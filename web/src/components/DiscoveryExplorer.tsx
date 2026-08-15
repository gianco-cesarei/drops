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
  return <div className="environment-layout"><aside className="environment-rail"><span className="rail-label">Categorie</span><Categories types={state.types} onChange={(types) => state.update(types)} label="Categorie Grid" /></aside><div className="environment-content"><div className="environment-toolbar"><form className="catalog-search" role="search" onSubmit={submit}><label className="sr-only" htmlFor="catalog-query">Ricerca</label><div className="search-field"><SearchIcon className="search-icon" /><input id="catalog-query" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Cerca label, artisti, set, storie…" /></div><button>Cerca</button></form><p className="result-summary"><strong>{visible.length}</strong> contenuti · development fixture</p></div><div className="discovery-grid">{visible.map((item) => <DiscoveryCard key={item.id} item={item} />)}</div></div></div>
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const source = item.sources.find((entry) => entry.kind === 'original') ?? item.sources[0]
  return <article className="discovery-card"><div className="card-meta"><span className="content-badge">{categoryLabels[item.type]}</span><time>{new Intl.DateTimeFormat('it', { dateStyle: 'medium' }).format(new Date(item.publishedAt))}</time></div><h2><a href={`/item/${item.slug}`}>{item.title}</a></h2><p>{item.summary}</p><div className="card-details"><span>{item.primaryLocation.name}</span><span>{item.tags.slice(0, 2).join(' · ')}</span></div><a className="source-link" href={source.url}>{source.label} ↗</a></article>
}

const densityLevels = ['year', 'month', 'day'] as const
type Density = typeof densityLevels[number]

export function TimelineEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(false)
  const [density, setDensity] = useState<Density>('month')
  const visible = useMemo(() => filterItems(items, state.types), [items, state.types])
  const index = densityLevels.indexOf(density)
  const years = [...new Set(visible.map((item) => new Date(item.publishedAt).getFullYear()))].sort((a, b) => b - a)
  return <div className="environment-layout"><aside className="environment-rail"><span className="rail-label">Anni</span><div className="rail-list">{years.map((year) => <a key={year} href={`#year-${year}`}>{year}</a>)}</div></aside><div className="environment-content"><div className="environment-toolbar"><span className="shell-note">Development fixture · ordine cronologico</span><div className="density-control" aria-label="Densità temporale"><button disabled={index === 0} onClick={() => setDensity(densityLevels[index - 1])} aria-label="Riduci densità">−</button><span>{density === 'year' ? 'Anno' : density === 'month' ? 'Mese' : 'Giorno'}</span><button disabled={index === 2} onClick={() => setDensity(densityLevels[index + 1])} aria-label="Aumenta densità">+</button></div></div><section className={`timeline-shell discovery-grid density-${density}`} aria-label="Timeline development shell">{visible.map((item) => <div id={`year-${new Date(item.publishedAt).getFullYear()}`} key={item.id}><DiscoveryCard item={item} /></div>)}</section></div></div>
}

export function MapEnvironment({ items }: { items: DiscoveryItem[] }) {
  const state = useArchiveState(false)
  const [zoom, setZoom] = useState(4)
  const [selection, setSelection] = useState<string | null>(null)
  const places = useMemo(() => filterItems(items, state.types).filter((item) => item.mapEligible && item.primaryLocation.kind === 'geographic' && item.primaryLocation.latitude !== undefined && item.primaryLocation.longitude !== undefined), [items, state.types])
  const countries = [...new Set(places.map((item) => item.primaryLocation.kind === 'geographic' ? item.primaryLocation.countryCode : ''))].filter(Boolean)
  return <div className="environment-layout"><aside className="environment-rail"><span className="rail-label">Continenti</span><button className="rail-choice active">Europa</button><button className="rail-choice" disabled>Americhe · in arrivo</button><button className="rail-choice" disabled>Asia · in arrivo</button><div className="rail-sublist"><span className="rail-label">Paesi</span>{countries.map((country) => <a key={country} href={`#country-${country}`}>{country}</a>)}</div></aside><div className="environment-content"><div className="environment-toolbar"><span className="shell-note">Development fixture · Europa aperta</span><div className="map-controls" aria-label="Controlli mappa"><button onClick={() => setZoom(Math.max(2, zoom - 1))} aria-label="Zoom indietro"><MinusIcon /></button><span>zoom {zoom}</span><button onClick={() => setZoom(Math.min(12, zoom + 1))} aria-label="Zoom avanti"><PlusIcon /></button><button aria-label="Pan mappa" onClick={() => setSelection(null)}><PanIcon /></button></div></div><section className="map-shell" aria-label="Map development shell"><div className="map-placeholder"><strong>Viewport iniziale Europa</strong><span>Shell pan/zoom · marker {zoom < 7 ? 'raggruppati' : 'singoli'}</span><div className="map-markers">{places.map((item) => <button id={`country-${item.primaryLocation.kind === 'geographic' ? item.primaryLocation.countryCode : ''}`} key={item.id} onClick={() => setSelection(item.primaryLocation.name)}>{item.primaryLocation.name}</button>)}</div></div>{selection && <aside className="map-selection"><h2>{selection}</h2>{places.filter((item) => item.primaryLocation.name === selection).map((item) => <a key={item.id} href={`/item/${item.slug}`}>{item.title}</a>)}</aside>}</section><div className="discovery-grid map-content-grid">{places.map((item) => <DiscoveryCard key={item.id} item={item} />)}</div></div></div>
}

export default DiscoveryEnvironment
