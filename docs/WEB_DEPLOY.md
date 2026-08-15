# Deploy web

Scaffolding covers one static Astro frontend and one FastAPI container. Real
deployment target is Cloudflare Pages for `web/` and Railway for the existing
Dockerfile. Redis, R2, Spotify, CMS and multiple replicas remain out of scope.

Use these placeholders consistently:

- `<REPOSITORY>`: GitHub repository selected in both providers
- `<BRANCH>`: production branch, normally `main`
- `<DOMAIN>`: domain already owned by the operator
- `https://<DOMAIN>`: production frontend origin
- `https://api.<DOMAIN>`: production API origin

No step below buys a domain. Review Railway plan, resource and volume prices
before approving its first deployment.

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

## Chosen production topology

```text
https://<DOMAIN>       Cloudflare Pages -> static web/dist
https://api.<DOMAIN>   Cloudflare DNS proxy -> Railway -> FastAPI container
                                               -> persistent volume /data
```

Sibling hostnames remain same-site for `SameSite=Lax`, while CORS still treats
them as different origins. Therefore frontend keeps `credentials: include`, API
allows only `https://<DOMAIN>`, and session cookie remains host-only on
`api.<DOMAIN>`, `Secure`, `HttpOnly`, `SameSite=Lax`.

Using a Cloudflare Worker to proxy `https://<DOMAIN>/api/*` is possible, but adds
another runtime and rewrite layer. It is not needed for current cookie policy and
is intentionally not added. Prefer `api.<DOMAIN>` unless a same-origin URL is a
hard requirement.

## 1. Connect repository to Railway

These steps require Railway and GitHub login, project creation and possible paid
plan approval. They cannot be completed from this repository alone.

1. Push this commit to `<BRANCH>` on `<REPOSITORY>`.
2. In Railway, create a project, choose **Deploy from GitHub repo**, authorize the
   Railway GitHub App for `<REPOSITORY>`, and select `<BRANCH>`.
3. Name the service `drops-api`. Leave root directory at repository root.
   Railway reads `railway.toml`, builds root `Dockerfile`, and uses final `api`
   stage. Confirm deployment details show Dockerfile builder and `/health` check.
4. Set exactly one replica in one region. Do not enable serverless sleep: media
   jobs and local SQLite state belong to one long-running process.
5. Create one Railway volume, attach it to `drops-api`, and set mount path to
   `/data`. Railway mounts volumes owned by root; because this image normally
   runs as non-root user `drops`, add `RAILWAY_RUN_UID=0` to service variables or
   `/data` will not be writable. This Railway-specific override runs container
   process as root; revisit with a privilege-dropping entrypoint if provider adds
   volume ownership controls.
6. In **Variables**, add values below. Use Railway secret UI; never commit actual
   username, hash, token or password.

```dotenv
DROPS_WEB_USERNAME=<production-username>
DROPS_WEB_PASSWORD_HASH=<full-argon2id-hash>
DROPS_WEB_ALLOWED_ORIGINS=https://<DOMAIN>
DROPS_WEB_COOKIE_SECURE=true
DROPS_WEB_ENV=production
DROPS_WEB_STATE_DIR=/data
DROPS_WEB_ARTIFACT_TTL_SECONDS=600
DROPS_WEB_MAX_QUEUED=20
DROPS_WEB_MAX_CONCURRENT=2
DROPS_WEB_MAX_DURATION_SECONDS=900
DROPS_WEB_MAX_FILE_BYTES=100000000
RAILWAY_RUN_UID=0
```

Do not set `PORT`: Railway injects it and `backend/run_web.py` already reads it.
Generate password hash locally using command in **API configuration** below.

7. Deploy staged Railway changes. Wait for `/health` to return `200`. A service
   with attached volume has brief redeploy downtime because Railway cannot mount
   same volume to old and new deployments concurrently.

## 2. Attach API domain through Cloudflare

Requires control of existing `<DOMAIN>` DNS zone plus Railway approval.

1. In Railway service **Settings > Public Networking**, choose **Custom Domain**,
   enter `api.<DOMAIN>`, and select application `PORT` when prompted.
2. Railway shows one CNAME target and one ownership TXT record. In Cloudflare
   **DNS > Records**, create both records exactly as Railway displays them.
3. For first-level `api.<DOMAIN>`, enable Cloudflare proxy (orange cloud). Set
   Cloudflare **SSL/TLS encryption mode** to **Full**, as required by Railway for
   proxied custom domains. Do not use Flexible.
4. Wait until Railway shows domain verified and Cloudflare proxy detected. Test:

```bash
curl --fail --show-error https://api.<DOMAIN>/health
```

DNS and certificate activation can take time. Do not proceed to frontend until
this command succeeds.

## 3. Connect repository to Cloudflare Pages

Requires Cloudflare and GitHub login plus authorization for `<REPOSITORY>`.

1. In Cloudflare **Workers & Pages**, create **Pages > Connect to Git**. Select
   `<REPOSITORY>` and production branch `<BRANCH>`.
2. Configure build:

   - Framework preset: `Astro`
   - Build system: v3
   - Root directory: `web`
   - Build command: `npm run build`
   - Build output directory: `dist`

3. Under production build environment variables add:

```dotenv
NODE_VERSION=22
PUBLIC_API_URL=https://api.<DOMAIN>
```

`PUBLIC_API_URL` is public build configuration, not a secret. Do not add API
credentials to Pages. `web/.node-version` also pins Node 22 for reproducibility.

4. Save and deploy. Build must run Astro checks and emit static `web/dist`.
5. In Pages project **Custom domains**, choose **Set up a domain**, enter
   `<DOMAIN>`, and follow DNS prompts. Apex domains require zone nameservers on
   Cloudflare. No domain purchase is part of this runbook.
6. After custom domain becomes active, trigger one fresh production deployment so
   bundle contains final API origin. Verify:

```bash
curl --fail --show-error https://<DOMAIN>/
curl --fail --show-error https://api.<DOMAIN>/health
```

Pages preview URLs are different origins and are deliberately excluded from
production CORS. Test authentication on final custom domain. To enable a specific
preview temporarily, append its exact origin to `DROPS_WEB_ALLOWED_ORIGINS` and
remove it afterward; never use `*` with credentialed requests.

## 4. Production acceptance

Run public checks from a machine with `curl`:

```bash
curl --fail --show-error https://api.<DOMAIN>/health
curl --fail --show-error https://<DOMAIN>/
```

Open `https://<DOMAIN>` in a private browser window, log in through UI, reload page
to verify session persistence, then log out. This avoids placing production
password in shell history. Test one small permitted media job and confirm Railway
volume contains `/data/web.sqlite3` and `/data/jobs`. Review CPU, memory, FFmpeg
duration, disk and egress before increasing limits or workload.

## Automation boundary

Repository work can automate Docker/API builds, unit tests, Astro build, local
container smoke test, provider config validation and future deploys after Git
connections are active. Pushes to configured branch then trigger both providers.

User login or explicit approval remains required for:

- pushing branch if Git remote credentials are not already authorized;
- Cloudflare, Railway and GitHub App account connections;
- Railway project/service/volume creation and any paid plan or resource choice;
- entering production secrets in Railway;
- selecting domain and changing DNS, TLS or custom-domain settings;
- first deployment approval and production acceptance with real credentials.

Provider references:

- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages build image and Node version](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Railway config as code](https://docs.railway.com/config-as-code)
- [Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles)
- [Railway volumes and permissions](https://docs.railway.com/volumes)
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Railway custom domains with Cloudflare](https://docs.railway.com/networking/domains/working-with-domains)

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

`PUBLIC_API_URL` is public build-time configuration, not a secret. Set it to exact
HTTPS API origin without trailing slash:

```bash
cd web
npm ci
PUBLIC_API_URL=https://api.example.com npm run build
grep -R --fixed-strings 'https://api.example.com' dist
```

Publish generated `web/dist/` directory. Rebuild frontend when API origin changes.
API `DROPS_WEB_ALLOWED_ORIGINS` must equal frontend browser origin exactly. Because
requests include credentials, wildcard CORS is invalid.

Equivalent reproducible Docker target:

```bash
docker build --target web-build \
  --build-arg PUBLIC_API_URL=https://api.example.com \
  -t drops-web-static:local .
docker run --rm drops-web-static:local \
  grep -R --fixed-strings 'https://api.example.com' /web/dist
```

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
PUBLIC_API_URL=http://localhost:8000 npm run build
grep -R --fixed-strings 'http://localhost:8000' dist
```

Run container smoke test from repository root. It builds image, starts temporary
single-replica API, checks health/login/session and verifies SQLite plus jobs
directory on mounted storage. It also builds static target with unique API URL and
requires that exact URL inside generated bundle:

```bash
./scripts/smoke-web-deploy.sh
```

Optional overrides: `DROPS_SMOKE_IMAGE`, `DROPS_SMOKE_WEB_IMAGE` and
`DROPS_SMOKE_PORT`.

## Before real staging deploy

Measure image size, idle/active memory, CPU during FFmpeg conversion, artifact disk
growth, download duration and outbound bandwidth. Choose provider only after these
measurements. Then provision one replica, persistent volume, HTTPS endpoints and
exact environment values. Do not place secrets in repository or static frontend.
