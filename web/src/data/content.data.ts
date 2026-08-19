import { DiscoveryType, PartyKind, RelationType, discoveryDatasetSchema } from '../domain/discovery'

// CONTENUTO REALE pubblicato su Drops (non fixture di sviluppo)
export const publishedContentItems = discoveryDatasetSchema.parse([
  {
    id: 'festival-houghton-norfolk',
    slug: 'houghton-festival-norfolk',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'Houghton Festival: la curatela di Craig Richards e la licenza di suono permanente',
    coverUrl: '/assets/houghton.png',
    summary:
      'Nato nel 2017 nel Norfolk e curato dal leggendario resident del Fabric Craig Richards, Houghton ha ridefinito il concetto di festival nel Regno Unito grazie a una licenza musicale non-stop di 24 ore e una selezione di world-class selector.',
    publishedAt: '2026-08-20T09:00:00.000Z',
    originalPublishedAt: '2026-08-06T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Norfolk, Regno Unito', countryCode: 'GB', latitude: 52.8252, longitude: 0.6653 },
    mapEligible: true,
    tags: ['festival', 'norfolk', 'houghton', 'craig-richards', 'uk', 'selectors', 'club-culture'],
    sources: [
      { url: 'https://www.houghtonfestival.co.uk', label: 'Sito Ufficiale Houghton Festival', kind: 'official' },
      { url: 'https://ra.co/events/1852084', label: 'Resident Advisor Houghton Festival', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-timedance-td10', type: RelationType.Release, label: 'Timedance', reason: 'Connessioni con la bass music e l’avanguardia britannica' },
    ],
    body: [
      {
        html: `<p class="lead">Nato nel 2017 nello splendido scenario rurale di Houghton Hall nel Norfolk, il festival curato da <b>Craig Richards</b> si è imposto in pochi anni come uno dei punti di riferimento mondiali per gli amanti del clubbing raffinato, grazie a una licenza musicale di 24 ore senza sosta e a un impianto Funktion-One tarato su misura.</p>`,
      },
      {
        heading: 'La licenza non-stop e la filosofia del suono',
        html: `<p>A differenza della quasi totalità dei festival nel Regno Unito, costretti a rigorosi coprifuoco notturni, Houghton beneficia di una licenza speciale che permette la programmazione ininterrotta di musica giorno e notte. Questo consente dei DJ di esprimersi in set lunghi e distesi, ricreando la vera atmosfera clubbing all'aperto, supportata da una cura maniacale per il sound design in ciascuno dei palchi immersi nel bosco.</p>`,
      },
      {
        heading: 'La direzione artistica di Craig Richards',
        html: `<p>La curatela firmata dal leggendario resident del Fabric di Londra garantisce una proposta artistica priva di concessioni al mainstream. Spaziando tra techno d'autore, electro di Detroit, minimal house, ambient e jazz, la lineup di <a href="https://www.houghtonfestival.co.uk" target="_blank" rel="noopener">Houghton Festival</a> predilige la coerenza stilistica e la competenza tecnica dei selector, rendendolo un vero paradiso per i crate digger.</p>`,
      },
      {
        heading: "Una galleria d'arte a cielo aperto",
        html: `<p>Oltre alla musica, Houghton integra installazioni d'arte contemporanea sparse nel parco storico, workshop di benessere e un'offerta gastronomica curata, mantenendo un'atmosfera intima e focalizzata sulla comunità, vietando l'uso dei telefoni sulle piste da ballo per preservare l'esperienza analogica.</p>`,
      },
    ],
  },

  // ==========================================
  // SEZIONE A: ARTISTI & RADAR SIGNALS
  // ==========================================
  {
    id: 'radar-xexa-kissom',
    slug: 'xexa-kissom',
    type: DiscoveryType.Artist,
    kicker: 'Radar',
    title: 'XEXA — Kissom: violoncello, intimità pop e kizomba decostruita',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Il secondo album della compositrice e polistrumentista lisbonese XEXA esce su Príncipe Discos, allargando l'estetica della label verso ambient, pop radiante e ritmi afro-diasporici decostruiti.",
    publishedAt: '2026-08-18T14:00:00.000Z',
    originalPublishedAt: '2025-09-26T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Lisbona, Portogallo', countryCode: 'PT', latitude: 38.7223, longitude: -9.1393 },
    mapEligible: true,
    tags: ['radar', 'artista emergente', 'lisbona', 'principe', 'kizomba', 'ambient', 'violoncello', 'leftfield-pop'],
    sources: [
      { url: 'https://principediscos.bandcamp.com/album/kissom', label: 'Bandcamp (Acquisto & Vinile)', kind: 'original' },
      { url: 'https://open.spotify.com/album/10qHH2CpyVGPY7R5yN76fR', label: 'Spotify', kind: 'listen' },
      { url: 'https://music.apple.com/album/kissom/1770068537', label: 'Apple Music', kind: 'listen' },
      { url: 'https://soundcloud.com/principe-discos', label: 'SoundCloud (Príncipe)', kind: 'listen' },
      { url: 'https://www.discogs.com/label/342131-Pr%C3%ADncipe', label: 'Discogs (Catalogo Príncipe)', kind: 'reference' },
      { url: 'https://www.instagram.com/xexa____/', label: 'Profilo Ufficiale XEXA', kind: 'official' },
    ],
    relations: [
      { id: 'guide-lisbona-clubbing-scene', type: RelationType.Story, label: 'Scena Clubbing Lisbona', reason: 'Ecosistema Príncipe e diaspora afro-portoghese' },
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
    kicker: 'Radar',
    title: 'TD10: dieci anni di futurismo club per la Timedance di Bristol',
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    summary:
      "La compilation celebrativa curata da Batu raccoglie 23 tracce esclusive che fotografano l'evoluzione del sound di Bristol fra techno ibrida, bass culture e sound design chirurgico.",
    publishedAt: '2026-08-17T16:00:00.000Z',
    originalPublishedAt: '2025-10-10T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Bristol, Regno Unito', countryCode: 'GB', latitude: 51.4545, longitude: -2.5879 },
    mapEligible: true,
    tags: ['radar', 'release', 'bristol', 'timedance', 'batu', 'techno', 'bass', 'soundsystem', 'compilation'],
    sources: [
      { url: 'https://timedance.bandcamp.com/album/td10', label: 'Bandcamp (TD10 Compilation & Vinile)', kind: 'original' },
      { url: 'https://soundcloud.com/timedance', label: 'SoundCloud (Timedance)', kind: 'listen' },
      { url: 'https://www.discogs.com/label/827660-Timedance', label: 'Discogs (Catalogo Timedance)', kind: 'reference' },
    ],
    relations: [
      { id: 'festival-dekmantel-amsterdam-2026', type: RelationType.Party, label: 'Dekmantel Connection', reason: 'Batu e Timedance costantemente ospitati sui palchi UFO' },
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
    kicker: 'Radar',
    title: 'Oroko Radio entra in pausa: la fragilità delle web-radio comunitarie',
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
    summary:
      "L'emittente indipendente di Accra sospende la diretta quotidiana per burnout e insostenibilità economica. Una vicenda che interroga l'ecosistema globale su chi finanzia la scoperta musicale.",
    publishedAt: '2026-08-16T12:00:00.000Z',
    originalPublishedAt: '2026-04-08T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Accra, Ghana', countryCode: 'GH', latitude: 5.6037, longitude: -0.1870 },
    mapEligible: true,
    tags: ['radar', 'notizia', 'accra', 'community-radio', 'archivio', 'sostenibilità', 'infrastrutture'],
    sources: [
      { url: 'https://oroko.live/news/hiatus', label: 'Oroko Radio (Comunicato Ufficiale)', kind: 'original' },
      { url: 'https://oroko.live/archive', label: 'Oroko Live Archive (Ascolto trasmissioni)', kind: 'listen' },
      { url: 'https://www.instagram.com/orokoradio/', label: 'Instagram Oroko Radio', kind: 'official' },
    ],
    relations: [
      { id: 'radar-ctm-festival-2026', type: RelationType.Party, label: 'CTM Festival & Oroko', reason: 'Collaborazione translocale tra festival berlinese e radio di Accra' },
      { id: 'radar-nyege-nyege-festival-2026', type: RelationType.Party, label: 'Nyege Nyege Festival', reason: 'Centri nevralgici di produzione e diffusione diasporica' },
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

  // ==========================================
  // SEZIONE B: FOCUS SU ETICHETTE DISCOGRAFICHE
  // ==========================================
  {
    id: 'label-defected-records',
    slug: 'defected-records-house-music-heritage',
    type: DiscoveryType.Label,
    kicker: 'Etichetta',
    title: 'Defected Records: anatomia di un impero della House Music globale',
    coverUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Fondata nel 1999 da Simon Dunmore e oggi guidata da Wez Saunders, Defected ha trasformato la vocal e club house in un ecosistema globale tra residenze a Ibiza, radio show storici e sublabel di culto come DFTD e Glitterbox.",
    publishedAt: '2026-08-19T11:00:00.000Z',
    originalPublishedAt: '1999-01-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Londra, Regno Unito', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278 },
    mapEligible: true,
    tags: ['etichetta', 'defected', 'house-music', 'glitterbox', 'dftd', 'ibiza', 'london', 'club-culture'],
    sources: [
      { url: 'https://defected.com', label: 'Sito Ufficiale Defected', kind: 'official' },
      { url: 'https://defected.bandcamp.com', label: 'Defected Bandcamp Store', kind: 'original' },
      { url: 'https://open.spotify.com/user/defectedrecords', label: 'Spotify Curated Profile', kind: 'listen' },
      { url: 'https://www.discogs.com/label/744-Defected', label: 'Discogs (Catalogo Defected)', kind: 'reference' },
      { url: 'https://soundcloud.com/defectedrecords', label: 'SoundCloud Radio Stream', kind: 'listen' },
    ],
    relations: [
      { id: 'guide-bordero-siae-spa-dj', type: RelationType.Story, label: 'Diritti d’Autore nei Club', reason: 'Gestione royalty per le hit mondiali nei DJ set estivi' },
      { id: 'guide-beatport-spiegato', type: RelationType.Story, label: 'Beatport Chart Dynamics', reason: 'Strategia di vertice nelle classifiche House e Tech House' },
    ],
    body: [
      {
        html: `<p class="lead">Fondata a Londra nel 1999 dal visionario <b>Simon Dunmore</b> e oggi proiettata nel futuro sotto la guida del CEO <b>Wez Saunders</b>, <b>Defected Records</b> rappresenta il pilastro assoluto e la memoria vivente della <i>House Music</i> su scala planetaria.</p>`,
      },
      {
        heading: "Dalle origini a Soho alla conquista di Ibiza",
        html: `<p>Nata in un piccolo ufficio nel cuore di Soho con l'intento di preservare l'anima soul, gospel e vocal della house americana trapiantandola nei club britannici, Defected ha debuttato con la storica hit <i>I Can't Get No Sleep</i> di Masters At Work feat. India. Da allora, l'etichetta ha costruito un ponte ininterrotto con l'isola di Ibiza, trasformando le proprie residency — dall'El Divino e Pacha fino al leggendario appuntamento settimanale all'Eden di San Antonio e all'Ushuaïa — in un rituale di massa per clubber di ogni generazione.</p>`,
      },
      {
        heading: "L'arcipelago delle sublabel: Glitterbox, DFTD e The Remedy Project",
        html: `<p>La forza di Defected risiede nella sua capacità di segmentare l'esperienza del dancefloor attraverso divisioni specializzate:</p><ul><li><b>Glitterbox:</b> l'esaltazione della disco-house, del funk anni '70 e '80 e della cultura queer originaria di New York e Chicago, con feste inclusive ed estetiche teatrali sfavillanti.</li><li><b>DFTD:</b> lo sbocco dedicato alla club-techno e alla minimal tech-house più cruda e sotterranea, pensata per i club più scuri e intimi.</li><li><b>The Remedy Project & Stay True Sounds:</b> imprint curati da figure come Melé e Kid Fonque per esplorare tribal rhythms, afro-house e deep house sudafricana.</li><li><b>D-Vine Sounds & Big Love:</b> boutique label fondate da Sam Divine e Seamus Haji per mantenere vivo il groove puro.</li></ul>`,
      },
      {
        heading: "Infrastruttura digitale e collezionismo",
        html: `<p>Defected non è solo un catalogo di oltre 1.000 release: è una media company autonoma con un radio show settimanale syndication trasmesso in oltre 60 paesi, festival proprietari in Croazia, Malta e Londra, e una divisione vinili che continua a stampare edizioni limitate e cofanetti da collezione rimasterizzati con la massima cura audiofila.</p>`,
      },
    ],
  },

  {
    id: 'label-innervisions-berlin',
    slug: 'innervisions-berlino-dixon-ame',
    type: DiscoveryType.Label,
    kicker: 'Etichetta',
    title: 'Innervisions: l’estetica melodica e il rigore concettuale di Dixon & Âme',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Fondata a Berlino nel 2005 da Steffen Berkhahn (Dixon) e Kristian Beyer & Frank Wiedemann (Âme), Innervisions ha ridefinito la house epica, ipnotica e drammatica, unendo release centellinate e l'esperienza immersiva di Lost In A Moment.",
    publishedAt: '2026-08-19T10:30:00.000Z',
    originalPublishedAt: '2005-01-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Berlino, Germania', countryCode: 'DE', latitude: 52.5200, longitude: 13.4050 },
    mapEligible: true,
    tags: ['etichetta', 'innervisions', 'dixon', 'ame', 'melodic-house', 'berlino', 'lost-in-a-moment', 'secret-weapons'],
    sources: [
      { url: 'https://www.innervisions.com', label: 'Innervisions Official Hub', kind: 'official' },
      { url: 'https://innervisions.bandcamp.com', label: 'Innervisions Bandcamp Store', kind: 'original' },
      { url: 'https://open.spotify.com/user/innervisionsofficial', label: 'Spotify Innervisions', kind: 'listen' },
      { url: 'https://www.discogs.com/label/42791-Innervisions', label: 'Discogs (Catalogo Completo)', kind: 'reference' },
      { url: 'https://ra.co/labels/834', label: 'Resident Advisor Label Profile', kind: 'reference' },
    ],
    relations: [
      { id: 'festival-dekmantel-amsterdam-2026', type: RelationType.Party, label: 'Dekmantel Connection', reason: 'Presenza cardine nei Main Stage e UFO stage' },
      { id: 'radar-ctm-festival-2026', type: RelationType.Party, label: 'Ecosistema Elettronico Berlinese', reason: 'Radici e sviluppo nel contesto d’avanguardia tedesco' },
    ],
    body: [
      {
        html: `<p class="lead">Nata nel 2005 a Berlino dalla visione congiunta di <b>Dixon (Steffen Berkhahn)</b> e del duo <b>Âme (Kristian Beyer & Frank Wiedemann)</b>, <b>Innervisions</b> ha riscritto le coordinate della musica elettronica contemporanea, forgiando un suono emozionale, drammaturgico e senza compromessi.</p>`,
      },
      {
        heading: "La genesi sonora: oltre la minimal berlinese",
        html: `<p>All'apice del dominio del minimalismo sonoro a Berlino, Innervisions ha osato reintrodurre tensione armonica, melodie stratificate, vocal eterei e costruzioni sinfoniche. Tracce manifesto come <i>Rej</i> di Âme, <i>En Route</i> di Marcus Worgull e gli indimenticabili remix di Dixon hanno dimostrato che il dancefloor può essere un luogo di profonda catarsi emotiva ed eleganza senza tempo.</p>`,
      },
      {
        heading: "La saga 'Secret Weapons' e la severità curatoriale",
        html: `<p>L'approccio dell'etichetta è leggendario per la sua estrema selettività: poche release all'anno, testate per mesi in segreto durante i tour mondiali dei fondatori prima di vedere la luce. La celebre serie di compilation <i>Secret Weapons</i> è diventata il trampolino di lancio per talenti come Henrik Schwarz, Agoria, Âme, Denis Horvat, Trikk e Jimi Jules, definendo anno dopo anno gli standard timbrici del DJing internazionale.</p>`,
      },
      {
        heading: "Lost In A Moment: la decostruzione del club tradizionale",
        html: `<p>Con il format itinerante <b>Lost In A Moment</b>, Innervisions ha abbandonato le pareti buie dei club convenzionali per creare esperienze diurne in siti carichi di valore storico, paesaggistico e architettonico: da isole deserte in Croazia a castelli medievali e fortezze costiere, eliminando qualsiasi divisione VIP e ripristinando l'ascolto collettivo all'aria aperta.</p>`,
      },
      {
        heading: "Muting The Noise e la cultura della manifattura",
        html: `<p>Attraverso la propria casa di distribuzione e negozio <i>Muting The Noise</i>, Innervisions ha sempre trattato il vinile non come semplice supporto, ma come oggetto d'arte: copertine serigrafate, packaging tattili e una dedizione meticolosa alla masterizzazione analogica che ne fanno uno dei cataloghi più ricercati dai collezionisti.</p>`,
      },
    ],
  },

  {
    id: 'label-xl-recordings',
    slug: 'xl-recordings-da-rave-a-potenza-indipendente',
    type: DiscoveryType.Label,
    kicker: 'Etichetta',
    title: 'XL Recordings: dall’hardcore rave britannico alla rivoluzione discografica indipendente',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Nata nel 1989 come spin-off dance di Beggars Banquet da Tim Palmer, Nick Halkes e Richard Russell, XL Recordings ha tracciato la traiettoria più straordinaria della musica indipendente: dai rave banger di The Prodigy a Burial, The xx, Radiohead, Overmono e Joy Orbison.",
    publishedAt: '2026-08-19T10:00:00.000Z',
    originalPublishedAt: '1989-01-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Londra, Regno Unito', countryCode: 'GB', latitude: 51.5138, longitude: -0.2084 },
    mapEligible: true,
    tags: ['etichetta', 'xl-recordings', 'richard-russell', 'rave', 'uk-bass', 'overmono', 'joy-orbison', 'londra'],
    sources: [
      { url: 'https://xlrecordings.com', label: 'XL Recordings Official Portal', kind: 'official' },
      { url: 'https://xlrecordings.bandcamp.com', label: 'XL Recordings Bandcamp Store', kind: 'original' },
      { url: 'https://open.spotify.com/user/xlrecordings', label: 'Spotify XL Releases', kind: 'listen' },
      { url: 'https://www.discogs.com/label/150-XL-Recordings', label: 'Discogs (Catalogo XL)', kind: 'reference' },
      { url: 'https://beggars.com', label: 'Beggars Group Archive', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-timedance-td10', type: RelationType.Release, label: 'Bristol & UK Bass Evolution', reason: 'Collaborazioni e osmosi estetica con Joy Orbison e Overmono' },
      { id: 'label-warp-records', type: RelationType.Label, label: 'Avanguardie Britanniche Indipendenti', reason: 'I due poli della discografia d’autore inglese' },
    ],
    body: [
      {
        html: `<p class="lead">Poche entità nella storia della musica registrata hanno incarnato la libertà creativa e la capacità di plasmare il canone contemporaneo come <b>XL Recordings</b>. Dalla polvere dei rave illegali britannici del 1989 agli stadi e ai vertici delle classifiche globali, XL è il modello definitivo di etichetta discografica indipendente.</p>`,
      },
      {
        heading: "1989–1995: L'esplosione breakbeat hardcore e The Prodigy",
        html: `<p>Fondata come costola elettronica del Beggars Group da Tim Palmer, Nick Halkes e un giovanissimo <b>Richard Russell</b>, XL cattura immediatamente l'energia tellurica del movimento rave con inni come <i>Charly</i> ed <i>Everybody in the Place</i> dei The Prodigy, SL2 (<i>On a Ragga Tip</i>) e Liquid. Quella matrice breakbeat, viscerale e orgogliosamente popolare rimarrà per sempre il DNA ritmico della label.</p>`,
      },
      {
        heading: "La filosofia di Richard Russell: meno uscite, totale dedizione",
        html: `<p>Assunta la guida solitaria dell'etichetta, Richard Russell impone una regola editoriale controintuitiva: pubblicare non più di cinque o sei album all'anno. Questo approccio sartoriale consente a XL di investire risorse e tempo smisurati in ciascun progetto, diventando la casa naturale per capolavori epocali come <i>In Rainbows</i> e i lavori solisti di Thom Yorke, <i>The xx</i>, Dizzee Rascal (il caposaldo del grime <i>Boy in da Corner</i>), King Krule, FKA twigs e Adele.</p>`,
      },
      {
        heading: "Il ritorno al clubbing del futuro: Overmono, Joy Orbison e Two Shell",
        html: `<p>Nel panorama clubbing attuale, XL Recordings è tornata ad essere il barometro supremo del suono da club britannico. Con la firma dei fratelli <b>Overmono</b> (il cui album <i>Good Lies</i> ha unito UK garage, trance nostalgia e bass culture), le pietre miliari di <b>Joy Orbison</b> (<i>flight fm</i>, <i>still slipping vol.1</i>) e gli enigmatici rilasci di Two Shell, la label dimostra che il clubbing sperimentale può comunicare con milioni di ascoltatori senza cedere alla mediocrità commerciale.</p>`,
      },
    ],
  },

  {
    id: 'label-warp-records',
    slug: 'warp-records-artificial-intelligence-avanguardia',
    type: DiscoveryType.Label,
    kicker: 'Etichetta',
    title: 'Warp Records: l’invenzione dell’ascolto sintetico e l’avanguardia sonora permanente',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Dalle origini bleep & bass a Sheffield nel 1989 con Steve Beckett e Rob Mitchell fino alla serie leggendaria 'Artificial Intelligence', Warp ha dato una casa ad Aphex Twin, Boards of Canada, Autechre, Nightmares on Wax, Flying Lotus e Oneohtrix Point Never.",
    publishedAt: '2026-08-19T09:30:00.000Z',
    originalPublishedAt: '1989-10-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Sheffield, Regno Unito', countryCode: 'GB', latitude: 53.3811, longitude: -1.4701 },
    mapEligible: true,
    tags: ['etichetta', 'warp', 'sheffield', 'aphex-twin', 'boards-of-canada', 'autechre', 'idm', 'bleep-techno'],
    sources: [
      { url: 'https://warp.net', label: 'Warp.net Official Universe', kind: 'official' },
      { url: 'https://warprecords.bandcamp.com', label: 'Warp Bandcamp Catalogue', kind: 'original' },
      { url: 'https://bleep.com', label: 'Bleep.com Music Store', kind: 'reference' },
      { url: 'https://open.spotify.com/user/warprecords', label: 'Spotify Warp Curated', kind: 'listen' },
      { url: 'https://www.discogs.com/label/23528-Warp-Records', label: 'Discogs (Archivio Warp Records)', kind: 'reference' },
    ],
    relations: [
      { id: 'label-xl-recordings', type: RelationType.Label, label: 'XL Recordings', reason: 'Poli cardine della cultura discografica autonoma britannica' },
      { id: 'radar-lev-festival-gijon-2026', type: RelationType.Party, label: 'Ricerca Audiovisiva ed Elettronica', reason: 'Affinità estetica tra IDM e festival audiovisivi contemporanei' },
    ],
    body: [
      {
        html: `<p class="lead">Fondata nel 1989 nel retro del negozio di dischi FON a Sheffield da <b>Steve Beckett</b> e il compianto <b>Rob Mitchell</b>, <b>Warp Records</b> non è semplicemente un'etichetta discografica: è l'istituzione che ha ridefinito la natura stessa della musica elettronica, inventando l'ascolto per la mente (<i>electronic listening music</i>) e spingendo la ricerca sonora oltre ogni limite conosciuto.</p>`,
      },
      {
        heading: "Sheffield 1989: Bleep & Bass come identità industriale",
        html: `<p>Il viaggio di Warp inizia con il suono metallico e industriale dello Yorkshire: la <i>Bleep Techno</i>. Uscite pionieristiche come <i>Track With No Name</i> di Forgemasters (WAP1), LFO (il cui singolo omonimo bruciò i diffusori dei club nel 1990) e Nightmares on Wax inventarono un linguaggio percussivo basato su sub-frequenze telluriche e impulsi sinusoidali purissimi, sintetizzando l'angoscia e la speranza della classe operaia inglese post-thatcheriana.</p>`,
      },
      {
        heading: "La rivoluzione 'Artificial Intelligence' e la nascita dell'IDM",
        html: `<p>Nel 1992, con la leggendaria compilation <i>Artificial Intelligence</i> e lo slogan iconico <i>'Electronic Listening Music from Warp'</i>, la label compie la sua mossa più audace: dimostrare che la musica elettronica non serviva solo per ballare nei warehouse, ma poteva essere fruita seduti in poltrona come la grande musica colta o il jazz d'avanguardia. Da questo manifesto nascono le carriere immortali di <b>Polygon Window / Aphex Twin (Richard D. James)</b>, <b>Autechre</b>, <b>B12</b> e The Black Dog.</p>`,
      },
      {
        heading: "I maestri della nostalgia e dell'astrazione: Boards of Canada e Flying Lotus",
        html: `<p>Negli anni successivi, Warp ha continuato ad espandere i propri confini: dal calore analogico, vellutato e nostalgico dei <b>Boards of Canada</b> (<i>Music Has the Right to Children</i>, <i>Geogaddi</i>) al jazz cibernetico losangelino di <b>Flying Lotus</b> (<i>Cosmogramma</i>), fino al modernismo sintetico di Oneohtrix Point Never, Squarepusher, Battles, Kelela e Yves Tumor. Una traiettoria inesauribile che dimostra come Warp rimanga il faro guida dell'avanguardia globale.</p>`,
      },
    ],
  },

  // ==========================================
  // SEZIONE C: REPORT FESTIVAL E SCENE 2026
  // ==========================================
  {
    id: 'festival-omana-kalamitsi',
    slug: 'omana-festival-kalamitsi',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'Omana Festival: diggin e intimità clubbing sulle spiagge greche',
    coverUrl: '/assets/omana.png',
    summary:
      'Nel golfo di Kalamitsi, Omana Festival si propone come un rifugio incontaminato e ultra-selezionato tra ambient, deep minimal e ritmi rallentati in riva all’Egeo.',
    publishedAt: '2026-08-19T20:00:00.000Z',
    originalPublishedAt: '2026-09-10T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Chalkidiki, Grecia', countryCode: 'GR', latitude: 40.0167, longitude: 23.9833 },
    mapEligible: true,
    tags: ['festival', 'grecia', 'omana', 'kalamitsi', 'deep-minimal', 'ambient', 'beach-clubbing'],
    sources: [
      { url: 'https://omana-festival.de', label: 'Sito Ufficiale Omana Festival', kind: 'official' },
      { url: 'https://ra.co/events/1852467', label: 'Resident Advisor Omana Festival', kind: 'reference' },
    ],
    relations: [
      { id: 'festival-dekmantel-amsterdam-2026', type: RelationType.Party, label: 'Dekmantel Festival', reason: 'Selector e attitudine musicale affine nell’elettronica colta' },
      { id: 'radar-mostra-barcellona-2026', type: RelationType.Party, label: 'MOSTRA Barcelona', reason: 'Condivisione della filosofia dell’ascolto attento, formati intimi e sound design profondo' },
    ],
    body: [
      {
        html: `<p class="lead">Immerso nella splendida e isolata baia di Kalamitsi, nella penisola di Sithonia, <b>Omana Festival</b> si distingue nel panorama europeo come un raduno boutique a capienza strettamente limitata, dove la club culture si fonde con il benessere e il rispetto profondo della natura.</p>`,
      },
      {
        heading: 'Un rifugio tra spiaggia e pineta',
        html: `<p>La manifestazione prende vita all'interno del Thalatta Kalamitsi Village Camp, sfruttando la scenografia naturale per allestire palchi sulla spiaggia sabbiosa e tra i boschi di pini marittimi. Omana rifiuta le logiche dei grandi numeri per offrire un’esperienza accogliente e rilassata, con un programma che accompagna gli ospiti per un’intera settimana tra sessioni di yoga al mattino, bagni nell'Egeo e DJ set distesi dal pomeriggio alla notte.</p>`,
      },
      {
        heading: 'Ricerca sonora, deep minimal e ambient',
        html: `<p>La curatela musicale è orientata alle sonorità più raffinate del panorama underground: deep minimal, house ipnotica, techno d'ascolto e downtempo. I DJ hanno la possibilità di esprimersi in set estesi di svariate ore, ideali per sviluppare una narrazione sonora complessa e coerente con lo spirito rigenerativo del festival, impreziosito da palchi dedicati all'ambient sperimentale.</p>`,
      },
    ],
  },

  {
    id: 'festival-dekmantel-amsterdam-2026',
    slug: 'dekmantel-festival-amsterdam-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'Dekmantel Festival Amsterdam 2026: il tempio dei selector nell’Amsterdamse Bos',
    coverUrl: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Dal Main Stage immerso nella foresta all'UFO stage dedicato alla techno ipnotica e al greenhouse tropicale, Dekmantel 2026 ribadisce il suo ruolo di barometro globale del DJing colto e della club culture d'eccellenza.",
    publishedAt: '2026-08-19T09:00:00.000Z',
    originalPublishedAt: '2026-08-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Amsterdam, Paesi Bassi', countryCode: 'NL', latitude: 52.3150, longitude: 4.8350 },
    mapEligible: true,
    tags: ['festival', 'amsterdam', 'dekmantel', 'amsterdamse-bos', 'selectors', 'ufo-stage', 'greenhouse', 'club-culture'],
    sources: [
      { url: 'https://www.dekmantelfestival.com', label: 'Dekmantel Official Hub & Program', kind: 'official' },
      { url: 'https://dekmantel.bandcamp.com', label: 'Dekmantel Records Store', kind: 'listen' },
      { url: 'https://ra.co/promoters/38318', label: 'Resident Advisor Dekmantel Profile', kind: 'reference' },
      { url: 'https://soundcloud.com/dkmntl', label: 'Dekmantel Podcast & Live Archive', kind: 'listen' },
    ],
    relations: [
      { id: 'festival-sonar-barcellona-2026', type: RelationType.Party, label: 'Sónar Barcellona', reason: 'I due poli d’eccellenza dell’estate festivaliera europea' },
      { id: 'radar-timedance-td10', type: RelationType.Release, label: 'UK & Bristol Connection', reason: 'Batu e Timedance costantemente ospitati sui palchi UFO' },
      { id: 'radar-ava-festival-belfast-2026', type: RelationType.Party, label: 'AVA Belfast', reason: 'Curatela attenta alle radici dei talenti locali' },
    ],
    body: [
      {
        html: `<p class="lead">Dal 29 luglio al 2 agosto 2026, <b>Dekmantel Festival</b> celebra la sua dodicesima edizione nell'incantevole cornice dell'<b>Amsterdamse Bos</b>, confermandosi l'appuntamento più influente e rispettato per la comunità internazionale dei DJ, dei crate digger e degli amanti del clubbing consapevole.</p>`,
      },
      {
        heading: "L'Amsterdamse Bos come cattedrale acustica naturale",
        html: `<p>La magia di Dekmantel risiede nella sua perfetta integrazione con l'ambiente naturale: palchi in legno mimetizzati tra gli alberi secolari, un'acustica tarata con precisione millimetrica e un'atmosfera priva di fronzoli commerciali dove la musica rimane l'unico centro di gravità.</p>`,
      },
      {
        heading: "I palchi iconici: Greenhouse, UFO e Selectors Stage",
        html: `<p>Ogni stage di Dekmantel incarna una specifica sfumatura della club culture:</p><ul><li><b>Greenhouse:</b> una vera e propria serra in vetro dove si alternano house calda, funk analogico, percussioni latine e live act mozzafiato circondati da piante tropicali.</li><li><b>UFO & UFO II:</b> i due hangar dedicati all'oscurità, alla techno ipnotica, all'electro di Detroit, all'EBM e alla bass music futurista ad altissima pressione sonora.</li><li><b>Selectors Stage:</b> il palco sacro dei digger, dove leggende del vinile come Hunee, Antal, Palms Trax e Motor City Drum Ensemble tessono set eclettici lunghi ore.</li><li><b>The Loop & Radar:</b> spazi dedicati all'esplorazione modulare, ai live sperimentali e alle collaborazioni inedite.</li></ul>`,
      },
      {
        heading: "Dekmantel come ecosistema culturale",
        html: `<p>Oltre alle giornate nel bosco, il festival include il programma d'apertura nei musei e lungo i canali dell'IJ (Muziekgebouw, Shelter, Eye Filmmuseum), tavole rotonde e workshop che dimostrano come un evento di massa possa mantenere intatta la propria etica underground.</p>`,
      },
    ],
  },

  {
    id: 'festival-sonar-barcellona-2026',
    slug: 'sonar-festival-barcellona-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'Sónar Barcellona 2026: musica avanzata, creatività digitale e l’ecosistema Sónar+D',
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    summary:
      "La trentatreesima edizione di Sónar trasforma Barcellona nella capitale mondiale dell'innovazione sonora: il connubio tra Sónar de Día a Fira Montjuïc, la maratona notturna di Sónar de Noche e i talk su intelligenza artificiale e sound design.",
    publishedAt: '2026-08-18T18:00:00.000Z',
    originalPublishedAt: '2026-06-18T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Barcellona, Spagna', countryCode: 'ES', latitude: 41.3733, longitude: 2.1488 },
    mapEligible: true,
    tags: ['festival', 'barcellona', 'sonar', 'sonar-plus-d', 'musica-avanzata', 'fira-montjuic', 'digital-arts'],
    sources: [
      { url: 'https://sonar.es', label: 'Sónar Festival Official Website', kind: 'official' },
      { url: 'https://sonarplusd.com', label: 'Sónar+D Innovation Congress', kind: 'reference' },
      { url: 'https://ra.co/promoters/31804', label: 'Resident Advisor Sónar Profile', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-mostra-barcellona-2026', type: RelationType.Party, label: 'Scena Elettronica di Barcellona', reason: 'MOSTRA come contromodello underground nella stessa città' },
      { id: 'radar-lev-festival-gijon-2026', type: RelationType.Party, label: 'Circuito Spagnolo di Arte Digitale', reason: 'Ponti tra innovazione tecnologica e performance AV' },
      { id: 'festival-dekmantel-amsterdam-2026', type: RelationType.Party, label: 'Dekmantel Amsterdam', reason: 'I due poli d’eccellenza dell’estate festivaliera europea' },
      { id: 'festival-primavera-sound-clubbing-2026', type: RelationType.Party, label: 'Primavera Sound Clubbing', reason: 'I due giganti dell’estate musicale barcellonese' },
      { id: 'radar-ctm-festival-2026', type: RelationType.Party, label: 'CTM Festival', reason: 'Poli complementari della ricerca sonora e delle arti digitali' },
    ],
    body: [
      {
        html: `<p class="lead">Fondata nel 1994, la rassegna <b>Sónar Barcellona (Festival de Música Avanzada y Arte Multimedia)</b> celebra nel 2026 trentatré anni di attività ininterrotta, confermandosi il punto di raccordo globale tra creatività artistica, avanguardia tecnologica e clubbing di massa.</p>`,
      },
      {
        heading: "La duplice anima: Sónar de Día e Sónar de Noche",
        html: `<p>La struttura di Sónar è unica nel suo genere: di giorno, tra gli spazi aperti e i padiglioni di <b>Fira Montjuïc</b>, il festival celebra il live set d'autore, i suoni ibridi e le performance immersive; di notte, l'immenso complesso industriale di <b>Fira Gran Via</b> si trasforma in una delle più grandi cattedrali del clubbing mondiale con stage monumentali come SonarClub e SonarPub.</p>`,
      },
      {
        heading: "Sónar+D: il cervello tecnologico e l'AI generativa",
        html: `<p>Elemento distintivo imprescindibile è <b>Sónar+D</b>, il congresso internazionale per professionisti dell'arte digitale, programmatori, scienziati e designer. Nel 2026, i panel e i laboratori esplorano l'intersezione tra algoritmi di intelligenza artificiale per la composizione generativa, spazializzazione audio 3D e nuove economie di tutela per i produttori indipendenti.</p>`,
      },
      {
        heading: "L'impatto sulla città e la settimana OFF-Sónar",
        html: `<p>L'influenza di Sónar va ben oltre i confini del festival ufficiale: durante la settimana di giugno, Barcellona diventa l'epicentro mondiale della notte, con centinaia di label showcase, party su terrazze e raduni underground (OFF-Sónar al Poble Espanyol) che richiamano appassionati da ogni continente.</p>`,
      },
    ],
  },

  {
    id: 'festival-primavera-sound-clubbing-2026',
    slug: 'primavera-sound-barcellona-2026-clubbing-circuit',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'Primavera Sound 2026: l’anima underground dentro il colosso di Barcellona',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Oltre i grandi palchi pop e rock, il Parc del Fòrum custodisce un cuore pulsante di club culture: dalle maratone non-stop di Boiler Room al palco The Warehouse, dove l'elettronica da club più radicale incontra un pubblico transgenerazionale.",
    publishedAt: '2026-08-18T16:00:00.000Z',
    originalPublishedAt: '2026-06-03T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Barcellona, Spagna', countryCode: 'ES', latitude: 41.4116, longitude: 2.2227 },
    mapEligible: true,
    tags: ['festival', 'barcellona', 'primavera-sound', 'boiler-room', 'warehouse-stage', 'clubbing', 'parc-del-forum'],
    sources: [
      { url: 'https://www.primaverasound.com', label: 'Primavera Sound Official Portal', kind: 'official' },
      { url: 'https://ra.co/promoters/50630', label: 'Resident Advisor Primavera Sound Profile', kind: 'reference' },
    ],
    relations: [
      { id: 'festival-sonar-barcellona-2026', type: RelationType.Party, label: 'Sónar Festival Connection', reason: 'I due giganti dell’estate musicale barcellonese' },
      { id: 'radar-mostra-barcellona-2026', type: RelationType.Party, label: 'Resistenza Locale', reason: 'Confronto di scala con gli eventi underground cittadini' },
    ],
    body: [
      {
        html: `<p class="lead">Nonostante <b>Primavera Sound</b> sia celebrato a livello globale per le sue grandiose lineup eclettiche, l'edizione 2026 consolida l'area del <b>Parc del Fòrum</b> affacciata sul Mediterraneo come uno dei distretti di clubbing e musica elettronica più stimolanti d'Europa.</p>`,
      },
      {
        heading: "The Warehouse e il palco Boiler Room a 360 gradi",
        html: `<p>L'allestimento dedicato alla club culture si articola attorno a punti nevralgici ad altissima intensità:</p><ul><li><b>Boiler Room Stage:</b> la celebre arena circolare dove la barriera tra DJ e pubblico è azzerata, trasmettendo in streaming globale le selezioni dei talenti più esplosivi di hard drum, jersey club, deconstructed club e baile funk.</li><li><b>The Warehouse:</b> una tensostruttura industriale pensata come un vero e proprio club di Berlino o Londra, con laser minimalisti e un impianto audio L-Acoustics dedicato a techno martellante, electro e breakbeat.</li><li><b>Dice & Cupra Stages:</b> spazi che dalle tre di notte alle sei del mattino ospitano i b2b più esclusivi della scena contemporanea.</li></ul>`,
      },
      {
        heading: "Curatela trasversale e ponti di genere",
        html: `<p>Il punto di forza dell'elettronica a Primavera Sound è la totale assenza di snobismo di genere: selector di culto come DJ Nobu, Avalon Emerson, Sherelle, VTSS e Joy Orbison suonano a pochi metri dai grandi act dal vivo, attirando un pubblico eterogeneo che scopre la cultura della notte in tutta la sua potenza sociale.</p>`,
      },
    ],
  },

  {
    id: 'guide-lisbona-clubbing-scene',
    slug: 'guida-clubbing-lisbona-scene-club-radio',
    type: DiscoveryType.Story,
    kicker: 'Scena & Guida',
    title: 'Guida al Clubbing di Lisbona: club iconici, web radio e l’asse sonoro afro-lusofono',
    coverUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Da Lux Frágil e Musicbox al circuito di 5A, Planeta Manas e Rádio Quântica: mappa completa dell'ecosistema notturno lisbonese, laboratorio europeo di batida, house atlantica e club culture comunitaria.",
    publishedAt: '2026-08-18T12:00:00.000Z',
    originalPublishedAt: '2026-05-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Lisbona, Portogallo', countryCode: 'PT', latitude: 38.7169, longitude: -9.1399 },
    mapEligible: true,
    tags: ['guida', 'lisbona', 'clubbing', 'lux-fragil', 'musicbox', 'radio-quantica', 'principe', 'afro-house', 'batida'],
    sources: [
      { url: 'https://luxfragil.com', label: 'Lux Frágil Official Site', kind: 'official' },
      { url: 'https://musicboxlisboa.com', label: 'Musicbox Lisboa', kind: 'official' },
      { url: 'https://radioquantica.com', label: 'Rádio Quântica Archive', kind: 'listen' },
      { url: 'https://ra.co/guide/pt/lisbon', label: 'Resident Advisor Lisbon City Guide', kind: 'reference' },
      { url: 'https://flur.pt', label: 'Flur Discos Record Store', kind: 'reference' },
    ],
    relations: [
      { id: 'radar-xexa-kissom', type: RelationType.Artist, label: 'XEXA — Kissom', reason: 'Nuova voce della scena sperimentale lisbonese' },
      { id: 'guide-bordero-siae-spa-dj', type: RelationType.Story, label: 'Regole SPA Portogallo per DJ', reason: 'Guida legale per suonare nei club in Portogallo' },
    ],
    body: [
      {
        html: `<p class="lead">Lisbona è oggi una delle capitali più vibranti ed elettrizzanti per la musica elettronica globale. Crocevia naturale tra Europa, Africa e Sud America, la capitale portoghese offre un tessuto di clubbing autentico, caldo e politicamente consapevole.</p>`,
      },
      {
        heading: "Le istituzioni regine: Lux Frágil e Musicbox",
        html: `<p>Nessuna guida alla notte lisbonese può prescindere da <b>Lux Frágil</b>, situato a Santa Apolónia sul fiume Tago. Fondato da Manuel Reis nel 1998, Lux unisce un sound system Funktion-One impeccabile, una programmazione che ospita i migliori selector del mondo e una terrazza all'alba che è parte integrante del mito cittadino. A Cais do Sodré, <b>Musicbox</b> è il punto di riferimento quotidiano per live act trasversali, serate bass music e clubbing intimo e sudato.</p>`,
      },
      {
        heading: "Spazi comunitari, DIY e club d'ascolto: 5A, Outra Cena e Planeta Manas",
        html: `<p>Negli ultimi anni la scena si è arricchita di spazi dedicati a comunità specifiche e sound design ricercato:</p><ul><li><b>5A Club:</b> micro-club nel cuore del Bairro Alto, noto per il suo impianto artigianale, luci rosse e selezioni viniliche deep, microhouse e minimal fino a tarda mattina.</li><li><b>Planeta Manas:</b> spazio culturale autogestito e queer-safe hub dove convergono performance transfemministe, deconstructed club e ritmi ibridi diasporici.</li><li><b>Outra Cena:</b> warehouse a Marvila dedicato alla techno scura e ai suoni rave senza concessioni commerciali.</li></ul>`,
      },
      {
        heading: "La linfa vitale: Rádio Quântica e l'eredità di Príncipe Discos",
        html: `<p>La vera rivoluzione musicale lisbonese è avvenuta grazie all'ibridazione della club culture europea con i ritmi dei sobborghi e delle ex colonie (Angola, Capo Verde, Mozambico): il kuduro, la batida, il funaná e il tarraxo documentati da <b>Príncipe Discos</b>. A fungere da megafono per questa comunità è <b>Rádio Quântica</b>, web radio indipendente fondata da Violet e Photonz che da oltre un decennio dà voce alle periferie e all'attivismo artistico.</p>`,
      },
      {
        heading: "Crate Digging: Flur e i record store imperdibili",
        html: `<p>Per chi cerca vinili rari, <b>Flur Discos</b> (adiacente a Lux Frágil) è una delle botteghe di dischi più raffinate d'Europa, affiancata da <i>Carpet & Snares Records</i> a Espaço Chiado (fondata da Jorge Caiado) e <i>Collect</i> a Cais do Sodré.</p>`,
      },
    ],
  },

  {
    id: 'guide-milano-clubbing-scene',
    slug: 'guida-clubbing-milano-scene-elettronica',
    type: DiscoveryType.Story,
    kicker: 'Scena & Guida',
    title: 'Guida al Clubbing di Milano: underground, club storici, spazi ibridi e festival del Nord Italia',
    coverUrl: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Dal Tunnel Club al Plastic, dal Tempio del Futuro Perduto all'eredità di Dude Club e Macao, fino all'asse con Terraforma e Jazz:Re:Found: anatomia della scena milanese tra sound design, clubbing consapevole e collezionismo su vinile.",
    publishedAt: '2026-08-17T18:00:00.000Z',
    originalPublishedAt: '2026-03-01T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Milano, Italia', countryCode: 'IT', latitude: 45.4642, longitude: 9.1900 },
    mapEligible: true,
    tags: ['guida', 'milano', 'clubbing', 'tunnel-club', 'plastic', 'tempio-del-futuro-perduto', 'terraforma', 'vinyl-stores'],
    sources: [
      { url: 'https://www.tunnel-club.it', label: 'Tunnel Club Milano Official', kind: 'official' },
      { url: 'https://tempiodelfuturo.art', label: 'Tempio del Futuro Perduto', kind: 'official' },
      { url: 'https://ra.co/guide/it/milan', label: 'Resident Advisor Milan Club Guide', kind: 'reference' },
      { url: 'https://serendeepity.net', label: 'Serendeepity Record Store Milano', kind: 'reference' },
      { url: 'https://www.terraformafestival.com', label: 'Terraforma Festival Archive', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-bordero-siae-spa-dj', type: RelationType.Story, label: 'Borderò SIAE & Normative Italiane', reason: 'Guida operativa per suonare nei locali milanesi e italiani' },
    ],
    body: [
      {
        html: `<p class="lead">Milano rappresenta da decenni il laboratorio più dinamico ed esigente per la musica elettronica e il clubbing in Italia: una metropoli capace di conciliare la nightlife patinata del design e della moda con una tenace cultura underground dedita al sound design e alla ricerca vinilica.</p>`,
      },
      {
        heading: "I club leggendari: Tunnel, Plastic e Apollo",
        html: `<p>La spina dorsale della notte milanese poggia su spazi con un'identità granitica:</p><ul><li><b>Tunnel Club:</b> incastonato sotto i binari della Stazione Centrale in Via Sammartini, da oltre trent'anni è il tempio della techno, dell'electro e della club music più avanguardista (con serate resident come <i>Take It Easy</i> e format innovativi).</li><li><b>Plastic Club (Killer Plastic):</b> icona senza tempo della libertà queer, della house e della disco d'autore, punto di incontro per artisti, designer e amanti della notte autentica.</li><li><b>Apollo Milano:</b> raffinato club sui Navigli diviso tra cocktail bar e club room, ideale per selezioni house sofisticate, nu-disco ed eclettismo contemporaneo.</li></ul>`,
      },
      {
        heading: "Spazi generic e rigenerazione: Il Tempio del Futuro Perduto",
        html: `<p>In Via Luigi Nono, il <b>Tempio del Futuro Perduto</b> rappresenta un modello unico in Europa: uno spazio culturale multidisciplinare recuperato dall'abbandono, fondato su etica no-phone, sostenibilità, book-crossing e maratone musicali dove la techno ipnotica, la drum & bass e la musica ambient dialogano con installazioni artistiche diurne.</p>`,
      },
      {
        heading: "L'asse con i festival di culto: Terraforma e Jazz:Re:Found",
        html: `<p>Milano è anche l'epicentro organizzativo dei festival più visionari d'Italia: <b>Terraforma</b> (a Villa Arconati, punto di riferimento per l'ecologia del suono e l'architettura effimera) e <b>Jazz:Re:Found</b> (nel Monferrato, ponte sublime tra jazz, broken beat, soul ed elettronica da club).</p>`,
      },
      {
        heading: "I negozi di dischi essenziali per i DJ",
        html: `<p>A Milano il vinile è una religione. Tappa obbligatoria per ogni selector è <b>Serendeepity</b> in Corso di Porta Ticinese (curato con dedizione enciclopedica su house, techno, jazz e sperimentale), affiancato da <i>Volume</i> all'Isola, <i>Sound Metaphors Milano</i> e <i>Mariposa Dischi</i>.</p>`,
      },
    ],
  },

  // ==========================================
  // SEZIONE D: REPORT FESTIVAL RADAR (CTM, AVA, LEV, MOSTRA, NYEGE NYEGE)
  // ==========================================
  {
    id: 'radar-ctm-festival-2026',
    slug: 'ctm-festival-berlino-2026',
    type: DiscoveryType.Party,
    partyKind: PartyKind.Festival,
    kicker: 'Festival',
    title: 'CTM 2026 Berlino: audio spaziale, nuove composizioni e reti translocali',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Il festival berlinese dedicato alle musiche avventurose esplora l'ascolto immersivo con Blawan e rinsalda le connessioni translocali con Accra e l'ecosistema di Oroko Radio.",
    publishedAt: '2026-08-15T18:00:00.000Z',
    originalPublishedAt: '2026-01-23T00:00:00.000Z',
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
      { id: 'festival-sonar-barcellona-2026', type: RelationType.Party, label: 'Festival d’Avanguardia', reason: 'Poli complementari della ricerca sonora e delle arti digitali' },
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
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Audio Visual Arts Festival torna a Belfast imponendo una proporzione chiara: oltre tre quarti degli artisti da Irlanda e UK, con 12 debutti assoluti nella capitale nordirlandese.",
    publishedAt: '2026-08-14T15:00:00.000Z',
    originalPublishedAt: '2026-05-29T00:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Belfast, Regno Unito', countryCode: 'GB', latitude: 54.5973, longitude: -5.9301 },
    mapEligible: true,
    tags: ['festival', 'belfast', 'ava', 'local-scene', 'ireland', 'visual-arts', 'clubbing'],
    sources: [
      { url: 'https://avafestival.com/belfast-tickets/', label: 'Biglietti Ufficiali AVA Belfast', kind: 'official' },
      { url: 'https://avafestival.com/ava-belfast-2026-lineup-announcement/', label: 'Lineup Ufficiale & Debutti', kind: 'original' },
      { url: 'https://avafestival.com/conference/', label: 'AVA Conference & Talk', kind: 'reference' },
    ],
    relations: [
      { id: 'festival-dekmantel-amsterdam-2026', type: RelationType.Party, label: 'Circuiti Festival Europei', reason: 'Curatela attenta alle radici dei talenti locali' },
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
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Tra La Nave di Gijón e gli spazi museali asturiani, il Laboratorio di Elettronica Visiva unisce post-clubbing, turntablism sperimentale e performance con intelligenza artificiale.",
    publishedAt: '2026-08-13T14:00:00.000Z',
    originalPublishedAt: '2026-04-30T00:00:00.000Z',
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
      { id: 'festival-sonar-barcellona-2026', type: RelationType.Party, label: 'Sónar+D Art Link', reason: 'Intersezione tra arti digitali e musica avanzata' },
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
    coverUrl: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Contro la gigantografia dei macro-festival estivi, MOSTRA propone a Barcellona un'esperienza a capienza limitata dedicata a deep techno, ascolto attento e sostenibilità urbana.",
    publishedAt: '2026-08-12T11:00:00.000Z',
    originalPublishedAt: '2026-03-12T00:00:00.000Z',
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
      { id: 'festival-sonar-barcellona-2026', type: RelationType.Party, label: 'Sónar Barcellona', reason: 'Prospettive a confronto tra scala intima e macro-festival' },
      { id: 'festival-primavera-sound-clubbing-2026', type: RelationType.Party, label: 'Primavera Sound Clubbing', reason: 'Confronto di scala con gli eventi underground cittadini' },
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
    coverUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    summary:
      "La maratona di 4 giorni a Jinja fonde l'energia del cinema d'azione underground ugandese di Wakaliwood con 7 palchi di suoni panafricani e diaspora globale.",
    publishedAt: '2026-08-11T12:00:00.000Z',
    originalPublishedAt: '2026-11-19T00:00:00.000Z',
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
  // SEZIONE E: GUIDE PRATICHE DJ & SETTORE
  // ==========================================
  {
    id: 'guide-bordero-siae-spa-dj',
    slug: 'guida-bordero-siae-spa-dj-diritto-autore',
    type: DiscoveryType.Story,
    kicker: 'Guida Pratica DJ',
    title: 'Guida pratica al Borderò per DJ: compilazione digitale SIAE, SPA e tutela del diritto d’autore',
    coverUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Come funziona il Programma Musicale online (mioBorderò), le differenze fiscali e giuridiche tra esecuzione e registrazione fonografica, come gestire unreleased, dubplate e bootleg, e le regole per suonare tra Italia, Spagna e Portogallo.",
    publishedAt: '2026-08-19T12:00:00.000Z',
    originalPublishedAt: '2026-02-15T00:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops DJ Specialist' },
    mapEligible: false,
    tags: ['guida', 'djing', 'bordero', 'siae', 'spa', 'diritto-autore', 'miobordero', 'royalties', 'clubbing'],
    sources: [
      { url: 'https://www.siae.it/it/servizi-online/miobordero/', label: 'SIAE (Portale Ufficiale mioBorderò)', kind: 'official' },
      { url: 'https://www.spautores.pt', label: 'SPA (Sociedade Portuguesa de Autores)', kind: 'official' },
      { url: 'https://www.sgae.es', label: 'SGAE (Sociedad General de Autores y Editores Spagna)', kind: 'reference' },
      { url: 'https://www.cisac.org', label: 'CISAC (Confederazione Internazionale Società Autori)', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-come-si-pubblica-la-musica', type: RelationType.Story, label: 'Come si pubblica la musica', reason: 'Flussi economici di composizione e registrazione' },
      { id: 'guide-isrc-upc', type: RelationType.Story, label: 'ISRC & UPC', reason: 'Codici standard per il riconoscimento delle tracce' },
      { id: 'guide-milano-clubbing-scene', type: RelationType.Story, label: 'Scena Clubbing Milano', reason: 'Applicazione del borderò nei locali e festival italiani' },
      { id: 'guide-lisbona-clubbing-scene', type: RelationType.Story, label: 'Scena Clubbing Lisbona', reason: 'Adempimenti legali e licenze SPA per serate in Portogallo' },
      { id: 'guide-rekordbox-usb-cdj3000-workflow', type: RelationType.Story, label: 'Workflow Rekordbox & USB', reason: 'Completamento della preparazione professionale per i live' },
    ],
    body: [
      {
        html: `<p class="lead">Il <b>Programma Musicale</b> (comunemente chiamato <i>Borderò</i>) è lo strumento giuridico e contabile attraverso il quale i diritti di pubblica esecuzione raccolti nei locali vengono ripartiti ai compositori e agli autori delle tracce suonate durante un DJ set. Capire come compilarlo correttamente non è solo un obbligo di legge, ma un atto di rispetto verso chi produce la musica che fa ballare la pista.</p>`,
      },
      {
        heading: "01 · Diritto d'Autore vs Diritto Connesso: dove vanno i soldi?",
        html: `<p>È fondamentale chiarire una distinzione cardinale:</p><ul><li><b>Diritto d'Autore (SIAE in Italia, SPA in Portogallo, SGAE in Spagna):</b> tutela chi ha <i>composto la melodia e il testo</i> della traccia. I proventi del borderò vanno interamente a questo fondo.</li><li><b>Diritto Connesso (SCF, Soundreef, NuovoIMAIE):</b> tutela il <i>produttore fonografico</i> (chi ha pagato la registrazione) e gli <i>artisti interpreti/esecutori</i>. Questo flusso viene liquidato attraverso licenze forfettarie del locale e piattaforme di streaming, non dal borderò tradizionale.</li></ul>`,
      },
      {
        heading: "02 · Come compilare il borderò digitale (mioBorderò SIAE)",
        html: `<p>Dal 2018 la versione cartacea (il vecchio foglio rosso) è stata quasi integralmente soppressa in favore del portale telematico <b>mioBorderò</b> (accessibile anche via app mobile):</p><ol><li><b>Assegnazione da parte dell'Organizzatore:</b> il gestore del locale o promoter dell'evento crea il permesso telematico e invia l'invito digitale al profilo del DJ (tramite codice fiscale o email verificata).</li><li><b>Accettazione del DJ:</b> il DJ accede alla propria area riservata prima o subito dopo l'esibizione e accetta il Programma Musicale.</li><li><b>Compilazione della scaletta (Tracklist):</b> si inseriscono i titoli esatti e i compositori (cognome dell'autore). È possibile salvare <i>Playlist preferite</i> per richiamare velocemente i blocchi di tracce suonate regolarmente.</li><li><b>Riconsegna telematica:</b> entro 48–72 ore dalla fine dell'evento, il DJ appone la firma digitale e riconsegna il borderò al gestore, che procederà alla chiusura contabile.</li></ol>`,
      },
      {
        heading: "03 · Cosa fare con unreleased, dubplate, edit e bootleg?",
        html: `<p>Uno dei dubbi più frequenti tra i DJ underground riguarda la musica non ancora pubblicata:</p><ul><li><b>Tracce inedite di amici/colleghi:</b> se il brano è già depositato in SIAE o in un'altra collecting society (es. PRS, GEMA, SACEM), inserisci titolo provvisorio e cognome dell'autore originale: quando la traccia sarà registrata ufficialmente, i crediti retroattivi verranno agganciati.</li><li><b>Bootleg e Re-edit non ufficiali:</b> indica sempre gli autori della canzone campionata originale. Il borderò tutela l'opera originaria di cui hai utilizzato le melodie o le armonie.</li><li><b>Tue produzioni inedite non depositate:</b> se non sei iscritto a una società di gestione collettiva, la SIAE accantonerà i fondi in un capitolo di 'musica non identificata'. Per monetizzare i tuoi DJ set con la tua musica, iscriviti come autore/compositore.</li></ul>`,
      },
      {
        heading: "04 · Suonare all'estero: la SPA in Portogallo e il circuito CISAC",
        html: `<p>Se suoni a Lisbona o a Porto, il locale opererà sotto la <b>SPA (Sociedade Portuguesa de Autores)</b>; in Spagna sotto la <b>SGAE</b>. Grazie ai trattati internazionali di reciprocità <b>CISAC</b>, le società estere raccolgono i borderò locali e riversano le quote spettanti alla SIAE (o alla PRO a cui sei iscritto). Assicurati sempre che il promoter portoghese o spagnolo ti fornisca il foglio di ripartizione locale (<i>folha de execução musical</i>) per non perdere i proventi internazionali.</p>`,
      },
      {
        heading: "05 · Responsabilità: DJ vs Organizzatore",
        html: `<p>La legge è chiara: il responsabile del pagamento del permesso per la musica d'ambiente e da ballo è <b>esclusivamente l'organizzatore dell'evento o il gestore della sala</b>. La responsabilità del DJ è unicamente quella di attestare con veridicità e correttezza le opere effettivamente eseguite.</p>`,
      },
    ],
  },

  {
    id: 'guide-rekordbox-usb-cdj3000-workflow',
    slug: 'guida-rekordbox-usb-cdj-3000-workflow-professionale',
    type: DiscoveryType.Story,
    kicker: 'Guida Pratica DJ',
    title: 'Workflow Rekordbox & USB per CDJ-3000: formattazione, metadati, cue points e backup di emergenza',
    coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Dalla formattazione corretta (FAT32 vs exFAT) all'analisi accurata del grid ritmico, gestione di Memory Cue vs Hot Cue, playlist intelligenti, color coding e strategie di ridondanza per non avere mai blackout in console.",
    publishedAt: '2026-08-19T08:00:00.000Z',
    originalPublishedAt: '2026-02-28T00:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Guida Drops DJ Specialist' },
    mapEligible: false,
    tags: ['guida', 'rekordbox', 'cdj-3000', 'pioneer-dj', 'alphatheta', 'usb-setup', 'dj-workflow', 'cue-points'],
    sources: [
      { url: 'https://rekordbox.com', label: 'Rekordbox Official Software Portal', kind: 'official' },
      { url: 'https://alphatheta.com', label: 'AlphaTheta / Pioneer DJ Hardware Support', kind: 'reference' },
      { url: 'https://djtechtools.com', label: 'DJ TechTools Technical Guides', kind: 'reference' },
    ],
    relations: [
      { id: 'guide-beatport-spiegato', type: RelationType.Story, label: 'Beatport spiegato', reason: 'Acquisto file lossless e standardizzazione metadati' },
      { id: 'guide-bordero-siae-spa-dj', type: RelationType.Story, label: 'Guida Borderò DJ', reason: 'Completamento della preparazione professionale per i live' },
    ],
    body: [
      {
        html: `<p class="lead">Nel DJing contemporaneo la preparazione della libreria su <b>Rekordbox</b> e la corretta configurazione delle memorie USB sono decisive quanto la selezione musicale. Una chiavetta mal configurata può causare freeze dei lettori, waveform non sincronizzate o crash a metà set.</p>`,
      },
      {
        heading: "01 · Scelta dell'hardware e File System (FAT32 vs Device Lock)",
        html: `<p>Anche se i nuovi <b>CDJ-3000</b> supportano memorie in formato <i>exFAT</i> e <i>FAT32</i>, se suoni regolarmente in club che dispongono ancora di CDJ-2000NXS2 o XDJ-1000MK2 lo standard universale ed obbligatorio rimane <b>FAT32 (con schema partizione MBR - Master Boot Record)</b>. Investi sempre in pendrive USB 3.2 o SSD portatili ad alta velocità di lettura continua (es. SanDisk Extreme PRO o Corsair Flash Voyager GTX).</p>`,
      },
      {
        heading: "02 · Analisi ritmica: Dynamic vs Normal Beatgrid",
        html: `<p>Quando importi nuove tracce:</p><ul><li><b>Elettronica/Techno/House:</b> usa sempre la modalità <i>Normal</i>. L'analisi dinamica rischia di creare micro-variazioni innaturali di BPM su tracce prodotte con drum machine a tempo fisso.</li><li><b>Disco '70, Funk, Jazz, Afrobeat registrato live:</b> attiva la modalità <i>Dynamic</i> per seguire le naturali fluttuazioni ritmiche del batterista in carne ed ossa, regolando manualmente i marker di battuta sui break salienti.</li></ul>`,
      },
      {
        heading: "03 · Memory Cue vs Hot Cue: come strutturare la traccia",
        html: `<p>Comprendere la differenza tra i due sistemi è la chiave per mixare con fluidità:</p><ul><li><b>Memory Cue (Colorati):</b> punti di riferimento visivi sulla waveform (primo kick, inizio break, out-tro) che non interrompono la riproduzione ma permettono il salto immediato tramite i tasti Cue e Loop del CDJ.</li><li><b>Hot Cue (A-H):</b> trigger istantanei per campionare, fare tone play, lanciare drop a sorpresa o saltare istantaneamente sezioni noiose della traccia.</li></ul>`,
      },
      {
        heading: "04 · La regola del triplo backup (Protocollo No-Panic)",
        html: `<p>La regola d'oro di ogni DJ professionista:</p><ol><li><b>USB Master 1:</b> la chiavetta primaria collegata al Deck 1 (e condivisa via cavo Pro DJ Link di rete LAN a tutti i 4 lettori).</li><li><b>USB Clone 2:</b> chiavetta gemella identica, sincronizzata con l'Export Sync Manager di Rekordbox, pronta all'inserimento immediato nel Deck 2 in caso di avaria LAN.</li><li><b>USB Backup 3 (o SD Card):</b> copia di emergenza conservata nella borsa delle cuffie con le sole playlist essenziali.</li></ol>`,
      },
    ],
  },

  // ==========================================
  // SEZIONE F: GUIDE DI SETTORE ORIGINARIE
  // ==========================================
  {
    id: 'guide-come-si-pubblica-la-musica',
    slug: 'come-si-pubblica-la-musica-oggi',
    type: DiscoveryType.Story,
    kicker: 'Guida',
    title: 'Come si pubblica la musica oggi',
    coverUrl: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1200&q=80',
    summary:
      "Dalla traccia finita all'ascolto: la mappa degli strumenti essenziali, in breve. Taglio scena elettronica, con note pop dove il gioco cambia.",
    publishedAt: '2026-08-18T09:00:00.000Z',
    originalPublishedAt: '2026-03-10T00:00:00.000Z',
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
      { id: 'guide-bordero-siae-spa-dj', type: RelationType.Story, label: 'Borderò SIAE & SPA', reason: 'Guida pratica alla compilazione del programma musicale' },
      { id: 'guide-vinile-2026', type: RelationType.Story, label: 'Vinile nel 2026', reason: 'Panoramica sui formati fisici e digitali' },
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
    coverUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Il negozio dei DJ: come funziona la classifica di genere, perché scegliere bene la categorizzazione, e come ci arrivi davvero tramite distributori approvati e label.',
    publishedAt: '2026-08-17T10:00:00.000Z',
    originalPublishedAt: '2026-03-20T00:00:00.000Z',
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
      { id: 'guide-rekordbox-usb-cdj3000-workflow', type: RelationType.Story, label: 'Workflow Rekordbox & USB', reason: 'Importazione delle tracce acquistate su Beatport' },
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
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Due codici invisibili decidono se vieni pagato e riconosciuto. Cosa sono, chi te li dà, e gli errori tipici da evitare tra registrazioni e release.',
    publishedAt: '2026-08-16T10:00:00.000Z',
    originalPublishedAt: '2026-04-15T00:00:00.000Z',
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
      { id: 'guide-bordero-siae-spa-dj', type: RelationType.Story, label: 'Borderò SIAE & SPA', reason: 'Collegamento tra identificatori e rendicontazione dei set' },
      { id: 'guide-come-si-pubblica-la-musica', type: RelationType.Story, label: 'Come si pubblica la musica', reason: 'Approfondimento sui codici identificativi' },
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
    coverUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Dal master dedicato alla pressing plant: come funziona la stampa del disco fisico, quanto aspetti davvero e come finanziarlo con i pre-order.',
    publishedAt: '2026-08-14T10:00:00.000Z',
    originalPublishedAt: '2026-05-15T00:00:00.000Z',
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
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    summary:
      "L'archivio aperto e collaborativo dietro centinaia di app: cos'è un MBID e perché metadati puliti significano venire riconosciuti ovunque da umani e algoritmi.",
    publishedAt: '2026-08-12T10:00:00.000Z',
    originalPublishedAt: '2026-05-20T00:00:00.000Z',
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

