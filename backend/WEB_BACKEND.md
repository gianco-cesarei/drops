# Drops web backend

Profilo FastAPI separato dal backend desktop. Configurazione solo tramite environment.

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

Generazione hash:

```bash
python -c 'from argon2 import PasswordHasher; print(PasswordHasher().hash(input("Password: ")))'
```

Avvio dalla root repository:

```bash
python backend/run_web.py
```
