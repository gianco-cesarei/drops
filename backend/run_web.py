import logging
import os
import socket
import subprocess
import time

import uvicorn

# uvicorn only configures its own "uvicorn*" loggers; without this, the app's
# "drops.*" loggers inherit the root logger's default WARNING level and INFO
# diagnostics (session/discogs status) never reach Render's log viewer.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("drops.run_web")

# Path baked into the Docker image (see Dockerfile) when the bgutil-ytdlp-pot-provider
# HTTP server is bundled. Absent in local/dev runs - that's fine, this whole step
# is best-effort.
BGUTIL_SERVER_ENTRY = "/opt/bgutil-server/build/main.js"
BGUTIL_PORT = 4416
BGUTIL_READY_TIMEOUT_SECONDS = 10.0


def start_bgutil_pot_provider() -> None:
    """Best-effort: start the bundled bgutil-ytdlp-pot-provider HTTP server so
    yt-dlp can request a free PO token against YouTube's bot-check.

    Never blocks or fails app startup: if the bundled server isn't present, or
    node fails to launch it, or it doesn't come up in time, this just returns
    without setting DROPS_YTDLP_BGUTIL_HTTP_BASE_URL - media_core.py's
    _pot_provider_extractor_args() then degrades exactly like it always did
    when no PO token provider is configured.
    """
    if not os.path.isfile(BGUTIL_SERVER_ENTRY):
        logger.info("bgutil pot provider: %s non trovato nell'immagine, PO token disabilitato", BGUTIL_SERVER_ENTRY)
        return
    try:
        subprocess.Popen(["node", BGUTIL_SERVER_ENTRY])
    except OSError as exc:
        logger.warning("bgutil pot provider: avvio fallito (%s), PO token disabilitato", exc)
        return
    deadline = time.monotonic() + BGUTIL_READY_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", BGUTIL_PORT), timeout=0.5):
                pass
        except OSError:
            time.sleep(0.5)
            continue
        os.environ["DROPS_YTDLP_BGUTIL_HTTP_BASE_URL"] = f"http://127.0.0.1:{BGUTIL_PORT}"
        logger.info("bgutil pot provider: HTTP server pronto su 127.0.0.1:%s, PO token abilitato", BGUTIL_PORT)
        return
    logger.warning("bgutil pot provider: server non pronto entro %ss, PO token disabilitato", BGUTIL_READY_TIMEOUT_SECONDS)


if __name__ == "__main__":
    start_bgutil_pot_provider()
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(
        "web_app:create_app",
        factory=True,
        host="0.0.0.0",
        port=port,
        workers=1,
    )
