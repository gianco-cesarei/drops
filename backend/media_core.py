import urllib.parse


ALLOWED_DOMAINS = ("youtube.com", "youtu.be", "soundcloud.com", "music.youtube.com")


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
