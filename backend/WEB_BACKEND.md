# Drops web backend

Profilo FastAPI separato dal backend desktop. Configurazione solo tramite environment.
Runtime supportato per sviluppo e test: Python 3.12.

Variabili obbligatorie:

- `DROPS_WEB_USERNAME`
- `DROPS_WEB_PASSWORD_HASH`: hash Argon2id completo
- `DROPS_WEB_ALLOWED_ORIGINS`: origini esatte separate da virgola

Variabili opzionali:

- `DROPS_WEB_STATE_DIR` (default: directory temporanea `drops-web`)
- `DROPS_WEB_COOKIE_SECURE` (default: `true`)
- `DROPS_WEB_SESSION_TTL_SECONDS` (default: `86400`)
- `DROPS_WEB_ARTIFACT_TTL_SECONDS` (default: `600`)
- `DROPS_WEB_MAX_QUEUED` (default: `20`)
- `DROPS_WEB_MAX_CONCURRENT` (default: `2`)
- `DROPS_WEB_MAX_DURATION_SECONDS` (default: `900`)
- `DROPS_WEB_MAX_FILE_BYTES` (default: `100000000`)
- `DROPS_WEB_LOGIN_RATE_LIMIT` (default: `5`)
- `DROPS_WEB_LOGIN_RATE_WINDOW_SECONDS` (default: `60`)
- `DROPS_WEB_ENV`: `production`, `development` o `test` (default: `production`)
- `DROPS_WEB_ALLOW_MISSING_ORIGIN` (default: `false`; abilitare esplicitamente solo per client locali/test senza header `Origin`)

In `production`, `DROPS_WEB_ALLOWED_ORIGINS` non può essere vuota. Ogni valore deve essere una origin HTTP/HTTPS esatta, senza wildcard, path, query o fragment.

Ambiente riproducibile e test:

```bash
python3.12 -m venv .venv-web
.venv-web/bin/python -m pip install -r backend/requirements.txt 'httpx==0.27.0'
.venv-web/bin/python -m unittest discover -s backend -p 'test_*.py'
```

Generazione hash:

```bash
python3.12 -c 'from argon2 import PasswordHasher; print(PasswordHasher().hash(input("Password: ")))'
```

Avvio dalla root repository:

```bash
python3.12 backend/run_web.py
```

`PORT` configura porta HTTP (default `8000`). Profilo produzione container,
storage persistente, CORS e smoke test: `docs/WEB_DEPLOY.md`.
