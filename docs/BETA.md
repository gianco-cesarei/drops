# Drops Beta

Drops Beta permette di provare funzioni non ancora pubblicate senza sostituire
Drops stabile.

| Canale | App | Bundle ID | Backend | Dati locali |
| --- | --- | --- | --- | --- |
| stabile | `Drops.app` | `com.giancocesarei.drops` | `127.0.0.1:8000` | `~/.drops` |
| beta | `Drops Beta.app` | `com.giancocesarei.drops.beta` | `127.0.0.1:8001` | `~/.drops-beta` |

Le due app possono essere installate e aperte insieme. Download, storico,
token Spotify e log restano separati.

## Spotify Beta

Nella Spotify Developer Dashboard aggiungere esattamente:

```text
http://127.0.0.1:8001/spotify/callback
```

Conservare anche il redirect stabile sulla porta `8000`. Aprire Drops Beta e
premere **Collega** per autorizzare account nel profilo beta.

## Build macOS locale

```bash
./build-beta-dmg.sh
```

Output:

```text
src-tauri/target/release/bundle/dmg/Drops_Beta_<version>_aarch64.dmg
```

Build locale usa firma ad-hoc. Distribuzione pubblica richiede Developer ID e
notarizzazione come descritto in `docs/DISTRIBUTION.md`.
