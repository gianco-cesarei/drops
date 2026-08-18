import os
import threading
import urllib.parse


ALLOWED_DOMAINS = ("youtube.com", "youtu.be", "soundcloud.com", "music.youtube.com")


# Single-flight lock shared by the download worker and the BPM engine: only
# one yt-dlp extraction runs per process at a time. Concurrent yt-dlp calls
# from the same IP add up to more "bot-like" traffic and resource contention;
# other jobs block here and run once the lock frees, they don't fail.
YTDLP_LOCK = threading.Lock()


YTDLP_PLAYER_CLIENTS = ["tv", "ios", "android", "web"]


def ytdlp_extractor_args() -> dict:
    """youtube player clients to try, shared by download and BPM (same engine).

    Render's datacenter IPs trip YouTube's "Sign in to confirm you're not a
    bot" check on the default web client; tv/ios/android clients frequently
    skip it entirely. Tried before falling back to cookies.
    """
    return {"youtube": {"player_client": list(YTDLP_PLAYER_CLIENTS)}}


def ytdlp_cookiefile() -> str | None:
    """Path to a Netscape-format cookies file for yt-dlp, shared by download and BPM.

    Render's datacenter IPs get YouTube's "Sign in to confirm you're not a bot"
    bot-check; a browser-exported cookies file is yt-dlp's documented workaround.
    Optional: missing/invalid must never block startup or fall through to an error.
    """
    path = os.environ.get("DROPS_YTDLP_COOKIES", "").strip()
    return path if path and os.path.isfile(path) else None


def safe_filename(name: str, ext: str) -> str:
    clean = "".join(c for c in name if c.isalnum() or c in " .-_()[]").strip()[:80]
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
