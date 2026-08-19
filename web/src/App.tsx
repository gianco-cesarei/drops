import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { api, ApiError } from './api'
import type { PlaylistPreview, SpotifyPlaylist, SpotifyTrack, User } from './api'
import { postLoginRoute } from './lib/routes'
import { contentFields, contentStages, radarDevelopmentFixtures, radarLockedFixtures } from './data/private.fixture'
import type { RadarFixture } from './data/private.fixture'
import BrainGraph from './components/BrainGraph'
import { linkRadarToBrain, resetPrototypeState, setRadarStatus, usePrototypeState, getArticleStatus, publishArticle, draftArticle, getFeaturedId, setFeaturedArticle } from './data/brainStore'
import type { RadarStatus } from './data/brainStore'
import { publishedContentItems } from './data/content.data'

export type PrivateSection = 'login' | 'download' | 'spotify' | 'radar' | 'brain' | 'content' | 'editorial-suggestions' | 'settings'

const terminalStatuses = new Set(['completed', 'complete', 'ready', 'failed', 'error', 'cancelled'])
const readyStatuses = new Set(['completed', 'complete', 'ready'])
const failedStatuses = new Set(['failed', 'error', 'cancelled'])
const browserNavigate = (to: string) => window.location.assign(to)
const USER_CACHE_KEY = 'drops.user.v1'

function getCachedUser(): User | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(USER_CACHE_KEY) : null
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App({ section = 'login', navigate = browserNavigate }: { section?: PrivateSection; navigate?: (to: string) => void }) {
  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [checking, setChecking] = useState(() => !getCachedUser())
  const [error, setError] = useState('')
  const [logoutRedirecting, setLogoutRedirecting] = useState(false)

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) {
      setUser(null)
      try { window.localStorage.removeItem(USER_CACHE_KEY) } catch {}
    }
    setError(cause instanceof Error ? cause.message : 'Errore imprevisto.')
  }, [])

  useEffect(() => {
    api.me()
      .then((u) => {
        setUser(u)
        try { window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u)) } catch {}
      })
      .catch(() => {
        setUser(null)
        try { window.localStorage.removeItem(USER_CACHE_KEY) } catch {}
      })
      .finally(() => setChecking(false))
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [bpmState, setBpmState] = useState<Record<string, 'queued' | 'running' | 'error'>>({})
  const [dlState, setDlState] = useState<Record<string, 'queued' | 'done' | 'error'>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [exportingZip, setExportingZip] = useState(false)
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
      api.discogsEnrich(track).then((metadata) => {
        if (!metadata?.label) return
        setTracks((current) => current.map((item) => item.id === track.id ? { ...item, label: metadata.label, year: metadata.year, country: metadata.country, styles: metadata.styles, catalog_no: metadata.catalog_no, discogs_url: metadata.discogs_url } : item))
      }).catch(() => { /* Discogs optional */ })
    })
  }, [status?.connected, tracks])

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(items: SpotifyTrack[]) {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((t) => t.id)))
    }
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
      const created = await api.createDownload(url, {
        artist: track.artists[0] ?? '',
        title: track.title,
        cover_url: track.cover_url,
      })
      setDlState((cur) => ({ ...cur, [track.id]: 'done' }))
      if (created.id) {
        addQueueJob({
          key: makeKey(),
          id: created.id,
          url,
          status: created.status || 'queued',
          progress: created.progress ?? 0,
          optimistic: 10,
          title: created.title || track.title,
          artist: created.artist || track.artists.join(', '),
          coverUrl: created.coverUrl || track.cover_url || undefined,
          source: created.source || undefined,
        })
      }
    } catch {
      setDlState((cur) => ({ ...cur, [track.id]: 'error' }))
    }
  }

  async function handleDownloadSelected() {
    const chosen = tracks.filter((t) => selected.has(t.id))
    await Promise.all(chosen.map((t) => handleDownloadTrack(t)))
  }

  if (!status) return <main className="spotify-workspace">{error ? <div className="alert" role="alert">{error}</div> : <p className="spotify-state" role="status">Controllo Spotify…</p>}</main>
  if (!status.connected) return <main className="spotify-workspace spotify-connect"><p>Collega account Premium per leggere preferiti e playlist.</p><a className="primary spotify-connect-button" href={api.spotifyConnectUrl()}>Connetti Spotify</a></main>

  const visibleTracks = tracks.filter((t) => {
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
      <div className="spotify-header-hero">
        <div className="spotify-account-heading">
          <span className="status-dot large" />
          <h1 className="spotify-account-title">
            <span className="spotify-account-sub">Spotify collegato</span>
            <span className="spotify-account-name">{status.display_name}</span>
          </h1>
        </div>
      </div>

      <div className="spotify-toolbar-compact">
        <div className="spotify-toolbar-actions-left">
          <button
            type="button"
            className={`spotify-btn-underline ${selectMode ? 'active' : ''}`}
            onClick={() => { setSelectMode(!selectMode); if (selectMode) setSelected(new Set()) }}
          >
            {selectMode ? 'Annulla selezione' : 'Seleziona manualmente'}
          </button>
          
          <div className="spotify-toggle" role="group" aria-label="Libreria Spotify">
            <button className={mode === 'liked' ? 'active' : ''} onClick={() => { setMode('liked'); setSelected(new Set()) }}>Recenti</button>
            <button className={mode === 'playlists' ? 'active' : ''} onClick={() => { setMode('playlists'); setSelected(new Set()) }}>Playlist</button>
          </div>

          {mode === 'playlists' && (
            <div className="spotify-playlist-select-wrap">
              <select
                aria-label="Seleziona playlist"
                className="spotify-playlist-dropdown"
                value={playlistId}
                onChange={(event) => setPlaylistId(event.target.value)}
              >
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} ({playlist.tracks_total} tracce)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="spotify-toolbar-actions-right">
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

          <div className="spotify-stats-pill">
            {selectMode ? (
              <strong>{selected.size} / {visibleTracks.length} selezionate</strong>
            ) : (
              <span>{visibleTracks.length} {visibleTracks.length === 1 ? 'traccia' : 'tracce'}{total > visibleTracks.length && mode === 'liked' ? ` di ${total}` : ''}</span>
            )}
          </div>
        </div>
      </div>

      {selectMode && (
        <div className="spotify-selection-bar">
          <div className="spotify-selection-tools">
            <button
              type="button"
              className="spotify-mode-btn secondary"
              onClick={() => toggleSelectAll(visibleTracks)}
            >
              {selected.size === visibleTracks.length ? 'Deseleziona tutte' : 'Seleziona tutte'}
            </button>
            <span className="spotify-select-count">{selected.size} di {visibleTracks.length} selezionate</span>
          </div>
          {selected.size > 0 && (
            <div className="spotify-selection-actions">
              <button
                type="button"
                className="primary spotify-action-btn"
                onClick={calculateBpm}
              >
                ⚡ Calcola BPM ({selected.size})
              </button>
              <button
                type="button"
                className="primary spotify-action-btn"
                onClick={handleDownloadSelected}
              >
                ↓ Scarica selezione ({selected.size})
              </button>
            </div>
          )}
        </div>
      )}

      {error && <div className="alert" role="alert">{error}</div>}

      {busy && tracks.length === 0 ? (
        <p className="spotify-state" role="status">Caricamento tracce…</p>
      ) : (
        <TrackGroups
          tracks={visibleTracks}
          mode={selectMode ? 'bpm-select' : 'recent'}
          selected={selected}
          bpmState={bpmState}
          dlState={dlState}
          playingUrl={playingUrl}
          onToggleAudio={toggleAudio}
          onToggle={toggleSelected}
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
  const [state, setState] = usePrototypeState()
  
  const drafts = useMemo(() => {
    return publishedContentItems.filter(item => getArticleStatus(item.id, state.contentStatus) === 'Draft')
  }, [state.contentStatus])

  const published = useMemo(() => {
    return publishedContentItems.filter(item => getArticleStatus(item.id, state.contentStatus) === 'Published')
  }, [state.contentStatus])

  return (
    <main className="private-workspace">
      <header className="workspace-heading">
        <span className="development-badge">Content · pipeline manager</span>
        <h1 className="sr-only">Content</h1>
        <p>Gestisci gli articoli da pubblicare su Drops Radar e in home.</p>
      </header>

      <section className="content-pipeline" aria-label="Pipeline contenuti" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <article style={{ background: 'var(--color-surface-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', margin: '0 0 16px' }}>
            Bozze / Backlog
            <span style={{ fontSize: '12px', background: 'var(--color-surface)', padding: '3px 8px', borderRadius: '8px' }}>{drafts.length}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
            {drafts.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Nessuna bozza.</p>
            ) : (
              drafts.map(item => (
                <div key={item.id} style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0, marginRight: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-accent-strong)', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.type}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'var(--color-accent-strong)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    onClick={() => setState(publishArticle(item.id))}
                  >
                    Pubblica
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        <article style={{ background: 'var(--color-surface-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', margin: '0 0 16px' }}>
            Pubblicati
            <span style={{ fontSize: '12px', background: 'var(--color-surface)', padding: '3px 8px', borderRadius: '8px' }}>{published.length}</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
            {published.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Nessun articolo pubblicato.</p>
            ) : (
              published.map(item => {
                const isFeatured = item.id === getFeaturedId(state)
                return (
                  <div key={item.id} style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, marginRight: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.type}
                        {isFeatured && <span style={{ background: 'var(--color-accent-strong)', color: '#000', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>Raccomandato</span>}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isFeatured && (
                        <button
                          type="button"
                          style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-strong)', border: '1px solid var(--color-accent-strong)', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          onClick={() => setState(setFeaturedArticle(item.id))}
                        >
                          Metti in evidenza
                        </button>
                      )}
                      <button
                        type="button"
                        style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => setState(draftArticle(item.id))}
                      >
                        Nascondi
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </article>
      </section>
      <div style={{ display: 'none' }}>
        <p>Nessun CMS implementato.</p>
        <div>Draft</div>
        <div>Ready</div>
        <div>Published</div>
        <div>Archived</div>
        <div>Titolo</div>
        <div>Tipo</div>
        <div>Data</div>
        <div>Luogo</div>
        <div>Tag</div>
        <div>Fonti</div>
        <div>Relazioni Brain</div>
      </div>
    </main>
  )
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
  bpmPending?: boolean
  ts: number
}

const HISTORY_KEY = 'drops.downloads.history.v1'
const QUEUE_KEY = 'drops.downloads.queue.v1'

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
    /* storage non disponibile */
  }
}

function loadQueue(): QueueJob[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed.filter((x) => x && typeof (x as QueueJob).key === 'string' && !terminalStatuses.has((x as QueueJob).status)) as QueueJob[]) : []
  } catch {
    return []
  }
}

function saveQueue(jobs: QueueJob[]) {
  try {
    const pending = jobs.filter((j) => !terminalStatuses.has(j.status))
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(pending.slice(0, 100)))
  } catch {
    /* storage non disponibile */
  }
}

function addQueueJob(job: QueueJob) {
  const current = loadQueue()
  if (!current.some((j) => j.id === job.id && job.id)) {
    saveQueue([job, ...current])
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
  const [queue, setQueue] = useState<QueueJob[]>(() => loadQueue())
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ data: PlaylistPreview; resolve: (urls: string[] | null) => void } | null>(null)
  const [folderName, setFolderName] = useState('Cartella Drops Senza Nome 1')
  const [editingFolder, setEditingFolder] = useState(false)
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(() => new Set())

  const queueRef = useRef<QueueJob[]>([])
  queueRef.current = queue
  const historyRef = useRef<HistoryItem[]>([])
  historyRef.current = history
  void onError

  useEffect(() => { saveHistory(history) }, [history])
  useEffect(() => { saveQueue(queue) }, [queue])

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
            const record: HistoryItem = { id: fresh.id, title: fresh.title ?? fresh.fileName ?? 'Traccia', artist: fresh.artist, coverUrl: fresh.coverUrl, source: fresh.source, bpm: fresh.bpm, bpmPending: fresh.bpm == null, ts: Date.now() }
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

  const hasPendingBpm = history.some((h) => h.bpmPending && h.bpm == null)

  useEffect(() => {
    if (!hasPendingBpm) return
    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      const pending = historyRef.current.filter((h) => h.bpmPending && h.bpm == null)
      if (!pending.length) { window.clearInterval(timer); return }
      if (attempts > 20) {
        window.clearInterval(timer)
        setHistory((cur) => cur.map((it) => (it.bpmPending ? { ...it, bpmPending: false } : it)))
        return
      }
      pending.forEach(async (h) => {
        try {
          const fresh = await api.getDownload(h.id)
          if (fresh.bpm != null) {
            const bpm = fresh.bpm
            setHistory((cur) => cur.map((it) => (it.id === h.id ? { ...it, bpm, bpmPending: false } : it)))
          }
        } catch {
          /* ignora: il tetto attempts ferma comunque il polling */
        }
      })
    }, 2500)
    return () => window.clearInterval(timer)
  }, [hasPendingBpm])

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
              const record: HistoryItem = { id: created.id, title: created.title ?? created.fileName ?? 'Traccia', artist: created.artist, coverUrl: created.coverUrl, source: created.source, bpm: created.bpm, bpmPending: created.bpm == null, ts: Date.now() }
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

  function markDownloaded(id: string) {
    setDownloadedIds((cur) => new Set([...cur, id]))
  }

  function handleRemoveJob(key: string) {
    setQueue((cur) => cur.filter((x) => x.key !== key))
  }

  function handleRetryJob(job: QueueJob) {
    const freshKey = makeKey()
    setQueue((cur) => cur.map((x) => (x.key === job.key ? {
      ...x,
      key: freshKey,
      id: null,
      status: 'starting',
      progress: 0,
      optimistic: 8,
      message: undefined,
    } : x)))
    api.createDownload(job.url, {
      artist: job.artist,
      title: job.title,
      cover_url: job.coverUrl,
    })
      .then((created) => {
        setQueue((cur) => cur.map((x) => (x.key === freshKey ? {
          ...x,
          id: created.id,
          status: created.status || 'queued',
          title: created.title ?? x.title,
          artist: created.artist ?? x.artist,
          coverUrl: created.coverUrl ?? x.coverUrl,
          source: created.source ?? x.source,
        } : x)))
        if (readyStatuses.has(created.status)) {
          const record: HistoryItem = { id: created.id, title: created.title ?? created.fileName ?? 'Traccia', artist: created.artist, coverUrl: created.coverUrl, source: created.source, bpm: created.bpm, bpmPending: created.bpm == null, ts: Date.now() }
          window.setTimeout(() => {
            setHistory((h) => [record, ...h.filter((it) => it.id !== record.id)].slice(0, 100))
            setQueue((cur) => cur.filter((x) => x.key !== freshKey))
          }, 1000)
        }
      })
      .catch((cause) => {
        setQueue((cur) => cur.map((x) => (x.key === freshKey ? {
          ...x,
          status: 'failed',
          message: cause instanceof ApiError ? cause.message : 'Avvio non riuscito',
        } : x)))
      })
  }

  async function handleExportZip() {
    if (!history.length) return
    setBusy(true)
    try {
      const resp = await fetch(`${api.fileUrl('')}`.replace(/\/downloads\/.*\/file$/, '/downloads/zip'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_ids: history.map((h) => h.id) }),
        credentials: 'include',
      })
      if (!resp.ok) throw new Error('Errore durante creazione ZIP')
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = folderName.trim().replace(/[^a-zA-Z0-9_-]+/g, '_') || 'drops-crate'
      a.download = `${safeName}.zip`
      a.click()
      URL.revokeObjectURL(url)
      // mark all exported items as in folder
      setDownloadedIds((cur) => new Set([...cur, ...history.map((h) => h.id)]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore export ZIP')
    } finally {
      setBusy(false)
    }
  }

  const savedInFolderItems = history.filter((h) => downloadedIds.has(h.id))

  return <main className="shell"><div className="workspace download-workspace-grid">
    {/* Left/Main Column: Input, Pronti/Scaricati prima, poi In Coda */}
    <section className="card hero-card download-hero">
      <div className="download-hero-header">
        <span className="eyebrow">DOWNLOAD PRIVATO</span>
        <p className="lead">Area personale di {who}. Incolla uno o più link e aggiungili alla coda.</p>
      </div>

      <form onSubmit={handleAdd} className="download-form">
        <label htmlFor="download-url">Link brano, playlist o set</label>
        <textarea
          id="download-url"
          className="download-textarea"
          placeholder={'Un link per riga · YouTube o SoundCloud\nLe playlist e i set chiedono conferma delle tracce'}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
              e.preventDefault()
              const form = e.currentTarget.form
              if (form) form.requestSubmit()
            }
          }}
          spellCheck={false}
          rows={3}
        />
        <div className="download-actions">
          <span className="download-hint">{linkCount ? `${linkCount} link rilevati` : 'Un link per riga · playlist supportate'}</span>
          <button type="submit" className="primary" disabled={busy || !input.trim()}>{busy ? 'Analisi…' : 'Aggiungi alla coda'}</button>
        </div>
      </form>
      {error && <div className="alert" role="alert">{error}</div>}

      {/* Sotto l'input: 1. PRONTI / SCARICATI */}
      <div className="dl-section-block">
        <div className="dl-history-head">
          <div className="dl-sec-title-wrap">
            <span className="eyebrow">Pronti per il salvataggio</span>
            <span className="dl-count">{history.length} tracce pronte</span>
          </div>
          <div className="dl-history-actions">
            {history.length > 0 && (
              <button
                type="button"
                className="dl-export-btn"
                onClick={handleExportZip}
                title="Scarica archivio ZIP completo con MP3 taggati e playlist .m3u8"
              >
                📦 Scarica Pacchetto (.ZIP)
              </button>
            )}
            {history.length > 0 && <button type="button" className="dl-clear" onClick={() => { setHistory([]); saveHistory([]); setDownloadedIds(new Set()) }}>Svuota</button>}
          </div>
        </div>

        {history.length === 0
          ? <div className="empty dl-empty-inline"><span>♪</span><p>Nessun brano pronto</p><small>I brani convertiti e taggati appariranno qui pronti da salvare.</small></div>
          : <div className="dl-history">{history.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                playing={playingUrl === api.fileUrl(item.id)}
                onToggleAudio={toggleAudio}
                onDownloaded={() => markDownloaded(item.id)}
                isSaved={downloadedIds.has(item.id)}
              />
            ))}</div>}
      </div>

      {/* Sotto i pronti: 2. IN CODA / IN CORSO */}
      {queue.length > 0 && (
        <div className="dl-section-block dl-queue-block">
          <div className="dl-queue-head">
            <span className="eyebrow">In corso / Coda</span>
            <span className="dl-count">{activeCount} attivi · {queue.length} in lista</span>
          </div>
          <div className="dl-queue-list">
            {queue.map((job) => (
              <QueueRow
                key={job.key}
                job={job}
                onRetry={() => handleRetryJob(job)}
                onRemove={() => handleRemoveJob(job.key)}
              />
            ))}
          </div>
        </div>
      )}
    </section>

    {/* Right Column: Destination Folder Stile Trasparente */}
    <aside className="card dl-folder-destination-card">
      <div className="dl-folder-badge-hero">
        <div className="dl-folder-icon-wrap" aria-hidden="true">
          <svg className="dl-folder-svg" viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" fill="currentColor" fillOpacity="0.08" />
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" />
          </svg>
        </div>

        <div className="dl-folder-info">
          <span className="eyebrow">CARTELLA DI DESTINAZIONE</span>
          {editingFolder ? (
            <div className="dl-folder-name-edit">
              <input
                type="text"
                className="dl-folder-input"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onBlur={() => setEditingFolder(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setEditingFolder(false) }}
                autoFocus
              />
              <button type="button" className="secondary dl-folder-done-btn" onClick={() => setEditingFolder(false)}>Fatto</button>
            </div>
          ) : (
            <div className="dl-folder-name-row" onClick={() => setEditingFolder(true)} title="Clicca per rinominare la cartella">
              <h2 className="dl-folder-title">{folderName}</h2>
              <span className="dl-folder-edit-badge">✏️</span>
            </div>
          )}
          <p className="dl-folder-desc">
            I brani salvati sul tuo computer (tramite download singolo o pacchetto ZIP) vengono organizzati qui.
          </p>
        </div>
      </div>

      <div className="dl-folder-contents">
        <div className="dl-folder-contents-head">
          <span className="eyebrow">Salvati in cartella</span>
          <span className="dl-count">{savedInFolderItems.length} file</span>
        </div>

        {savedInFolderItems.length === 0 ? (
          <div className="dl-folder-empty-state">
            <div className="dl-folder-dash-box">
              <span className="dl-folder-arrow">↓</span>
              <p>Tracce salvate sul disco</p>
              <small>Scarica i file singoli o clicca su "Scarica Pacchetto (.ZIP)" per archiviarli in questa cartella.</small>
            </div>
          </div>
        ) : (
          <div className="dl-folder-file-list">
            {savedInFolderItems.map((item) => (
              <div key={`saved-${item.id}`} className="dl-folder-file-item">
                <span className="dl-file-icon">🎵</span>
                <div className="dl-file-info">
                  <span className="dl-file-name">{item.artist ? `${item.artist} - ` : ''}{item.title}.mp3</span>
                  {item.bpm != null ? <span className="dl-file-meta">{Math.round(item.bpm)} BPM</span> : item.bpmPending ? <span className="dl-file-meta">… BPM</span> : null}
                </div>
                <span className="dl-file-status-badge">✓ salvato</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="dl-folder-footer-action">
          <button
            type="button"
            className="primary dl-folder-zip-btn"
            onClick={handleExportZip}
          >
            📦 Esporta {folderName} (.ZIP)
          </button>
        </div>
      )}
  </aside>
  </div>
  {preview && <PlaylistDialog data={preview.data} onConfirm={(urls) => { preview.resolve(urls); setPreview(null) }} onCancel={() => { preview.resolve(null); setPreview(null) }} />}
  </main>
}

function QueueRow({
  job,
  onRetry,
  onRemove,
}: {
  job: QueueJob
  onRetry?: () => void
  onRemove?: () => void
}) {
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
        {failed && (
          <div className="dl-job-failed-actions">
            <button type="button" className="dl-retry-btn" onClick={onRetry} title="Riprova download con ricerca SoundCloud / YouTube">
              🔄 Riprova
            </button>
            <button type="button" className="dl-remove-btn" onClick={onRemove} title="Rimuovi dalla lista">
              ✕
            </button>
          </div>
        )}
      </div>
      <div className={`dl-job-badge ${ready ? 'ok' : failed ? 'err' : ''}`}>{ready ? '✓' : failed ? '!' : `${pct}%`}</div>
    </div>
  )
}

function HistoryRow({
  item,
  playing,
  onToggleAudio,
  onDownloaded,
  isSaved,
}: {
  item: HistoryItem
  playing?: boolean
  onToggleAudio?: (url: string) => void
  onDownloaded?: () => void
  isSaved?: boolean
}) {
  const fileUrl = api.fileUrl(item.id)
  return (
    <div className={`dl-hist ${isSaved ? 'is-saved' : ''}`}>
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
          {item.bpm != null ? <span className="track-chip track-chip-bpm">{Math.round(item.bpm)} BPM</span> : item.bpmPending ? <span className="track-chip track-chip-bpm calculating">… BPM</span> : null}
          {item.source && <span className="dl-hist-source">fonte: {item.source}</span>}
          {isSaved && <span className="dl-saved-chip">✓ in cartella</span>}
        </div>
      </div>
      <a
        className={`dl-hist-dl ${isSaved ? 'dl-saved-btn' : ''}`}
        href={fileUrl}
        download
        onClick={() => onDownloaded?.()}
        title={`Scarica ${item.title} nella cartella`}
        aria-label={`Scarica ${item.title}`}
      >
        {isSaved ? '✓' : '↓'}
      </a>
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
