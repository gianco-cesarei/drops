FROM node:22-slim AS web-build

WORKDIR /web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./

ARG PUBLIC_API_URL
ENV ASTRO_TELEMETRY_DISABLED=1 \
    PUBLIC_API_URL=${PUBLIC_API_URL}

RUN test -n "$PUBLIC_API_URL" \
    && npm run build \
    && grep -R --fixed-strings --quiet "$PUBLIC_API_URL" dist

FROM python:3.12-slim AS api

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    DROPS_WEB_STATE_DIR=/data

RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system drops \
    && useradd --system --gid drops --home-dir /app drops \
    && mkdir -p /app /data \
    && chown -R drops:drops /app /data

WORKDIR /app

COPY backend/requirements-web.txt backend/requirements-web.txt
RUN pip install --no-cache-dir -r backend/requirements-web.txt

COPY --chown=drops:drops \
    backend/discogs_agent.py \
    backend/media_core.py \
    backend/run_web.py \
    backend/spotify_agent.py \
    backend/web_app.py \
    backend/web_settings.py \
    backend/web_store.py \
    backend/

# Fail image build if runtime import graph is incomplete. Backend runs with
# /app/backend on sys.path because run_web.py is executed as backend/run_web.py.
RUN python -c "import sys; sys.path.insert(0, '/app/backend'); import web_app; import spotify_agent; import discogs_agent"

USER drops

EXPOSE 8000
VOLUME ["/data"]

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8000') + '/health', timeout=3).read()"

CMD ["python", "backend/run_web.py"]
