import { useMemo, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { categoryLabels, DiscoveryType } from '../domain/discovery'
import type { DiscoveryItem } from '../domain/discovery'
import { serializeDiscoveryQuery } from '../lib/discovery-query'
import type { DiscoveryQueryState, DiscoveryView } from '../lib/discovery-query'

type Props = {
  items: DiscoveryItem[]
  initialState: DiscoveryQueryState
}

const viewLabels: Record<DiscoveryView, string> = {
  discovery: 'Discovery',
  timeline: 'Timeline',
  map: 'Map',
}

export default function DiscoveryExplorer({ items, initialState }: Props) {
  const [state, setState] = useState(initialState)
  const [searchDraft, setSearchDraft] = useState(initialState.query)

  function update(next: DiscoveryQueryState) {
    setState(next)
    window.history.replaceState({}, '', `/${serializeDiscoveryQuery(next)}`)
  }

  function submitSearch(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    update({ ...state, query: searchDraft.trim() })
  }

  function toggleType(type: DiscoveryType) {
    const selected = state.types.includes(type)
      ? state.types.filter((value) => value !== type)
      : [...state.types, type]
    update({ ...state, types: selected })
  }

  const filtered = useMemo(() => {
    const query = state.query.toLocaleLowerCase('it')
    return items
      .filter((item) => !state.types.length || state.types.includes(item.type))
      .filter((item) => !query || [item.title, item.summary, item.primaryLocation.name, ...item.tags].join(' ').toLocaleLowerCase('it').includes(query))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  }, [items, state])

  return <>
    <form className="catalog-search" role="search" onSubmit={submitSearch}>
      <label htmlFor="catalog-query">Ricerca</label>
      <div><input id="catalog-query" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Cerca label, artisti, set, storie…" /><button type="submit">Cerca</button></div>
    </form>

    <div className="catalog-controls">
      <div className="view-switcher" aria-label="Vista catalogo">
        {(Object.keys(viewLabels) as DiscoveryView[]).map((view) => <button key={view} className={state.view === view ? 'active' : ''} aria-pressed={state.view === view} onClick={() => update({ ...state, view })}>{viewLabels[view]}</button>)}
      </div>
      <div className="category-filters" aria-label="Filtri categorie">
        {(Object.values(DiscoveryType)).map((type) => <button key={type} className={state.types.includes(type) ? 'active' : ''} aria-pressed={state.types.includes(type)} onClick={() => toggleType(type)}>{categoryLabels[type]}</button>)}
      </div>
    </div>

    <div className="result-summary"><strong>{filtered.length}</strong> contenuti · più recenti prima</div>
    {state.view === 'discovery' && <DiscoveryFeed items={filtered} />}
    {state.view === 'timeline' && <TimelineShell items={filtered} />}
    {state.view === 'map' && <MapShell items={filtered.filter((item) => item.mapEligible)} />}
  </>
}

function DiscoveryFeed({ items }: { items: DiscoveryItem[] }) {
  return <div className="discovery-grid">{items.map((item) => <DiscoveryCard key={item.id} item={item} />)}</div>
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const original = item.sources.find((source) => source.kind === 'original') ?? item.sources[0]
  return <article className="discovery-card">
    <div className="card-meta"><span>{categoryLabels[item.type]}</span><time dateTime={item.publishedAt}>{new Intl.DateTimeFormat('it', { dateStyle: 'medium' }).format(new Date(item.publishedAt))}</time></div>
    <h2><a href={`/item/${item.slug}`}>{item.title}</a></h2>
    <p>{item.summary}</p>
    <div className="card-details"><span>{item.primaryLocation.name}</span><span>{item.tags.join(' · ')}</span></div>
    {!!item.relations.length && <div className="relations">Collegato a {item.relations.map((relation) => relation.label).join(', ')}</div>}
    <a className="source-link" href={original.url} target="_blank" rel="noreferrer">{original.label} ↗</a>
  </article>
}

function TimelineShell({ items }: { items: DiscoveryItem[] }) {
  return <section className="timeline-shell" aria-label="Timeline development shell">
    <p className="shell-note">Shell Timeline · stesso dataset, più recente in alto.</p>
    {items.map((item) => <div className="timeline-row" key={item.id}><time>{new Intl.DateTimeFormat('it', { dateStyle: 'medium' }).format(new Date(item.publishedAt))}</time><a href={`/item/${item.slug}`}>{item.title}</a><span>{categoryLabels[item.type]}</span></div>)}
  </section>
}

function MapShell({ items }: { items: DiscoveryItem[] }) {
  return <section className="map-shell" aria-label="Map development shell">
    <div className="continent-options"><button className="active">Europa</button><button disabled>Nord America · in arrivo</button><button disabled>Sud America · in arrivo</button><button disabled>Asia · in arrivo</button></div>
    <div className="map-placeholder"><strong>Viewport Europa</strong><span>Mappa reale fuori scope.</span></div>
    <ul>{items.map((item) => <li key={item.id}>{item.primaryLocation.name} · {item.title}</li>)}</ul>
  </section>
}
