# Deploy web reale

Deploy target già esistente:

```text
Browser
  └─ https://drops.giancarlocesarei.workers.dev
       └─ Cloudflare Worker Static Assets -> web/dist
       └─ /api/*, /health -> https://mp3-ytb.onrender.com

Render service: srv-d86rcsf7f7vs73f22ej0
Repository:     gianco-cesarei/drops
Branch:         codex/web-first
Runtime:        Docker, Dockerfile ./Dockerfile
Persistent dir: /data
```

No new container architecture. No second API. No custom domain. The Worker keeps
the browser on one origin and forwards only the API routes to existing Render.

## Worker configuration

[wrangler.jsonc](../wrangler.jsonc) defines Worker name, static asset binding,
API origin and public frontend URL. [worker/index.js](../worker/index.js) applies
this routing:

- `/api/*`: proxy to `API_ORIGIN`;
- `/health`: proxy to `API_ORIGIN` (deployment check convenience);
- every other path: `env.ASSETS.fetch(request)` from `web/dist`;
- no request parameter, header or path can select an upstream.

Proxy keeps original method, query string, headers, body and streaming response.
`Set-Cookie` returns directly from Render. Browser `Origin` remains
`https://drops.giancarlocesarei.workers.dev`; Worker does not rewrite it.

`API_ORIGIN` is an environment-configurable HTTPS origin without path, credentials,
query or fragment. It is a deployment setting, not a URL taken from request input,
so Worker is not an open proxy. Production value:
`https://mp3-ytb.onrender.com`.

Wrangler dependency is pinned exactly to `4.31.0` in root `package.json` and lock.
`web/.node-version` remains `22`.

## Cloudflare Workers Builds

Requires Cloudflare and GitHub login. No domain purchase or custom hostname step.

1. Open Cloudflare dashboard → **Workers** → **Create application** →
   **Import a repository**.
2. Connect GitHub repository `gianco-cesarei/drops`; choose branch
   `codex/web-first`.
3. Set project root to repository root.
4. Build command:

   ```bash
   npm ci && npm run build:worker
   ```

   `build:worker` runs `npm ci --prefix web` and `npm run build --prefix web`.
5. Add production build variable:

   ```dotenv
   PUBLIC_API_URL=https://drops.giancarlocesarei.workers.dev
   ```

   This value is public and embedded in Astro assets; never put credentials here.
6. Deploy command, if dashboard requests one:

   ```bash
   npx wrangler deploy
   ```

   Wrangler reads `wrangler.jsonc`, uploads `web/dist`, and deploys
   `worker/index.js`. Keep production branch set to `codex/web-first`.
7. In Worker Variables, set `API_ORIGIN` to:

   ```dotenv
   API_ORIGIN=https://mp3-ytb.onrender.com
   ```

   `PUBLIC_API_URL` in `wrangler.jsonc` documents the public binding; the Astro
   build variable above is authoritative at build time.
8. Verify Worker-provided URL:

   ```bash
   curl --fail --show-error https://drops.giancarlocesarei.workers.dev/
   curl --fail --show-error https://drops.giancarlocesarei.workers.dev/health
   ```

Worker preview deployments are not production auth targets. Keep production API
CORS restricted to the Worker origin below.

## Render source and runtime update

Requires Render login and deployment approval. In Render service
`srv-d86rcsf7f7vs73f22ej0`:

1. **Settings → Build → Source → Edit**.
2. Repository: `gianco-cesarei/drops`.
3. Branch: `codex/web-first`.
4. Runtime: **Docker**.
5. Dockerfile: `./Dockerfile`.
6. Keep one service instance and existing persistent disk mounted at `/data`.
7. Keep health check path `/health`; application listens on injected `PORT`.
8. Add/update these service environment variables:

   ```dotenv
   DROPS_WEB_ALLOWED_ORIGINS=https://drops.giancarlocesarei.workers.dev
   DROPS_WEB_COOKIE_SECURE=true
   DROPS_WEB_ENV=production
   DROPS_WEB_STATE_DIR=/data
   ```

9. Preserve existing secret variables in Render secret storage:
   `DROPS_WEB_USERNAME` and `DROPS_WEB_PASSWORD_HASH`. Do not copy them into
   this repository or Worker variables.
   Configure Spotify values in Render environment only:

   ```dotenv
   SPOTIFY_CLIENT_ID=<Spotify app client ID>
   SPOTIFY_REDIRECT_URI=https://drops.giancarlocesarei.workers.dev/api/v1/spotify/callback
   SPOTIFY_REFRESH_TOKEN=<refresh token copied after first OAuth connect>
   ```

   Register exact redirect URI in Spotify app dashboard. `SPOTIFY_REFRESH_TOKEN`
   seeds connection after restarts; runtime token JSON remains on `/data`.
   Configure Discogs only in Render secret/environment settings:

   ```dotenv
   DISCOGS_TOKEN=<Discogs personal token>
   DISCOGS_USER_AGENT=Drops/1.0 +https://drops.giancarlocesarei.workers.dev
   ```

   Discogs responses cache under `/data/discogs-cache`; missing token or upstream
   failure leaves Spotify tracks available without Discogs metadata.
10. Save, review, and approve deploy. Confirm Render logs show Docker build and
    `/health` returns `200`.

Generate Argon2id hash locally; paste result only into Render secret variable:

```bash
python3.12 -c 'from argon2 import PasswordHasher; print(PasswordHasher().hash(input("Password: ")))'
```

## CORS, cookie and API behavior

Render accepts exactly one browser origin:
`https://drops.giancarlocesarei.workers.dev`. Wildcard CORS is invalid with
credentialed requests. Cookie policy stays `Secure`, `HttpOnly`, `SameSite=Lax`,
with `credentials: include` from frontend. Worker and API share same site because
requests stay on the Worker URL.

Do not add `Access-Control-Allow-Origin: *`, do not expose Render API directly in
frontend build, and do not place passwords, Argon2 hashes, tokens or cookies in
tracked files. `PUBLIC_API_URL` is the only public build value.

## Local checks

From repository root:

```bash
.venv-web/bin/python -m unittest discover -s backend -p 'test_*.py' -v
npm test --prefix web
PUBLIC_API_URL=https://drops.giancarlocesarei.workers.dev npm run build --prefix web
npm run test:worker
git diff --check
```

Worker tests cover static asset serving, `/api/*` routing, optional `/health`,
method/query/body/Origin preservation, `Set-Cookie`, streaming, invalid origin
configuration and no open proxy. Docker smoke remains available:

```bash
./scripts/smoke-web-deploy.sh
```

Smoke validates existing API container, health, auth session, SQLite and `/data`.

## Automation boundary

After GitHub connections are authorized, pushes to `codex/web-first` can trigger
Worker build/deploy and Render deploy. Local tests, Astro build, Worker proxy
tests and Docker smoke are automatic commands.

User login/approval remains required for GitHub app authorization, Cloudflare
Workers Builds connection, Render source edit, Render environment secrets, disk
settings and production deploy approval. No external deployment, billing action
or secret entry is performed by repository changes.

References:

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Render Docker deploys](https://render.com/docs/deploys)
