import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { api, ApiError } from './api'
import type { Job, SpotifyPlaylist, SpotifyTrack, User } from './api'
import { postLoginRoute } from './lib/routes'
import { contentFields, contentStages, radarDevelopmentFixtures, radarLockedFixtures } from './data/private.fixture'
import type { RadarFixture } from './data/private.fixture'
import BrainGraph from './components/BrainGraph'
import { linkRadarToBrain, resetPrototypeState, setRadarStatus, usePrototypeState } from './data/brainStore'
import type { RadarStatus } from './data/brainStore'

export type PrivateSection = 'login' | 'download' | 'spotify' | 'radar' | 'brain' | 'content' | 'editorial-suggestions' | 'settings'

const terminalStatuses = new Set(['completed', 'complete', 'ready', 'failed', 'error', 'cancelled'])
const readyStatuses = new Set(['completed', 'complete', 'ready'])
const failedStatuses = new Set(['failed', 'error', 'cancelled'])
const queuedStatuses = new Set(['queued', 'pending'])
const statusLabels: Record<string, string> = {
  queued: 'In coda', pending: 'In coda', downloading: 'Download in corso', processing: 'Elaborazione…',
}
const browserNavigate = (to: string) => window.location.assign(to)

export default function App({ section = 'login', navigate = browserNavigate }: { section?: PrivateSection; navigate?: (to: string) => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [logoutRedirecting, setLogoutRedirecting] = useState(false)

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) setUser(null)
    setError(cause instanceof Error ? cause.message : 'Errore imprevisto.')
  }, [])

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!checking && !user && section !== 'login' && !logoutRedirecting) {
      const next = encodeURIComponent(`/app/${section}`)
      navigate(`/app/login?next=${next}`)
    }
  }, [checking, logoutRedirecting, navigate, section, user])

  useEffect(() => {
    if (!checking && user && section === 'login') navigate(postLoginRoute(window.location.search))
  }, [checking, navigate, section, user])

  function completeLogin(loggedUser: User) {
    setUser(loggedUser)
  }

  function beginLogout() {
    setLogoutRedirecting(true)
    setUser(null)
  }

  function finishLogout() { navigate('/') }

  if (checking) return <Loading />
  if (logoutRedirecting) return <Loading />
  if (!user) return <Login onLogin={completeLogin} error={error} setError={setError} />
  if (section === 'download') return <PrivateFrame section={section} user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Download user={user} onError={handleError} error={error} setError={setError} /></PrivateFrame>
  if (section === 'spotify') return <PrivateFrame section={section} user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><SpotifyLibrary onError={handleError} error={error} /></PrivateFrame>
  if (section === 'radar') return <PrivateFrame section={section} user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Radar /></PrivateFrame>
  if (section === 'brain') return <PrivateFrame section={section} user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Brain /></PrivateFrame>
  if (section === 'content') return <PrivateFrame section={section} user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Content /></PrivateFrame>
  return <PrivateFrame section={section} user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><PrivatePlaceholder section={section} /></PrivateFrame>
}

function Brand() {
  return <div className="brand"><div className="logo">Drops<span>.</span></div></div>
}

function Loading() {
  return <main className="center"><div className="login-card"><Brand /><p className="muted" role="status">Controllo sessione…</p></div></main>
}

function Login({ onLogin, error, setError }: { onLogin: (user: User) => void; error: string; setError: (value: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setBusy(true); setError('')
    try { onLogin(await api.login(username, password)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Accesso non riuscito.') }
    finally { submitting.current = false; setBusy(false) }
  }

  return <main className="center"><section className="login-card">
    <Brand />
    <div className="login-heading"><h1>Accedi</h1><p className="muted">Entra nella tua area privata.</p></div>
    <form onSubmit={submit} className="form-stack">
      <label>Username<input type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <div className="alert" role="alert">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Accesso…' : 'Accedi'}</button>
    </form>
  </section></main>
}

function PrivateFrame({ section, user, onLogoutStart, onLogoutEnd, children }: { section: PrivateSection; user: User; onLogoutStart: () => void; onLogoutEnd: () => void; children: ReactNode }) {
  async function logout() {
    onLogoutStart()
    try { await api.logout() } catch { /* Local session remains invalidated. */ } finally { onLogoutEnd() }
  }
  return <div className={`private-layout private-layout-${section}`}>
    <div className="private-header-bar"><header className="private-header"><a href="/" className="logo">Drops<span>.</span></a><nav aria-label="Area privata"><a href="/">Discovery</a><a href="/app/download">Download</a><a href="/app/spotify">Spotify</a><a href="/app/radar">Radar</a><a href="/app/brain">Brain</a><a href="/app/content">Content</a></nav><div className="account"><span>{user.name ?? user.username ?? user.email ?? 'Account'}</span><button className="secondary" onClick={logout}>Esci</button></div></header></div>
    {children}
  </div>
}

function PrivatePlaceholder({ section }: { section: PrivateSection }) {
  const labels: Record<PrivateSection, string> = {
    login: 'Login', download: 'Download', spotify: 'Spotify', radar: 'Radar', brain: 'Brain', content: 'Content',
    'editorial-suggestions': 'Editorial suggestions', settings: 'Settings',
  }
  return <main className="private-placeholder"><span className="development-badge">Private development shell</span><h1 className="sr-only">{labels[section]}</h1><p>Strumento non implementato in questa milestone.</p></main>
}

function SpotifyLibrary({ onError, error }: { onError: (error: unknown) => void; error: string }) {
  const [status, setStatus] = useState<{ connected: boolean; display_name: string | null } | null>(null)
  const [mode, setMode] = useState<'liked' | 'playlists'>('liked')
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [total, setTotal] = useState(0)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [playlistId, setPlaylistId] = useState('')
  const [busy, setBusy] = useState(false)
  const [modeView, setModeView] = useState<'recent' | 'labels' | 'bpm'>('recent')
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bpmState, setBpmState] = useState<Record<string, 'queued' | 'running' | 'error'>>({})
  const [pendingLabels, setPendingLabels] = useState<Set<string>>(new Set())
  const discogsRequested = useRef(new Set<string>())

  useEffect(() => { api.spotifyStatus().then(setStatus).catch(onError) }, [onError])
  useEffect(() => {
    if (!status?.connected || mode !== 'liked') return
    setBusy(true)
    api.spotifyLiked(100, 0).then((result) => { setTracks(result.tracks); setTotal(result.total) }).catch(onError).finally(() => setBusy(false))
  }, [mode, onError, status?.connected])
  useEffect(() => {
    // Preferiti oltre i 100 iniziali: continua a paginare in automatico finché
    // non sono caricate tutte le tracce, senza fermarsi a una singola pagina.
    if (mode !== 'liked' || busy || tracks.length === 0 || tracks.length >= total) return
    let cancelled = false
    setBusy(true)
    api.spotifyLiked(100, tracks.length)
      .then((result) => { if (!cancelled) { setTracks((current) => [...current, ...result.tracks]); setTotal(result.total) } })
      .catch((cause) => { if (!cancelled) onError(cause) })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [mode, tracks.length, total, busy, onError])
  useEffect(() => {
    if (!status?.connected || mode !== 'playlists') return
    api.spotifyPlaylists().then((result) => { setPlaylists(result.playlists); setPlaylistId((current) => current || result.playlists[0]?.id || '') }).catch(onError)
  }, [mode, onError, status?.connected])
  useEffect(() => {
    if (mode !== 'playlists' || !playlistId) return
    setBusy(true)
    api.spotifyPlaylistTracks(playlistId).then((result) => { setTracks(result.tracks); setTotal(result.total) }).catch(onError).finally(() => setBusy(false))
  }, [mode, onError, playlistId])
  useEffect(() => {
    if (!status?.connected) return
    tracks.filter((track) => !track.label && !discogsRequested.current.has(track.id)).forEach((track) => {
      discogsRequested.current.add(track.id)
      setPendingLabels((current) => new Set(current).add(track.id))
      api.discogsEnrich(track).then((metadata) => {
        if (!metadata?.label) return
        setTracks((current) => current.map((item) => item.id === track.id ? { ...item, label: metadata.label, year: metadata.year, country: metadata.country, styles: metadata.styles, catalog_no: metadata.catalog_no, discogs_url: metadata.discogs_url } : item))
      }).catch(() => { /* Discogs optional; Spotify rows stay visible. */ })
        .finally(() => setPendingLabels((current) => { const next = new Set(current); next.delete(track.id); return next }))
    })
  }, [status?.connected, tracks])

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  async function calculateBpm() {
    const chosen = tracks.filter((track) => selected.has(track.id))
    await Promise.all(chosen.map(async (track) => {
      setBpmState((current) => ({ ...current, [track.id]: 'queued' }))
      try {
        const job = await api.bpmCompute(track, soundcloudUrl(track))
        if (job.bpm != null) { const bpm = job.bpm; setTracks((current) => current.map((item) => item.id === track.id ? { ...item, bpm, in_catalog: true } : item)); return }
        let result = await api.bpmJob(job.job_id)
        while (result.status === 'queued' || result.status === 'running') {
          setBpmState((current) => ({ ...current, [track.id]: result.status as 'queued' | 'running' }))
          await new Promise((resolve) => window.setTimeout(resolve, 1200))
          result = await api.bpmJob(job.job_id)
        }
        if (result.status === 'ready' && result.bpm != null) setTracks((current) => current.map((item) => item.id === track.id ? { ...item, bpm: result.bpm!, in_catalog: true } : item))
        else setBpmState((current) => ({ ...current, [track.id]: 'error' }))
      } catch { setBpmState((current) => ({ ...current, [track.id]: 'error' })) }
    }))
  }

  if (!status) return <main className="spotify-workspace">{error ? <div className="alert" role="alert">{error}</div> : <p className="spotify-state" role="status">Controllo Spotify…</p>}</main>
  if (!status.connected) return <main className="spotify-workspace spotify-connect"><p>Collega account Premium per leggere preferiti e playlist.</p><a className="primary spotify-connect-button" href={api.spotifyConnectUrl()}>Connetti Spotify</a></main>
  const visibleTracks = selectedLabel === null ? tracks : tracks.filter((track) => (track.label?.trim() || 'Senza label') === selectedLabel)
  return <main className="spotify-workspace"><div className="spotify-toolbar"><div className="spotify-account"><span className="status-dot" /><span>Spotify collegato</span><strong>{status.display_name}</strong></div><div className="spotify-toggle" role="group" aria-label="Libreria Spotify"><button className={mode === 'liked' ? 'active' : ''} onClick={() => { setMode('liked'); setSelectedLabel(null) }}>Preferiti</button><button className={mode === 'playlists' ? 'active' : ''} onClick={() => { setMode('playlists'); setSelectedLabel(null) }}>Playlist</button></div><div className="spotify-sort" role="group" aria-label="Vista Spotify"><button className={modeView === 'recent' ? 'active' : ''} onClick={() => { setModeView('recent'); setSelectedLabel(null) }}>Recenti</button><button className={modeView === 'labels' ? 'active' : ''} onClick={() => { setModeView('labels'); setSelectedLabel(null) }}>Label</button><button className={modeView === 'bpm' ? 'active' : ''} onClick={() => { setModeView('bpm'); setSelectedLabel(null) }}>BPM</button></div>{mode === 'playlists' && <label className="playlist-picker">Playlist<select aria-label="Seleziona playlist" value={playlistId} onChange={(event) => setPlaylistId(event.target.value)}>{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name} ({playlist.tracks_total})</option>)}</select></label>}</div>{error && <div className="alert" role="alert">{error}</div>}{busy && tracks.length === 0 ? <p className="spotify-state" role="status">Caricamento tracce…</p> : modeView === 'labels' && selectedLabel === null ? <LabelBrowser tracks={tracks} pendingCount={pendingLabels.size} onSelect={setSelectedLabel} /> : modeView === 'labels' ? <div><button className="spotify-back" onClick={() => setSelectedLabel(null)}>← Tutte le label</button><TrackGroups tracks={visibleTracks} mode="recent" /></div> : modeView === 'bpm' ? <div><div className="bpm-selection-bar"><span>Selezionate {selected.size}/3</span><button className="primary" disabled={!selected.size} onClick={calculateBpm}>Calcola BPM ({selected.size}/3)</button></div><TrackGroups tracks={tracks} mode="bpm-select" selected={selected} bpmState={bpmState} onToggle={toggleSelected} /></div> : <TrackGroups tracks={tracks} mode="recent" />}{mode === 'liked' && tracks.length < total && <p className="spotify-more" role="status">{`Caricamento preferiti… ${tracks.length}/${total}`}</p>}</main>
}

function LabelBrowser({ tracks, pendingCount, onSelect }: { tracks: SpotifyTrack[]; pendingCount: number; onSelect: (label: string) => void }) {
  const groups = Object.entries(tracks.reduce<Record<string, SpotifyTrack[]>>((result, track) => { const label = track.label?.trim() || 'Senza label'; (result[label] ||= []).push(track); return result }, {})).sort(([a], [b]) => a === 'Senza label' ? 1 : b === 'Senza label' ? -1 : a.localeCompare(b))
  if (!tracks.length) return <p className="spotify-state">Nessuna traccia.</p>
  return <div className="label-browser-wrap">{pendingCount > 0 && <p className="spotify-state label-enrich-note" role="status">Arricchimento label in corso… {pendingCount} {pendingCount === 1 ? 'traccia' : 'tracce'}</p>}<div className="label-browser">{groups.map(([label, entries]) => <button key={label} onClick={() => onSelect(label)}><strong>{label}</strong><span>{entries.length} {entries.length === 1 ? 'traccia' : 'tracce'} →</span></button>)}</div></div>
}

function TrackGroups({ tracks, mode, selected, bpmState, onToggle }: { tracks: SpotifyTrack[]; mode: 'recent' | 'bpm-select'; selected?: Set<string>; bpmState?: Record<string, 'queued' | 'running' | 'error'>; onToggle?: (id: string) => void }) {
  if (!tracks.length) return <p className="spotify-state">Nessuna traccia.</p>
  const ordered = [...tracks].sort((left, right) => (Date.parse(right.added_at || '') || 0) - (Date.parse(left.added_at || '') || 0))
  return <div className="track-list">{ordered.map((track) => <TrackRow key={track.id} track={track} selectable={mode === 'bpm-select'} checked={selected?.has(track.id) ?? false} disabled={!(selected?.has(track.id) ?? false) && (selected?.size ?? 0) >= 3} bpmStatus={bpmState?.[track.id]} onToggle={onToggle} />)}</div>
}

function TrackRow({ track, selectable, checked, disabled, bpmStatus, onToggle }: { track: SpotifyTrack; selectable?: boolean; checked?: boolean; disabled?: boolean; bpmStatus?: string; onToggle?: (id: string) => void }) {
  const query = encodeURIComponent(`${track.artists[0] || ''} ${track.title}`.trim())
  const links = [{ label: 'YT', name: 'YouTube', href: `https://www.youtube.com/results?search_query=${query}` }, { label: 'SC', name: 'SoundCloud', href: `https://soundcloud.com/search?q=${query}` }, { label: 'BP', name: 'Beatport', href: `https://www.beatport.com/search?q=${query}` }, { label: 'BC', name: 'Bandcamp', href: `https://bandcamp.com/search?q=${query}` }, ...(track.discogs_url ? [{ label: 'DG', name: 'Discogs', href: track.discogs_url }] : [])]
  return <article className="spotify-track">{selectable && <input className="bpm-checkbox" type="checkbox" aria-label={`Seleziona ${track.title}`} checked={checked} disabled={disabled} onChange={() => onToggle?.(track.id)} />}<div className="track-cover">{track.cover_url ? <img src={track.cover_url} alt="" loading="lazy" /> : <span />}</div><div className="track-main"><strong>{track.title}</strong><span>{track.artists.join(', ')}</span></div><span className="track-album">{track.album}</span><span className="track-bpm"><b>{bpmStatus === 'queued' || bpmStatus === 'running' ? '…' : bpmStatus === 'error' ? 'riprova' : track.bpm ?? '—'}</b><small>BPM</small></span><time dateTime={track.added_at ?? undefined}>{formatSpotifyDate(track.added_at)}</time><nav className="track-links" aria-label={`Ascolta ${track.title}`}>{links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Apri ${track.title} su ${link.name}`} title={link.name}>{link.label}</a>)}</nav></article>
}

function soundcloudUrl(track: SpotifyTrack) { return `https://soundcloud.com/search?q=${encodeURIComponent(`${track.artists[0] ?? ''} ${track.title}`.trim())}` }

function formatSpotifyDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const radarStatusLabels: Record<RadarStatus, string> = { saved: 'Salvato', discarded: 'Scartato', linked: 'Collegato al Brain', content: 'Trasformato in contenuto' }

function Radar() {
  const [state, setState] = usePrototypeState()
  const visibleFixtures = [...radarDevelopmentFixtures, ...radarLockedFixtures.filter((fixture) => state.unlockedIds.includes(fixture.id))]
  const hasPrototypeData = state.extraNodes.length > 0 || Object.keys(state.radarStatus).length > 0

  function save(id: string) { setState(setRadarStatus(id, 'saved')) }
  function discard(id: string) { setState(setRadarStatus(id, 'discarded')) }
  function link(fixture: RadarFixture) { setState(linkRadarToBrain(fixture)) }
  function convert(id: string) { setState(setRadarStatus(id, 'content')) }
  function resetPrototype() { setState(resetPrototypeState()) }

  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Radar · development shell</span><h1 className="sr-only">Radar</h1><p>Segnali guidati dal Brain, con fonti che possono emergere anche fuori dalle relazioni già presenti.</p></header>
    <div className="radar-toolbar">
      <p className="prototype-note">Prototipo — stato salvato solo in questo browser (localStorage), non è ancora il database reale. “Collega al Brain” aggiunge davvero un nodo al grafo e può sbloccare nuove proposte qui sotto.</p>
      <button type="button" className="radar-reset" onClick={resetPrototype} disabled={!hasPrototypeData}>Reset prototipo</button>
    </div>
    <div className="brain-preview" aria-label="Anteprima Brain">
      <strong>Nel Brain (prototipo):</strong>
      {state.extraNodes.length === 0
        ? <span className="brain-preview-empty">Ancora nessun nodo aggiunto dal Radar.</span>
        : state.extraNodes.map((node) => <span className="brain-preview-chip" key={node.id}>{node.id.replace(/^Radar · /, '')}</span>)}
    </div>
    <div className="radar-grid">{visibleFixtures.map((item) => {
      const status = state.radarStatus[item.id]
      const isNew = radarLockedFixtures.some((locked) => locked.id === item.id) && status === undefined
      return <article className={`radar-card ${status ? `is-${status}` : ''} ${isNew ? 'is-new' : ''}`} key={item.id}>
        <div className="radar-card-head"><span className="fixture-label">Development fixture</span>{status && <span className="radar-status-badge">{radarStatusLabels[status]}</span>}{isNew && <span className="radar-status-badge">Nuovo · sbloccato dal Brain</span>}</div>
        <h2>{item.title}</h2>
        <dl><div><dt>Fonte</dt><dd>{item.source}</dd></div><div><dt>Data</dt><dd>{item.date}</dd></div><div><dt>Luogo</dt><dd>{item.location}</dd></div><div><dt>Categoria</dt><dd>{item.category}</dd></div></dl>
        <section><h3>Perché è rilevante</h3><p>{item.relevance}</p></section>
        <div className="planned-actions" aria-label="Azioni">
          <button type="button" data-action="save" className={status === 'saved' ? 'is-active' : ''} disabled={status === 'linked' || status === 'content'} onClick={() => save(item.id)}>Salva</button>
          <button type="button" data-action="discard" className={status === 'discarded' ? 'is-active' : ''} disabled={status === 'linked' || status === 'content'} onClick={() => discard(item.id)}>Scarta</button>
          <button type="button" data-action="link" disabled={status === 'linked'} onClick={() => link(item)}>{status === 'linked' ? 'Collegato ✓' : 'Collega al Brain'}</button>
          <button type="button" data-action="content" disabled={status === 'content'} onClick={() => convert(item.id)}>{status === 'content' ? 'Trasformato ✓' : 'Trasforma in contenuto'}</button>
        </div>
      </article>
    })}</div>
  </main>
}

function Brain() {
  const [state] = usePrototypeState()
  return <main className="brain-workspace"><h1 className="sr-only">Brain</h1><BrainGraph extraNodes={state.extraNodes} extraLinks={state.extraLinks} /></main>
}

function Content() {
  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Content · development shell</span><h1 className="sr-only">Content</h1><p>Pipeline editoriale strutturale. Nessun CMS implementato.</p></header><section className="content-pipeline" aria-label="Pipeline contenuti">{contentStages.map((stage) => <article key={stage}><h2>{stage}</h2><p>0 development items</p></article>)}</section><section className="tool-shell"><h2>Campi previsti</h2><div className="type-list">{contentFields.map((field) => <span key={field}>{field}</span>)}</div></section></main>
}

function Download({ user, onError, error, setError }: { user: User; onError: (error: unknown) => void; error: string; setError: (value: string) => void }) {
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<Job | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!job?.id || terminalStatuses.has(job.status)) return
    const timer = window.setInterval(async () => {
      try { setJob(await api.getDownload(job.id)) }
      catch (cause) { window.clearInterval(timer); onError(cause) }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [job?.id, job?.status, onError])

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setJob(null)
    try { setJob(await api.createDownload(url)); setUrl('') }
    catch (cause) { onError(cause) }
    finally { setBusy(false) }
  }

  return <main className="shell"><div className="workspace">
    <section className="card hero-card"><div><span className="eyebrow">DOWNLOAD PRIVATO</span><h1 className="sr-only">Nuovo download</h1><p className="lead">Area personale di {user.name ?? user.username ?? 'utente'}.</p></div>
      <form onSubmit={submit} className="download-form"><label htmlFor="download-url">URL contenuto</label><div className="url-row"><input id="download-url" type="url" required placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} /><button className="primary" disabled={busy}>{busy ? 'Avvio…' : 'Scarica'}</button></div></form>{error && <div className="alert" role="alert">{error}</div>}
    </section>
    <aside className="card status-card"><span className="eyebrow">STATO JOB</span>{!job ? <div className="empty"><p>Nessun download attivo</p></div> : <TrackCard job={job} />}</aside>
  </div></main>
}

function TrackCard({ job }: { job: Job }) {
  const ready = readyStatuses.has(job.status)
  const failed = failedStatuses.has(job.status)
  const queued = queuedStatuses.has(job.status)
  const statusLabel = ready ? 'Pronto' : failed ? 'Download fallito' : statusLabels[job.status] ?? 'Elaborazione…'
  const progress = Math.max(0, Math.min(100, job.progress ?? (ready ? 100 : 0)))
  return <div className={`track-card ${ready ? 'ready' : failed ? 'failed' : ''}`}>
    <div className="track-cover" aria-hidden="true">{job.coverUrl ? <img src={job.coverUrl} alt="" /> : <span className="track-cover-fallback">♪</span>}</div>
    <div className="track-info">
      <p className="track-title">{job.title ?? job.fileName ?? `Job ${job.id}`}</p>
      {job.artist && <p className="track-artist">{job.artist}</p>}
      <div className="track-status-row"><span className="status-dot" /><span className="track-status-label">{statusLabel}</span></div>
      {!failed && !ready && <><div className="progress"><span style={{ width: `${queued ? 0 : progress}%` }} /></div><small>{!queued && progress ? `${progress}%` : ''}</small></>}
      {failed && <div className="alert" role="alert">{job.message ?? 'Il job non è stato completato. Riprova.'}</div>}
      {ready && <a className="primary download-link" href={api.fileUrl(job.id)} download>↓ Scarica file</a>}
    </div>
  </div>
}
