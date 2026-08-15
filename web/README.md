# Drops Web

Sito pubblico Astro con isole React e area privata React per API Drops.

```bash
cp .env.example .env
npm install
npm run dev
```

`PUBLIC_API_URL` definisce origine API. Se vuota, richieste usano stessa origine. Autenticazione usa cookie HTTP-only tramite `credentials: include`.

Build e deploy statico completo: `../docs/WEB_DEPLOY.md`.

Route pubbliche: `/`, `/suggests`, `/item/[slug]`. Discovery, Timeline e Map condividono `/` tramite `?view=`. Route private sotto `/app`; shell Graph resta placeholder in questa milestone.
