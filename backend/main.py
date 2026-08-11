import os
import sys
import uuid
import time
import tempfile
import threading
import shutil
import logging
import json
import html
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from logging.handlers import RotatingFileHandler
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
import yt_dlp
from bpm_analyzer import BpmAnalysisError, analyze_bpm
from history_store import DownloadHistory
from spotify_agent import (
    SpotifyAgentError,
    approved_download_context,
    connection_status,
    create_authorization,
    explain_connection_error,
    exchange_code,
    export_saved_tracks,
    get_catalog,
    import_saved_tracks,
    search_candidates,
)

# ─── Logging Setup ──────────────────────────────────────────────────────────
DROPS_DIR = Path(os.environ.get("DROPS_STATE_DIR", str(Path.home() / ".drops"))).expanduser()
DROPS_DIR.mkdir(exist_ok=True)
LOGS_DIR = DROPS_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

logger = logging.getLogger("drops")
logger.setLevel(logging.DEBUG)
handler = RotatingFileHandler(
    LOGS_DIR / "backend.log",
    maxBytes=10_000_000,
    backupCount=5,
)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# ─── Cookies ────────────────────────────────────────────────────────────────
COOKIES_FILE = DROPS_DIR / "cookies.txt"
HISTORY_FILE = DROPS_DIR / "download-history.json"
history_store = DownloadHistory(HISTORY_FILE)
_shared_history_value = os.environ.get("DROPS_SHARED_HISTORY_FILE")
if not _shared_history_value and DROPS_DIR.name == ".drops-beta":
    _shared_history_value = str(Path.home() / ".drops" / "download-history.json")
SHARED_HISTORY_FILE = (
    Path(_shared_history_value).expanduser() if _shared_history_value else None
)
shared_history_store = (
    DownloadHistory(SHARED_HISTORY_FILE)
    if SHARED_HISTORY_FILE and SHARED_HISTORY_FILE != HISTORY_FILE
    else None
)

# ─── ffmpeg: discovery cross-platform ────────────────────────────────────────
IS_WINDOWS = os.name == "nt"
FFMPEG_EXE = "ffmpeg.exe" if IS_WINDOWS else "ffmpeg"

# Su macOS/Linux forziamo i path Homebrew nel PATH (comportamento storico).
_BREW_PATHS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"]
if not IS_WINDOWS:
    os.environ["PATH"] = os.pathsep.join(_BREW_PATHS) + os.pathsep + os.environ.get("PATH", "")


def find_ffmpeg() -> str | None:
    # 1) cartella impacchettata dal wrapper desktop (Tauri su Windows passa DROPS_FFMPEG_DIR)
    bundled = os.environ.get("DROPS_FFMPEG_DIR")
    if bundled and Path(bundled, FFMPEG_EXE).exists():
        return bundled
    # 2) path Homebrew noti (macOS)
    if not IS_WINDOWS:
        for folder in _BREW_PATHS:
            if Path(folder, FFMPEG_EXE).exists():
                return folder
    # 3) ffmpeg presente nel PATH di sistema
    found = shutil.which("ffmpeg")
    return str(Path(found).parent) if found else None


FFMPEG_LOCATION = find_ffmpeg()

# ─── Config ─────────────────────────────────────────────────────────────────
DOWNLOAD_DIR = Path(
    os.environ.get("DROPS_DOWNLOAD_DIR", str(Path(tempfile.gettempdir()) / "drops-downloads"))
)
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_SAVE_DIR = Path(
    os.environ.get("DROPS_DEFAULT_SAVE_DIR", str(Path.home() / "Downloads"))
).expanduser()
DEFAULT_SAVE_DIR.mkdir(parents=True, exist_ok=True)
MAX_CONCURRENT = 3
MAX_QUEUED = 100
FILE_TTL = 600  # 10 minuti
APP_VERSION = os.environ.get("DROPS_APP_VERSION", "1.0.5")
APP_NAME = os.environ.get("DROPS_APP_NAME", "Drops")
GITHUB_LATEST_RELEASE_API = "https://api.github.com/repos/gianco-cesarei/drops/releases/latest"
UPDATE_CACHE_SECONDS = 3600
# Version history restarted at 1.0.x. Releases published before this instant belong
# to the retired numbering (1.1.0–1.3.1) and must not trigger false updates.
RELEASE_LINEAGE_START = "2026-07-28T00:00:00Z"

# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(title=f"{APP_NAME} API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── State ──────────────────────────────────────────────────────────────────
jobs: dict = {}
semaphore = threading.Semaphore(MAX_CONCURRENT)
selected_destinations: dict[str, Path] = {}
update_cache: dict = {"checked_at": 0.0, "result": None}
preview_cache: dict[str, dict] = {}
bpm_analysis_lock = threading.Lock()
bpm_analyses_active: set[str] = set()

ALLOWED_DOMAINS = [
    "youtube.com", "youtu.be",
    "soundcloud.com",
    "music.youtube.com",
]

AUDIO_QUALITY_MAP = {
    "128": ("mp3", "128"),
    "192": ("mp3", "192"),
    "320": ("mp3", "0"),   # 0 = VBR best
    "flac": ("flac", None),
}

VIDEO_FORMAT_MAP = {
    "1080": "bestvideo[height<=1080][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio/best[height<=1080][ext=mp4]/best[height<=1080]",
    "720":  "bestvideo[height<=720][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=720][ext=mp4]+bestaudio/best[height<=720][ext=mp4]/best[height<=720]",
    "480":  "bestvideo[height<=480][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=480][ext=mp4]+bestaudio/best[height<=480][ext=mp4]/best[height<=480]",
}

# ─── Models ─────────────────────────────────────────────────────────────────
class DownloadRequest(BaseModel):
    url: str
    quality: str = "320"
    format: str = "audio"                # "audio" | "video"
    video_quality: str = "1080"          # "1080" | "720" | "480"
    start_time: int | None = None        # secondi (clip)
    duration: int | None = None          # secondi (clip)
    destination_token: str | None = None
    spotify_track_id: str | None = None
    batch_id: str | None = None
    rights_confirmed: bool = False


class PlaylistRequest(BaseModel):
    url: str
    destination_token: str | None = None


class MediaInspectRequest(BaseModel):
    url: str


# ─── Helpers ────────────────────────────────────────────────────────────────
def cleanup_old_files():
    now = time.time()
    to_delete = []
    for job_id, job in list(jobs.items()):
        if now - job["created_at"] > FILE_TTL:
            fp = job.get("file_path")
            if (
                fp
                and os.path.exists(fp)
                and not job.get("library_path")
                and not job.get("saved_path")
            ):
                try:
                    os.remove(fp)
                except Exception:
                    pass
            to_delete.append(job_id)
    for jid in to_delete:
        jobs.pop(jid, None)


def read_download_history(limit: int = 100) -> list[dict]:
    requested = max(1, min(limit, 1000))
    records = history_store.read(500)
    if shared_history_store:
        records.extend(shared_history_store.read(500))

    merged: list[dict] = []
    seen: set[str] = set()
    for record in records:
        identity = str(record.get("id") or record.get("saved_path") or "")
        if not identity or identity in seen:
            continue
        seen.add(identity)
        merged.append(dict(record))
    merged.sort(key=lambda item: float(item.get("completed_at") or 0), reverse=True)
    return merged[:requested]


def find_history_record(record_id: str) -> dict | None:
    record = history_store.get(record_id)
    if record or not shared_history_store:
        return record
    return shared_history_store.get(record_id)


def find_history_by_spotify_id(spotify_track_id: str) -> dict | None:
    record = history_store.find_by_spotify_id(spotify_track_id)
    if record or not shared_history_store:
        return record
    return shared_history_store.find_by_spotify_id(spotify_track_id)


def append_download_history(record: dict) -> None:
    history_store.upsert(record)


def bpm_response(record: dict) -> dict:
    keys = (
        "bpm_status",
        "bpm",
        "bpm_rounded",
        "bpm_confidence",
        "bpm_candidates",
        "bpm_source",
        "bpm_manual",
        "bpm_analyzed_at",
        "bpm_error",
    )
    return {
        "download_id": record.get("id"),
        "spotify_track_id": record.get("spotify_track_id"),
        "bpm_status": record.get("bpm_status") or "not_available",
        **{key: record.get(key) for key in keys if record.get(key) is not None},
    }


def analyze_download_bpm(record_id: str) -> None:
    try:
        record = history_store.get(record_id)
        if not record:
            return
        history_store.update(record_id, {"bpm_status": "analyzing", "bpm_error": None})
        if record_id in jobs:
            jobs[record_id].update({"bpm_status": "analyzing", "bpm_error": None})
        result = analyze_bpm(
            Path(record.get("saved_path", "")), ffmpeg_path=ffmpeg_bin()
        )
        result.update({"bpm_status": "ready", "bpm_analyzed_at": time.time(), "bpm_error": None})
        history_store.update(record_id, result)
        if record_id in jobs:
            jobs[record_id].update(result)
        logger.info("BPM pronto - Job:%s bpm:%s", record_id, result["bpm"])
    except BpmAnalysisError as exc:
        error = str(exc)
        history_store.update(
            record_id,
            {"bpm_status": "error", "bpm_error": error, "bpm_analyzed_at": time.time()},
        )
        if record_id in jobs:
            jobs[record_id].update({"bpm_status": "error", "bpm_error": error})
        logger.warning("BPM non disponibile - Job:%s: %s", record_id, error)
    finally:
        with bpm_analysis_lock:
            bpm_analyses_active.discard(record_id)


def queue_bpm_analysis(record_id: str) -> bool:
    record = history_store.get(record_id)
    if not record or record.get("format") != "audio":
        return False
    if not Path(record.get("saved_path", "")).is_file():
        return False
    with bpm_analysis_lock:
        if record_id in bpm_analyses_active:
            return False
        bpm_analyses_active.add(record_id)
    pending = {
        "bpm_status": "pending",
        "bpm": None,
        "bpm_rounded": None,
        "bpm_confidence": None,
        "bpm_candidates": None,
        "bpm_source": None,
        "bpm_manual": None,
        "bpm_analyzed_at": None,
        "bpm_error": None,
    }
    history_store.update(record_id, pending)
    if record_id in jobs:
        jobs[record_id].update(pending)
    threading.Thread(target=analyze_download_bpm, args=(record_id,), daemon=True).start()
    return True


def reveal_local_file(path: Path) -> None:
    if not path.is_file():
        raise FileNotFoundError(str(path))
    if sys.platform == "darwin":
        subprocess.Popen(["open", "-R", str(path)])
    elif os.name == "nt":
        subprocess.Popen(
            ["explorer.exe", f"/select,{path}"],
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    else:
        subprocess.Popen(["xdg-open", str(path.parent)])


def safe_filename(name: str, ext: str) -> str:
    clean = "".join(c for c in name if c.isalnum() or c in " .-_()[]").strip()
    clean = clean[:80]
    return f"{clean}.{ext}" if clean else f"audio.{ext}"


def is_supported_url(value: str) -> bool:
    try:
        parsed = urllib.parse.urlsplit(value.strip())
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    host = parsed.hostname.lower().rstrip(".")
    return any(host == domain or host.endswith(f".{domain}") for domain in ALLOWED_DOMAINS)


def playlist_entry_url(entry: dict, original_url: str) -> str | None:
    for key in ("webpage_url", "original_url", "url"):
        value = entry.get(key)
        if isinstance(value, str) and is_supported_url(value):
            return value
    extractor = str(entry.get("extractor_key") or entry.get("ie_key") or "").lower()
    video_id = entry.get("id")
    if video_id and "youtube" in extractor:
        return f"https://www.youtube.com/watch?v={video_id}"
    return original_url if is_supported_url(original_url) else None


def normalized_media_title(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def existing_media_titles(destination_token: str | None) -> set[str]:
    if not destination_token:
        return set()
    target_dir = selected_destinations.get(destination_token)
    if not target_dir or not target_dir.is_dir():
        return set()
    media_extensions = {".mp3", ".flac", ".m4a", ".wav", ".mp4", ".webm"}
    return {
        normalized_media_title(path.stem)
        for path in target_dir.iterdir()
        if path.is_file() and path.suffix.casefold() in media_extensions
    }


def unique_destination(target_dir: Path, title: str, ext: str) -> Path:
    """Restituisce un nome sicuro senza sovrascrivere file esistenti."""
    filename = safe_filename(title, ext)
    destination = target_dir / filename
    counter = 2
    while destination.exists():
        destination = target_dir / f"{Path(filename).stem} ({counter}).{ext}"
        counter += 1
    return destination


def choose_destination_folder() -> Path | None:
    """Apre selettore cartella nativo. None indica annullamento utente."""
    if sys.platform == "darwin":
        result = subprocess.run(
            [
                "osascript",
                "-e",
                'POSIX path of (choose folder with prompt "Scegli dove salvare i download di Drops")',
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return None
        value = result.stdout.strip()
    elif os.name == "nt":
        script = (
            "Add-Type -AssemblyName System.Windows.Forms; "
            "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog; "
            "$dialog.Description = 'Scegli dove salvare i download di Drops'; "
            "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) "
            "{ Write-Output $dialog.SelectedPath }"
        )
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-NonInteractive", "-STA", "-Command", script],
            capture_output=True,
            text=True,
            # Backend PyInstaller è windowed, ma PowerShell può comunque creare
            # una console temporanea. Mantiene visibile solo FolderBrowserDialog.
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        if result.returncode != 0:
            return None
        value = result.stdout.strip()
    else:
        zenity = shutil.which("zenity")
        if not zenity:
            raise RuntimeError("Selettore cartella non disponibile su questo sistema")
        result = subprocess.run(
            [zenity, "--file-selection", "--directory", "--title=Scegli cartella Drops"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return None
        value = result.stdout.strip()

    if not value:
        return None
    path = Path(value).expanduser().resolve()
    if not path.is_dir():
        raise RuntimeError("Cartella selezionata non valida")
    if not os.access(path, os.W_OK):
        raise RuntimeError("Drops non ha permesso di scrittura nella cartella selezionata")
    return path


def version_tuple(value: str) -> tuple[int, int, int, int, int]:
    clean = value.strip().lstrip("v")
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?", clean)
    if not match:
        raise ValueError(f"Versione non valida: {value}")
    major, minor, patch = (int(match.group(index)) for index in range(1, 4))
    prerelease = match.group(4)
    prerelease_number = 0
    if prerelease:
        numbers = re.findall(r"\d+", prerelease)
        prerelease_number = int(numbers[-1]) if numbers else 0
    # A parità di 1.1.0, release stabile viene dopo 1.1.0-beta.N.
    return major, minor, patch, 0 if prerelease else 1, prerelease_number


def check_latest_release() -> dict:
    now = time.time()
    cached = update_cache.get("result")
    if cached and now - update_cache["checked_at"] < UPDATE_CACHE_SECONDS:
        return cached

    request = urllib.request.Request(
        GITHUB_LATEST_RELEASE_API,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": f"Drops/{APP_VERSION}",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            release = json.load(response)
        if str(release.get("published_at") or "") < RELEASE_LINEAGE_START:
            result = {
                "current_version": APP_VERSION,
                "latest_version": APP_VERSION,
                "available": False,
                "release_url": None,
                "notes": "",
            }
            update_cache.update({"checked_at": now, "result": result})
            return result
        latest = str(release["tag_name"]).lstrip("v")
        result = {
            "current_version": APP_VERSION,
            "latest_version": latest,
            "available": version_tuple(latest) > version_tuple(APP_VERSION),
            "release_url": release.get("html_url"),
            "notes": release.get("body") or "",
        }
    except (urllib.error.URLError, TimeoutError, KeyError, ValueError, json.JSONDecodeError) as exc:
        logger.warning(f"Controllo aggiornamenti fallito: {exc}")
        result = {
            "current_version": APP_VERSION,
            "latest_version": None,
            "available": False,
            "release_url": None,
            "error": "Controllo aggiornamenti temporaneamente non disponibile",
        }

    update_cache.update({"checked_at": now, "result": result})
    return result


def open_release_page(url: str) -> None:
    """Apre esclusivamente una pagina Release del repository ufficiale."""
    expected_prefix = "https://github.com/gianco-cesarei/drops/releases/"
    if not url.startswith(expected_prefix):
        raise ValueError("URL aggiornamento non valido")

    if sys.platform == "darwin":
        subprocess.Popen(["open", url])
    elif os.name == "nt":
        os.startfile(url)  # type: ignore[attr-defined]
    else:
        subprocess.Popen(["xdg-open", url])


def open_spotify_page(url: str) -> None:
    """Apre solo pagina OAuth Spotify prodotta dal backend."""
    expected_prefix = "https://accounts.spotify.com/authorize?"
    if not url.startswith(expected_prefix):
        raise ValueError("URL Spotify non valido")

    if sys.platform == "darwin":
        subprocess.Popen(["open", url])
    elif os.name == "nt":
        os.startfile(url)  # type: ignore[attr-defined]
    else:
        subprocess.Popen(["xdg-open", url])


def ffmpeg_bin() -> str:
    if FFMPEG_LOCATION:
        return str(Path(FFMPEG_LOCATION) / FFMPEG_EXE)
    return FFMPEG_EXE


def trim_file(input_path: Path, output_path: Path, start: int, dur: int, is_video: bool) -> bool:
    """Ritaglia start → start+dur dal file. Ritorna True se ok."""
    cmd = [ffmpeg_bin(), "-ss", str(start), "-i", str(input_path), "-t", str(dur)]
    if is_video:
        # Re-encode per allineamento keyframe preciso
        cmd += ["-c:v", "libx264", "-preset", "fast", "-c:a", "aac"]
    else:
        cmd += ["-c", "copy"]
    cmd += ["-y", str(output_path)]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"FFmpeg trim error: {result.stderr[:300]}")
    return result.returncode == 0 and output_path.exists()


def do_download(
    job_id: str,
    url: str,
    quality: str,
    fmt: str = "audio",
    video_quality: str = "1080",
    start_time: int | None = None,
    duration: int | None = None,
    library_context: dict | None = None,
    target_dir: Path | None = None,
):
    with semaphore:
        try:
            jobs[job_id]["status"] = "downloading"
            is_clip = start_time is not None and duration is not None
            is_video = fmt == "video"

            logger.info(
                f"Download - Job:{job_id} fmt:{fmt} q:{quality if not is_video else video_quality}"
                + (f" clip:{start_time}s+{duration}s" if is_clip else "")
            )

            # Pre-fetch metadata per stimare size attesa
            # Saltato per i clip: sono brevi, il progress_hook yt-dlp è sufficiente
            # e il round-trip a YouTube aggiunge 3-5s di latenza inutile
            expected_bytes = None
            if not is_clip:
                try:
                    t0 = time.time()
                    meta_opts = {"quiet": True, "no_warnings": True, "skip_download": True, "noplaylist": True}
                    with yt_dlp.YoutubeDL(meta_opts) as ydl_meta:
                        meta = ydl_meta.extract_info(url, download=False)
                        full_duration = meta.get("duration") or 0
                        section_secs = full_duration
                        if section_secs > 0:
                            formats = meta.get("formats", []) or []

                            def fmt_bytes(f):
                                """Stima byte di un format: filesize esatto se presente, altrimenti tbr * duration."""
                                fs = f.get("filesize") or f.get("filesize_approx")
                                if fs:
                                    return int(fs * section_secs / full_duration) if full_duration else fs
                                tbr = f.get("tbr") or f.get("vbr") or f.get("abr") or 0
                                return int(tbr * 1000 / 8 * section_secs)

                            if is_video:
                                max_h = int(video_quality)
                                video_fmts = [f for f in formats
                                              if f.get("vcodec") not in (None, "none")
                                              and (f.get("height") or 0) <= max_h
                                              and (f.get("height") or 0) > 0]
                                audio_fmts = [f for f in formats
                                              if f.get("acodec") not in (None, "none")
                                              and f.get("vcodec") in (None, "none")]
                                best_v = max(video_fmts, key=lambda f: f.get("height") or 0, default=None)
                                best_a = max(audio_fmts, key=lambda f: f.get("abr") or f.get("tbr") or 0, default=None)
                                v_bytes = fmt_bytes(best_v) if best_v else 0
                                a_bytes = fmt_bytes(best_a) if best_a else 0
                                expected_bytes = int((v_bytes + a_bytes) * 1.05)
                            else:
                                audio_fmts = [f for f in formats if f.get("acodec") not in (None, "none")]
                                best_a = max(audio_fmts, key=lambda f: f.get("abr") or f.get("tbr") or 0, default=None)
                                expected_bytes = fmt_bytes(best_a) if best_a else 0

                            if expected_bytes and expected_bytes > 0:
                                jobs[job_id]["expected_bytes"] = expected_bytes
                            jobs[job_id]["title"] = meta.get("title")
                    logger.debug(f"Pre-fetch metadata - Job:{job_id} - {time.time()-t0:.1f}s")
                except Exception as e:
                    logger.warning(f"Pre-fetch metadata fallito - Job:{job_id}: {e}")

            def progress_hook(d):
                if d.get("status") == "downloading":
                    total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                    downloaded = d.get("downloaded_bytes", 0)
                    jobs[job_id]["downloaded_bytes"] = downloaded
                    if total > 0:
                        pct = int(downloaded * 100 / total)
                        jobs[job_id]["progress"] = min(pct, 99)
                    elif d.get("fragment_index") and d.get("fragment_count"):
                        pct = int(d["fragment_index"] * 100 / d["fragment_count"])
                        jobs[job_id]["progress"] = min(pct, 99)
                elif d.get("status") == "finished":
                    jobs[job_id]["progress"] = 99

            # Monitor thread: scansiona file su disco per progress fallback
            # (utile con download_ranges + external_downloader=ffmpeg dove progress_hook non si attiva)
            stop_monitor = threading.Event()
            def monitor_part_file():
                while not stop_monitor.wait(0.5):
                    try:
                        files = [p for p in DOWNLOAD_DIR.glob(f"{job_id}*") if p.is_file()]
                        if files:
                            total_size = sum(p.stat().st_size for p in files)
                            if total_size > jobs[job_id].get("downloaded_bytes", 0):
                                jobs[job_id]["downloaded_bytes"] = total_size
                    except Exception:
                        pass
            monitor_thread = threading.Thread(target=monitor_part_file, daemon=True)
            monitor_thread.start()

            output_template = str(DOWNLOAD_DIR / f"{job_id}.%(ext)s")
            cookies = str(COOKIES_FILE) if COOKIES_FILE.exists() else None
            ffmpeg_kw = {"ffmpeg_location": FFMPEG_LOCATION} if FFMPEG_LOCATION else {}

            # download_ranges: scarica solo la sezione richiesta (evita download dell'intero video per clip)
            download_ranges = None
            if is_clip:
                end_time = start_time + duration
                def _ranges(info_dict, ydl):
                    return [{"start_time": start_time, "end_time": end_time}]
                download_ranges = _ranges

            if is_video:
                video_fmt = VIDEO_FORMAT_MAP.get(video_quality, VIDEO_FORMAT_MAP["1080"])
                ydl_opts = {
                    "format": video_fmt,
                    "merge_output_format": "mp4",
                    "outtmpl": output_template,
                    "quiet": True,
                    "no_warnings": True,
                    "noplaylist": True,
                    "socket_timeout": 30,
                    "cookiefile": cookies,
                    "progress_hooks": [progress_hook],
                    "concurrent_fragment_downloads": 4,
                    **ffmpeg_kw,
                }
                if download_ranges:
                    ydl_opts["download_ranges"] = download_ranges
                    # force_keyframes_at_cuts: yt-dlp forza un keyframe al punto di taglio
                    # → il muxing ffmpeg è più preciso e veloce, evita secondi extra scaricati
                    ydl_opts["force_keyframes_at_cuts"] = True
                output_ext = "mp4"
            else:
                codec, q = AUDIO_QUALITY_MAP.get(quality, ("mp3", "0"))
                if codec == "flac":
                    postprocessors = [{"key": "FFmpegExtractAudio", "preferredcodec": "flac"}]
                    output_ext = "flac"
                else:
                    postprocessors = [{
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": q,
                    }]
                    output_ext = "mp3"

                ydl_opts = {
                    "format": "bestaudio/best",
                    "postprocessors": postprocessors,
                    "outtmpl": output_template,
                    "quiet": True,
                    "no_warnings": True,
                    "noplaylist": True,
                    "socket_timeout": 30,
                    "cookiefile": cookies,
                    "progress_hooks": [progress_hook],
                    "concurrent_fragment_downloads": 4,
                    **ffmpeg_kw,
                }
                if download_ranges:
                    ydl_opts["download_ranges"] = download_ranges

            try:
                t_start = time.time()
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    title = info.get("title", "audio")
                    total_duration = info.get("duration", 0)
                logger.info(f"yt-dlp completato - Job:{job_id} - {time.time()-t_start:.1f}s")
            finally:
                stop_monitor.set()

            # Trova file reale prodotto da yt-dlp/ffmpeg (estensione può differire dall'attesa)
            candidates = sorted(
                DOWNLOAD_DIR.glob(f"{job_id}.*"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )
            # Filtra file .part residui
            candidates = [p for p in candidates if not p.name.endswith(".part")]

            if not candidates:
                jobs[job_id].update({"status": "error", "error": "File non trovato dopo il download"})
                logger.error(f"File mancante - Job:{job_id} - glob vuoto in {DOWNLOAD_DIR}")
                return

            file_path = candidates[0]
            actual_ext = file_path.suffix.lstrip(".")
            if actual_ext != output_ext:
                logger.warning(f"Estensione diversa da attesa - Job:{job_id} atteso:{output_ext} reale:{actual_ext}")
                output_ext = actual_ext

            # Trim post-download solo se download_ranges non era disponibile (yt-dlp ha già tagliato)
            # download_ranges scarica solo la sezione richiesta → niente trim necessario
            if is_clip and not download_ranges:
                trimmed_path = DOWNLOAD_DIR / f"{job_id}_trimmed.{output_ext}"
                ok = trim_file(file_path, trimmed_path, start_time, duration, is_video)
                if ok:
                    file_path.unlink()
                    file_path = trimmed_path
                    logger.info(f"Trim completato - Job:{job_id}")
                else:
                    logger.warning(f"Trim fallito, uso file completo - Job:{job_id}")

            size = file_path.stat().st_size
            final_duration = duration if is_clip else total_duration

            if library_context:
                target_dir = Path(library_context["target_dir"]).expanduser()
                target_dir.mkdir(parents=True, exist_ok=True)
                artist = safe_filename(" - ".join(library_context["artists"]), "").rstrip(".")
                track_name = safe_filename(library_context["name"], output_ext)
                destination = target_dir / f"{artist} - {track_name}"
                counter = 2
                while destination.exists():
                    destination = (
                        target_dir
                        / f"{artist} - {Path(track_name).stem} ({counter}).{output_ext}"
                    )
                    counter += 1
                shutil.move(str(file_path), destination)
                file_path = destination
                size = file_path.stat().st_size
            else:
                save_dir = target_dir or DEFAULT_SAVE_DIR
                save_dir.mkdir(parents=True, exist_ok=True)
                destination = unique_destination(save_dir, title, output_ext)
                shutil.move(str(file_path), destination)
                file_path = destination
                size = file_path.stat().st_size

            jobs[job_id].update({
                "status": "ready",
                "file_path": str(file_path),
                "title": title,
                "duration": final_duration,
                "size": size,
                "ext": output_ext,
                "format": fmt,
                "progress": 100,
                "library_path": str(file_path) if library_context else None,
                "saved_path": str(file_path),
            })
            history_record = {
                "id": job_id,
                "title": title,
                "source_url": url,
                "saved_path": str(file_path),
                "format": fmt,
                "quality": video_quality if is_video else quality,
                "size": size,
                "duration": final_duration,
                "completed_at": time.time(),
                "spotify_track_id": (library_context or {}).get("spotify_id"),
                "isrc": (library_context or {}).get("isrc"),
                "batch_id": jobs[job_id].get("batch_id"),
                "bpm_status": "pending" if fmt == "audio" else "not_applicable",
            }
            append_download_history(history_record)
            if fmt == "audio":
                queue_bpm_analysis(job_id)
            logger.info(f"Pronto - Job:{job_id} '{title}' {size} bytes")

        except Exception as e:
            jobs[job_id].update({"status": "error", "error": str(e)})
            logger.error(f"Eccezione - Job:{job_id}", exc_info=True)


# ─── Routes ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    active = sum(1 for j in jobs.values() if j["status"] in ("pending", "downloading"))
    return {"status": "ok", "active_jobs": active, "total_jobs": len(jobs)}


@app.get("/app-info")
def app_info():
    return {"name": APP_NAME, "version": APP_VERSION}


@app.get("/update/check")
def update_check():
    return check_latest_release()


@app.post("/update/open")
def update_open():
    release = check_latest_release()
    if not release.get("available") or not release.get("release_url"):
        raise HTTPException(status_code=409, detail="Nessun aggiornamento disponibile")
    try:
        open_release_page(release["release_url"])
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=f"Impossibile aprire aggiornamento: {exc}") from exc
    return {"opened": True, "release_url": release["release_url"]}


@app.post("/select-folder")
def select_folder():
    try:
        path = choose_destination_folder()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if path is None:
        return {"selected": False}

    token = str(uuid.uuid4())
    selected_destinations[token] = path
    return {"selected": True, "token": token, "path": str(path)}


@app.post("/media/inspect")
def inspect_media(req: MediaInspectRequest):
    if not is_supported_url(req.url):
        raise HTTPException(status_code=400, detail="URL non supportato")
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "format": "bestaudio/best",
    }
    if COOKIES_FILE.exists():
        options["cookiefile"] = str(COOKIES_FILE)
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(req.url, download=False)
    except Exception as exc:
        logger.warning(f"Anteprima media fallita: {exc}")
        raise HTTPException(
            status_code=400,
            detail="Anteprima non disponibile per questo elemento",
        ) from exc

    requested = (info or {}).get("requested_downloads") or []
    stream_url = (requested[0].get("url") if requested else None) or (info or {}).get("url")
    try:
        stream_scheme = urllib.parse.urlsplit(stream_url or "").scheme
    except ValueError:
        stream_scheme = ""
    if stream_scheme not in {"http", "https"}:
        raise HTTPException(status_code=400, detail="Flusso anteprima non disponibile")

    now = time.time()
    for key, value in list(preview_cache.items()):
        if now - value.get("created_at", 0) > 900:
            preview_cache.pop(key, None)
    token = str(uuid.uuid4())
    preview_cache[token] = {"url": stream_url, "created_at": now}
    return {
        "title": (info or {}).get("title") or "Senza titolo",
        "uploader": (info or {}).get("uploader") or (info or {}).get("channel") or "",
        "duration": (info or {}).get("duration"),
        "preview_url": f"/preview/{token}",
    }


@app.get("/preview/{token}")
def stream_preview(token: str):
    cached = preview_cache.get(token)
    if not cached or time.time() - cached.get("created_at", 0) > 900:
        preview_cache.pop(token, None)
        raise HTTPException(status_code=404, detail="Anteprima scaduta: riaprila")
    return RedirectResponse(cached["url"])


@app.get("/history")
def download_history(limit: int = 100):
    all_records = read_download_history(1000)
    records = all_records[: max(1, min(limit, 1000))]
    latest_batch_id = records[0].get("batch_id") if records else None
    latest_group_ids: set[str] = set()
    if records and not latest_batch_id:
        previous_time = float(records[0].get("completed_at") or 0)
        for record in records:
            completed_at = float(record.get("completed_at") or 0)
            # Storico precedente ai batch_id: download consecutivi distanti meno
            # di 90 secondi appartengono alla stessa sessione/playlist.
            if previous_time - completed_at > 90:
                break
            latest_group_ids.add(str(record.get("id") or ""))
            previous_time = completed_at
    for record in records:
        record["exists"] = Path(record.get("saved_path", "")).is_file()
        if latest_batch_id:
            record["is_latest_batch"] = record.get("batch_id") == latest_batch_id
        else:
            record["is_latest_batch"] = str(record.get("id") or "") in latest_group_ids
    return {"items": records, "total": len(all_records)}


@app.post("/history/{record_id}/reveal")
def reveal_history_file(record_id: str):
    record = find_history_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Download non trovato nello storico")
    try:
        reveal_local_file(Path(record.get("saved_path", "")))
    except (FileNotFoundError, OSError) as exc:
        raise HTTPException(
            status_code=404,
            detail="File non esiste più nella cartella originale",
        ) from exc
    return {"opened": True}


@app.get("/bpm/download/{record_id}")
def bpm_for_download(record_id: str):
    record = find_history_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Download non trovato nello storico")
    return bpm_response(record)


@app.post("/bpm/analyze/{record_id}", status_code=202)
def bpm_analyze(record_id: str):
    record = find_history_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Download non trovato nello storico")
    if record.get("format") != "audio":
        raise HTTPException(status_code=400, detail="Analisi BPM disponibile solo per audio")
    if not Path(record.get("saved_path", "")).is_file():
        raise HTTPException(status_code=404, detail="File audio non trovato")
    if history_store.get(record_id) is None:
        history_store.upsert(record)
    started = queue_bpm_analysis(record_id)
    current = history_store.get(record_id) or record
    return {**bpm_response(current), "started": started}


@app.get("/bpm/spotify/{spotify_track_id}")
def bpm_for_spotify(spotify_track_id: str):
    record = find_history_by_spotify_id(spotify_track_id)
    if not record:
        return {
            "spotify_track_id": spotify_track_id,
            "bpm_status": "not_available",
            "reason": "track_not_downloaded",
        }
    return bpm_response(record)


@app.post("/download")
def start_download(req: DownloadRequest):
    cleanup_old_files()

    if not is_supported_url(req.url):
        raise HTTPException(status_code=400, detail="URL non supportato. Usa YouTube o SoundCloud.")

    if req.format == "audio" and req.quality not in AUDIO_QUALITY_MAP:
        raise HTTPException(status_code=400, detail="Qualità audio non valida")

    if req.format == "video" and req.video_quality not in VIDEO_FORMAT_MAP:
        raise HTTPException(status_code=400, detail="Qualità video non valida")

    if req.format not in ("audio", "video"):
        raise HTTPException(status_code=400, detail="Formato non valido")

    if req.batch_id and not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", req.batch_id):
        raise HTTPException(status_code=400, detail="Identificatore gruppo non valido")

    if req.format == "audio" and (req.start_time is not None or req.duration is not None):
        raise HTTPException(status_code=400, detail="Il taglio è disponibile solo per i video")

    if (req.start_time is None) != (req.duration is None):
        raise HTTPException(status_code=400, detail="Inizio e durata clip devono essere indicati insieme")

    if req.start_time is not None and (req.start_time < 0 or req.duration <= 0):
        raise HTTPException(status_code=400, detail="Intervallo clip non valido")

    active = sum(1 for j in jobs.values() if j["status"] in ("pending", "downloading"))
    if active >= MAX_QUEUED:
        raise HTTPException(status_code=429, detail="Coda piena: massimo 100 download")

    if req.destination_token:
        target_dir = selected_destinations.get(req.destination_token)
        if target_dir is None:
            raise HTTPException(status_code=400, detail="Cartella non più valida: selezionala di nuovo")
    else:
        target_dir = DEFAULT_SAVE_DIR

    library_context = None
    if req.spotify_track_id:
        if not req.rights_confirmed:
            raise HTTPException(
                status_code=400,
                detail="Conferma di possedere diritti o autorizzazione richiesta",
            )
        try:
            library_context = approved_download_context(req.spotify_track_id, req.url)
        except SpotifyAgentError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "pending",
        "title": None,
        "file_path": None,
        "error": None,
        "created_at": time.time(),
        "quality": req.quality,
        "format": req.format,
        "video_quality": req.video_quality,
        "size": None,
        "duration": None,
        "ext": None,
        "progress": 0,
        "library_path": None,
        "saved_path": None,
        "destination": str(target_dir),
        "batch_id": req.batch_id or job_id,
    }

    t = threading.Thread(
        target=do_download,
        args=(
            job_id,
            req.url,
            req.quality,
            req.format,
            req.video_quality,
            req.start_time,
            req.duration,
            library_context,
            target_dir,
        ),
        daemon=True,
    )
    t.start()

    return {"job_id": job_id}


@app.post("/playlist/resolve")
def resolve_playlist(req: PlaylistRequest):
    if not is_supported_url(req.url):
        raise HTTPException(status_code=400, detail="URL non supportato")
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "playlistend": MAX_QUEUED + 1,
    }
    if COOKIES_FILE.exists():
        options["cookiefile"] = str(COOKIES_FILE)
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(req.url, download=False)
    except Exception as exc:
        logger.warning(f"Risoluzione playlist fallita: {exc}")
        raise HTTPException(
            status_code=400,
            detail="Playlist non leggibile. Controlla link, privacy e disponibilità.",
        ) from exc

    raw_entries = list((info or {}).get("entries") or [])
    if not raw_entries:
        raw_entries = [info or {}]
    entries = []
    existing_titles = existing_media_titles(req.destination_token)
    for entry in raw_entries[:MAX_QUEUED]:
        if not entry:
            continue
        url = playlist_entry_url(entry, req.url)
        if not url:
            continue
        title = entry.get("title") or "Senza titolo"
        entries.append(
            {
                "url": url,
                "title": title,
                "uploader": entry.get("uploader") or entry.get("channel") or "",
                "duration": entry.get("duration"),
                "already_downloaded": normalized_media_title(title) in existing_titles,
            }
        )
    if not entries:
        raise HTTPException(status_code=400, detail="Nessun elemento scaricabile trovato")
    return {
        "title": (info or {}).get("title") or entries[0]["title"],
        "entries": entries,
        "count": len(entries),
        "existing_count": sum(entry["already_downloaded"] for entry in entries),
        "truncated": len(raw_entries) > MAX_QUEUED,
    }


@app.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job non trovato")
    j = jobs[job_id]
    return {
        "status": j["status"],
        "title": j["title"],
        "error": j["error"],
        "size": j["size"],
        "duration": j["duration"],
        "quality": j["quality"],
        "video_quality": j.get("video_quality"),
        "format": j.get("format", "audio"),
        "ext": j.get("ext"),
        "progress": j.get("progress", 0),
        "downloaded_bytes": j.get("downloaded_bytes", 0),
        "expected_bytes": j.get("expected_bytes", 0),
        "library_path": j.get("library_path"),
        "saved_path": j.get("saved_path"),
        "destination": j.get("destination"),
        "bpm_status": j.get("bpm_status"),
        "bpm": j.get("bpm"),
        "bpm_rounded": j.get("bpm_rounded"),
        "bpm_confidence": j.get("bpm_confidence"),
        "bpm_error": j.get("bpm_error"),
    }


@app.get("/spotify/connect")
def spotify_connect():
    try:
        authorization = create_authorization()
        return RedirectResponse(authorization["authorization_url"])
    except SpotifyAgentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/spotify/connect/open")
def spotify_connect_open():
    try:
        authorization = create_authorization()
        open_spotify_page(authorization["authorization_url"])
        return {"opened": True}
    except (SpotifyAgentError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/spotify/status")
def spotify_status():
    return connection_status()


@app.get("/spotify/callback")
def spotify_callback(code: str, state: str):
    try:
        result = exchange_code(code, state)
    except SpotifyAgentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    account = result.get("account") or {}
    identity = account.get("display_name") or account.get("email") or account.get("id")
    identity_html = f"<strong>{html.escape(str(identity))}</strong>" if identity else "account Spotify"
    return HTMLResponse(
        "<h1>Spotify collegato a Drops</h1>"
        f"<p>Account collegato: {identity_html}</p>"
        "<p>Puoi chiudere questa finestra e tornare a Drops.</p>"
    )


@app.post("/spotify/import")
def spotify_import():
    try:
        return import_saved_tracks()
    except SpotifyAgentError as exc:
        message, _ = explain_connection_error(exc)
        raise HTTPException(status_code=400, detail=message) from exc


@app.post("/spotify/export")
def spotify_export():
    try:
        return export_saved_tracks(DEFAULT_SAVE_DIR / "Drops Spotify")
    except SpotifyAgentError as exc:
        message, _ = explain_connection_error(exc)
        raise HTTPException(status_code=400, detail=message) from exc


@app.get("/spotify/library")
def spotify_library(offset: int = 0, limit: int = 100):
    return get_catalog(max(offset, 0), max(1, min(limit, 500)))


@app.post("/spotify/library/{track_id}/candidates")
def spotify_candidates(track_id: str, limit: int = 5):
    try:
        return search_candidates(track_id, limit)
    except SpotifyAgentError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _frontend_index_path() -> Path | None:
    """Trova frontend/index.html sia in dev che nell'exe PyInstaller (frozen).

    In modalità frozen (Windows/DMG impacchettato) i file sono estratti in
    sys._MEIPASS e il layout relativo a __file__ non esiste. Proviamo più
    posizioni candidate e restituiamo la prima esistente.
    """
    candidates = []
    if getattr(sys, "frozen", False):
        # PyInstaller: risorse estratte in _MEIPASS, e file accanto all'exe
        meipass = getattr(sys, "_MEIPASS", None)
        if meipass:
            candidates.append(Path(meipass) / "frontend" / "index.html")
        candidates.append(Path(sys.executable).parent / "frontend" / "index.html")
    # Dev / sorgente: backend/../frontend/index.html
    candidates.append(Path(__file__).parent.parent / "frontend" / "index.html")
    for p in candidates:
        if p.is_file():
            return p
    return None


@app.get("/")
def serve_frontend():
    html_path = _frontend_index_path()
    if html_path is None:
        logger.error("index.html non trovato (frozen=%s)", getattr(sys, "frozen", False))
        raise HTTPException(status_code=500, detail="Frontend non trovato nell'installazione.")
    content = html_path.read_text(encoding="utf-8")
    if APP_NAME == "Drops Beta":
        content = content.replace('<body>', '<body class="beta-theme">', 1)
    return HTMLResponse(content=content)
