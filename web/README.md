# Drops Web

Frontend React + TypeScript + Vite per API Drops.

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` definisce origine API. Se vuota, richieste usano stessa origine. Autenticazione usa cookie HTTP-only tramite `credentials: include`.
