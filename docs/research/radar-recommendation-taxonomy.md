# Drops Radar Research — tassonomia e formato

Versione 1.0 · 2026-08-15

## Obiettivo

Un record Radar è un'ipotesi editoriale verificabile, non un contenuto pubblicato. Deve permettere a una persona di capire cosa è successo, controllare la fonte, collegare il segnale al Brain e decidere se promuoverlo verso Radar, Brain, Content, Discovery o Suggests.

## Tipi

- `artist`: artista o collettivo con segnale rilevante.
- `label`: etichetta, catalogo o comunità editoriale.
- `release`: album, EP, singolo o compilation.
- `set`: DJ set, live set, trasmissione o archivio audio.
- `playlist`: selezione editoriale o raccolta.
- `party`: festa, club night o festival.
- `scene`: ecosistema locale o translocale.
- `cultural_phenomenon`: dinamica culturale, economica o infrastrutturale.
- `editorial_source`: fonte da seguire.
- `product_pattern`: comportamento di prodotto osservabile.

## Vocabolari controllati

### Relazione col grafo

- `inside`: almeno due entità già note al Brain e legame diretto forte.
- `adjacent`: un ponte verificabile verso entità, luogo, label o suono noto.
- `outside`: nessun legame richiesto; candidato scelto per valore editoriale e diversità.

La relazione descrive stato al momento della ricerca, non valore assoluto. Se inventario Brain non è disponibile, usare `adjacent` solo con ponte esplicito e annotare limite.

### Confidenza

- `high` (`0.80–1.00`): fonte primaria, date e soggetto chiari; inferenza limitata.
- `medium` (`0.55–0.79`): fatti solidi, ma segnale editoriale ancora da triangolare.
- `low` (`0.00–0.54`): fonte incompleta, ambiguità o ipotesi precoce; non promuovere senza verifica.

### Destinazioni

- `Radar`: coda privata di valutazione.
- `Brain`: entità o relazione durevole e verificata.
- `Content`: storia con tesi, fonti e sviluppo.
- `Discovery`: oggetto pubblico esplorabile con metadati solidi.
- `Suggests`: raccomandazione pubblica forte, ascoltata e approvata da persona.

## Forma canonica

File batch: `data/radar-candidates/YYYY-MM-DD-radar-candidates.json`.

Campi obbligatori per ogni record:

```json
{
  "id": "radar-YYYYMMDD-slug",
  "title": "Titolo leggibile",
  "type": "release",
  "summary": "Sintesi neutra",
  "primary_source": {
    "name": "Fonte",
    "url": "https://...",
    "date": "YYYY-MM-DD",
    "date_basis": "published|released|event|accessed"
  },
  "subject_date": { "start": "YYYY-MM-DD", "end": null, "precision": "day|month|year" },
  "location": { "kind": "place|online|hybrid", "name": "Luogo", "country_code": "PT" },
  "tags": ["controlled-lowercase-tag"],
  "assessment": {
    "facts": ["Affermazione direttamente supportata"],
    "inferences": ["Interpretazione dichiarata"],
    "opinions": ["Giudizio editoriale dichiarato"]
  },
  "relevance": "Perché conta per Drops",
  "brain_connection": {
    "possible_entities": [{ "name": "Nome", "entity_type": "artist|label|release|event|place|scene|source|concept" }],
    "possible_edges": [{ "from": "Nome", "relation": "released_by|part_of|based_in|performed_at|collaborates_with|documents|influences|similar_context", "to": "Nome" }],
    "graph_relation": "inside|adjacent|outside",
    "rationale": "Ponte o ragione di esplorazione"
  },
  "confidence": { "level": "high|medium|low", "score": 0.9, "notes": "Limiti" },
  "destinations": ["Radar", "Brain"],
  "editorial_status": "candidate",
  "reviewed_at": "YYYY-MM-DD"
}
```

## Regole editoriali

1. URL diretto alla fonte primaria; aggregatori solo come verifica secondaria.
2. `primary_source.date` usa data pubblicata/release/evento. Se pagina non espone data, usa data d'accesso e `date_basis: accessed`.
3. `subject_date` resta separata: evita di confondere annuncio, uscita ed evento.
4. Fatti, inferenze e opinioni non condividono stessa frase.
5. Tag descrivono suono, luogo, formato e dinamica; niente tag promozionali vaghi.
6. Ogni edge Brain deve essere verificabile o marcato come possibile; mai materializzare inferenze come fatti.
7. `outside` deve occupare quota minima del feed per prevenire chiusura autoreferenziale.
8. Nessun record raggiunge `Suggests` senza ascolto/visione umana e controllo fonte.
