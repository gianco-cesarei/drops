import secrets
import shutil
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import yt_dlp
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from media_core import is_supported_url, safe_filename
from web_settings import WebSettings
from web_store import WebStore

COOKIE_NAME = "drops_session"
AUDIO_QUALITY = {"128": "128", "192": "192", "320": "0"}


class LoginRequest(BaseModel):
    username: str
    password: str


class WebDownloadRequest(BaseModel):
    url: str
    quality: str = "320"


def create_app(settings: WebSettings | None = None) -> FastAPI:
    settings = settings or WebSettings.from_env()
    settings.state_dir.mkdir(parents=True, exist_ok=True)
    jobs_dir = settings.state_dir / "jobs"
    jobs_dir.mkdir(parents=True, exist_ok=True)
    store = WebStore(settings.state_dir / "web.sqlite3")
    executor = ThreadPoolExecutor(max_workers=settings.max_concurrent, thread_name_prefix="drops-web")
    password_hasher = PasswordHasher()
    app = FastAPI(title="Drops Web API")
    app.state.settings = settings
    app.state.store = store
    app.state.executor = executor

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    def cleanup() -> None:
        for row in store.expired_artifacts():
            if row["file_path"]:
                shutil.rmtree(Path(row["file_path"]).parent, ignore_errors=True)
        store.delete_expired()

    def current_owner(drops_session: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> str:
        cleanup()
        if not drops_session:
            raise HTTPException(status_code=401, detail="Authentication required")
        owner = store.session_owner(drops_session)
        if not owner:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        return owner

    def public_job(row) -> dict:
        result = {
            "id": row["id"],
            "status": row["status"],
            "format": row["format"],
            "quality": row["quality"],
            "created_at": row["created_at"],
        }
        for key in ("title", "filename", "size", "error"):
            if row[key] is not None:
                result[key] = row[key]
        if row["status"] == "ready":
            result["file_url"] = f"/api/v1/downloads/{row['id']}/file"
        return result

    def download(job_id: str, url: str, quality: str) -> None:
        job_dir = jobs_dir / job_id
        job_dir.mkdir(mode=0o700)
        started = time.monotonic()

        def progress(event: dict) -> None:
            if time.monotonic() - started > settings.max_duration_seconds:
                raise yt_dlp.utils.DownloadError("Download duration limit exceeded")
            downloaded = int(event.get("downloaded_bytes") or 0)
            total = int(event.get("total_bytes") or event.get("total_bytes_estimate") or 0)
            if max(downloaded, total) > settings.max_file_bytes:
                raise yt_dlp.utils.DownloadError("Download size limit exceeded")

        def duration_filter(info: dict, *, incomplete: bool):
            duration = int(info.get("duration") or 0)
            if duration > settings.max_duration_seconds:
                return "Media duration limit exceeded"
            return None

        try:
            store.update_job(job_id, status="downloading")
            options = {
                "format": "bestaudio/best",
                "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": AUDIO_QUALITY[quality]}],
                "outtmpl": str(job_dir / "source.%(ext)s"),
                "quiet": True,
                "no_warnings": True,
                "noplaylist": True,
                "max_filesize": settings.max_file_bytes,
                "match_filter": duration_filter,
                "socket_timeout": 30,
                "progress_hooks": [progress],
            }
            with yt_dlp.YoutubeDL(options) as ydl:
                info = ydl.extract_info(url, download=True)
            if int(info.get("duration") or 0) > settings.max_duration_seconds:
                raise yt_dlp.utils.DownloadError("Media duration limit exceeded")
            candidates = [path for path in job_dir.iterdir() if path.is_file() and not path.name.endswith((".part", ".ytdl"))]
            if len(candidates) != 1:
                raise RuntimeError("Downloaded artifact missing")
            source = candidates[0]
            if source.stat().st_size > settings.max_file_bytes:
                raise yt_dlp.utils.DownloadError("Download size limit exceeded")
            filename = safe_filename(str(info.get("title") or "audio"), "mp3")
            artifact = job_dir / filename
            if source != artifact:
                source.replace(artifact)
            store.update_job(
                job_id,
                status="ready",
                title=str(info.get("title") or "audio")[:200],
                filename=filename,
                file_path=str(artifact),
                size=artifact.stat().st_size,
                expires_at=time.time() + settings.artifact_ttl_seconds,
            )
        except Exception:  # worker boundary: never expose command lines or local paths
            shutil.rmtree(job_dir, ignore_errors=True)
            store.update_job(job_id, status="error", error="Download failed", expires_at=time.time() + settings.artifact_ttl_seconds)

    @app.post("/api/v1/auth/login")
    def login(request: LoginRequest, response: Response):
        valid = secrets.compare_digest(request.username, settings.username)
        try:
            valid = password_hasher.verify(settings.password_hash, request.password) and valid
        except (VerifyMismatchError, InvalidHashError):
            valid = False
        if not valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = secrets.token_urlsafe(32)
        store.create_session(token, settings.username, settings.session_ttl_seconds)
        response.set_cookie(COOKIE_NAME, token, max_age=settings.session_ttl_seconds, httponly=True, secure=settings.cookie_secure, samesite="lax", path="/")
        return {"username": settings.username}

    @app.get("/api/v1/auth/me")
    def me(owner: str = Depends(current_owner)):
        return {"username": owner}

    @app.post("/api/v1/auth/logout", status_code=204)
    def logout(response: Response, drops_session: str | None = Cookie(default=None, alias=COOKIE_NAME)):
        if drops_session:
            store.delete_session(drops_session)
        response.delete_cookie(COOKIE_NAME, httponly=True, secure=settings.cookie_secure, samesite="lax", path="/")

    @app.post("/api/v1/downloads", status_code=202)
    def start_download(request: WebDownloadRequest, owner: str = Depends(current_owner)):
        if not is_supported_url(request.url):
            raise HTTPException(status_code=400, detail="Unsupported URL")
        if request.quality not in AUDIO_QUALITY:
            raise HTTPException(status_code=400, detail="Invalid quality")
        if store.active_count() >= settings.max_queued + settings.max_concurrent:
            raise HTTPException(status_code=429, detail="Download queue full")
        job_id = str(uuid.uuid4())
        store.create_job(
            job_id,
            owner,
            request.url,
            "audio",
            request.quality,
            settings.max_duration_seconds + settings.artifact_ttl_seconds,
        )
        executor.submit(download, job_id, request.url, request.quality)
        return {"id": job_id, "status": "queued"}

    @app.get("/api/v1/downloads/{job_id}")
    def get_download(job_id: str, owner: str = Depends(current_owner)):
        row = store.get_job(job_id, owner)
        if not row:
            raise HTTPException(status_code=404, detail="Download not found")
        return public_job(row)

    @app.get("/api/v1/downloads/{job_id}/file")
    def get_file(job_id: str, owner: str = Depends(current_owner)):
        row = store.get_job(job_id, owner)
        if not row or row["status"] != "ready" or not row["file_path"]:
            raise HTTPException(status_code=404, detail="File not found")
        path = Path(row["file_path"]).resolve()
        expected_root = (jobs_dir / job_id).resolve()
        if path.parent != expected_root or not path.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(path, filename=row["filename"], media_type="audio/mpeg")

    return app
