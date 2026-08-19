"""Multi-source download engine: SoundCloud first (matched by similarity and
duration), the link's own native source (usually YouTube) always last,
transparently to the caller."""

from __future__ import annotations

import difflib
import logging
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import yt_dlp

from media_core import YTDLP_LOCK, ytdlp_cookiefile, ytdlp_extractor_args

logger = logging.getLogger("drops.download")

AUDIO_QUALITY = {"128": "128", "192": "192", "320": "0"}

# Our own abort messages (progress hook / duration check) - never retryable,
# retrying an oversized/too-long media just repeats the same failure.
DOWNLOAD_ABORT_MESSAGES = {
    "Download duration limit exceeded",
    "Download size limit exceeded",
    "Media duration limit exceeded",
}

SOUNDCLOUD_SEARCH_COUNT = 5
DURATION_TOLERANCE_SECONDS = 15
# Conservative on purpose: the spec's hard rule is "never a wrong match" - a
# missed-but-real SoundCloud match just falls through to the native source,
# which is always a safe outcome; a false-positive match is not.
SIMILARITY_THRESHOLD = 0.6


def _normalize(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").casefold()).strip()


def similarity(a: str | None, b: str | None) -> float:
    return difflib.SequenceMatcher(None, _normalize(a), _normalize(b)).ratio()


def score_candidate(artist: str | None, title: str | None, entry: dict[str, Any]) -> float:
    candidate_title = str(entry.get("title") or "")
    candidate_uploader = str(entry.get("uploader") or "")
    combined_query = f"{artist or ''} {title or ''}".strip()
    scores = [similarity(title, candidate_title), similarity(combined_query, candidate_title)]
    if artist:
        scores.append((similarity(title, candidate_title) + similarity(artist, candidate_uploader)) / 2)
    return max(scores)


def find_soundcloud_match(artist: str | None, title: str | None, duration: int | None) -> str | None:
    """Search SoundCloud for a track matching artist+title, gated by duration when known.

    Not extract_flat: we need each candidate's real duration for the +/-15s
    gate, which flat search results don't reliably carry.
    """
    if not artist or not title:
        return None
    query = f"{artist} {title}".strip()
    options = {
        "quiet": True, "no_warnings": True,
        "socket_timeout": 15, "extractor_args": ytdlp_extractor_args(),
    }
    try:
        with YTDLP_LOCK, yt_dlp.YoutubeDL(options) as ydl:
            result = ydl.extract_info(f"scsearch{SOUNDCLOUD_SEARCH_COUNT}:{query}", download=False)
    except Exception as exc:
        logger.info("soundcloud search fallita query=%r detail=%r", query, str(exc)[:200])
        return None
    best_url, best_score = None, 0.0
    for entry in (result or {}).get("entries") or []:
        if not entry:
            continue
        if duration is not None:
            candidate_duration = entry.get("duration")
            if candidate_duration is None or abs(candidate_duration - duration) > DURATION_TOLERANCE_SECONDS:
                continue
        score = score_candidate(artist, title, entry)
        if score > best_score:
            best_score, best_url = score, entry.get("webpage_url") or entry.get("url")
    if best_url and best_score >= SIMILARITY_THRESHOLD:
        return best_url
    return None


def attempt_download(job_dir: Path, url: str, quality: str, settings, started: float, *, proxy: str | None = None) -> dict[str, Any]:
    """Run yt-dlp against a single candidate url, with the existing retry/limit behavior. Raises on total failure."""

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

    options = {
        "format": "bestaudio/best",
        "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": AUDIO_QUALITY[quality]}],
        "outtmpl": str(job_dir / "source.%(ext)s"),
        "quiet": True, "no_warnings": True, "noplaylist": True,
        "max_filesize": settings.max_file_bytes,
        "match_filter": duration_filter,
        "socket_timeout": 30,
        "progress_hooks": [progress],
        "extractor_args": ytdlp_extractor_args(),
    }
    cookies = ytdlp_cookiefile()
    if cookies:
        options["cookiefile"] = cookies
    if proxy:
        options["proxy"] = proxy

    info = None
    last_extract_error: yt_dlp.utils.DownloadError | None = None
    for attempt in range(1, 4):
        try:
            with YTDLP_LOCK, yt_dlp.YoutubeDL(options) as ydl:
                info = ydl.extract_info(url, download=True)
            break
        except yt_dlp.utils.DownloadError as exc:
            last_extract_error = exc
            for leftover in job_dir.iterdir():
                if leftover.is_file():
                    leftover.unlink(missing_ok=True)
            if str(exc) in DOWNLOAD_ABORT_MESSAGES or attempt == 3:
                raise
            # YouTube's bot-check is intermittent per player client/IP; a
            # short retry often clears it without needing cookies.
            logger.warning("download retrying attempt=%s", attempt)
            time.sleep(1)
    if info is None:
        raise last_extract_error
    return info


def _clear_job_dir(job_dir: Path) -> None:
    for leftover in job_dir.iterdir():
        if leftover.is_file():
            leftover.unlink(missing_ok=True)


def _native_source_label(url: str) -> str:
    host = (urlsplit(url).hostname or "").lower()
    return "soundcloud" if host == "soundcloud.com" or host.endswith(".soundcloud.com") else "youtube"


def download_multi_source(
    job_dir: Path, job_id: str, native_url: str, artist: str | None, title: str | None,
    duration: int | None, quality: str, settings, started: float, *, proxy: str | None = None,
) -> tuple[dict[str, Any], str]:
    """SoundCloud first (only if it's a confident match), native source (YouTube) always last."""
    match_url = find_soundcloud_match(artist, title, duration)
    if match_url:
        try:
            info = attempt_download(job_dir, match_url, quality, settings, started)
            logger.info("download source scelta job_id=%s source=soundcloud", job_id)
            return info, "soundcloud"
        except Exception as exc:
            logger.info("download fallback job_id=%s motivo=soundcloud_fallito detail=%r", job_id, str(exc)[:200])
            _clear_job_dir(job_dir)
    else:
        logger.info("download fallback job_id=%s motivo=nessun_match_soundcloud", job_id)
    label = _native_source_label(native_url)
    info = attempt_download(job_dir, native_url, quality, settings, started, proxy=proxy)
    logger.info("download source scelta job_id=%s source=%s", job_id, label)
    return info, label
