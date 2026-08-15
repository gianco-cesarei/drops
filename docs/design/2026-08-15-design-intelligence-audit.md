# Drops Design Intelligence — audit e architettura visiva

**Stato:** proposta esplorativa, non polish finale

**Data:** 15 agosto 2026

**Ambito verificato:** UI pubblica e privata presente in `web/`; nessuna modifica prodotto
**Metodo:** lettura DOM/CSS/componenti, verifica breakpoint e contrasto, benchmark di fonti ufficiali. Il browser visuale non era disponibile: nessuna affermazione pixel-perfect o screenshot della build corrente. Serve capture review prima del handoff finale.

## Sintesi decisionale

Drops possiede già buone fondamenta: light-first, logo centrale nella navigazione pubblica desktop, contenuti modellati con fonti e relazioni, distinzione pubblico/privato. Problema principale: Discovery, Timeline e Map sono oggi viste intercambiabili dello stesso catalogo. Cambia rendering, non cambia modalità cognitiva. Area privata espone inoltre `Graph`, termine e shell che spingono Brain verso visualizzazione tecnologica.

Proposta: architettura **centrata sul contenuto**, con brand come perno e tre ambienti pubblici fratelli. Discovery risponde “cosa merita attenzione?”, Timeline “quando emerge o si collega?”, Map “dove vive una scena?”. Ogni ambiente conserva query e filtri compatibili, ma possiede ritmo, densità e interazioni proprie.

Direzione raccomandata: **B — Editorial Atlas**. Combina editoria, archivio e geografia; rende relazioni visibili solo quando aiutano decisione o comprensione. Brain resta strumento privato di verifica e provenienza.

## 1. Audit UI corrente

### Cosa funziona

- Navigazione pubblica desktop usa griglia `1fr auto 1fr`: logo realmente centrato, indipendente da larghezza gruppi laterali.
- Palette chiara e contenuta; verde usato come accento, non come superficie dominante.
- Discovery espone fonte originale, data, luogo, categoria e relazioni: buon punto di partenza per fiducia editoriale.
- URL serializza vista, query e categorie: stato condivisibile e ripristinabile.
- Mobile riduce griglia a colonna singola e mantiene categorie scorrevoli.
- Login possiede label native, autocomplete, alert semantico e stato busy.

### Problemi prioritari

| Area | Evidenza corrente | Impatto | Priorità |
|---|---|---|---|
| Modello ambienti | `DiscoveryExplorer` usa switch segmented sopra stesso dataset | Timeline e Map percepite come filtri, non destinazioni | P0 |
| Content-first | Card tutte uguali, senza immagini o modulo editoriale dominante | Titoli competono; manca motivo per iniziare | P0 |
| Navigazione | Header pubblico contiene Discovery/Suggests, mentre Timeline/Map vivono dentro Discovery | Architettura non comunica tre ambienti autonomi | P0 |
| Brain | Area privata chiama sezione `Graph` e mostra “Nessun grafo…” | Tecnologia diventa oggetto, non supporto | P0 |
| Densità | Discovery: due colonne uniformi; Timeline: tabella piatta; Map: placeholder + elenco | Ritmo non segue natura dei contenuti | P1 |
| Tipografia | System sans unica, pesi 800–900 frequenti, tracking molto stretto su H1 | Voce efficiente ma poco editoriale; enfasi quasi costante | P1 |
| Colore base | Canvas `#f7f8f6`, non bianco | Identità “sfondo bianco” risulta attenuata | P1 |
| Mobile nav | Menu occupa overlay assoluto ma non gestisce click esterno/focus containment | Fragilità tastiera e contesto | P1 |
| Stati | Filtri attivi dipendono molto da verde tenue/bordo | Selezione poco robusta con contrasto basso dei bordi | P1 |
| Dettaglio | Pagina item espone metadati minimi e fonte, ma non contesto/relazioni | Percorso di scoperta termina presto | P1 |

### Gerarchia, ritmo e densità

- **Primo colpo d’occhio:** H1 enorme, poi controlli. Contenuto reale entra tardi. Ridurre hero funzionale nelle visite successive; mostrare primo contenuto entro primo viewport.
- **Ritmo:** sequenza attuale intro → search → due righe filtri → count → griglia crea lunga “zona strumenti”. Portare ricerca globale in header/utility; filtri locali restano vicino al contenuto.
- **Densità:** card da minimo 280 px con quattro fixture producono aria, ma non scala a catalogo vasto. Servono tre densità: feature, standard, compact.
- **Tipografia:** mantenere sans neutra per UI; introdurre contrasto editoriale tramite scala, misura e peso prima di aggiungere secondo carattere. Titoli 600–700, metadata 500–600; evitare uppercase + 850 come default.
- **Allineamento:** shell pubblica a 1180 px funziona. Nuovo sistema usa asse centrale da 1200 px, colonna lettura 680–760 px, rail contestuale 280–320 px.

## 2. Architettura visiva centrata

### Navigazione pubblica

Desktop:

```text
[Discovery] [Timeline]        Drops.        [Map] [Suggests] [Search]
```

Regola: logo resta centro geometrico. Lati possono cambiare contenuto ma mantengono larghezza simmetrica. Login non compete nella barra primaria: icona/account discreto o voce utility nel menu Search/account.

Mobile:

```text
[Menu]        Drops.        [Search]
------------------------------------
[Discovery] [Timeline] [Map]   ← sticky environment bar
```

Tre ambienti sempre raggiungibili con un tap; niente hamburger per cambio ambiente. Suggests vive nel menu o come modulo contestuale, non quarto ambiente equivalente.

### Strati comuni

```text
Global shell
├── Brand + ambienti + ricerca
├── Environment header: titolo, promessa, stato query
├── Local controls: filtri specifici
├── Content field: layout autonomo
└── Detail layer: pagina desktop / sheet mobile
```

Persistenza: query testuale, categorie e item selezionato sopravvivono al cambio ambiente quando semanticamente validi. Viewport Map e scala Timeline restano locali. Back ripristina esatto stato precedente.

## 3. Interaction model pubblico

### Discovery — selezione editoriale

**Intento:** iniziare da contenuto curato, poi allargare per relazione.

- Desktop: griglia editoriale 12 colonne. Apertura 7+5 con feature primaria e stack secondario; segue moduli 4+4+4, righe compact e raccolte tematiche.
- Mobile: feed singolo; feature 4:3, card standard 1:1/4:3, compact senza immagine. Nessun masonry che alteri ordine di lettura.
- Search apre campo espanso; filtri diventano chips con conteggio e comando “Filtri”.
- Hover/focus mostra azione secondaria “Perché qui”; tap card apre dettaglio, non fonte esterna.
- Detail spiega fonte, contesto, relazioni curate e CTA esterna. Navigazione precedente/successivo conserva feed.
- Empty state suggerisce rimozione filtro più restrittivo; non colpevolizza query.

### Timeline — tempo come struttura

**Intento:** capire sequenza, ricorrenze e simultaneità.

- Desktop: asse verticale centrale solo quando confronta due flussi; default più leggibile: date sticky a sinistra, contenuti a destra, raggruppati per mese/settimana.
- Scala: `Giorni / Mesi / Anni`; zoom conserva centro temporale. Non simulare pinch desktop.
- Tipi di data distinti nel testo: “pubblicato”, “avvenuto”, “ristampa”, “riscoperto”. Mai affidarsi solo al colore.
- Eventi con stessa data diventano gruppo espandibile; relazioni temporali appaiono come annotazioni, non linee decorative.
- Mobile: date sticky sopra gruppo; scrubber verticale opzionale sul bordo destro; tap data apre mini indice.
- Deep link include intervallo e scala. “Ora” riporta al periodo corrente senza cancellare filtri.

### Map — luogo come contesto

**Intento:** esplorare scene, non contare marker.

- Desktop: mappa 65–70% + rail contenuti 30–35%. Selezione su mappa sincronizza card nel rail e viceversa.
- Primo livello mostra città/scene aggregate; zoom progressivo rivela venue, label, party e storie. Cluster con conteggio, nome area quando disponibile.
- Filtri locali: periodo, tipo, “scene attive”; legenda persistente ma compatta.
- Mobile: mappa full viewport con bottom sheet a tre snap point (peek/list/detail). Sheet non copre completamente contesto geografico.
- Risultato senza coordinate resta in Discovery/Timeline; non inventare geocoding. Luogo online escluso e spiegato.
- Se utente riduce movimento, animazioni pan/zoom diventano istantanee o brevi dissolvenze.

### Transizioni tra ambienti

- Cambio ambiente: crossfade 120–180 ms + continuità elemento selezionato; nessun morph spettacolare.
- Da card a Map: stessa immagine/titolo resta ancora visibile nel rail/sheet.
- Da card a Timeline: focus si posiziona sul gruppo data rilevante.
- Motion informa causalità. `prefers-reduced-motion` elimina spostamenti ampi e parallasse.

## 4. Struttura privata

Pipeline mentale: **Radar → Brain → Content → Discovery/Suggests**. Download è ingresso operativo, non fase editoriale.

```text
Private
├── Download     acquisizione manuale + stato job
├── Radar        segnali in ingresso, code, fonti, priorità
├── Brain        entità, relazioni, conflitti, provenienza, confidence
├── Content      bozze, review, publish readiness
└── History      audit trail trasversale
```

### Principi

- Dashboard iniziale mostra lavoro da fare, non metriche vanity: segnali da triagiare, conflitti, bozze bloccate, pubblicazioni recenti.
- Brain default è **inbox/table + inspector**. Vista relazionale opzionale solo per risolvere conflitti o capire provenienza.
- Ogni relazione Brain mostra `perché`, fonte, confidence e ultima verifica. Nessun nodo privo di azione.
- Content collega input Radar/Brain e output pubblico. Stato leggibile: Draft → Review → Ready → Published.
- Suggests usa motivazioni editoriali leggibili; mai mostrare punteggio grezzo pubblico.
- Download: URL, previsione tipo contenuto, progressivo job, output e prossimo passo “Invia a Radar”.

### Layout privato

Desktop: rail sinistro 216–240 px, header contestuale, workspace fluido, inspector destro 320–400 px quando selezione attiva. Mobile: tab bar per Radar/Brain/Content; Download e History nel menu. Inspector diventa pagina o sheet, mai terza colonna compressa.

## 5. Tre direzioni visive

### A — Quiet Archive

Bianco puro, nero morbido, verde raro. Griglia rigorosa, bordi sottili, immagini documentarie, metadata densi. Ispirazione funzionale: Discogs/MusicBrainz per precisione, Apple Photos per continuità tra overview e dettaglio.

- **Forza:** credibilità, scalabilità, ottima leggibilità.
- **Rischio:** può sembrare database o istituzione culturale fredda.
- **Uso ideale:** Timeline, Brain, Content.

### B — Editorial Atlas — raccomandata

Bianco puro, testi carbone, verde Drops, un colore territoriale tenue derivato dal contenuto solo su Map. Layout editoriale asimmetrico ma ordinato; immagini e titoli guidano, metadata supporta. Geografia e tempo cambiano composizione, non identità.

- **Forza:** content-first, forte distinzione ambienti, spazio per voce curatoriale.
- **Rischio:** richiede disciplina immagini/crop e priorità editoriali; feature vuote degradano visibilmente.
- **Uso ideale:** intero ecosistema, con densità Quiet Archive nel privato.

### C — Signal Rooms

Bianco con moduli compatti, ticker sobri, stati operativi e accento verde più presente. Ogni ambiente appare come “stanza” con propri strumenti. NTS/RA come riferimento per immediatezza e ritmo.

- **Forza:** energia, azioni rapide, buon ponte Radar/Content.
- **Rischio:** dashboardizzazione; tecnologia e aggiornamento continuo possono superare contenuto.
- **Uso ideale:** Radar e Download, meno adatto a Discovery contemplativa.

### Raccomandazione e trade-off

Adottare **B come linguaggio pubblico**, importando densità di A nel privato e feedback operativi di C solo in Radar/Download.

Trade-off accettati:

- Più lavoro editoriale su immagini, priorità e raggruppamenti; in cambio Discovery possiede un punto di vista.
- Tre layout reali aumentano costo design/QA; in cambio modello mentale diventa chiaro.
- Relazioni restano selettive, quindi Brain non è “tutto visibile”; in cambio utilità supera spettacolo.
- Bianco puro richiede separazioni tramite spazio, tipo e tono, non ombre/card ovunque.

Non approvare ancora font, crop system definitivo o motion curve finale. Prima validare architettura con wireframe low-fi e 5 task moderati.

## 6. Responsive checklist

Breakpoint basati su contenuto, non device: compact `320–599`, medium `600–899`, wide `900–1279`, expansive `1280+`.

- [ ] Logo resta centro geometrico a ogni larghezza wide.
- [ ] Environment bar mobile resta visibile e non richiede scroll orizzontale a 320 px.
- [ ] Nessun contenuto o controllo richiede horizontal scroll, salvo chip list dichiarata.
- [ ] Discovery conserva ordine editoriale DOM uguale a ordine visivo.
- [ ] Card supportano titoli su 3 righe e metadata lunghi senza collisioni.
- [ ] Timeline conserva data vicino al gruppo a 200% zoom.
- [ ] Map offre lista equivalente a marker/cluster.
- [ ] Bottom sheet Map lascia contesto visibile in peek e gestisce tastiera virtuale.
- [ ] Private inspector diventa route/sheet sotto 900 px.
- [ ] Safe-area inset applicati a tab bar, sheet e controlli mappa.
- [ ] Loading, empty, error, partial-data e offline definiti per ogni ambiente.
- [ ] Layout testati a 320, 375, 768, 1024, 1440 px e zoom browser 200%.

## 7. Accessibilità — audit e criteri

**Target:** WCAG 2.1 AA minimo; adottare target WCAG 2.2 per focus e dimensione target dove pratico.

### Risultati verificabili sulla UI corrente

| Finding | Criterio | Severità | Evidenza / requisito |
|---|---|---:|---|
| Verde scuro `#118a43` su bianco = **4.43:1** | 1.4.3 | Major | Fallisce testo normale 4.5:1; scurire o usare solo testo grande/grassetto qualificante |
| Muted `#626862` su bianco = **5.71:1**; su canvas = **5.36:1** | 1.4.3 | Pass | Conservare almeno questi rapporti |
| CTA `#082713` su `#20c763` = **7.18:1** | 1.4.3 | Pass | Combinazione valida |
| Bordi `#dce1dc`/`#c8cec8` su bianco = **1.33/1.60:1** | 1.4.11 | Major | Se bordo comunica stato/limite controllo, portare a 3:1 o aggiungere altro segnale |
| Focus definito solo per input | 2.4.7 | Critical | Link, button, chip e card-link richiedono `:focus-visible` evidente |
| Chip filtro ~36 px alte | 2.5.5 | Major | Portare area attiva a 44×44 CSS px |
| Menu mobile sposta focus al primo link ma non contiene/chiude su focus out | 2.1.1, 2.4.3 | Major | Definire pattern disclosure: ordine logico, Escape, click esterno, ritorno focus |
| View switcher usa `aria-pressed` | 4.1.2 | Pass parziale | Con nuova IA usare link/nav per ambienti; button solo per cambi locali |
| Progress job non espone semantica progressbar | 4.1.2 | Major | `role=progressbar`, min/max/now e aggiornamento live non verboso |

### Checklist pre-handoff

- [ ] Un solo H1; landmark `header/nav/main/aside/footer` coerenti.
- [ ] Skip link porta al contenuto ambiente.
- [ ] Ambiente attivo usa `aria-current="page"`, non solo colore.
- [ ] Tutte azioni tastiera: Tab/Shift+Tab; Escape chiude layer; frecce solo nei widget previsti.
- [ ] Focus non viene perso durante cambio ambiente, filtro o apertura detail.
- [ ] `focus-visible` almeno 3:1 contro colori adiacenti e non coperto da sticky UI.
- [ ] Testo normale ≥4.5:1; testo grande/UI graphics ≥3:1.
- [ ] Target touch 44×44; distanza evita attivazioni accidentali.
- [ ] Immagini editoriali hanno alt descrittivo; artwork decorativo usa alt vuoto; didascalia non duplica alt.
- [ ] Timeline comunica date e relazioni in testo, non colore/posizione soltanto.
- [ ] Map possiede vista elenco completa, ordine coerente e annunci non continui durante pan.
- [ ] Cluster e marker hanno nome, ruolo e conteggio accessibili.
- [ ] Motion rispetta `prefers-reduced-motion`; autoplay audio/video mai attivo.
- [ ] Stati async annunciati con `aria-live` appropriato; errori collegati al campo.
- [ ] VoiceOver Safari mobile/desktop, NVDA Firefox/Chrome, keyboard-only e zoom 200% inclusi in QA.

## 8. Piano di validazione

Cinque task prima del polish:

1. “Trova una storia nuova e apri fonte originale.”
2. “Scopri cosa è successo a Lisbona nello stesso periodo.”
3. “Passa dalla storia alla sua posizione senza perdere contesto.”
4. “Da Radar, verifica perché due entità sono collegate e prepara contenuto.”
5. “Con sola tastiera, filtra Discovery e torna al risultato precedente.”

Metriche: successo task, tempo, backtracking, comprensione differenza ambienti, capacità di spiegare Brain senza parole “grafo/network”.

## 9. Benchmark e fonti

Pattern adottati, non stile copiato:

| Fonte | Pattern utile | Cosa evitare |
|---|---|---|
| [Apple — Browsing Your Photos](https://developer.apple.com/tutorials/sample-apps/capturingphotos-browsephotos/) | griglia responsive, continuità overview → detail | estetica nativa Apple come scorciatoia |
| [Apple HIG — Maps](https://developer.apple.com/design/human-interface-guidelines/maps/) | pan/zoom attesi, cluster, dettaglio progressivo, selezione chiara | overlay che ostacolano mappa |
| [Apple — UI Design Dos and Don’ts](https://developer.apple.com/design/tips/) | 44×44 pt, leggibilità, controlli vicini al contenuto | applicazione letterale di stile iOS al web |
| [NTS](https://www.nts.live/) / [About](https://www.nts.live/about) | curatela umana, live/archive, contenuto con voce forte | densità/promozione continua ovunque |
| [Resident Advisor](https://ra.co/about) | luogo/evento come porta di discovery | ticketing e utility che dominano editoria |
| [Bandcamp](https://bandcamp.com/) / [Bandcamp Daily](https://daily.bandcamp.com/) | artwork + contesto editoriale + supporto fonte/artista | collisione tra marketplace e narrazione |
| [Discogs — browse/search](https://support.discogs.com/hc/en-us/articles/360003622014-How-To-Browse-Search-In-The-Database) | filtri profondi, entità chiare, precisione archivistica | gerarchia visiva da database nel pubblico |
| [MusicBrainz](https://musicbrainz.org/) / [Search](https://musicbrainz.org/search) | provenienza, identificatori, struttura dati | complessità esposta senza progressive disclosure |
| [Musicmap](https://musicmap.info/) | livelli di dettaglio e relazioni storiche | mega-visualizzazione come fine |
| [Fairground](https://fairground.music/) | scene locali come unità di scoperta | claim ampi senza segnali editoriali verificabili |
| [Diggercamp — fonte secondaria](https://intaresu.com/diggercamp-launches-ai-music-discovery-platform-for-independent-electronic-tracks/) | promessa di digging indipendente | AI come messaggio principale |

`Creative Fair`, `Set Roulette` e URL ufficiale Diggercamp non sono identificabili con sufficiente certezza dai risultati pubblici disponibili. Nessun pattern specifico viene attribuito senza URL esatto. Richiedere link al team prima della reference capture.

### Capture list per prossimo review visuale

Quando browser visuale disponibile, acquisire screenshot datati a 1440×900 e 390×844 di: NTS home/archive, RA discovery eventi/città, Bandcamp Daily home/articolo, Discogs search/release, MusicBrainz search/entity, Musicmap overview/detail, Fairground scene. Annotare solo gerarchia, densità, ritmo, navigazione e stati; non archiviare immagini editoriali protette oltre uso interno di critica.

## Criteri di accettazione design

- Utente identifica Discovery, Timeline e Map come tre destinazioni entro 5 secondi.
- Ogni ambiente risponde domanda distinta senza spiegazione tecnica.
- Brain è comprensibile tramite lavoro da svolgere, provenienza e conflitti; visualizzazione relazionale resta secondaria.
- Header pubblico mantiene centro geometrico; contenuto significativo appare nel primo viewport.
- Nessun token colore corrente fallisce requisiti assegnati.
- Wireframe desktop/mobile, stati e flow vengono approvati prima di qualsiasi polish o implementazione frontend.
