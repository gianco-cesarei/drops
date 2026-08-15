# Opportunità prodotto osservate nei competitor

Ricerca: 2026-08-15. Le funzionalità sotto sono fatti documentati dalle piattaforme; applicazioni a Drops sono inferenze di prodotto, non roadmap approvata.

## 1. Pacchetti curatoriale + contesto + rituale

**Osservazione — Bandcamp Clubs.** Club guidati da curatori consegnano un album mensile posseduto dall'utente, intervista, spazio membri e listening party. Bandcamp presenta il modello come discovery umana e sostegno ad artista e curatore.

**Opportunità Drops.** Trasformare Suggests da lista continua a “drop motivato”: una selezione piccola, nota del curatore, percorso Brain e finestra di ascolto condivisa. Drops non deve vendere musica per adottare ritmo e profondità.

**Rischio.** Ritualizzazione può restringere voci se roster curatori resta stabile. Rotazione geografica e disclosure della selezione necessarie.

Fonte primaria: [Bandcamp Clubs](https://bandcamp.com/about_clubs), accesso 2026-08-15; [annuncio ufficiale](https://blog.bandcamp.com/2025/09/01/discover-bandcamp-clubs-curated-music-experiences/), 2025-09-01.

## 2. Discovery eventi: filtri espliciti più personalizzazione

**Osservazione — RA Guide.** RA combina filtri per tipo, dimensione, genere, data, popolarità e scelte editoriali con raccomandazioni “For You”; importa gusti da Spotify/Apple Music e notifica concerti locali degli artisti seguiti.

**Opportunità Drops.** Timeline e Map dovrebbero esporre sempre perché un party appare: `vicino`, `artista seguito`, `ponte Brain`, `scelta editoriale`, `fuori-grafo`. Filtri e spiegazione devono poter correggere personalizzazione.

**Rischio.** Importare gusto da piattaforme dominanti replica loro bias. Trattarlo come segnale opzionale, mai fondamento esclusivo.

Fonte primaria: [RA Guide](https://ra.co/ra-guide), accesso 2026-08-15; [RA About](https://ra.co/about), accesso 2026-08-15.

## 3. Doppia porta: mood immediato e ricerca profonda

**Osservazione — NTS.** Archivio navigabile per mood e tassonomia di genere; Infinite Mixtapes offre stream tematici continui; Collections e NTS Guide creano percorsi editoriali. NTS dichiara priorità alla curatela umana.

**Opportunità Drops.** Discovery può offrire ingresso a basso attrito (“voglio ballare”, “audio research”, “non assumere”) e ingresso profondo via Brain. Stessi oggetti, due modalità; niente duplicazione editoriale.

**Rischio.** Mood vaghi possono appiattire contesti. Ogni stream deve preservare provenienza, autore della selezione e collegamenti alle scene.

Fonte primaria: [NTS Explore](https://www.nts.live/explore), accesso 2026-08-15; [Infinite Mixtapes](https://www.nts.live/infinite-mixtapes), accesso 2026-08-15; [About NTS](https://www.nts.live/about), accesso 2026-08-15.

## 4. Oggetto riusabile, connessioni contestuali, provenienza

**Osservazione — Are.na.** Blocchi di testo, link, immagini e file possono vivere in più channel; API espone connessioni del blocco e URL sorgente originale. Canali possono essere pubblici, chiusi o privati.

**Opportunità Drops.** Una fonte deve esistere una volta e partecipare a più viste: Radar candidate, nodo Brain, dossier Content, Suggest pubblico. Ogni riuso conserva relazione specifica e provenienza, evitando copie divergenti.

**Rischio.** Connessioni senza semantica diventano accumulo. Edge tipizzati, nota del curatore e data di verifica restano obbligatori.

Fonte primaria: [Are.na About](https://www.are.na/about), accesso 2026-08-15; [API block connections](https://www.are.na/developers/explore/block/connections), accesso 2026-08-15; [API create block](https://www.are.na/developers/explore/block/post-block), accesso 2026-08-15.

## 5. Feedback esplicito e identità musicale interoperabile

**Osservazione — ListenBrainz/MusicBrainz.** ListenBrainz registra ascolti, produce raccomandazioni, accetta feedback love/hate e tenta mapping verso identificatori MusicBrainz; documentazione espone anche spiegazione del mapping e correzione manuale.

**Opportunità Drops.** Separare reazioni (`salva`, `non fa per me`, `già noto`, `fonte debole`) da verità del grafo. Usare identificatori esterni quando disponibili e mostrare confidenza di entity resolution. Feedback modifica ranking, non cancella nodo culturale.

**Rischio.** “Hate” binario confonde gusto con qualità. Drops necessita motivi leggeri e privati, più decadimento temporale.

Fonte primaria: [documentazione ListenBrainz](https://listenbrainz.readthedocs.io/_/downloads/en/latest/pdf/), pubblicazione indicizzata 2026-07; [MusicBrainz: MBID mapping](https://musicbrainz.org/doc/ListenBrainz/MBIDMappingDocumentation), accesso 2026-08-15.

## Ordine suggerito

1. Provenienza unica e edge contestuali: fondazione condivisa da Radar, Brain e Content.
2. “Perché lo vedo” e controlli fuori-grafo: fiducia e anti-bolla.
3. Feedback distinto da fatto: apprendimento senza riscrivere cultura.
4. Doppia porta mood/ricerca: accessibilità della Discovery.
5. Drop curatoriale ritualizzato: formato pubblico dopo validazione pipeline.
