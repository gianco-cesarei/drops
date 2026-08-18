import logging
import secrets
import shutil
import time
import uuid
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import yt_dlp
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Cookie, Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel

from media_core import is_supported_url, safe_filename
from spotify_agent import SpotifyAgentError, WebSpotifyClient
from web_settings import WebSettings
from web_store import WebStore

COOKIE_NAME = "drops_session"
AUDIO_QUALITY = {"128": "128", "192": "192", "320": "0"}
logger = logging.getLogger("drops.web")


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
    spotify = WebSpotifyClient(settings.state_dir)
    password_hasher = PasswordHasher()

    def cleanup() -> None:
        for row in store.expired_artifacts():
            job_dir = (jobs_dir / str(row["id"])).resolve()
            if job_dir.parent == jobs_dir.resolve():
                shutil.rmtree(job_dir, ignore_errors=True)
            else:
                logger.error("refused unsafe cleanup record")
        store.delete_expired()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        store.interrupt_active_jobs(settings.artifact_ttl_seconds)
        cleanup()
        executor = ThreadPoolExecutor(max_workers=settings.max_concurrent, thread_name_prefix="drops-web")
        app.state.executor = executor
        try:
            yield
        finally:
            executor.shutdown(wait=True, cancel_futures=True)
            cleanup()

    app = FastAPI(title="Drops Web API", lifespan=lifespan)
    app.state.settings = settings
    app.state.store = store
    app.state.executor = None

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    def require_csrf_origin(request: Request) -> None:
        origin = request.headers.get("origin")
        if origin is None:
            if settings.allow_missing_origin:
                return
            raise HTTPException(status_code=403, detail="Origin required")
        if origin not in settings.allowed_origins:
            raise HTTPException(status_code=403, detail="Origin not allowed")

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
        except Exception as exc:  # worker boundary: log identifiers and class only
            logger.error("download worker failed job_id=%s error_type=%s", job_id, type(exc).__name__)
            shutil.rmtree(job_dir, ignore_errors=True)
            store.update_job(job_id, status="error", error="Download failed", expires_at=time.time() + settings.artifact_ttl_seconds)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/api/v1/auth/login")
    def login(credentials: LoginRequest, request: Request, response: Response):
        client_key = request.client.host if request.client else "unknown"
        if not store.allow_login_attempt(client_key, settings.login_rate_limit, settings.login_rate_window_seconds):
            raise HTTPException(status_code=429, detail="Too many login attempts")
        valid = secrets.compare_digest(credentials.username, settings.username)
        try:
            valid = password_hasher.verify(settings.password_hash, credentials.password) and valid
        except (VerifyMismatchError, InvalidHashError):
            valid = False
        if not valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        store.clear_login_attempts(client_key)
        token = secrets.token_urlsafe(32)
        store.create_session(token, settings.username, settings.session_ttl_seconds)
        response.set_cookie(COOKIE_NAME, token, max_age=settings.session_ttl_seconds, httponly=True, secure=settings.cookie_secure, samesite="lax", path="/")
        return {"username": settings.username}

    @app.get("/api/v1/auth/me")
    def me(owner: str = Depends(current_owner)):
        return {"username": owner}

    def spotify_call(operation):
        try:
            return operation()
        except SpotifyAgentError as exc:
            logger.warning("spotify request failed error_type=%s", type(exc).__name__)
            raise HTTPException(status_code=502, detail="Spotify request failed") from exc

    @app.get("/api/v1/spotify/status")
    def spotify_status(owner: str = Depends(current_owner)):
        return spotify_call(spotify.status)

    @app.get("/api/v1/spotify/connect")
    def spotify_connect(owner: str = Depends(current_owner)):
        return RedirectResponse(spotify_call(spotify.create_authorization), status_code=302)

    @app.get("/api/v1/spotify/callback")
    def spotify_callback(code: str, state: str, owner: str = Depends(current_owner)):
        spotify_call(lambda: spotify.exchange_code(code, state))
        return RedirectResponse("/app/spotify", status_code=302)

    @app.get("/api/v1/spotify/liked")
    def spotify_liked(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0), owner: str = Depends(current_owner)):
        return spotify_call(lambda: spotify.liked(limit, offset))

    @app.get("/api/v1/spotify/playlists")
    def spotify_playlists(owner: str = Depends(current_owner)):
        return spotify_call(spotify.playlists)

    @app.get("/api/v1/spotify/playlists/{playlist_id}/tracks")
    def spotify_playlist_tracks(playlist_id: str, owner: str = Depends(current_owner)):
        return spotify_call(lambda: spotify.playlist_tracks(playlist_id))

    @app.post("/api/v1/auth/logout", status_code=204)
    def logout(
        response: Response,
        _: None = Depends(require_csrf_origin),
        owner: str = Depends(current_owner),
        drops_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
    ):
        if drops_session:
            store.delete_session(drops_session)
        response.delete_cookie(COOKIE_NAME, httponly=True, secure=settings.cookie_secure, samesite="lax", path="/")

    @app.post("/api/v1/downloads", status_code=202)
    def start_download(
        request: WebDownloadRequest,
        owner: str = Depends(current_owner),
        _: None = Depends(require_csrf_origin),
    ):
        if not is_supported_url(request.url):
            raise HTTPException(status_code=400, detail="Unsupported URL")
        if request.quality not in AUDIO_QUALITY:
            raise HTTPException(status_code=400, detail="Invalid quality")
        job_id = str(uuid.uuid4())
        accepted = store.create_job_if_capacity(
            job_id,
            owner,
            request.url,
            "audio",
            request.quality,
            settings.max_duration_seconds + settings.artifact_ttl_seconds,
            settings.max_queued + settings.max_concurrent,
        )
        if not accepted:
            raise HTTPException(status_code=429, detail="Download queue full")
        app.state.executor.submit(download, job_id, request.url, request.quality)
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
