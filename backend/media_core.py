import os
import shutil
import tempfile
import threading
import urllib.parse
import importlib.metadata
import logging
from pathlib import Path

logger = logging.getLogger("drops.media")


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
    args: dict = {"youtube": {"player_client": list(YTDLP_PLAYER_CLIENTS)}}
    args.update(_pot_provider_extractor_args())
    return args


def _pot_provider_extractor_args() -> dict:
    """Best-effort PO token via bgutil-ytdlp-pot-provider (script mode).

    Helps dodge YouTube's bot-check but never required: needs the pip plugin
    installed AND a cloned bgutil script dir (node/deno on PATH does the rest,
    outside our control). Either missing -> skip silently, yt-dlp proceeds
    without a PO token exactly like it does today.
    """
    try:
        importlib.metadata.distribution("bgutil-ytdlp-pot-provider")
    except importlib.metadata.PackageNotFoundError:
        logger.info("pot provider: bgutil-ytdlp-pot-provider non installato, PO token disabilitato")
        return {}
    script_home = os.environ.get("DROPS_YTDLP_BGUTIL_SCRIPT", "").strip() or str(Path.home() / "bgutil-ytdlp-pot-provider" / "server")
    if not os.path.isdir(script_home):
        logger.info("pot provider: script bgutil non trovato in %s, PO token disabilitato", script_home)
        return {}
    return {"youtubepot-bgutilscript": {"server_home": script_home}}


def ytdlp_cookiefile() -> str | None:
    """Path to a Netscape-format cookies file for yt-dlp, shared by download and BPM.

    Render's datacenter IPs get YouTube's "Sign in to confirm you're not a bot"
    bot-check; a browser-exported cookies file is yt-dlp's documented workaround.
    Optional: missing/invalid must never block startup or fall through to an error.
    """
    path = os.environ.get("DROPS_YTDLP_COOKIES", "").strip()
    if not path or not os.path.isfile(path):
        return None
    if os.access(path, os.W_OK):
        return path
    # yt-dlp rewrites the cookie jar after use, but Render's Secret Files are
    # mounted read-only (OSError [Errno 30]) - copy once to a writable spot
    # and hand yt-dlp that copy instead; the original Secret File is untouched.
    writable_copy = os.path.join(tempfile.gettempdir(), "drops-cookies.txt")
    if not os.path.isfile(writable_copy):
        shutil.copyfile(path, writable_copy)
    return writable_copy


def ytdlp_proxy() -> str | None:
    """Optional outbound proxy for yt-dlp's YouTube attempt, from DROPS_YTDLP_PROXY.

    Empty/unset means off - most deployments never set this.
    """
    value = os.environ.get("DROPS_YTDLP_PROXY", "").strip()
    return value or None


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
