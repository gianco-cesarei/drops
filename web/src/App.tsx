import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { api, ApiError } from './api'
import type { PlaylistPreview, SpotifyPlaylist, SpotifyTrack, User } from './api'
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

const globalAudio = typeof Audio !== 'undefined' ? new Audio() : null

function useAudioPlayer() {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)

  const toggle = useCallback((url: string) => {
    if (!globalAudio) return
    if (globalAudio.src === url && !globalAudio.paused) {
      globalAudio.pause()
      setPlayingUrl(null)
    } else {
      globalAudio.pause()
      globalAudio.src = url
      globalAudio.play().then(() => setPlayingUrl(url)).catch(() => setPlayingUrl(null))
      globalAudio.onended = () => setPlayingUrl(null)
      globalAudio.onerror = () => setPlayingUrl(null)
    }
  }, [])

  return { playingUrl, toggle }
}

function exportCrate(items: (HistoryItem | SpotifyTrack)[], name = 'drops-crate') {
  if (!items.length) return
  const m3u8 = [
    '#EXTM3U',
    ...items.map((it) => {
      const title = 'title' in it ? it.title : ''
      const artist = 'artist' in it ? it.artist : 'artists' in it ? it.artists.join(', ') : ''
      const file = 'id' in it && typeof it.id === 'string' && !it.id.startsWith('spotify-') ? api.fileUrl(it.id) : ''
      return `#EXTINF:-1,${artist ? `${artist} - ` : ''}${title}\n${file}`
    }),
  ].join('\n')
  const blob = new Blob([m3u8], { type: 'audio/x-mpegurl' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.m3u8`
  a.click()
  URL.revokeObjectURL(url)
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
  const [dlState, setDlState] = useState<Record<string, 'queued' | 'done' | 'error'>>({})
  const [pendingLabels, setPendingLabels] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const discogsRequested = useRef(new Set<string>())
  const { playingUrl, toggle: toggleAudio } = useAudioPlayer()

  useEffect(() => { api.spotifyStatus().then(setStatus).catch(onError) }, [onError])
  useEffect(() => {
    if (!status?.connected || mode !== 'liked') return
    setBusy(true)
    api.spotifyLiked(100, 0).then((result) => { setTracks(result.tracks); setTotal(result.total) }).catch(onError).finally(() => setBusy(false))
  }, [mode, onError, status?.connected])
  useEffect(() => {
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

  async function calculateSingleBpm(track: SpotifyTrack) {
    setBpmState((current) => ({ ...current, [track.id]: 'queued' }))
    try {
      const job = await api.bpmCompute(track, soundcloudUrl(track))
      if (job.bpm != null) {
        const bpm = job.bpm
        setTracks((current) => current.map((item) => (item.id === track.id ? { ...item, bpm, in_catalog: true } : item)))
        return
      }
      let result = await api.bpmJob(job.job_id)
      while (result.status === 'queued' || result.status === 'running') {
        setBpmState((current) => ({ ...current, [track.id]: result.status as 'queued' | 'running' }))
        await new Promise((resolve) => window.setTimeout(resolve, 1200))
        result = await api.bpmJob(job.job_id)
      }
      if (result.status === 'ready' && result.bpm != null) {
        setTracks((current) => current.map((item) => (item.id === track.id ? { ...item, bpm: result.bpm!, in_catalog: true } : item)))
      } else {
        setBpmState((current) => ({ ...current, [track.id]: 'error' }))
      }
    } catch {
      setBpmState((current) => ({ ...current, [track.id]: 'error' }))
    }
  }

  async function calculateBpm() {
    const chosen = tracks.filter((track) => selected.has(track.id))
    await Promise.all(chosen.map((track) => calculateSingleBpm(track)))
  }

  async function handleDownloadTrack(track: SpotifyTrack) {
    setDlState((cur) => ({ ...cur, [track.id]: 'queued' }))
    try {
      const url = soundcloudUrl(track)
      const created = await api.createDownload(url)
      setDlState((cur) => ({ ...cur, [track.id]: 'done' }))
      if (created.id) {
        const hist = loadHistory()
        if (!hist.some((h) => h.id === created.id)) {
          saveHistory([
            {
              id: created.id,
              title: created.title || track.title,
              artist: created.artist || track.artists.join(', '),
              coverUrl: created.coverUrl || track.cover_url || undefined,
              source: created.source || undefined,
              bpm: created.bpm || (track.bpm ? Math.round(track.bpm) : undefined),
              ts: Date.now(),
            },
            ...hist,
          ])
        }
      }
    } catch {
      setDlState((cur) => ({ ...cur, [track.id]: 'error' }))
    }
  }

  if (!status) return <main className="spotify-workspace">{error ? <div className="alert" role="alert">{error}</div> : <p className="spotify-state" role="status">Controllo Spotify…</p>}</main>
  if (!status.connected) return <main className="spotify-workspace spotify-connect"><p>Collega account Premium per leggere preferiti e playlist.</p><a className="primary spotify-connect-button" href={api.spotifyConnectUrl()}>Connetti Spotify</a></main>

  const baseTracks = selectedLabel === null ? tracks : tracks.filter((track) => (track.label?.trim() || 'Senza label') === selectedLabel)
  const visibleTracks = baseTracks.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      t.title.toLowerCase().includes(q) ||
      t.artists.some((a) => a.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q)) ||
      (t.label && t.label.toLowerCase().includes(q))
    )
  })

  return (
    <main className="spotify-workspace">
      <div className="spotify-toolbar">
        <div className="spotify-toolbar-left">
          <div className="spotify-account">
            <span className="status-dot" />
            <span>Spotify collegato:</span>
            <strong>{status.display_name}</strong>
          </div>
          <div className="spotify-toggle" role="group" aria-label="Libreria Spotify">
            <button className={mode === 'liked' ? 'active' : ''} onClick={() => { setMode('liked'); setSelectedLabel(null) }}>Preferiti</button>
            <button className={mode === 'playlists' ? 'active' : ''} onClick={() => { setMode('playlists'); setSelectedLabel(null) }}>Playlist</button>
          </div>
        </div>
        <div className="spotify-toolbar-right">
          <div className="spotify-search-wrap">
            <span className="spotify-search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              aria-label="Cerca traccia"
              placeholder="Cerca per titolo, artista, label…"
              className="spotify-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {mode === 'playlists' && (
            <label className="playlist-picker">
              <select aria-label="Seleziona playlist" value={playlistId} onChange={(event) => setPlaylistId(event.target.value)}>
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} ({playlist.tracks_total})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="spotify-subbar">
        <div className="spotify-sort" role="group" aria-label="Vista Spotify">
          <button className={modeView === 'recent' ? 'active' : ''} onClick={() => { setModeView('recent'); setSelectedLabel(null) }}>Recenti</button>
          <button className={modeView === 'labels' ? 'active' : ''} onClick={() => { setModeView('labels'); setSelectedLabel(null) }}>Label</button>
          <button className={modeView === 'bpm' ? 'active' : ''} onClick={() => { setModeView('bpm'); setSelectedLabel(null) }}>BPM</button>
        </div>
        <div className="spotify-subbar-actions">
          <span className="spotify-stats">
            {visibleTracks.length} {visibleTracks.length === 1 ? 'traccia' : 'tracce'}
            {total > visibleTracks.length && mode === 'liked' ? ` di ${total}` : ''}
          </span>
          {visibleTracks.length > 0 && (
            <button
              type="button"
              className="spotify-export-btn"
              onClick={() => exportCrate(visibleTracks, `spotify-${mode}`)}
              title="Esporta playlist in formato .m3u8 per Rekordbox / Traktor"
            >
              📥 Esporta Crate (.m3u8)
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      {busy && tracks.length === 0 ? (
        <p className="spotify-state" role="status">Caricamento tracce…</p>
      ) : modeView === 'labels' && selectedLabel === null ? (
        <LabelBrowser tracks={tracks} pendingCount={pendingLabels.size} onSelect={setSelectedLabel} />
      ) : modeView === 'labels' ? (
        <div>
          <button className="spotify-back" onClick={() => setSelectedLabel(null)}>← Tutte le label</button>
          <TrackGroups
            tracks={visibleTracks}
            mode="recent"
            dlState={dlState}
            playingUrl={playingUrl}
            onToggleAudio={toggleAudio}
            onDownload={handleDownloadTrack}
            onCalculateBpm={calculateSingleBpm}
          />
        </div>
      ) : modeView === 'bpm' ? (
        <div>
          <div className="bpm-selection-bar">
            <span>Selezionate {selected.size}/3</span>
            <button className="primary" disabled={!selected.size} onClick={calculateBpm}>
              Calcola BPM ({selected.size}/3)
            </button>
          </div>
          <TrackGroups
            tracks={visibleTracks}
            mode="bpm-select"
            selected={selected}
            bpmState={bpmState}
            dlState={dlState}
            playingUrl={playingUrl}
            onToggleAudio={toggleAudio}
            onToggle={toggleSelected}
            onDownload={handleDownloadTrack}
            onCalculateBpm={calculateSingleBpm}
          />
        </div>
      ) : (
        <TrackGroups
          tracks={visibleTracks}
          mode="recent"
          dlState={dlState}
          playingUrl={playingUrl}
          onToggleAudio={toggleAudio}
          onDownload={handleDownloadTrack}
          onCalculateBpm={calculateSingleBpm}
        />
      )}

      {mode === 'liked' && tracks.length < total && (
        <p className="spotify-more" role="status">{`Caricamento preferiti… ${tracks.length}/${total}`}</p>
      )}
    </main>
  )
}

function LabelBrowser({ tracks, pendingCount, onSelect }: { tracks: SpotifyTrack[]; pendingCount: number; onSelect: (label: string) => void }) {
  const groups = Object.entries(tracks.reduce<Record<string, SpotifyTrack[]>>((result, track) => { const label = track.label?.trim() || 'Senza label'; (result[label] ||= []).push(track); return result }, {})).sort(([a], [b]) => a === 'Senza label' ? 1 : b === 'Senza label' ? -1 : a.localeCompare(b))
  if (!tracks.length) return <p className="spotify-state">Nessuna traccia.</p>
  return <div className="label-browser-wrap">{pendingCount > 0 && <p className="spotify-state label-enrich-note" role="status">Arricchimento label in corso… {pendingCount} {pendingCount === 1 ? 'traccia' : 'tracce'}</p>}<div className="label-browser">{groups.map(([label, entries]) => <button key={label} onClick={() => onSelect(label)}><strong>{label}</strong><span>{entries.length} {entries.length === 1 ? 'traccia' : 'tracce'} →</span></button>)}</div></div>
}

function TrackGroups({
  tracks,
  mode,
  selected,
  bpmState,
  dlState,
  playingUrl,
  onToggleAudio,
  onToggle,
  onDownload,
  onCalculateBpm,
}: {
  tracks: SpotifyTrack[]
  mode: 'recent' | 'bpm-select'
  selected?: Set<string>
  bpmState?: Record<string, 'queued' | 'running' | 'error'>
  dlState?: Record<string, 'queued' | 'done' | 'error'>
  playingUrl?: string | null
  onToggleAudio?: (url: string) => void
  onToggle?: (id: string) => void
  onDownload?: (track: SpotifyTrack) => void
  onCalculateBpm?: (track: SpotifyTrack) => void
}) {
  const isTest = import.meta.env.MODE === 'test'
  const [displayCount, setDisplayCount] = useState(isTest ? 9999 : 15)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const ordered = useMemo(() => {
    return [...tracks].sort((left, right) => (Date.parse(right.added_at || '') || 0) - (Date.parse(left.added_at || '') || 0))
  }, [tracks])

  useEffect(() => {
    setDisplayCount(isTest ? 9999 : 15)
  }, [tracks, isTest])

  useEffect(() => {
    if (displayCount >= ordered.length) return
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setDisplayCount((cur) => Math.min(ordered.length, cur + 15))
      }
    }, { rootMargin: '300px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [displayCount, ordered.length])

  if (!tracks.length) return <p className="spotify-state">Nessuna traccia.</p>

  const visible = ordered.slice(0, displayCount)

  return (
    <div className="track-list">
      {visible.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          selectable={mode === 'bpm-select'}
          checked={selected?.has(track.id) ?? false}
          disabled={!(selected?.has(track.id) ?? false) && (selected?.size ?? 0) >= 3}
          bpmStatus={bpmState?.[track.id]}
          dlStatus={dlState?.[track.id]}
          playing={playingUrl === track.preview_url}
          onToggleAudio={onToggleAudio}
          onToggle={onToggle}
          onDownload={onDownload}
          onCalculateBpm={onCalculateBpm}
        />
      ))}
      {displayCount < ordered.length && (
        <div ref={sentinelRef} className="track-list-sentinel">
          <button
            type="button"
            className="secondary track-load-more"
            onClick={() => setDisplayCount((cur) => Math.min(ordered.length, cur + 20))}
          >
            Carica altre ({ordered.length - displayCount} rimanenti)
          </button>
        </div>
      )}
    </div>
  )
}

function PlatformLinks({ query, discogsUrl, title }: { query: string; discogsUrl?: string | null; title: string }) {
  return (
    <nav className="track-links" aria-label={`Ascolta ${title}`}>
      <a
        href={`https://www.youtube.com/results?search_query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Apri ${title} su YouTube`}
        title="YouTube"
        className="track-platform-icon track-icon-yt"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </a>
      <a
        href={`https://soundcloud.com/search?q=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Apri ${title} su SoundCloud`}
        title="SoundCloud"
        className="track-platform-icon track-icon-sc"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M11.56 8.87V17h9.72c1.5 0 2.72-1.22 2.72-2.72s-1.22-2.72-2.72-2.72c-.22 0-.44.03-.64.08-.22-1.57-1.57-2.77-3.2-2.77-.45 0-.87.09-1.26.25C15.65 7.42 14.07 6.2 12.2 6.2c-.22 0-.43.02-.64.06v2.61zm-1.85-.3V17H8.25V9.41c-.48.24-.9.57-1.24.97V17H5.55v-5.26c-.39.63-.61 1.37-.61 2.16 0 .04 0 .07.01.11H3.5C2.67 14.01 2 14.68 2 15.5S2.67 17 3.5 17h.8v-2.89H3.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1.45v3.89H1.4v.01H1.2C.54 17.01 0 17.55 0 18.21s.54 1.2 1.2 1.2h20.08c2.05 0 3.72-1.67 3.72-3.72s-1.67-3.72-3.72-3.72c-.17 0-.34.01-.5.04C20.35 9.87 18.52 8.2 16.32 8.2c-.75 0-1.46.2-2.07.54-.75-1.04-1.97-1.72-3.36-1.72-.4 0-.79.06-1.18.15z"/></svg>
      </a>
      <a
        href={`https://www.beatport.com/search?q=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Apri ${title} su Beatport`}
        title="Beatport"
        className="track-platform-icon track-icon-bp"
      >
        <span>BP</span>
      </a>
      <a
        href={`https://bandcamp.com/search?q=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Apri ${title} su Bandcamp`}
        title="Bandcamp"
        className="track-platform-icon track-icon-bc"
      >
        <span>BC</span>
      </a>
      {discogsUrl && (
        <a
          href={discogsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Apri ${title} su Discogs`}
          title="Discogs"
          className="track-platform-icon track-icon-dg"
        >
          <span>DG</span>
        </a>
      )}
    </nav>
  )
}

function TrackRow({
  track,
  selectable,
  checked,
  disabled,
  bpmStatus,
  dlStatus,
  playing,
  onToggleAudio,
  onToggle,
  onDownload,
  onCalculateBpm,
}: {
  track: SpotifyTrack
  selectable?: boolean
  checked?: boolean
  disabled?: boolean
  bpmStatus?: string
  dlStatus?: 'queued' | 'done' | 'error'
  playing?: boolean
  onToggleAudio?: (url: string) => void
  onToggle?: (id: string) => void
  onDownload?: (track: SpotifyTrack) => void
  onCalculateBpm?: (track: SpotifyTrack) => void
}) {
  const query = encodeURIComponent(`${track.artists[0] || ''} ${track.title}`.trim())
  return (
    <article className={`spotify-track-card ${checked ? 'selected' : ''}`}>
      {selectable && (
        <input
          className="bpm-checkbox"
          type="checkbox"
          aria-label={`Seleziona ${track.title}`}
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle?.(track.id)}
        />
      )}
      <div
        className={`track-cover ${track.preview_url ? 'is-playable' : ''} ${playing ? 'is-playing' : ''}`}
        onClick={() => track.preview_url && onToggleAudio?.(track.preview_url)}
        title={track.preview_url ? (playing ? 'Pausa anteprima' : 'Ascolta anteprima (30s)') : undefined}
      >
        {track.cover_url ? <img src={track.cover_url} alt="" loading="lazy" /> : <span>♪</span>}
        {track.preview_url && <span className="cover-play-badge">{playing ? '⏸' : '▶'}</span>}
      </div>
      <div className="track-main">
        <div className="track-title-row">
          <strong className="track-title" title={track.title}>{track.title}</strong>
          <div className="track-bpm-badge">
            {track.bpm != null ? (
              <span className="track-chip track-chip-bpm"><b>{Math.round(track.bpm)}</b> <small>BPM</small></span>
            ) : bpmStatus === 'queued' || bpmStatus === 'running' ? (
              <span className="track-chip track-chip-bpm calculating">… BPM</span>
            ) : (
              <button
                type="button"
                className="track-chip-bpm-btn"
                title="Calcola BPM rapido con download audio"
                onClick={() => onCalculateBpm?.(track)}
              >
                + BPM
              </button>
            )}
          </div>
        </div>
        <div className="track-meta-line">
          <span className="track-artist">{track.artists.join(', ')}</span>
          {track.album && <span className="track-dot">·</span>}
          {track.album && <span className="track-album-name">{track.album}</span>}
          {track.label && <span className="track-chip track-chip-label">{track.label}</span>}
          {track.year && <span className="track-chip track-chip-year">{track.year}</span>}
          {track.styles?.[0] && <span className="track-chip track-chip-style">{track.styles[0]}</span>}
        </div>
      </div>
      <div className="track-actions-bar">
        <time className="track-date" dateTime={track.added_at ?? undefined}>
          {formatSpotifyDate(track.added_at)}
        </time>
        <button
          type="button"
          className={`track-dl-btn ${dlStatus === 'done' ? 'done' : dlStatus === 'queued' ? 'busy' : ''}`}
          disabled={dlStatus === 'queued' || dlStatus === 'done'}
          onClick={() => onDownload?.(track)}
          title="Scarica con motore Drops e salva in Coda"
        >
          {dlStatus === 'done' ? '✓ In coda' : dlStatus === 'queued' ? '…' : '↓ Scarica'}
        </button>
        <PlatformLinks query={query} discogsUrl={track.discogs_url} title={track.title} />
      </div>
    </article>
  )
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

type QueueJob = {
  key: string
  id: string | null
  url: string
  status: string
  progress: number
  optimistic: number
  title?: string
  artist?: string
  coverUrl?: string
  source?: string
  message?: string
}

type HistoryItem = {
  id: string
  title: string
  artist?: string
  coverUrl?: string
  source?: string
  bpm?: number
  ts: number
}

const HISTORY_KEY = 'drops.downloads.history.v1'

function loadHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed.filter((x) => x && typeof (x as HistoryItem).id === 'string') as HistoryItem[]) : []
  } catch {
    return []
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 100)))
  } catch {
    /* storage non disponibile: la lista resta solo in memoria */
  }
}

const makeKey = () =>
  (globalThis.crypto?.randomUUID?.() ?? `k${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)

function looksLikePlaylist(value: string): boolean {
  try {
    const u = new URL(value)
    const host = u.hostname.toLowerCase()
    if (host.includes('youtube.com') || host === 'youtu.be') return u.searchParams.has('list')
    if (host.includes('soundcloud.com')) return u.pathname.includes('/sets/')
  } catch {
    return false
  }
  return false
}

function optimisticCap(status: string): number {
  if (readyStatuses.has(status)) return 100
  if (status === 'downloading' || status === 'enriching' || status === 'processing') return 92
  return 40
}

function queueStatusLabel(status: string): string {
  if (readyStatuses.has(status)) return 'Pronto'
  if (failedStatuses.has(status)) return 'Errore'
  const map: Record<string, string> = {
    starting: 'Avvio…',
    recognized: 'In coda',
    queued: 'In coda',
    pending: 'In coda',
    enriching: 'Riconoscimento…',
    downloading: 'Scarico…',
    processing: 'Elaborazione…',
  }
  return map[status] ?? 'Elaborazione…'
}

function Download({ user, onError, error, setError }: { user: User; onError: (error: unknown) => void; error: string; setError: (value: string) => void }) {
  const [input, setInput] = useState('')
  const [queue, setQueue] = useState<QueueJob[]>([])
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ data: PlaylistPreview; resolve: (urls: string[] | null) => void } | null>(null)

  const queueRef = useRef<QueueJob[]>([])
  queueRef.current = queue
  void onError

  useEffect(() => { saveHistory(history) }, [history])

  const hasActive = queue.some((j) => !readyStatuses.has(j.status) && !failedStatuses.has(j.status))

  useEffect(() => {
    if (!hasActive) return
    const timer = window.setInterval(() => {
      setQueue((cur) => cur.map((j) => {
        if (readyStatuses.has(j.status) || failedStatuses.has(j.status)) return j
        const cap = optimisticCap(j.status)
        if (j.optimistic >= cap) return j
        const next = Math.min(cap, j.optimistic + Math.max(0.5, (cap - j.optimistic) * 0.07))
        return { ...j, optimistic: next }
      }))
    }, 220)
    return () => window.clearInterval(timer)
  }, [hasActive])

  useEffect(() => {
    if (!hasActive) return
    const timer = window.setInterval(() => {
      const active = queueRef.current.filter((j) => j.id && !terminalStatuses.has(j.status))
      if (!active.length) return
      active.forEach(async (j) => {
        try {
          const fresh = await api.getDownload(j.id as string)
          setQueue((cur) => cur.map((x) => {
            if (x.key !== j.key) return x
            const merged: QueueJob = {
              ...x,
              status: fresh.status,
              progress: typeof fresh.progress === 'number' ? fresh.progress : x.progress,
              title: fresh.title ?? x.title,
              artist: fresh.artist ?? x.artist,
              coverUrl: fresh.coverUrl ?? x.coverUrl,
              source: fresh.source ?? x.source,
              message: fresh.message ?? x.message,
            }
            if (readyStatuses.has(fresh.status)) merged.optimistic = 100
            return merged
          }))
          if (readyStatuses.has(fresh.status)) {
            const record: HistoryItem = { id: fresh.id, title: fresh.title ?? fresh.fileName ?? 'Traccia', artist: fresh.artist, coverUrl: fresh.coverUrl, source: fresh.source, bpm: fresh.bpm, ts: Date.now() }
            window.setTimeout(() => {
              setHistory((h) => [record, ...h.filter((it) => it.id !== record.id)].slice(0, 100))
              setQueue((cur) => cur.filter((x) => x.key !== j.key))
            }, 1000)
          }
        } catch (cause) {
          setQueue((cur) => cur.map((x) => (x.key === j.key ? { ...x, status: 'failed', message: cause instanceof ApiError ? cause.message : 'Errore di rete' } : x)))
        }
      })
    }, 1500)
    return () => window.clearInterval(timer)
  }, [hasActive])

  function askPlaylistSelection(data: PlaylistPreview): Promise<string[] | null> {
    return new Promise((resolve) => setPreview({ data, resolve }))
  }

  async function handleAdd(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const links = [...new Set(input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean))]
    if (!links.length) return
    setBusy(true)
    const resolved: string[] = []
    const errors: string[] = []
    for (const link of links) {
      if (!looksLikePlaylist(link)) { resolved.push(link); continue }
      try {
        const data = await api.resolvePlaylist(link)
        if (data.count > 1) {
          const chosen = await askPlaylistSelection(data)
          if (chosen && chosen.length) resolved.push(...chosen)
        } else if (data.entries && data.entries.length > 0) {
          resolved.push(...data.entries.map((e) => e.url))
        } else {
          resolved.push(link)
        }
      } catch {
        resolved.push(link)
      }
    }
    const unique = [...new Set(resolved)].slice(0, 100)
    if (unique.length) {
      const newJobs: QueueJob[] = unique.map((url) => ({ key: makeKey(), id: null, url, status: 'starting', progress: 0, optimistic: 8 }))
      setQueue((cur) => [...newJobs, ...cur])
      setInput('')
      newJobs.forEach((jobItem) => {
        api.createDownload(jobItem.url)
          .then((created) => {
            setQueue((cur) => cur.map((x) => (x.key === jobItem.key ? {
              ...x,
              id: created.id,
              status: created.status || 'queued',
              title: created.title ?? x.title,
              artist: created.artist ?? x.artist,
              coverUrl: created.coverUrl ?? x.coverUrl,
              source: created.source ?? x.source,
            } : x)))
            if (readyStatuses.has(created.status)) {
              const record: HistoryItem = { id: created.id, title: created.title ?? created.fileName ?? 'Traccia', artist: created.artist, coverUrl: created.coverUrl, source: created.source, bpm: created.bpm, ts: Date.now() }
              window.setTimeout(() => {
                setHistory((h) => [record, ...h.filter((it) => it.id !== record.id)].slice(0, 100))
                setQueue((cur) => cur.filter((x) => x.key !== jobItem.key))
              }, 1000)
            }
          })
          .catch((cause) => setQueue((cur) => cur.map((x) => (x.key === jobItem.key ? { ...x, status: 'failed', message: cause instanceof ApiError ? cause.message : 'Avvio non riuscito' } : x))))
      })
    }
    if (errors.length) setError(errors.join(' · '))
    setBusy(false)
  }

  const linkCount = input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).length
  const activeCount = queue.filter((j) => !readyStatuses.has(j.status) && !failedStatuses.has(j.status)).length
  const who = user.name ?? user.username ?? 'utente'
  const { playingUrl, toggle: toggleAudio } = useAudioPlayer()

  return <main className="shell"><div className="workspace">
    <section className="card hero-card download-hero">
      <div><span className="eyebrow">DOWNLOAD PRIVATO</span><p className="lead">Area personale di {who}. Incolla uno o più link e aggiungili alla coda.</p></div>
      <form onSubmit={handleAdd} className="download-form">
        <label htmlFor="download-url">Link brano, playlist o set</label>
        <textarea id="download-url" className="download-textarea" placeholder={'Un link per riga · YouTube o SoundCloud\nLe playlist e i set chiedono conferma delle tracce'} value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} rows={3} />
        <div className="download-actions">
          <span className="download-hint">{linkCount ? `${linkCount} link rilevati` : 'Un link per riga · playlist supportate'}</span>
          <button className="primary" disabled={busy || !input.trim()}>{busy ? 'Analisi…' : 'Aggiungi alla coda'}</button>
        </div>
      </form>
      {error && <div className="alert" role="alert">{error}</div>}
      {queue.length > 0 && (
        <div className="dl-queue">
          <div className="dl-queue-head"><span className="eyebrow">In coda</span><span className="dl-count">{activeCount} attivi · {queue.length} in lista</span></div>
          <div className="dl-queue-list">{queue.map((job) => <QueueRow key={job.key} job={job} />)}</div>
        </div>
      )}
    </section>
    <aside className="card status-card">
      <div className="dl-history-head">
        <span className="eyebrow">Scaricati</span>
        <div className="dl-history-actions">
          {history.length > 0 && (
            <button
              type="button"
              className="dl-export-btn"
              onClick={() => exportCrate(history, 'drops-downloads')}
              title="Esporta playlist in formato .m3u8 per Rekordbox / Traktor"
            >
              📥 Crate (.m3u8)
            </button>
          )}
          {history.length > 0 && <button className="dl-clear" onClick={() => setHistory([])}>Svuota</button>}
        </div>
      </div>
      {history.length === 0
        ? <div className="empty"><span>♪</span><p>Nessun download</p><small>I brani scaricati restano qui su questo browser.</small></div>
        : <div className="dl-history">{history.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              playing={playingUrl === api.fileUrl(item.id)}
              onToggleAudio={toggleAudio}
            />
          ))}</div>}
    </aside>
  </div>
  {preview && <PlaylistDialog data={preview.data} onConfirm={(urls) => { preview.resolve(urls); setPreview(null) }} onCancel={() => { preview.resolve(null); setPreview(null) }} />}
  </main>
}

function QueueRow({ job }: { job: QueueJob }) {
  const ready = readyStatuses.has(job.status)
  const failed = failedStatuses.has(job.status)
  const pct = Math.min(100, Math.round(Math.max(job.optimistic, job.progress)))
  return (
    <div className={`dl-job ${ready ? 'ready' : failed ? 'failed' : ''}`}>
      <div className="dl-job-cover" aria-hidden="true">{job.coverUrl ? <img src={job.coverUrl} alt="" /> : <span>♪</span>}</div>
      <div className="dl-job-main">
        <div className="dl-job-title">{job.title ?? job.url}</div>
        <div className="dl-job-detail">{failed ? (job.message ?? 'Errore') : ready ? 'Completato' : queueStatusLabel(job.status)}{job.source ? ` · ${job.source}` : ''}</div>
        {!failed && <div className="progress"><span style={{ width: `${ready ? 100 : pct}%` }} /></div>}
      </div>
      <div className={`dl-job-badge ${ready ? 'ok' : failed ? 'err' : ''}`}>{ready ? '✓' : failed ? '!' : `${pct}%`}</div>
    </div>
  )
}

function HistoryRow({
  item,
  playing,
  onToggleAudio,
}: {
  item: HistoryItem
  playing?: boolean
  onToggleAudio?: (url: string) => void
}) {
  const fileUrl = api.fileUrl(item.id)
  return (
    <div className="dl-hist">
      <div
        className={`dl-job-cover is-playable ${playing ? 'is-playing' : ''}`}
        onClick={() => onToggleAudio?.(fileUrl)}
        title={playing ? 'Pausa anteprima' : 'Ascolta brano'}
        role="button"
        tabIndex={0}
      >
        {item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span>♪</span>}
        <span className="cover-play-badge">{playing ? '⏸' : '▶'}</span>
      </div>
      <div className="dl-job-main">
        <div className="dl-job-title">{item.title}</div>
        {item.artist && <div className="dl-job-detail">{item.artist}</div>}
        <div className="dl-hist-chips">
          {item.bpm != null && <span className="track-chip track-chip-bpm">{Math.round(item.bpm)} BPM</span>}
          {item.source && <span className="dl-hist-source">fonte: {item.source}</span>}
        </div>
      </div>
      <a className="dl-hist-dl" href={fileUrl} download title={`Scarica ${item.title}`} aria-label={`Scarica ${item.title}`}>↓</a>
    </div>
  )
}

function PlaylistDialog({ data, onConfirm, onCancel }: { data: PlaylistPreview; onConfirm: (urls: string[]) => void; onCancel: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.entries.map((e) => e.url)))
  const allOn = selected.size === data.entries.length
  const toggle = (url: string) => setSelected((cur) => {
    const next = new Set(cur)
    if (next.has(url)) next.delete(url); else next.add(url)
    return next
  })
  return (
    <div className="dl-overlay" role="dialog" aria-modal="true" aria-label="Anteprima playlist">
      <div className="dl-dialog">
        <div className="dl-dialog-head">
          <div><div className="dl-dialog-title">{data.title}</div><div className="dl-dialog-sub">{data.count} tracce{data.truncated ? ' (elenco troncato)' : ''} · {selected.size} selezionate</div></div>
          <button className="secondary" onClick={onCancel}>Chiudi</button>
        </div>
        <div className="dl-dialog-tools">
          <button className="secondary" onClick={() => setSelected(allOn ? new Set() : new Set(data.entries.map((e) => e.url)))}>{allOn ? 'Deseleziona tutti' : 'Seleziona tutti'}</button>
        </div>
        <div className="dl-dialog-list">
          {data.entries.map((entry) => (
            <label key={entry.url} className="dl-entry">
              <input type="checkbox" checked={selected.has(entry.url)} onChange={() => toggle(entry.url)} />
              <span className="dl-entry-main"><span className="dl-entry-title">{entry.title}</span>{entry.uploader ? <span className="dl-entry-sub">{entry.uploader}</span> : null}</span>
            </label>
          ))}
        </div>
        <div className="dl-dialog-actions">
          <button className="primary" disabled={!selected.size} onClick={() => onConfirm(data.entries.filter((e) => selected.has(e.url)).map((e) => e.url))}>Aggiungi {selected.size} alla coda</button>
        </div>
      </div>
    </div>
  )
}
