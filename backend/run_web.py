import logging
import os

import uvicorn

# uvicorn only configures its own "uvicorn*" loggers; without this, the app's
# "drops.*" loggers inherit the root logger's default WARNING level and INFO
# diagnostics (session/discogs status) never reach Render's log viewer.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(
        "web_app:create_app",
        factory=True,
        host="0.0.0.0",
        port=port,
        workers=1,
    )
