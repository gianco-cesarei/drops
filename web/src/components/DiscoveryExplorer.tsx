import { useEffect, useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { categoryLabels, DiscoveryType } from '../domain/discovery'
import type { DiscoveryItem } from '../domain/discovery'
import { parseArchiveQuery, serializeArchiveQuery } from '../lib/discovery-query'
import { MinusIcon, PanIcon, PlusIcon, SearchIcon } from './icons'

const sorted = (items: DiscoveryItem[]) => [...items].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

function useArchiveState(allowQuery: boolean) {
  const [types, setTypes] = useState<DiscoveryType[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => {
    const restore = () => { const state = parseArchiveQuery(new URLSearchParams(location.search), allowQuery); setTypes(state.types); setQuery(state.query) }
    restore(); addEventListener('popstate', restore); return () => removeEventListener('popstate', restore)
  }, [allowQuery])
  const update = (nextTypes: DiscoveryType[], nextQuery = query) => {
    setTypes(nextTypes); setQuery(allowQuery ? nextQuery : '')
    history.pushState({}, '', `${location.pathname}${serializeArchiveQuery({ types: nextTypes, query: allowQuery ? nextQuery : '' })}`)
  }
  return { types, query, update }
}

export interface DiscoveryCategoryConfig {
  key: string
  label: string
  types: DiscoveryType[]
  matches: (item: DiscoveryItem) => boolean
}

export const DISCOVERY_CATEGORIES: DiscoveryCategoryConfig[] = [
  {
    key: 'radar',
    label: 'Radar & Artisti',
    types: [DiscoveryType.Artist, DiscoveryType.Release],
    matches: (item) => item.type === DiscoveryType.Artist || item.type === DiscoveryType.Release,
  },
  {
    key: 'festival',
    label: 'Festival',
    types: [DiscoveryType.Party],
    matches: (item) => item.type === DiscoveryType.Party,
  },
  {
    key: 'guide',
    label: 'Guide & Scene',
    types: [DiscoveryType.Story],
    matches: (item) => item.type === DiscoveryType.Story,
  },
]

function Categories({
  types,
  onChange,
  label,
  items,
}: {
  types: DiscoveryType[]
  onChange: (types: DiscoveryType[]) => void
  label: string
  items?: DiscoveryItem[]
}) {
  const isAll = !types.length

  const activeCategories = useMemo(() => {
    if (!items) return DISCOVERY_CATEGORIES
    return DISCOVERY_CATEGORIES.filter((cat) => items.some(cat.matches))
  }, [items])

  return (
    <div className="category-filters" role="group" aria-label={label}>
      <button
        type="button"
        className={`rail-choice ${isAll ? 'active' : ''}`}
        aria-pressed={isAll}
        onClick={() => onChange([])}
      >
        Tutti {items ? <span className="cat-count">({items.length})</span> : null}
      </button>

      {activeCategories.map((cat) => {
        const isCatActive = cat.types.some((t) => types.includes(t))
        const count = items ? items.filter(cat.matches).length : 0

        return (
          <button
            key={cat.key}
            type="button"
            className={`rail-choice ${isCatActive ? 'active' : ''}`}
            aria-pressed={isCatActive}
            onClick={() => {
              if (isCatActive) {
                onChange([])
              } else {
                onChange(cat.types)
              }
            }}
          >
            {cat.label} {items ? <span className="cat-count">({count})</span> : null}
          </button>
        )
      })}
    </div>
  )
}

const filterItems = (items: DiscoveryItem[], types: DiscoveryType[], query = '') =>
  sorted(items)
    .filter((item) => !types.length || types.includes(item.type))
    .filter((item) => {
      if (!query) return true
      const haystack = [item.title, item.summary, item.primaryLocation.name, ...item.tags, item.kicker ?? ''].join(' ').toLowerCase()
      return haystack.includes(query.toLowerCase())
    })

export function DiscoveryEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(true)
  const [draft, setDraft] = useState('')
  useEffect(() => setDraft(state.query), [state.query])

  const visible = useMemo(() => filterItems(items, state.types, state.query), [items, state.query, state.types])

  const handleQueryChange = (val: string) => {
    setDraft(val)
    state.update(state.types, val.trim())
  }

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    state.update(state.types, draft.trim())
  }

  return (
    <div className="environment-layout">
      <aside className="environment-rail">
        <span className="rail-label">Categorie</span>
        <Categories types={state.types} onChange={(types) => state.update(types)} label="Categorie Grid" items={items} />
      </aside>
      <div className="environment-content">
        <div className="environment-toolbar">
          <form className="catalog-search" role="search" onSubmit={submit}>
            <label className="sr-only" htmlFor="catalog-query">Ricerca</label>
            <div className="search-field">
              <SearchIcon className="search-icon" />
              <input
                id="catalog-query"
                value={draft}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Cerca per titolo, artista, festival, città o guida…"
              />
            </div>
            {draft && (
              <button type="button" className="search-clear-btn" onClick={() => handleQueryChange('')} title="Cancella ricerca">
                ✕
              </button>
            )}
            <button type="submit">Cerca</button>
          </form>
          <p className="result-summary"><strong>{visible.length}</strong> contenuti pubblicati</p>
        </div>
        {visible.length === 0 ? (
          <div className="empty-catalog-state">
            <p>Nessun contenuto trovato per i filtri selezionati.</p>
            <button type="button" className="reset-filters-btn" onClick={() => { setDraft(''); state.update([]) }}>
              Reimposta tutti i filtri
            </button>
          </div>
        ) : (
          <div className="discovery-grid">
            {visible.map((item) => <DiscoveryCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const source = item.sources.find((entry) => entry.kind === 'original') ?? item.sources[0]
  const kicker = item.kicker ?? (item.tags.includes('guida') ? 'Guida' : categoryLabels[item.type])
  return (
    <article className="discovery-card">
      <a href={`/item/${item.slug}`} className="card-cover-link" tabIndex={-1} aria-hidden="true">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="card-cover-image" loading="lazy" />
        ) : (
          <div className={`card-cover-placeholder type-${item.type.toLowerCase()}`}>
            <span className="placeholder-kicker">{kicker}</span>
            <span className="placeholder-brand">Drops</span>
          </div>
        )}
      </a>
      <div className="card-content">
        <div className="card-meta">
          <span className="content-badge">{kicker}</span>
          <time>{new Intl.DateTimeFormat('it', { dateStyle: 'medium' }).format(new Date(item.publishedAt))}</time>
        </div>
        <h2>
          <a href={`/item/${item.slug}`}>{item.title}</a>
        </h2>
        <p>{item.summary}</p>
        <div className="card-details">
          <span>📍 {item.primaryLocation.name}</span>
          <span>{item.tags.slice(0, 2).join(' · ')}</span>
        </div>
        <div className="card-actions">
          <a className="card-read-btn" href={`/item/${item.slug}`}>
            Leggi articolo →
          </a>
          <a className="card-source-link" href={source.url} target="_blank" rel="noreferrer" title={`Apri ${source.label}`}>
            {source.label} ↗
          </a>
        </div>
      </div>
    </article>
  )
}

const densityLevels = ['year', 'month', 'day'] as const
type Density = typeof densityLevels[number]

export function TimelineEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(false)
  // Sort items based on originalPublishedAt (content reference date) or publishedAt
  const getItemDate = (item: DiscoveryItem) => new Date(item.originalPublishedAt ?? item.publishedAt)
  const visible = useMemo(() => {
    return filterItems(items, state.types).sort((a, b) => getItemDate(b).getTime() - getItemDate(a).getTime())
  }, [items, state.types])

  const years = useMemo(() => {
    return [...new Set(visible.map((item) => getItemDate(item).getFullYear()))].sort((a, b) => b - a)
  }, [visible])

  return (
    <div className="environment-layout">
      <aside className="environment-rail">
        <span className="rail-label">Categorie</span>
        <Categories types={state.types} onChange={(types) => state.update(types)} label="Categorie Timeline" items={items} />
        <div className="rail-sublist">
          <span className="rail-label">Anni di riferimento</span>
          <div className="rail-list">
            {years.map((year) => <a key={year} href={`#timeline-year-${year}`}>{year}</a>)}
          </div>
        </div>
      </aside>

      <div className="environment-content">
        <div className="environment-toolbar">
          <span className="shell-note">Cronologia dei contenuti musicali (per data storica di riferimento)</span>
          <p className="result-summary"><strong>{visible.length}</strong> eventi / uscite nel tempo</p>
        </div>

        {/* Vertical Alternating Timeline Container */}
        <section className="timeline-vertical-spine-container" aria-label="Timeline Cronologica">
          <div className="timeline-spine-line" aria-hidden="true" />

          {visible.map((item, idx) => {
            const date = getItemDate(item)
            const year = date.getFullYear()
            const dateFormatted = new Intl.DateTimeFormat('it', { month: 'short', year: 'numeric' }).format(date)
            const isLeft = idx % 2 === 0
            const kicker = item.kicker ?? (item.tags.includes('guida') ? 'Guida' : categoryLabels[item.type])

            return (
              <div
                key={item.id}
                id={`timeline-year-${year}`}
                className={`timeline-vertical-node ${isLeft ? 'node-left' : 'node-right'}`}
              >
                {/* Center Badge with Event Reference Date */}
                <div className="timeline-center-marker">
                  <div className="timeline-dot" />
                  <span className="timeline-date-chip">{dateFormatted}</span>
                </div>

                {/* Content Card Side */}
                <div className="timeline-node-card-wrap">
                  <article className="discovery-card timeline-card-compact">
                    <a href={`/item/${item.slug}`} className="card-cover-link" tabIndex={-1} aria-hidden="true">
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} className="card-cover-image" loading="lazy" />
                      ) : (
                        <div className={`card-cover-placeholder type-${item.type.toLowerCase()}`}>
                          <span className="placeholder-kicker">{kicker}</span>
                          <span className="placeholder-brand">Drops</span>
                        </div>
                      )}
                    </a>
                    <div className="card-content">
                      <div className="card-meta">
                        <span className="content-badge">{kicker}</span>
                        <span>📍 {item.primaryLocation.name}</span>
                      </div>
                      <h2>
                        <a href={`/item/${item.slug}`}>{item.title}</a>
                      </h2>
                      <p>{item.summary}</p>
                      <div className="card-actions">
                        <a className="card-read-btn" href={`/item/${item.slug}`}>
                          Approfondisci →
                        </a>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

// European Geographic Boundaries for SVG Map Projection
// Lat: ~34°N (Gibraltar/Cyprus) to 62°N (Scandinavia/Scotland), Lon: -12°W (Lisbon/Ireland) to 32°E (Bucharest/Kyiv)
const MAP_BOUNDS = { minLon: -12, maxLon: 32, minLat: 34, maxLat: 62 }

function projectCoords(lat: number, lon: number, width: number, height: number) {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * width
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height
  return { x: Math.max(10, Math.min(width - 10, x)), y: Math.max(10, Math.min(height - 10, y)) }
}

// 5 discrete zoom levels
const ZOOM_LEVELS = [0.8, 1.2, 1.6, 2.2, 3.0] as const

// Comprehensive baseline of European musical hubs / cities (both active with items and empty baseline)
const EUROPEAN_CITIES_BASE = [
  // Western Europe
  { name: 'Lisbona, Portogallo', countryCode: 'PT', lat: 38.7223, lon: -9.1393 },
  { name: 'Porto, Portogallo', countryCode: 'PT', lat: 41.1579, lon: -8.6291 },
  { name: 'Madrid, Spagna', countryCode: 'ES', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcellona, Spagna', countryCode: 'ES', lat: 41.3851, lon: 2.1734 },
  { name: 'Gijón, Spagna', countryCode: 'ES', lat: 43.5322, lon: -5.6611 },
  { name: 'Parigi, Francia', countryCode: 'FR', lat: 48.8566, lon: 2.3522 },
  { name: 'Lione, Francia', countryCode: 'FR', lat: 45.764, lon: 4.8357 },
  { name: 'Londra, Regno Unito', countryCode: 'GB', lat: 51.5074, lon: -0.1278 },
  { name: 'Bristol, Regno Unito', countryCode: 'GB', lat: 51.4545, lon: -2.5879 },
  { name: 'Manchester, Regno Unito', countryCode: 'GB', lat: 53.4808, lon: -2.2426 },
  { name: 'Belfast, Regno Unito', countryCode: 'GB', lat: 54.5973, lon: -5.9301 },
  { name: 'Dublino, Irlanda', countryCode: 'IE', lat: 53.3498, lon: -6.2603 },
  { name: 'Bruxelles, Belgio', countryCode: 'BE', lat: 50.8503, lon: 4.3517 },
  { name: 'Amsterdam, Paesi Bassi', countryCode: 'NL', lat: 52.3676, lon: 4.9041 },
  { name: 'Rotterdam, Paesi Bassi', countryCode: 'NL', lat: 51.9244, lon: 4.4777 },

  // Central & Northern Europe
  { name: 'Berlino, Germania', countryCode: 'DE', lat: 52.52, lon: 13.405 },
  { name: 'Francoforte, Germania', countryCode: 'DE', lat: 50.1109, lon: 8.6821 },
  { name: 'Monaco, Germania', countryCode: 'DE', lat: 48.1351, lon: 11.582 },
  { name: 'Amburgo, Germania', countryCode: 'DE', lat: 53.5511, lon: 9.9937 },
  { name: 'Zurigo, Svizzera', countryCode: 'CH', lat: 47.3769, lon: 8.5417 },
  { name: 'Vienna, Austria', countryCode: 'AT', lat: 48.2082, lon: 16.3738 },
  { name: 'Praga, Repubblica Ceca', countryCode: 'CZ', lat: 50.0755, lon: 14.4378 },
  { name: 'Copenaghen, Danimarca', countryCode: 'DK', lat: 55.6761, lon: 12.5683 },
  { name: 'Stoccolma, Svezia', countryCode: 'SE', lat: 59.3293, lon: 18.0686 },
  { name: 'Oslo, Norvegia', countryCode: 'NO', lat: 59.9139, lon: 10.7522 },
  { name: 'Helsinki, Finlandia', countryCode: 'FI', lat: 60.1699, lon: 24.9384 },

  // Italy
  { name: 'Milano, Italia', countryCode: 'IT', lat: 45.4642, lon: 9.19 },
  { name: 'Roma, Italia', countryCode: 'IT', lat: 41.9028, lon: 12.4964 },
  { name: 'Torino, Italia', countryCode: 'IT', lat: 45.0703, lon: 7.6869 },
  { name: 'Bologna, Italia', countryCode: 'IT', lat: 44.4949, lon: 11.3426 },
  { name: 'Napoli, Italia', countryCode: 'IT', lat: 40.8518, lon: 14.2681 },

  // Eastern & Southern Europe
  { name: 'Varsavia, Polonia', countryCode: 'PL', lat: 52.2297, lon: 21.0122 },
  { name: 'Cracovia, Polonia', countryCode: 'PL', lat: 50.0647, lon: 19.945 },
  { name: 'Budapest, Ungheria', countryCode: 'HU', lat: 47.4979, lon: 19.0402 },
  { name: 'Bucarest, Romania', countryCode: 'RO', lat: 44.4268, lon: 26.1025 },
  { name: 'Cluj-Napoca, Romania', countryCode: 'RO', lat: 46.7712, lon: 23.6236 },
  { name: 'Belgrado, Serbia', countryCode: 'RS', lat: 44.7866, lon: 20.4489 },
  { name: 'Atene, Grecia', countryCode: 'GR', lat: 37.9838, lon: 23.7275 },
  { name: 'Tbilisi, Georgia', countryCode: 'GE', lat: 41.7151, lon: 44.8271 },
]

export function MapEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(false)
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const mapContainerRef = useState<HTMLDivElement | null>(null)
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null)

  const places = useMemo(() => {
    return filterItems(items, state.types).filter(
      (item) => item.mapEligible && item.primaryLocation.kind === 'geographic' && item.primaryLocation.latitude !== undefined && item.primaryLocation.longitude !== undefined,
    )
  }, [items, state.types])

  // Merge active items with comprehensive European city baseline
  const allCities = useMemo(() => {
    const map = new Map<string, { name: string; countryCode: string; lat: number; lon: number; items: DiscoveryItem[] }>()

    EUROPEAN_CITIES_BASE.forEach((c) => {
      map.set(c.name.toLowerCase(), {
        name: c.name,
        countryCode: c.countryCode,
        lat: c.lat,
        lon: c.lon,
        items: [],
      })
    })

    places.forEach((item) => {
      if (item.primaryLocation.kind === 'geographic') {
        const cityName = item.primaryLocation.name
        const key = cityName.toLowerCase()

        let entry = map.get(key)
        if (!entry) {
          const partialKey = Array.from(map.keys()).find((k) => k.includes(key.split(',')[0].trim()) || key.includes(k.split(',')[0].trim()))
          if (partialKey) entry = map.get(partialKey)
        }

        if (entry) {
          entry.items.push(item)
        } else {
          map.set(key, {
            name: cityName,
            countryCode: item.primaryLocation.countryCode,
            lat: item.primaryLocation.latitude ?? 45,
            lon: item.primaryLocation.longitude ?? 9,
            items: [item],
          })
        }
      }
    })

    return Array.from(map.values())
  }, [places])

  const activeCount = useMemo(() => allCities.filter((c) => c.items.length > 0).length, [allCities])

  const selectedGroup = useMemo(() => {
    if (!activeCity) return null
    return allCities.find((g) => g.name === activeCity) ?? null
  }, [activeCity, allCities])

  // Initialize Leaflet real geographic map on mount
  useEffect(() => {
    if (!mapElement || typeof window === 'undefined') return

    let isMounted = true
    let leafletMap: any = null

    import('leaflet').then((L) => {
      if (!isMounted || !mapElement) return

      // Clean up previous instance if any
      // @ts-expect-error internal check
      if (mapElement._leaflet_id) {
        // @ts-expect-error internal cleanup
        mapElement._leaflet_id = null
      }

      // Center on Central Europe (Milan/Zurich/Munich latitude) with maxBounds on Europe
      leafletMap = L.map(mapElement, {
        center: [48.5, 12.0],
        zoom: 4.5,
        minZoom: 3.5,
        maxZoom: 9,
        zoomControl: true,
        maxBounds: [
          [32.0, -25.0], // South-West Europe/Canaries
          [72.0, 45.0],  // North-East Scandinavia/Ural
        ],
        maxBoundsViscosity: 0.9,
      })

      // Real Geographic World Map with Country Borders & Cities (Light / Cream Carto Positron Tiles)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(leafletMap)

      // Add City Markers directly onto the map
      allCities.forEach((city) => {
        const count = city.items.length
        const hasItems = count > 0
        const cityName = city.name.split(',')[0].trim()

        const radius = !hasItems ? 4 : count === 1 ? 8 : count === 2 ? 11 : Math.min(18, 12 + count * 2)

        const markerHtml = `
          <div class="leaflet-custom-city-pin ${hasItems ? 'is-active' : 'is-empty'}" data-city="${city.name}">
            <div class="city-circle" style="width:${radius * 2}px;height:${radius * 2}px;">
              ${count >= 2 ? `<span class="city-num">${count}</span>` : ''}
            </div>
            <span class="city-text">${cityName}</span>
          </div>
        `

        const customIcon = L.divIcon({
          className: 'leaflet-city-marker-wrap',
          html: markerHtml,
          iconSize: [80, 40],
          iconAnchor: [40, 20],
        })

        const marker = L.marker([city.lat, city.lon], { icon: customIcon }).addTo(leafletMap)

        if (hasItems) {
          marker.on('click', () => {
            setActiveCity(city.name)
          })
        }
      })
    })

    return () => {
      isMounted = false
      if (leafletMap) {
        leafletMap.remove()
      }
    }
  }, [mapElement, allCities])

  return (
    <div className="environment-layout">
      <aside className="environment-rail">
        <span className="rail-label">Continenti</span>
        <button className="rail-choice active" title="Navigabile">
          🇪🇺 Europa
        </button>
        <button className="rail-choice continent-disabled" disabled title="In arrivo con le prossime release">
          🌎 Americhe <span className="coming-badge">Soon</span>
        </button>
        <button className="rail-choice continent-disabled" disabled title="In arrivo con le prossime release">
          🌏 Asia & Africa <span className="coming-badge">Soon</span>
        </button>
        <button className="rail-choice continent-disabled" disabled title="In arrivo con le prossime release">
          🌊 Oceania <span className="coming-badge">Soon</span>
        </button>
      </aside>

      <div className="environment-content">
        <div className="environment-toolbar">
          <span className="shell-note">Mappa geografica reale dell'Europa · Clicca su un cerchio verde per aprire i contenuti della città</span>
          <div className="map-meta-chips">
            <span className="chip-pill">{activeCount} città con scene attive</span>
            <span className="chip-pill">{places.length} articoli mappati</span>
          </div>
        </div>

        {/* Real Leaflet Map Container Shell */}
        <section className="interactive-europe-map-shell leaflet-shell-wrap" aria-label="Mappa Europea dei Club e delle Scene">
          <div ref={setMapElement} className="leaflet-map-canvas" id="europe-leaflet-map" style={{ width: '100%', height: '560px' }} />

          {/* FLOATING OVERLAY DIALOG FOR SELECTED CITY (IN SOVRAPPRESSIONE) */}
          {selectedGroup && (
            <div className="map-floating-overlay" role="dialog" aria-modal="false" aria-label={`Dettagli per ${selectedGroup.name}`}>
              <div className="overlay-header">
                <div className="overlay-title-wrap">
                  <span className="eyebrow">Scena Locale Selezionata</span>
                  <h3 className="overlay-city-title">📍 {selectedGroup.name}</h3>
                </div>
                <button
                  type="button"
                  className="overlay-close-btn"
                  onClick={() => setActiveCity(null)}
                  aria-label="Chiudi sovrimpressione"
                >
                  ✕
                </button>
              </div>

              <div className="overlay-content-list">
                {selectedGroup.items.map((item) => (
                  <div key={item.id} className="overlay-article-row">
                    <a href={`/item/${item.slug}`} className="overlay-thumb-link">
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt="" className="overlay-thumb-img" />
                      ) : (
                        <div className="overlay-thumb-fallback">♪</div>
                      )}
                    </a>
                    <div className="overlay-article-info">
                      <span className="overlay-kicker">{item.kicker ?? categoryLabels[item.type]}</span>
                      <h4 className="overlay-title">
                        <a href={`/item/${item.slug}`}>{item.title}</a>
                      </h4>
                      <p className="overlay-summary">{item.summary}</p>
                      <a href={`/item/${item.slug}`} className="overlay-read-link">
                        Leggi scheda →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default DiscoveryEnvironment
