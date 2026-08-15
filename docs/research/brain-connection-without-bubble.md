# Collegare Radar al Brain senza creare una bolla

## Principio

Brain guida ricerca, non ne definisce confini. Ranking deve bilanciare rilevanza, novità, distanza e qualità della fonte. Il grafo conserva conoscenza; non deve diventare profezia che raccomanda solo ciò che contiene già.

## Modello di ingestione

Ogni candidato entra in area di staging con:

- entità proposte, non ancora canoniche;
- edge proposti con fonte e data;
- distanza `inside`, `adjacent` o `outside`;
- fatto/inferenza/opinione separati;
- confidenza della fonte distinta da affinità editoriale;
- motivazione di comparsa.

Promozione nel Brain richiede entity resolution e revisione umana. Una fonte può supportare più edge; ogni edge conserva URL, data e frase probatoria. Opinioni restano annotazioni editoriali, mai relazioni fattuali.

## Mix di esplorazione

Per ogni brief da 10:

- 4 segnali `inside`: approfondimento e continuità;
- 3 `adjacent`: espansione attraverso un ponte esplicito;
- 3 `outside`: serendipity senza percorso dal Brain.

Primo brief devia a 3/7 perché inventario Brain non era accessibile. Nei cicli successivi, quota va calibrata su dati reali. `outside` non significa casuale: richiede fonte forte, luogo/scena sottorappresentata o anomalia editoriale concreta.

## Quattro canali indipendenti

Calcolare shortlist da pool separati prima della fusione:

1. **Graph walk:** vicini di nodi salvati, massimo due hop; penalità per nodi già sovraesposti.
2. **Source watch:** nuove uscite da fonti affidabili, indipendente da artisti noti.
3. **Geo rotation:** città e regioni con bassa copertura recente.
4. **Contrarian sampler:** segnali con bassa similarità sonora ma forte qualità/provenienza.

Nessun canale può occupare oltre 50% del brief. Deduplicazione avviene dopo assegnazione quota, così graph walk non assorbe tutto.

## Ranking spiegabile

Esempio concettuale, non specifica implementativa:

`score = 0.30 source_quality + 0.25 editorial_signal + 0.15 freshness + 0.15 geographic_novelty + 0.15 graph_bridge - exposure_penalty`

Per pool `outside`, `graph_bridge` vale zero e peso viene redistribuito a qualità fonte e novità geografica. Similarità non è sinonimo di qualità.

Ogni card Radar mostra una ragione: “nuova uscita da fonte seguita”, “ponte via Príncipe”, “città poco coperta”, “scelta fuori-grafo”. Curatore può cambiare canale o rifiutare motivazione.

## Feedback senza collasso

- `save`: aumenta interesse personale, non importanza universale.
- `not_for_me`: abbassa affinità temporanea, non rimuove artista o scena.
- `already_known`: riduce novità, conserva rilevanza.
- `weak_source`: penalizza fonte/record, non soggetto.
- `wrong_link`: apre correzione entity/edge.

Applicare decadimento: gusti cambiano. Non usare mancato click come feedback negativo forte.

## Metriche anti-bolla

Misurare per finestra di 30/90 giorni:

- quota inside/adjacent/outside servita e salvata;
- distribuzione geografica e concentrazione per label/fonte;
- percentuale di nuovi nodi scoperti tramite fonti non già nel Brain;
- distanza media dal grafo al momento della scoperta;
- tasso di promozione fuori-grafo verso Brain/Content/Suggests;
- esposizione ripetuta dei nodi dominanti;
- diversità dei curatori e delle fonti primarie.

Alert editoriale se una label, città o fonte supera soglia scelta senza giustificazione, oppure se quota `outside` scende sotto 20% per due cicli.

## Guardrail

- Nessuna pubblicazione automatica.
- Nessun edge inferito diventa fatto senza fonte.
- Nessun ranking usa solo embedding/similarità.
- Nessuna fonte viene considerata neutrale: conservare prospettiva, sede e modello economico.
- Review periodica dei nodi orfani e delle scene sottorappresentate.
- Audit manuale mensile di dieci raccomandazioni respinte: segnala bias invisibili meglio dei soli click.
