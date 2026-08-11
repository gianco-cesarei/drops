# Drops — ambiente di sviluppo

Configurazione tecnica per lavorare sul repository. Installazione utente macOS:
vedi `INSTALLAZIONE_MACOS.md`.

## Prerequisiti macOS

- Python 3.11 o successivo;
- Node.js 20;
- Rust;
- FFmpeg.

## Preparazione

```bash
python3.11 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
npm install
```

Avvio backend e interfaccia nel browser:

```bash
./start.sh
```

Avvio app desktop Tauri:

```bash
./launch-desktop.sh
```

## Stato locale

Drops crea dati runtime fuori dal repository:

```text
~/.drops/
├── cookies.txt
├── download-history.json
├── spotify-account.json
├── spotify-artist-genres.json
├── spotify-auth-state.json
├── spotify-library.json
├── spotify-token.json
└── logs/
    ├── backend.log
    └── uvicorn.log
```

Token Spotify e cookie sono privati. Non copiarli nel repository, nei log condivisi
o nelle segnalazioni bug.

## Test backend

```bash
.venv/bin/python -m unittest discover -s backend -p 'test_*.py' -v
```

## Diagnosi

Backend locale: `http://127.0.0.1:8000`.

```bash
curl http://127.0.0.1:8000/health
tail -50 ~/.drops/logs/backend.log
```

Se porta 8000 è occupata, chiudere precedente istanza Drops prima di riavviare.

Diagnosi Spotify isolata:

```bash
.venv/bin/python backend/diagnose_spotify.py
```

Script operativi `analyze_genres.py` e `batch_download.py` restano strumenti di
sviluppo: non vengono richiamati automaticamente dall'app.
