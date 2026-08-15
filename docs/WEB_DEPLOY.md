# Deploy web staging

Scaffolding covers one static Astro frontend and one FastAPI container. It does
not select or provision a provider. Redis, R2, Spotify, CMS and multiple replicas
remain out of scope.

## Architecture and constraints

- Build `web/` as static files and publish `web/dist/` on a static host.
- Run API from root `Dockerfile` as exactly one container replica and one Uvicorn
  worker.
- Mount persistent storage at `/data`. SQLite database is `/data/web.sqlite3`;
  temporary job artifacts live under `/data/jobs/` and are removed after TTL.
- Keep frontend and API on same site, ideally sibling subdomains such as
  `web.example.com` and `api.example.com`. Current session cookie uses
  `SameSite=Lax`; unrelated provider domains are not compatible with credentialed
  cross-origin requests.
- Terminate HTTPS before API. Production cookie is `Secure` by default.

## API configuration

Copy `.env.example` to an untracked environment file or configure equivalent
provider variables. Generate password hash locally:

```bash
python3.12 -c 'from argon2 import PasswordHasher; print(PasswordHasher().hash(input("Password: ")))'
```

Required production values:

- `DROPS_WEB_USERNAME`
- `DROPS_WEB_PASSWORD_HASH`, containing full Argon2id hash
- `DROPS_WEB_ALLOWED_ORIGINS`, containing exact public frontend origin, without
  path or wildcard

`DROPS_WEB_STATE_DIR=/data` must stay unchanged unless persistent volume mount
changes with it. `PORT` defaults to `8000`; runtime may override it. Do not start
more than one worker or replica: executor scheduling and SQLite are local to
process/container.

Build and run locally:

```bash
docker build -t drops-web-api:local .
docker run --rm --env-file .env -p 8000:8000 -v drops-web-data:/data drops-web-api:local
```

Health endpoint:

```bash
curl --fail http://127.0.0.1:8000/health
```

Container image includes FFmpeg and defines Docker healthcheck against same
endpoint.

## Static Astro build

`VITE_API_URL` is public build-time configuration, not a secret. Set it to exact
HTTPS API origin without trailing slash:

```bash
cd web
npm ci
VITE_API_URL=https://api.example.com npm run build
```

Publish generated `web/dist/` directory. Rebuild frontend when API origin changes.
API `DROPS_WEB_ALLOWED_ORIGINS` must equal frontend browser origin exactly. Because
requests include credentials, wildcard CORS is invalid.

## Reproducible local checks

Run backend suite with Python 3.12:

```bash
python3.12 -m venv .venv-web
.venv-web/bin/pip install -r backend/requirements.txt 'httpx==0.27.0'
.venv-web/bin/python -m unittest discover -s backend -p 'test_*.py' -v
```

Run frontend verification:

```bash
cd web
npm ci
npm test
VITE_API_URL=http://localhost:8000 npm run build
```

Run container smoke test from repository root. It builds image, starts temporary
single-replica API, checks health/login/session and verifies SQLite plus jobs
directory on mounted storage:

```bash
./scripts/smoke-web-deploy.sh
```

Optional overrides: `DROPS_SMOKE_IMAGE` and `DROPS_SMOKE_PORT`.

## Before real staging deploy

Measure image size, idle/active memory, CPU during FFmpeg conversion, artifact disk
growth, download duration and outbound bandwidth. Choose provider only after these
measurements. Then provision one replica, persistent volume, HTTPS endpoints and
exact environment values. Do not place secrets in repository or static frontend.
