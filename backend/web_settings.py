import os
import tempfile
from dataclasses import dataclass
from pathlib import Path


def _positive_int(name: str, default: int) -> int:
    value = int(os.environ.get(name, default))
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value


def _bool(name: str, default: bool) -> bool:
    return os.environ.get(name, str(default)).lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class WebSettings:
    username: str
    password_hash: str
    state_dir: Path
    allowed_origins: tuple[str, ...]
    cookie_secure: bool
    session_ttl_seconds: int
    artifact_ttl_seconds: int
    max_queued: int
    max_concurrent: int
    max_duration_seconds: int
    max_file_bytes: int

    @classmethod
    def from_env(cls) -> "WebSettings":
        username = os.environ.get("DROPS_WEB_USERNAME", "").strip()
        password_hash = os.environ.get("DROPS_WEB_PASSWORD_HASH", "").strip()
        if not username or not password_hash:
            raise ValueError("DROPS_WEB_USERNAME and DROPS_WEB_PASSWORD_HASH are required")
        if not password_hash.startswith("$argon2id$"):
            raise ValueError("DROPS_WEB_PASSWORD_HASH must be an Argon2id hash")
        origins = tuple(x.strip() for x in os.environ.get("DROPS_WEB_ALLOWED_ORIGINS", "").split(",") if x.strip())
        state_dir = Path(os.environ.get("DROPS_WEB_STATE_DIR", Path(tempfile.gettempdir()) / "drops-web")).expanduser()
        return cls(
            username=username,
            password_hash=password_hash,
            state_dir=state_dir,
            allowed_origins=origins,
            cookie_secure=_bool("DROPS_WEB_COOKIE_SECURE", True),
            session_ttl_seconds=_positive_int("DROPS_WEB_SESSION_TTL_SECONDS", 86400),
            artifact_ttl_seconds=_positive_int("DROPS_WEB_ARTIFACT_TTL_SECONDS", 600),
            max_queued=_positive_int("DROPS_WEB_MAX_QUEUED", 20),
            max_concurrent=_positive_int("DROPS_WEB_MAX_CONCURRENT", 2),
            max_duration_seconds=_positive_int("DROPS_WEB_MAX_DURATION_SECONDS", 900),
            max_file_bytes=_positive_int("DROPS_WEB_MAX_FILE_BYTES", 100_000_000),
        )
