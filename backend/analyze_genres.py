"""Analizza e, su richiesta, riclassifica il catalogo usando solo dati locali.

Nessuna chiamata di rete. ``--apply`` crea prima un backup del catalogo.

Uso:
    python3 backend/analyze_genres.py
    python3 backend/analyze_genres.py --apply
"""

import argparse
import json
import time
from collections import Counter
from pathlib import Path

from spotify_agent import genre_folder

CATALOG = Path.home() / ".drops" / "spotify-library.json"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="riclassifica offline e salva il catalogo dopo aver creato un backup",
    )
    args = parser.parse_args()
    if not CATALOG.exists():
        raise SystemExit(f"Catalogo non trovato: {CATALOG}")
    catalog = json.loads(CATALOG.read_text())
    tracks = catalog.get("tracks", [])

    projected = Counter(genre_folder(t.get("genres") or []) for t in tracks)
    changed = sum(
        t.get("genre_folder") != genre_folder(t.get("genres") or []) for t in tracks
    )

    altri = [t for t in tracks if t.get("genre_folder") == "Altri Generi"]
    con_tag = [t for t in altri if t.get("genres")]
    senza_tag = [t for t in altri if not t.get("genres")]

    print(f"Totale brani: {len(tracks)}")
    print(f"In 'Altri Generi': {len(altri)}")
    print(f"  - con tag MusicBrainz (recuperabili con nuove regole): {len(con_tag)}")
    print(f"  - senza alcun tag (artista non trovato/senza tag): {len(senza_tag)}")

    tag_counts = Counter(
        tag.lower() for t in con_tag for tag in t.get("genres", [])
    )
    print("\nTag piu' frequenti tra gli 'Altri Generi' (i candidati per nuove regole):\n")
    for tag, n in tag_counts.most_common(45):
        print(f"  {n:4}  {tag}")

    print(f"\nRiclassificazione offline disponibile per {changed} brani:")
    for folder, count in projected.most_common():
        print(f"  {count:4}  {folder}")

    if not args.apply:
        return

    backup = CATALOG.with_name(
        f"{CATALOG.stem}.backup-{time.strftime('%Y%m%d-%H%M%S')}{CATALOG.suffix}"
    )
    backup.write_bytes(CATALOG.read_bytes())
    for track in tracks:
        track["genre_folder"] = genre_folder(track.get("genres") or [])
    catalog["reclassified_at"] = time.time()
    temporary = CATALOG.with_suffix(CATALOG.suffix + ".tmp")
    temporary.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    temporary.replace(CATALOG)
    print(f"\nCatalogo aggiornato: {CATALOG}")
    print(f"Backup: {backup}")


if __name__ == "__main__":
    main()
