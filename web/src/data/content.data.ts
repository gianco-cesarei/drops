import { DiscoveryType, PartyKind, RelationType, discoveryDatasetSchema } from '../domain/discovery'

// CONTENUTO REALE pubblicato su Drops (non fixture di sviluppo)
export const publishedContentItems = discoveryDatasetSchema.parse([
  // ==========================================
  // SEZIONE A: ARTISTA EMERGENTE & RADAR SIGNALS
  // ==========================================
  {
    id: 'radar-xexa-kissom',
    slug: 'xexa-kissom',
    type: DiscoveryType.Release,
    kicker: 'Artista Emergente',
    title: 'XEXA — Kissom: violoncello, intimità pop e kizomba decostruita',
    summary:
      "Il secondo album della compositrice e polistrumentista lisbonese XEXA esce su Príncipe Discos, allargando l'estetica della label verso ambient, pop radiante e ritmi afro-diasporici decostruiti.",
    publishedAt: '2026-08-18T14:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Lisbona, Portogallo', countryCode: 'PT', latitude: 38.7223, longitude: -9.1393 },
    mapEligible: true,
    tags: ['artista emergente', 'lisbona', 'principe', 'kizomba', 'ambient', 'violoncello', 'leftfield-pop'],
    sources: [
      { url: 'https://principediscos.bandcamp.com/album/kissom', label: 'Bandcamp (Acquisto & Vinile)', kind: 'original' },
      { url: 'https://open.spotify.com/album/xexa-kissom', label: 'Spotify', kind: 'listen' },
      { url: 'https://music.apple.com/album/kissom/xexa', label: 'Apple Music', kind: 'listen' },
      { url: 'https://soundcloud.com/principe-discos', label: 'SoundCloud (Príncipe)', kind: 'listen' },
      { url: 'https://www.discogs.com/label/342131-Pr%C3%ADncipe', label: 'Discogs (Catalogo Príncipe)', kind: 'reference' },
      { url: 'https://www.instagram.com/xexa____/', label: 'Profilo Ufficiale XEXA', kind: 'official' },
    ],
    relations: [
      { id: 'dev-set-lisbon', type: RelationType.CityScene, label: 'Scena Elettronica Lisbona', reason: 'Ecosistema Príncipe e diaspora afro-portoghese' },
    ],
    body: [
      {
        html: `<p class="lead">Con <i>Kissom</i>, la giovane compositrice lisbonese <b>XEXA</b> firma uno dei dischi più audaci dell'anno: un lavoro intimo in cui la formazione classica al violoncello si fonde con la tradizione diasporica dell'Angola e di São Tomé, riletta attraverso un prisma elettronico sognante e futurista.</p>`,
      },
      {
        heading: "L'artista e la scena di Lisbona",
        html: `<p>Cresciuta tra le periferie multiculturali della capitale portoghese e gli studi accademici al conservatorio, XEXA rappresenta una voce generazionale unica nel panorama europeo. Il suo approccio non si limita a campionare i ritmi tradizionali, ma ne estrae la grammatica emotiva: il violoncello acustico viene processato in tempo reale con delay analogici e riverberi granulari, dialogando costantemente con linee vocali ariose e testi riflessivi.</p>`,
      },
      {
        heading: 'Kissom: decostruzione ritmica e pop cameristico',
        html: `<p>In <i>Kissom</i> (termine che in kimbundu evoca la conversazione, il legame e il racconto orale), la kizomba e il tarraxo vengono rallentati fino a perdere l'urgenza cinetica della pista, trasformandosi in una lenta pulsazione ipnotica. I beat tipici della batida lasciano spazio a frammenti percussivi metallici e armonie fluttuanti, dando vita a un <span class="pop">leftfield-pop</span> cameristico che rifiuta le categorizzazioni di genere preconfezionate.</p>`,
      },
      {
        heading: "L'evoluzione di Príncipe Discos",
        html: `<p>L'uscita su <a href="https://principediscos.bandcamp.com/album/kissom" target="_blank" rel="noopener">Príncipe Discos</a> segna un momento di svolta per la storica etichetta di Lisbona. Nota a livello globale per aver documentato il kuduro, la batida e la club music dei sobborghi (da DJ Marfox a DJ Nigga Fox), con XEXA la label dimostra la maturità di un catalogo capace di accogliere la canzone d'autore sperimentale senza perdere un grammo della propria identità territoriale.</p>`,
      },
      {
        heading: 'Crediti e produzione',
        html: `<p>L'album è interamente scritto, composto, cantato, arrangiato e prodotto da XEXA. Il lavoro sul mastering digitale e il taglio lacca per l'edizione in vinile 12" sono stati curati con la consueta dedizione artigianale del team Príncipe, con artwork originale a cura di Márcio Matos.</p>`,
      },
    ],
  },

  {
    id: 'radar-timedance-td10',
    slug: 'timedance-td10',
    type: DiscoveryType.Release,
    kicker: 'Release',
    title: 'TD10: dieci anni di futurismo club per la Timedance di Bristol',
    summary:
      "La compilation celebrativa curata da Batu raccoglie 23 tracce esclusive che fotografano l'evoluzione del sound di Bristol fra techno ibrida, bass culture e sound design chirurgico.",
    publishedAt: '2026-08-17T16:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Bristol, Regno Unito', countryCode: 'GB', latitude: 51.4545, longitude: -2.5879 },
    mapEligible: true,
    tags: ['release', 'bristol', 'timedance', 'batu', 'techno', 'bass', 'soundsystem', 'compilation'],
    sources: [
      { url: 'https://timedance.bandcamp.com/album/td10', label: 'Bandcamp (TD10 Compilation & Vinile)', kind: 'original' },
      { url: 'https://open.spotify.com/album/timedance-td10', label: 'Spotify', kind: 'listen' },
      { url: 'https://soundcloud.com/timedance', label: 'SoundCloud (Timedance)', kind: 'listen' },
      { url: 'https://music.apple.com/album/td10-timedance', label: 'Apple Music', kind: 'listen' },
      { url: 'https://www.discogs.com/label/827660-Timedance', label: 'Discogs (Catalogo Timedance)', kind: 'reference' },
    ],
    relations: [
      { id: 'dev-artist-london', type: RelationType.CityScene, label: 'Scena UK Bass & Sound System', reason: 'Asse Bristol-Londra nel club futurism' },
    ],
    body: [
      {
        html: `<p class="lead">Fondata a Bristol nel 2015 dal produttore e DJ <b>Batu</b>, l'etichetta <b>Timedance</b> ha ridefinito le coordinate della club music contemporanea britannica. Per celebrare il suo primo decennio, la label pubblica <i>TD10</i>: un'opera monumentale in 23 tracce che unisce maestri del suono e talenti emergenti.</p>`,
      },
      {
        heading: 'Dieci anni di sound design e sub-bass',
        html: `<p>Pochi marchi hanno saputo incidere sull'estetica sonora degli ultimi dieci anni come Timedance. Raccogliendo l'eredità storica di Bristol (dal trip-hop al dubstep primordiale fino alla techno mutante), la label ha forgiato un vocabolario caratterizzato da poliritmie spigolose, silenzi improvvisi e una gestione della gamma bassa tarata specificamente per impianti audio di grande potenza.</p>`,
      },
      {
        heading: 'La mappa relazionale di TD10',
        html: `<p>Più che una semplice raccolta antologica, <a href="https://timedance.bandcamp.com/album/td10" target="_blank" rel="noopener">TD10</a> funziona come un vero e proprio atlante geografico ed estetico. Le 23 tracce vedono alternarsi veterani del calibro di Peverelist, Bruce, Laksa, Lurka e lo stesso Batu, accanto a produttori internazionali che hanno assorbito la lezione di Bristol reinterpretandola con sensibilità post-club e sound design cinematografico.</p>`,
      },
      {
        heading: 'Oltre la pista da ballo',
        html: `<p>Ciò che rende imprescindibile la compilation è il rifiuto della formula techno convenzionale: ogni traccia è un esperimento di tensione dinamica, dove l'impatto ritmico non soffoca mai la ricerca timbrica e la tridimensionalità acustica. Disponibile in cofanetto quadruplo vinile e in formato digitale ad alta risoluzione.</p>`,
      },
    ],
  },

  {
    id: 'radar-oroko-radio-hiatus',
    slug: 'oroko-radio-pausa-infrastrutture-indipendenti',
    type: DiscoveryType.Story,
    kicker: 'Notizia',
    title: 'Oroko Radio entra in pausa: la fragilità delle web-radio comunitarie',
    summary:
      "L'emittente indipendente di Accra sospende la diretta quotidiana per burnout e insostenibilità economica. Una vicenda che interroga l'ecosistema globale su chi finanzia la scoperta musicale.",
    publishedAt: '2026-08-16T12:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Accra, Ghana', countryCode: 'GH', latitude: 5.6037, longitude: -0.1870 },
    mapEligible: true,
    tags: ['notizia', 'accra', 'community-radio', 'archivio', 'sostenibilità', 'infrastrutture'],
    sources: [
      { url: 'https://oroko.live/news/hiatus', label: 'Oroko Radio (Comunicato Ufficiale)', kind: 'original' },
      { url: 'https://oroko.live/archive', label: 'Oroko Live Archive (Ascolto trasmissioni)', kind: 'listen' },
      { url: 'https://www.instagram.com/orokoradio/', label: 'Instagram Oroko Radio', kind: 'official' },
    ],
    relations: [
      { id: 'radar-ctm-festival-2026', type: RelationType.Story, label: 'CTM Festival & Oroko', reason: 'Collaborazione translocale tra festival berlinese e radio di Accra' },
    ],
    body: [
      {
        html: `<p class="lead">L'8 aprile 2026 la web-radio indipendente <b>Oroko Radio</b>, con sede ad Accra (Ghana), ha annunciato una sospensione a tempo indeterminato della sua programmazione quotidiana. Una decisione sofferta, motivata dall'esaurimento delle risorse economiche e dal burnout del team operativo.</p>`,
      },
      {
        heading: "L'annuncio e il nodo della sostenibilità",
        html: `<p>In soli quattro anni di attività, Oroko Radio si era imposta come uno dei nodi cruciali per la divulgazione della musica afro-diasporica, dei suoni alternativi africani e delle connessioni transcontinentali, collaborando con istituzioni come CTM Festival e Boiler Room. Tuttavia, come chiarito nel comunicato ufficiale, il modello fondato su grant discontinui, sponsorship commerciali sporadiche e una mole insostenibile di lavoro volontario non retribuito ha raggiunto il punto di rottura.</p>`,
      },
      {
        heading: "Il dilemma delle infrastrutture culturali",
        html: `<p>Il caso Oroko scuote l'intero settore: la visibilità globale e l'apprezzamento della critica internazionale non si traducono automaticamente in entrate stabili per chi gestisce le strutture fisiche e digitali sul territorio. Mentre le piattaforme commerciali beneficiano indirettamente del lavoro di curation delle radio indipendenti per intercettare nuovi trend, i costi vivi di banda, spazi, attrezzature e personale rimangono a carico di micro-collettivi locali.</p>`,
      },
      {
        heading: "L'archivio online come bene comune",
        html: `<p>Nonostante la pausa dal live broadcasting, l'enorme archivio di registrazioni, interviste e show resterà liberamente accessibile sul sito <a href="https://oroko.live/archive" target="_blank" rel="noopener">Oroko Live</a>. Un patrimonio culturale inestimabile che continua a documentare il fermento musicale contemporaneo dell'Africa occidentale e della sua diaspora globale.</p>`,
      },
    ],
  },

  {
    id: 'radar-ctm-festival-2026',
    slug: 'ctm-festival-berlino-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'CTM 2026 Berlino: audio spaziale, nuove composizioni e reti translocali',
    summary:
      "Il festival berlinese dedicato alle musiche avventurose esplora l'ascolto immersivo con Blawan e rinsalda le connessioni translocali con Accra e l'ecosistema di Oroko Radio.",
    publishedAt: '2026-08-15T18:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Berlino, Germania', countryCode: 'DE', latitude: 52.5200, longitude: 13.4050 },
    mapEligible: true,
    tags: ['festival', 'berlino', 'ctm', 'spatial-audio', 'club-culture', 'experimental', 'sound-art'],
    sources: [
      { url: 'https://www.ctm-festival.de/tickets', label: 'Biglietteria Ufficiale CTM', kind: 'official' },
      { url: 'https://www.ctm-festival.de/news/ctm-2026-third-programme-announcement', label: 'Programma & Lineup 2026', kind: 'original' },
      { url: 'https://www.ctm-festival.de/festival-2026/locations', label: 'Location & Spazi (Berghain, HAU, Radialsystem)', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-oroko-radio-hiatus', type: RelationType.Story, label: 'Oroko Radio Connection', reason: 'Programma congiunto e talk sulla circolazione musicale' },
    ],
    body: [
      {
        html: `<p class="lead">Dal 23 gennaio al 1 febbraio 2026, <b>CTM Festival</b> ha trasformato Berlino nel laboratorio mondiale della sperimentazione sonora contemporanea, mettendo al centro dell'indagine le nuove tecnologie di spazializzazione sonora e i ponti culturali tra Europa e Africa.</p>`,
      },
      {
        heading: 'Audio immersivo e club culture al CTM',
        html: `<p>Tra i momenti salienti dell'edizione 2026 spicca la speciale performance commissionata a <b>Blawan</b>, concepita interamente per un impianto multicanale 3D all'interno degli spazi industriali di Radialsystem. Il produttore britannico ha decostruito la propria techno modulare in traiettorie acustiche tridimensionali, dimostrando come la ricerca tecnologica possa esaltare la viscerale fisicità del clubbing.</p>`,
      },
      {
        heading: 'Ponti tra Berlino e Accra',
        html: `<p>Coerentemente con la sua vocazione critica, il CTM 2026 ha ospitato una serie di showcase e tavole rotonde in collaborazione con <a href="https://www.ctm-festival.de" target="_blank" rel="noopener">Oroko Radio</a>, interrogando la platea sulle asimmetrie dei visti d'ingresso per gli artisti africani e sulle pratiche di solidarietà translocale tra festival del Nord e piattaforme del Sud globale.</p>`,
      },
      {
        heading: 'Location e formati di fruizione',
        html: `<p>La manifestazione ha coinvolto i templi della vita notturna e culturale berlinese — dalle notti ad alto volume al Berghain e al RSO Berlin, fino alle installazioni sonore diurne all'HAU Hebbel am Ufer e ai concerti d'ascolto al Radialsystem.</p>`,
      },
    ],
  },

  {
    id: 'radar-ava-festival-belfast-2026',
    slug: 'ava-festival-belfast-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'AVA Belfast 2026: il 75% della lineup radicato nella scena locale',
    summary:
      "Audio Visual Arts Festival torna a Belfast imponendo una proporzione chiara: oltre tre quarti degli artisti da Irlanda e UK, con 12 debutti assoluti nella capitale nordirlandese.",
    publishedAt: '2026-08-14T15:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Belfast, Regno Unito', countryCode: 'GB', latitude: 54.5973, longitude: -5.9301 },
    mapEligible: true,
    tags: ['festival', 'belfast', 'ava', 'local-scene', 'ireland', 'visual-arts', 'clubbing'],
    sources: [
      { url: 'https://avafestival.com/belfast-tickets/', label: 'Biglietti Ufficiali AVA Belfast', kind: 'official' },
      { url: 'https://avafestival.com/ava-belfast-2026-lineup-announcement/', label: 'Lineup Ufficiale & Debutti', kind: 'original' },
      { url: 'https://avafestival.com/conference/', label: 'AVA Conference & Talk', kind: 'reference' },
    ],
    relations: [
      { id: 'dev-artist-london', type: RelationType.CityScene, label: 'Scena UK & Irlanda', reason: 'Rappresentanza territoriale e sviluppo talenti' },
    ],
    body: [
      {
        html: `<p class="lead">Dal 29 al 30 maggio 2026, <b>AVA Festival (Audio Visual Arts)</b> celebra una nuova edizione a Belfast, confermando una scelta curatoriale precisa e controcorrente: il <b>75% della lineup</b> proviene da Irlanda e Regno Unito, accompagnato da 12 debutti assoluti sul suolo nordirlandese.</p>`,
      },
      {
        heading: 'La metrica del radicamento territoriale',
        html: `<p>In un mercato dei festival dominato dalla ripetizione omologante degli stessi headliner internazionali, <a href="https://avafestival.com" target="_blank" rel="noopener">AVA Belfast</a> dimostra come sia possibile costruire un evento di risonanza mondiale valorizzando anzitutto il tessuto artistico locale. La percentuale dichiarata di musicisti irlandesi e britannici non è un semplice slogan, ma un impegno misurabile che favorisce lo sviluppo professionale della scena regionale.</p>`,
      },
      {
        heading: 'Formati audiovisivi e conferenza diurna',
        html: `<p>Oltre al programma notturno, AVA si distingue per la sua conferenza diurna gratuita dedicata ai giovani professionisti della musica, con panel tecnici su produzione, DJing, salute mentale e contrattualistica discografica, affiancati da installazioni audiovisive site-specific.</p>`,
      },
      {
        heading: 'Location: Titanic Slipways',
        html: `<p>Ambientato nella maestosa cornice post-industriale dei Titanic Slipways, il festival sfrutta l'architettura dei docks per creare una scenografia naturale monumentale in cui il dialogo tra visual e suoni ad alto impatto trova la sua collocazione ideale.</p>`,
      },
    ],
  },

  {
    id: 'radar-lev-festival-gijon-2026',
    slug: 'lev-festival-gijon-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'L.E.V. Gijón 2026: il club inteso come dispositivo audiovisivo',
    summary:
      "Tra La Nave di Gijón e gli spazi museali asturiani, il Laboratorio di Elettronica Visiva unisce post-clubbing, turntablism sperimentale e performance con intelligenza artificiale.",
    publishedAt: '2026-08-13T14:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Gijón, Spagna', countryCode: 'ES', latitude: 43.5322, longitude: -5.6611 },
    mapEligible: true,
    tags: ['festival', 'gijon', 'lev', 'audiovisual', 'turntablism', 'post-club', 'digital-arts'],
    sources: [
      { url: 'https://levfestival.com/26/tickets/', label: 'Biglietteria Ufficiale L.E.V.', kind: 'official' },
      { url: 'https://levfestival.com/wp-content/uploads/2026/03/NP_EN_LEVFESTIVAL_2026_ANUNCIO-1.pdf', label: 'Programma Ufficiale L.E.V. Gijón', kind: 'original' },
      { url: 'https://levfestival.com/26/artistas/', label: 'Roster Artisti & Installazioni AV', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-mostra-barcellona-2026', type: RelationType.Party, label: 'Circuito Spagnolo d’Avanguardia', reason: 'Festival indipendenti tra Asturie e Catalogna' },
    ],
    body: [
      {
        html: `<p class="lead">Dal 30 aprile al 3 maggio 2026, il <b>L.E.V. Festival (Laboratorio de Electrónica Visual)</b> ha trasformato la città asturiana di Gijón nel fulcro europeo della ricerca audiovisiva, proponendo un'interpretazione della club culture come medium espressivo totale.</p>`,
      },
      {
        heading: 'La Nave e la dimensione post-club',
        html: `<p>Il padiglione de <i>La Nave</i> ha ospitato i progetti più orientati alla danza e alla ritmica avanzata. Tra le esibizioni più acclamate, il live AV dell'artista britannica <b>NikNak</b>, basato su un turntablism polifonico a otto mani e visual generativi, e l'innovativa performance del collettivo sudcoreano <b>Tacit Group</b>, che ha portato sul palco due performer guidati da algoritmi di machine learning in tempo reale.</p>`,
      },
      {
        heading: 'Sinergia tra arte digitale e territorio',
        html: `<p>Il fascino di <a href="https://levfestival.com" target="_blank" rel="noopener">L.E.V. Gijón</a> risiede nella sua diffusione urbana: dai concerti intimi al Teatro Jovellanos alle mostre immersive nei capannoni di LABoral Centro de Arte, la città diventa parte integrante dell'esperienza sensoriale.</p>`,
      },
      {
        heading: "Oltre l'intrattenimento convenzionale",
        html: `<p>L.E.V. dimostra che la pista da ballo può essere un laboratorio di percezione estetica senza perdere la sua pulsazione viscerale, offrendo uno standard di qualità acustica e visiva raro nel panorama internazionale.</p>`,
      },
    ],
  },

  {
    id: 'radar-mostra-barcellona-2026',
    slug: 'mostra-festival-barcellona-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'MOSTRA Barcellona 2026: il piccolo formato come resistenza culturale',
    summary:
      "Contro la gigantografia dei macro-festival estivi, MOSTRA propone a Barcellona un'esperienza a capienza limitata dedicata a deep techno, ascolto attento e sostenibilità urbana.",
    publishedAt: '2026-08-12T11:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Barcellona, Spagna', countryCode: 'ES', latitude: 41.3874, longitude: 2.1686 },
    mapEligible: true,
    tags: ['festival', 'barcellona', 'mostra', 'deep-techno', 'ambient', 'sostenibilità', 'small-format'],
    sources: [
      { url: 'https://www.mostra.barcelona/en/tickets', label: 'Biglietti & Pass MOSTRA', kind: 'official' },
      { url: 'https://www.mostra.barcelona/en', label: 'Sito & Manifesto MOSTRA Barcelona', kind: 'original' },
      { url: 'https://www.mostra.barcelona/en/programme', label: 'Programma & Lineup Deep Techno', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-lev-festival-gijon-2026', type: RelationType.Party, label: 'Festival d’Avanguardia in Spagna', reason: 'Approccio etico e indipendente al clubbing' },
    ],
    body: [
      {
        html: `<p class="lead">Dal 12 al 15 marzo 2026, <b>MOSTRA Festival</b> ha confermato a Barcellona la validità del suo manifesto: un festival indipendente di musica elettronica e d'avanguardia a scala umana, nato come risposta diretta alla saturazione e alla commercializzazione dei mega-eventi turistici.</p>`,
      },
      {
        heading: 'La risposta critica alla festivalizzazione',
        html: `<p>A differenza dei grandi raduni da decine di migliaia di spettatori al giorno, <a href="https://www.mostra.barcelona/en" target="_blank" rel="noopener">MOSTRA</a> limita deliberatamente la propria capienza a poche centinaia di appassionati. Questa scelta garantisce condizioni d'ascolto ottimali, rispetto per la comunità residente e un'atmosfera comunitaria in cui artisti e pubblico condividono gli stessi spazi senza barriere VIP.</p>`,
      },
      {
        heading: 'Curatela ipnotica e deep listening',
        html: `<p>La linea musicale è rigorosa: techno ipnotica e profonda, ambient meditativa diurna tra le mura del Castell de Montjuïc e live set analogici che valorizzano la concentrazione e l'immersione temporale, rifiutando i drop facili e le dinamiche da social media.</p>`,
      },
      {
        heading: 'Patto con il tessuto cittadino',
        html: `<p>Dalle forniture a km zero al riutilizzo dei materiali di allestimento fino al sostegno dei club underground barcellonesi, MOSTRA si afferma come modello ecologico ed etico per il futuro dei festival europei.</p>`,
      },
    ],
  },

  {
    id: 'radar-nyege-nyege-festival-2026',
    slug: 'nyege-nyege-festival-jinja-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: "Nyege Nyege 2026: l'edizione Wakaliwood sulle rive del Nilo",
    summary:
      "La maratona di 4 giorni a Jinja fonde l'energia del cinema d'azione underground ugandese di Wakaliwood con 7 palchi di suoni panafricani e diaspora globale.",
    publishedAt: '2026-08-11T12:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Jinja, Uganda', countryCode: 'UG', latitude: 0.4479, longitude: 33.2026 },
    mapEligible: true,
    tags: ['festival', 'uganda', 'jinja', 'nyege-nyege', 'wakaliwood', 'singeli', 'afro-club'],
    sources: [
      { url: 'https://festival.nyegenyege.com/tickets', label: 'Biglietti Ufficiali Nyege Nyege', kind: 'official' },
      { url: 'https://festival.nyegenyege.com/', label: 'Sito Ufficiale Festival Jinja', kind: 'original' },
      { url: 'https://nyegenyegetapes.bandcamp.com', label: 'Nyege Nyege Tapes (Bandcamp)', kind: 'listen' },
      { url: 'https://www.wakaliwood.com', label: 'Wakaliwood Official Studio', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-oroko-radio-hiatus', type: RelationType.Story, label: 'Ecosistema Musicale Africano', reason: 'Centri nevralgici di produzione e diffusione diasporica' },
    ],
    body: [
      {
        html: `<p class="lead">Dal 19 al 22 novembre 2026, l'undicesima edizione del <b>Nyege Nyege Festival</b> accoglie migliaia di ascoltatori ad Adrift Overland Camp a Jinja (Uganda). L'edizione 2026 è intitolata <i>Wakaliwood Edition</i>, sancendo un connubio spettacolare tra cinema d'azione popolare e clubbing afrocentrico.</p>`,
      },
      {
        heading: "L'incontro tra cinema d'azione DIY e suoni panafricani",
        html: `<p>Lo studio cinematografico cult di Wakaliga (Kampala), celebre per i film d'azione iper-creativi girati con micro-budget, firma scenografie, trailer e performance speciali che animano i 7 palchi del festival. L'immaginario cinematografico ugandese diventa la lente attraverso cui rileggere l'esuberanza della club culture del continente.</p>`,
      },
      {
        heading: 'Sette palchi sulle rive del Nilo',
        html: `<p>Per quattro giorni e quattro notti consecutive, <a href="https://festival.nyegenyege.com/" target="_blank" rel="noopener">Nyege Nyege</a> propone una panoramica senza pari: dal singeli ad altissima velocità della Tanzania all'acholitronix dell'Uganda settentrionale, dal gqom e amapiano del Sudafrica fino alle sperimentazioni dell'etichetta associata <i>Nyege Nyege Tapes</i> e <i>Hakuna Kulala</i>.</p>`,
      },
      {
        heading: 'Il centro di gravità della musica africana contemporanea',
        html: `<p>Più che un festival musicale, Nyege Nyege si conferma come il più importante punto di incontro panafricano per artisti, producer, filmmaker e attivisti culturali di tutto il mondo.</p>`,
      },
    ],
  },

  // ==========================================
  // SEZIONE B: LE 5 GUIDE DI SETTORE
  // ==========================================
  {
    id: 'guide-come-si-pubblica-la-musica',
    slug: 'come-si-pubblica-la-musica-oggi',
    type: DiscoveryType.Story,
    kicker: 'Guida',
    title: 'Come si pubblica la musica oggi',
    summary:
      "Dalla traccia finita all'ascolto: la mappa degli strumenti essenziali, in breve. Taglio scena elettronica, con note pop dove il gioco cambia.",
    publishedAt: '2026-08-18T09:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops' },
    mapEligible: false,
    tags: ['guida', 'strumenti', 'pubblicazione', 'distribuzione'],
    sources: [
      { url: 'https://www.beatport.com', label: 'Beatport', kind: 'reference' },
      { url: 'https://bandcamp.com', label: 'Bandcamp', kind: 'reference' },
      { url: 'https://www.discogs.com', label: 'Discogs', kind: 'reference' },
      { url: 'https://distrokid.com', label: 'DistroKid', kind: 'reference' },
      { url: 'https://www.siae.it', label: 'SIAE', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-beatport-spiegato', type: RelationType.Story, label: 'Beatport spiegato', reason: 'Focus sui negozi digitali per DJ' },
      { id: 'guide-isrc-upc', type: RelationType.Story, label: 'ISRC & UPC', reason: 'Approfondimento sui codici identificativi' },
    ],
    body: [
      {
        html: `<p class="lead">Dalla traccia finita all'ascolto passi per categorie di strumenti diverse. Ecco le essenziali, in breve — taglio scena elettronica, con note <span class="pop">pop</span> dove il gioco cambia.</p>`,
      },
      {
        heading: '01 · Archivio & metadati',
        html: `<p>La memoria della musica: release, label, cataloghi, versioni, discografie. <a href="https://www.discogs.com" target="_blank" rel="noopener">Discogs</a> è lo standard per vinile ed elettronica; <a href="https://musicbrainz.org" target="_blank" rel="noopener">MusicBrainz</a> è l'archivio aperto. Ideali per catalogare e ricostruire chi ha pubblicato cosa.</p>`,
      },
      {
        heading: '02 · Distribuzione',
        html: `<p>Non carichi da solo sui negozi: un distributore consegna la traccia (con i codici ISRC/UPC) e raccoglie le royalty. <a href="https://distrokid.com" target="_blank" rel="noopener">DistroKid</a> (abbonamento, se pubblichi spesso), <a href="https://cdbaby.com" target="_blank" rel="noopener">CD Baby</a> (a release), <a href="https://www.tunecore.com" target="_blank" rel="noopener">TuneCore</a>. Per l'elettronica serve un distributore approvato Beatport come <a href="https://www.label-worx.com" target="_blank" rel="noopener">LabelWorx</a> o <a href="https://www.label-engine.com" target="_blank" rel="noopener">Label Engine</a>, oppure l'uscita tramite una label.</p>`,
      },
      {
        heading: '03 · Dove esce',
        html: `<p>Dove la musica vive e si monetizza. <a href="https://www.spotify.com" target="_blank" rel="noopener">Spotify</a> e <a href="https://music.apple.com" target="_blank" rel="noopener">Apple Music</a> sono il cuore del <span class="pop">pop</span> (streaming + playlist). Per l'elettronica contano <a href="https://www.beatport.com" target="_blank" rel="noopener">Beatport</a> (si va a classifica di genere), <a href="https://bandcamp.com" target="_blank" rel="noopener">Bandcamp</a> (vendita diretta + fisico) e <a href="https://soundcloud.com" target="_blank" rel="noopener">SoundCloud</a> (promo e scoperta).</p>`,
      },
      {
        heading: "04 · Diritti d'autore",
        html: `<p>Il secondo flusso di soldi, spesso dimenticato: la distribuzione paga la <i>registrazione</i>, questo paga la <i>composizione</i>. In Italia è la <a href="https://www.siae.it" target="_blank" rel="noopener">SIAE</a>; all'estero una PRO o un admin come <a href="https://www.songtrust.com" target="_blank" rel="noopener">Songtrust</a>. Vale per tutti, pop compreso.</p>`,
      },
      {
        heading: '05 · Promozione & scoperta',
        html: `<p>Creare momentum prima e dopo l'uscita. Nell'elettronica: DJ promo pool come <a href="https://inflyte.io" target="_blank" rel="noopener">Inflyte</a> per mandare l'anteprima ai DJ, e <a href="https://ra.co" target="_blank" rel="noopener">Resident Advisor</a> per eventi e scena. Nel <span class="pop">pop</span>: pitching alle playlist editoriali.</p>`,
      },
      {
        heading: '06 · Dati & codici',
        html: `<p>Misurare cosa funziona con <a href="https://chartmetric.com" target="_blank" rel="noopener">Chartmetric</a> o <a href="https://soundcharts.com" target="_blank" rel="noopener">Soundcharts</a>, e assicurarti che ogni traccia abbia i suoi codici <b>ISRC/UPC</b> (te li dà il distributore): sono ciò che tiene insieme royalty e riconoscimento.</p>`,
      },
      {
        heading: 'In sintesi',
        html: `<ul><li><b>Pop:</b> distributore → streaming → playlist, più il publishing.</li><li><b>Elettronica:</b> label/Beatport + Bandcamp + vinile + promo pool, con Discogs come archivio.</li><li><b>Per tutti:</b> due flussi (registrazione + composizione) e codici puliti dall'inizio.</li></ul>`,
      },
    ],
  },

  {
    id: 'guide-beatport-spiegato',
    slug: 'beatport-spiegato-classifiche-generi',
    type: DiscoveryType.Story,
    kicker: 'Guida',
    title: 'Beatport spiegato: classifiche, generi e visibilità',
    summary:
      'Il negozio dei DJ: come funziona la classifica di genere, perché scegliere bene la categorizzazione, e come ci arrivi davvero tramite distributori approvati e label.',
    publishedAt: '2026-08-17T10:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops' },
    mapEligible: false,
    tags: ['guida', 'beatport', 'distribuzione', 'djing', 'classifiche'],
    sources: [
      { url: 'https://www.beatport.com', label: 'Beatport', kind: 'reference' },
      { url: 'https://www.label-worx.com', label: 'LabelWorx', kind: 'reference' },
      { url: 'https://www.label-engine.com', label: 'Label Engine', kind: 'reference' },
      { url: 'https://www.beatportal.com', label: 'Beatportal', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-come-si-pubblica-la-musica', type: RelationType.Story, label: 'Come si pubblica la musica', reason: 'Guida generale alla pubblicazione' },
    ],
    body: [
      {
        html: `<p class="lead">Nel <span class="pop">pop</span> il metro è lo streaming; nell'elettronica c'è un negozio a parte, pensato per i DJ. Ecco come funziona <a href="https://www.beatport.com" target="_blank" rel="noopener">Beatport</a> e perché pesa.</p>`,
      },
      {
        heading: "Cos'è",
        html: `<p>Beatport è il negozio di riferimento per la musica elettronica: download in alta qualità (WAV/AIFF) pensati per essere suonati, non solo ascoltati. È il posto dove i DJ comprano le tracce, quindi esserci significa entrare nel loro flusso di lavoro.</p>`,
      },
      {
        heading: 'Le classifiche',
        html: `<p>Il cuore è la <b>Top 100 per genere</b>. Non c'è una classifica unica: si scala <i>dentro</i> il proprio genere, in base alle vendite. Il supporto dei DJ (che comprano e suonano) e la spinta promo nelle prime due settimane fanno la differenza tra sparire e finire in chart.</p>`,
      },
      {
        heading: 'I generi contano',
        html: `<p>La tassonomia è rigida e la scelta del genere è una decisione strategica: un genere troppo affollato ti rende invisibile, uno preciso ti dà una classifica raggiungibile. Scegli dove la tua traccia compete davvero, non dove "suona figo".</p>`,
      },
      {
        heading: 'Come ci arrivi',
        html: `<p>Non carichi da solo: Beatport accetta solo da <b>distributori approvati</b> come <a href="https://www.label-worx.com" target="_blank" rel="noopener">LabelWorx</a> o <a href="https://www.label-engine.com" target="_blank" rel="noopener">Label Engine</a>, oppure tramite una label già presente. Firmare con un'etichetta è spesso la via più semplice per entrare.</p>`,
      },
      {
        heading: 'Oltre il negozio',
        html: `<p>Beatport è anche <b>Beatport Streaming/LINK</b> (streaming ad alta qualità per DJ e software) e <b>Beatportal</b> (editoriale e classifiche curate): vetrine ulteriori oltre alla vendita.</p>`,
      },
      {
        heading: 'In sintesi',
        html: `<ul><li>È il negozio dei DJ: la valuta è la classifica di genere, non lo stream.</li><li>Scegli il genere con cura: è metà del risultato.</li><li>Ci entri via distributore approvato o label, non da solo.</li></ul>`,
      },
    ],
  },

  {
    id: 'guide-isrc-upc',
    slug: 'isrc-upc-codici-royalty',
    type: DiscoveryType.Story,
    kicker: 'Guida',
    title: 'ISRC & UPC: i codici che tutelano le tue royalty',
    summary:
      'Due codici invisibili decidono se vieni pagato e riconosciuto. Cosa sono, chi te li dà, e gli errori tipici da evitare tra registrazioni e release.',
    publishedAt: '2026-08-16T10:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops' },
    mapEligible: false,
    tags: ['guida', 'codici', 'royalty', 'metadati', 'isrc', 'upc'],
    sources: [
      { url: 'https://isrc.ifpi.org', label: 'ISRC (IFPI)', kind: 'reference' },
      { url: 'https://distrokid.com', label: 'DistroKid', kind: 'reference' },
      { url: 'https://soundcharts.com', label: 'Soundcharts', kind: 'reference' },
      { url: 'https://chartmetric.com', label: 'Chartmetric', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-musicbrainz-identita', type: RelationType.Story, label: 'MusicBrainz & Identità', reason: 'Metadati aperti e identificatori stabili' },
    ],
    body: [
      {
        html: `<p class="lead">Non sono burocrazia: sono ciò che tiene insieme soldi e riconoscimento. Vale identico per <span class="pop">pop</span> ed elettronica.</p>`,
      },
      {
        heading: 'Cosa sono',
        html: `<p><b>ISRC</b> (International Standard Recording Code) identifica la singola <i>registrazione</i>: una traccia specifica, quel mix, quella versione. <b>UPC/EAN</b> identifica il <i>prodotto</i>, cioè la release (singolo, EP, album) nel suo insieme. Uno è la canzone, l'altro è la confezione.</p>`,
      },
      {
        heading: 'Chi te li dà',
        html: `<p>Di norma li assegna il <a href="https://distrokid.com" target="_blank" rel="noopener">distributore</a> quando carichi: non devi comprarli a parte. Se pubblichi molto puoi richiedere un tuo codice registrante <a href="https://isrc.ifpi.org" target="_blank" rel="noopener">ISRC</a> e gestirli in autonomia, ma per la maggior parte è il distributore a occuparsene.</p>`,
      },
      {
        heading: 'Perché contano',
        html: `<p>Sono la chiave con cui piattaforme, PRO e servizi di analytics collegano ascolti, vendite e royalty alla tua traccia. Servono anche per il riconoscimento (Shazam, content ID) e per i report. Senza codici puliti, i soldi si perdono o finiscono attribuiti a qualcun altro.</p>`,
      },
      {
        heading: 'Errori tipici',
        html: `<ul><li>Riusare lo <b>stesso ISRC</b> per una versione diversa (remaster, radio edit, remix): ogni registrazione distinta vuole il suo.</li><li>Cambiare distributore e ristampare senza tenere traccia dei codici già esistenti.</li><li>Non conservarli: annotali sempre, sono la carta d'identità delle tue uscite.</li></ul>`,
      },
      {
        heading: 'In sintesi',
        html: `<ul><li>ISRC = la registrazione; UPC = la release.</li><li>Te li dà il distributore — ma sono tuoi, custodiscili.</li><li>Un codice per ogni versione: mai riciclarli.</li></ul>`,
      },
    ],
  },

  {
    id: 'guide-vinile-2026',
    slug: 'vinile-2026-stampa-tempi-costi',
    type: DiscoveryType.Story,
    kicker: 'Guida',
    title: 'Vinile nel 2026: come si stampa, tempi e costi reali',
    summary:
      'Dal master dedicato alla pressing plant: come funziona la stampa del disco fisico, quanto aspetti davvero e come finanziarlo con i pre-order.',
    publishedAt: '2026-08-14T10:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops' },
    mapEligible: false,
    tags: ['guida', 'vinile', 'produzione', 'mastering', 'bandcamp'],
    sources: [
      { url: 'https://bandcamp.com', label: 'Bandcamp', kind: 'reference' },
      { url: 'https://www.discogs.com', label: 'Discogs', kind: 'reference' },
      { url: 'https://www.deepgrooves.net', label: 'Deepgrooves Pressing Plant', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-come-si-pubblica-la-musica', type: RelationType.Story, label: 'Come si pubblica la musica', reason: 'Panoramica sui formati fisici e digitali' },
    ],
    body: [
      {
        html: `<p class="lead">Il vinile è tornato centrale nell'elettronica: oggetto, feticcio e fonte di reddito diretta. Ma stamparlo ha regole precise.</p>`,
      },
      {
        heading: 'Come si stampa',
        html: `<p>Dal master si incide una <b>lacca</b> (o DMM), da cui per galvanica si ricavano gli <b>stamper</b> che pressano il PVC. Prima della tiratura arriva il <b>test pressing</b>: alcune copie da ascoltare e approvare. Serve un mastering <i>dedicato al vinile</i>, diverso da quello digitale.</p>`,
      },
      {
        heading: 'Tempi reali',
        html: `<p>Non è veloce: tra coda dell'impianto, test pressing e stampa si va spesso da <b>3 a 6 mesi</b>, a volte di più nei periodi pieni. Pianifica l'uscita a ritroso da questa finestra, non il contrario.</p>`,
      },
      {
        heading: 'Costi e minimi',
        html: `<p>Le presse lavorano a <b>tirature minime</b> (tipicamente ~100–300 copie): sotto certi numeri non conviene o non si fa. Il costo per copia scende quando il volume sale. Aggiungi mastering per vinile, grafica, buste e spedizioni nel conto.</p>`,
      },
      {
        heading: 'Come finanziarlo',
        html: `<p>Il modo più sano è il <b>pre-order</b> su <a href="https://bandcamp.com" target="_blank" rel="noopener">Bandcamp</a>: raccogli gli ordini prima di stampare e copri (o riduci) l'anticipo. Molte label indipendenti stampano solo ciò che è già in gran parte prenotato.</p>`,
      },
      {
        heading: 'Da sapere prima',
        html: `<p>La <b>durata per lato</b> incide sul volume: più minuti per lato, meno headroom e loudness. Meglio pochi minuti ben incisi che un lato lungo e debole. E archivia la release su <a href="https://www.discogs.com" target="_blank" rel="noopener">Discogs</a>: è lì che il tuo disco vivrà nel tempo.</p>`,
      },
      {
        heading: 'In sintesi',
        html: `<ul><li>Master dedicato + test pressing: passaggi non saltabili.</li><li>Metti in conto 3–6 mesi e una tiratura minima.</li><li>Pre-order su Bandcamp per finanziarlo senza rischiare.</li></ul>`,
      },
    ],
  },

  {
    id: 'guide-musicbrainz-identita',
    slug: 'musicbrainz-identita-mbid',
    type: DiscoveryType.Story,
    kicker: 'Guida',
    title: 'MusicBrainz & identità: il riconoscimento dei metadati musicali',
    summary:
      "L'archivio aperto e collaborativo dietro centinaia di app: cos'è un MBID e perché metadati puliti significano venire riconosciuti ovunque da umani e algoritmi.",
    publishedAt: '2026-08-12T10:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops' },
    mapEligible: false,
    tags: ['guida', 'musicbrainz', 'metadati', 'listenbrainz', 'mbid'],
    sources: [
      { url: 'https://musicbrainz.org', label: 'MusicBrainz', kind: 'reference' },
      { url: 'https://listenbrainz.org', label: 'ListenBrainz', kind: 'reference' },
      { url: 'https://picard.musicbrainz.org', label: 'MusicBrainz Picard (Tagger)', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-isrc-upc', type: RelationType.Story, label: 'ISRC & UPC', reason: 'Codici standard e identificatori univoci' },
    ],
    body: [
      {
        html: `<p class="lead">Se Discogs è la memoria dell'elettronica, <a href="https://musicbrainz.org" target="_blank" rel="noopener">MusicBrainz</a> è l'anagrafe aperta su cui si appoggiano moltissime app. Capirla aiuta a farsi trovare.</p>`,
      },
      {
        heading: "Cos'è",
        html: `<p>Un'enciclopedia musicale <b>aperta e collaborativa</b>: artisti, release, registrazioni, relazioni. È mantenuta da una community e i suoi dati sono liberamente riutilizzabili, per questo tanti servizi la usano come base.</p>`,
      },
      {
        heading: "L'MBID",
        html: `<p>Il pezzo chiave è l'<b>MBID</b> (MusicBrainz Identifier): un codice stabile per ogni entità — artista, release, recording. È come un documento d'identità che non cambia anche se cambia il nome visualizzato, così i servizi non ti confondono con un omonimo.</p>`,
      },
      {
        heading: 'A cosa serve',
        html: `<p>Molti strumenti ci si appoggiano: lo scrobbling e le raccomandazioni di <a href="https://listenbrainz.org" target="_blank" rel="noopener">ListenBrainz</a>, i tagger di libreria (come Picard), i sistemi di riconoscimento e catalogazione. Un'entità ben registrata qui viaggia meglio ovunque.</p>`,
      },
      {
        heading: 'Metadati puliti = venire trovati',
        html: `<p>Nome artista coerente, crediti corretti, release collegate agli identificatori giusti: sono ciò che fa "vedere" la tua musica dalle macchine. Metadati sciatti = frammentazione, ascolti sparsi e scoperte mancate. È lavoro noioso, ma è infrastruttura.</p>`,
      },
      {
        heading: 'In sintesi',
        html: `<ul><li>Archivio aperto su cui si basano molte app di ascolto e scoperta.</li><li>L'MBID è l'identità stabile della tua musica.</li><li>Cura i metadati: è così che ti trovano, umani e algoritmi.</li></ul>`,
      },
    ],
  },
])
