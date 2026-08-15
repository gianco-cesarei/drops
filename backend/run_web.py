import os

import uvicorn


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(
        "web_app:create_app",
        factory=True,
        host="0.0.0.0",
        port=port,
        workers=1,
    )
