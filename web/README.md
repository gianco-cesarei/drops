# Drops Web

Sito pubblico Astro con isole React e area privata React per API Drops.

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` definisce origine API. Se vuota, richieste usano stessa origine. Autenticazione usa cookie HTTP-only tramite `credentials: include`.

Route pubbliche: `/`, `/suggests`, `/item/[slug]`. Discovery, Timeline e Map condividono `/` tramite `?view=`. Route private sotto `/app`; shell Graph resta placeholder in questa milestone.
