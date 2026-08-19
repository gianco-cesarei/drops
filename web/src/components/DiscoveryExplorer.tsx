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

function Categories({ types, onChange, label }: { types: DiscoveryType[]; onChange: (types: DiscoveryType[]) => void; label: string }) {
  const toggle = (type: DiscoveryType) => onChange(types.includes(type) ? types.filter((entry) => entry !== type) : [...types, type])
  return <div className="category-filters" role="group" aria-label={label}>
    <button className={!types.length ? 'active' : ''} aria-pressed={!types.length} onClick={() => onChange([])}>All</button>
    {Object.values(DiscoveryType).map((type) => <button key={type} className={types.includes(type) ? 'active' : ''} aria-pressed={types.includes(type)} onClick={() => toggle(type)}>{categoryLabels[type]}</button>)}
  </div>
}

const filterItems = (items: DiscoveryItem[], types: DiscoveryType[], query = '') => sorted(items).filter((item) => !types.length || types.includes(item.type)).filter((item) => !query || [item.title, item.summary, item.primaryLocation.name, ...item.tags].join(' ').toLowerCase().includes(query.toLowerCase()))

export function DiscoveryEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(true)
  const [draft, setDraft] = useState('')
  useEffect(() => setDraft(state.query), [state.query])
  const visible = useMemo(() => filterItems(items, state.types, state.query), [items, state.query, state.types])
  const submit = (event: SyntheticEvent) => { event.preventDefault(); state.update(state.types, draft.trim()) }
  return (
    <div className="environment-layout">
      <aside className="environment-rail">
        <span className="rail-label">Categorie</span>
        <Categories types={state.types} onChange={(types) => state.update(types)} label="Categorie Grid" />
      </aside>
      <div className="environment-content">
        <div className="environment-toolbar">
          <form className="catalog-search" role="search" onSubmit={submit}>
            <label className="sr-only" htmlFor="catalog-query">Ricerca</label>
            <div className="search-field">
              <SearchIcon className="search-icon" />
              <input id="catalog-query" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Cerca label, artisti, set, storie, guide…" />
            </div>
            <button>Cerca</button>
          </form>
          <p className="result-summary"><strong>{visible.length}</strong> contenuti pubblicati</p>
        </div>
        <div className="discovery-grid">
          {visible.map((item) => <DiscoveryCard key={item.id} item={item} />)}
        </div>
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
        <Categories types={state.types} onChange={(types) => state.update(types)} label="Categorie Timeline" />
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

export function MapEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(false)
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const places = useMemo(() => {
    return filterItems(items, state.types).filter(
      (item) => item.mapEligible && item.primaryLocation.kind === 'geographic' && item.primaryLocation.latitude !== undefined && item.primaryLocation.longitude !== undefined,
    )
  }, [items, state.types])

  // Group items by city/location name
  const cityGroups = useMemo(() => {
    const map = new Map<string, { name: string; countryCode: string; lat: number; lon: number; items: DiscoveryItem[] }>()
    places.forEach((item) => {
      if (item.primaryLocation.kind === 'geographic') {
        const key = item.primaryLocation.name
        if (!map.has(key)) {
          map.set(key, {
            name: item.primaryLocation.name,
            countryCode: item.primaryLocation.countryCode,
            lat: item.primaryLocation.latitude ?? 45,
            lon: item.primaryLocation.longitude ?? 9,
            items: [],
          })
        }
        map.get(key)!.items.push(item)
      }
    })
    return Array.from(map.values())
  }, [places])

  const selectedGroup = useMemo(() => {
    if (!activeCity) return null
    return cityGroups.find((g) => g.name === activeCity) ?? null
  }, [activeCity, cityGroups])

  // Mouse pan / drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button/node
    if ((e.target as HTMLElement).closest('.map-city-node')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setZoom((prev) => Math.min(3.5, Math.max(0.8, Number((prev * zoomFactor).toFixed(2)))))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setActiveCity(null)
  }

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
          <span className="shell-note">Mappa geografica europea · Trascina e usa lo zoom per esplorare le scene musicali</span>
          <div className="map-meta-chips">
            <div className="map-zoom-controls">
              <button type="button" className="map-zoom-btn" onClick={() => setZoom((z) => Math.min(3.5, z + 0.3))} title="Ingrandisci">+</button>
              <span className="map-zoom-label">{Math.round(zoom * 100)}%</span>
              <button type="button" className="map-zoom-btn" onClick={() => setZoom((z) => Math.max(0.8, z - 0.3))} title="Riduci">−</button>
              <button type="button" className="map-zoom-btn map-reset-btn" onClick={resetView} title="Ripristina vista">↺ Reset</button>
            </div>
            <span className="chip-pill">{cityGroups.length} città connesse</span>
            <span className="chip-pill">{places.length} articoli</span>
          </div>
        </div>

        {/* Interactive Europe Map Viewport Shell */}
        <section
          className={`interactive-europe-map-shell ${isDragging ? 'is-grabbing' : ''}`}
          aria-label="Mappa Europea dei Club e delle Scene"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg className="europe-vector-map" viewBox="0 0 900 580" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="grid-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(22, 101, 52, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Clean Cream Background */}
            <rect width="900" height="580" fill="#f8f9f5" rx="16" />
            <rect width="900" height="580" fill="url(#grid-pattern)" rx="16" />

            {/* Zoomable / Pannable Landmass & City Layer */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '450px 290px', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}>
              {/* Stylized European Landmass with Clean Outlines */}
              <g className="map-landmass-layer" fill="#eaeee5" stroke="#94a395" strokeWidth="1.4" strokeLinejoin="round">
                {/* Iberian Peninsula (Portugal & Spain) */}
                <path d="M 120 380 L 150 360 L 220 370 L 250 420 L 240 480 L 190 500 L 140 480 L 115 440 Z" />
                {/* France & Benelux */}
                <path d="M 230 365 L 290 310 L 350 300 L 370 340 L 340 410 L 260 415 L 230 370 Z" />
                {/* British Isles (UK & Ireland) */}
                <path d="M 230 240 L 260 210 L 290 220 L 270 290 L 240 280 Z" />
                <path d="M 190 230 L 220 230 L 210 270 L 180 260 Z" />
                {/* Central Europe & Germany */}
                <path d="M 360 290 L 440 270 L 470 310 L 430 380 L 360 370 Z" />
                {/* Italy */}
                <path d="M 370 390 L 430 390 L 470 450 L 510 500 L 490 520 L 450 470 L 410 440 Z" />
                {/* Scandinavia */}
                <path d="M 380 180 L 430 110 L 480 90 L 510 160 L 440 250 Z" />
                {/* Eastern Europe & Balkans */}
                <path d="M 475 290 L 640 260 L 700 350 L 630 460 L 530 450 L 475 370 Z" />
              </g>

              {/* City Hotspots & Geolocation Markers */}
              {cityGroups.map((g) => {
                const { x, y } = projectCoords(g.lat, g.lon, 900, 580)
                const isSelected = activeCity === g.name

                return (
                  <g
                    key={g.name}
                    className={`map-city-node ${isSelected ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveCity(isSelected ? null : g.name)
                    }}
                    cursor="pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`Visualizza contenuti per ${g.name}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') setActiveCity(isSelected ? null : g.name) }}
                  >
                    {/* Outer Pulsing Ping */}
                    <circle cx={x} cy={y} r={isSelected ? 22 : 14} className="map-marker-ping" />
                    {/* Middle Glow */}
                    <circle cx={x} cy={y} r={isSelected ? 11 : 7} className="map-marker-core" />
                    {/* Pin Dot */}
                    <circle cx={x} cy={y} r={isSelected ? 5 : 3.5} className="map-marker-dot" />

                    {/* City Label Badge */}
                    <g transform={`translate(${x}, ${y - 18})`}>
                      <rect
                        x={- (g.name.split(',')[0].length * 4 + 18)}
                        y={-14}
                        width={(g.name.split(',')[0].length * 8 + 36)}
                        height={20}
                        rx={10}
                        className="map-city-pill"
                      />
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        className="map-city-text"
                      >
                        📍 {g.name.split(',')[0]} ({g.items.length})
                      </text>
                    </g>
                  </g>
                )
              })}
            </g>
          </svg>

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
