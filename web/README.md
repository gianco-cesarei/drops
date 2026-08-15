# Drops Web

Sito pubblico Astro con isole React e area privata React per API Drops.

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` definisce origine API. Per sviluppo locale, copia `.env.example` in `.env` (`http://localhost:8000`). In produzione variabile è obbligatoria: nessun fallback same-origin. Autenticazione usa cookie HTTP-only `drops_session` tramite `credentials: include`.

Route pubbliche: `/`, `/suggests`, `/item/[slug]`. Discovery, Timeline e Map condividono `/` tramite `?view=`. Route private sotto `/app`; shell Graph resta placeholder in questa milestone.
