export type User = {
  id?: string | number
  email?: string
  name?: string
  username?: string
}

export type Job = {
  id: string
  status: string
  progress?: number
  title?: string
  artist?: string
  fileName?: string
  coverUrl?: string
  message?: string
  label?: string
  year?: number
  styles?: string[]
  bpm?: number
  source?: string
}

export type SpotifyTrack = {
  id: string
  title: string
  artists: string[]
  album: string
  label: string | null
  cover_url: string | null
  isrc: string | null
  added_at: string | null
  duration_ms: number | null
  bpm: number | null
  in_catalog: boolean
  year?: number | null
  country?: string | null
  styles?: string[]
  catalog_no?: string | null
  discogs_url?: string | null
  preview_url?: string | null
}

export type SpotifyPlaylist = { id: string; name: string; tracks_total: number }
export type PlaylistEntry = { url: string; title: string; uploader?: string; duration?: number | null }
export type PlaylistPreview = { title: string; entries: PlaylistEntry[]; count: number; truncated: boolean }
export type DiscogsEnrichment = { label: string | null; year?: number | null; country?: string | null; styles?: string[]; artists?: string[]; catalog_no?: string | null; discogs_url?: string | null }

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestContext = 'login' | 'session' | 'default'

export function resolveApiUrl(configuredValue: string | undefined, localMode: boolean): string {
  const configured = configuredValue?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (localMode) return 'http://localhost:8000'
  throw new ApiError(0, 'Configurazione API mancante. Contatta il supporto.')
}

const apiUrl = () => resolveApiUrl(import.meta.env.PUBLIC_API_URL, import.meta.env.DEV || import.meta.env.MODE === 'test')

const errorMessage = (status: number, payload: unknown, context: RequestContext) => {
  if (status === 401 && context === 'login') return 'Credenziali non valide.'
  if (status === 401) return 'Sessione scaduta. Accedi di nuovo.'
  if (status === 403) return 'Non hai i permessi per questa operazione.'
  if (status === 429) return 'Troppe richieste. Attendi qualche minuto e riprova.'
  if (status === 400 || status === 422) return 'Controlla i dati inseriti e riprova.'
  if (status === 404) return 'Contenuto non trovato.'
  if (status >= 500) return 'Servizio temporaneamente non disponibile. Riprova più tardi.'
  void payload
  return 'Operazione non riuscita. Riprova.'
}

async function request<T>(path: string, options: RequestInit = {}, context: RequestContext = 'default'): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (cause) {
    if (cause instanceof ApiError) throw cause
    throw new ApiError(0, 'Non riusciamo a contattare il servizio. Controlla la connessione e riprova.')
  }
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new ApiError(response.status, errorMessage(response.status, payload, context))
  return payload as T
}

const unwrapUser = (payload: User | { user: User }) => ('user' in payload ? payload.user : payload)

export const normalizeJob = (payload: unknown): Job => {
  const wrapped = payload as Record<string, unknown>
  const raw = ((wrapped?.job as Record<string, unknown>) ?? wrapped) || {}
  const rawStyles = raw.style ?? raw.styles
  const styles = Array.isArray(rawStyles)
    ? rawStyles.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : typeof rawStyles === 'string' && rawStyles.trim().length > 0
      ? [rawStyles.trim()]
      : undefined
  return {
    id: String(raw.id ?? raw.job_id ?? ''),
    status: String(raw.status ?? raw.state ?? 'queued').toLowerCase(),
    progress: typeof raw.progress === 'number' ? raw.progress : undefined,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    artist: typeof raw.artist === 'string' ? raw.artist : typeof raw.artist_name === 'string' ? raw.artist_name : undefined,
    fileName: typeof raw.file_name === 'string' ? raw.file_name : typeof raw.filename === 'string' ? raw.filename : undefined,
    coverUrl: typeof raw.cover_url === 'string' ? raw.cover_url : typeof raw.thumbnail === 'string' ? raw.thumbnail : typeof raw.thumbnail_url === 'string' ? raw.thumbnail_url : undefined,
    message: typeof raw.message === 'string' ? raw.message : typeof raw.error === 'string' ? raw.error : undefined,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : undefined,
    year: typeof raw.year === 'number' ? raw.year : undefined,
    styles,
    bpm: typeof raw.bpm === 'number' ? raw.bpm : undefined,
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source.trim() : undefined,
  }
}

export const api = {
  login: (username: string, password: string) =>
    request<User | { user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, 'login').then(unwrapUser),
  me: () => request<User | { user: User }>('/api/v1/auth/me', {}, 'session').then(unwrapUser),
  logout: () => request<void>('/api/v1/auth/logout', { method: 'POST' }),
  createDownload: (url: string, meta?: { artist?: string; title?: string; cover_url?: string | null }) =>
    request<unknown>('/api/v1/downloads', {
      method: 'POST',
      body: JSON.stringify({
        url,
        ...(meta?.artist ? { artist: meta.artist } : {}),
        ...(meta?.title ? { title: meta.title } : {}),
        ...(meta?.cover_url ? { cover_url: meta.cover_url } : {}),
      }),
    }).then(normalizeJob),
  getDownload: (id: string) => request<unknown>(`/api/v1/downloads/${encodeURIComponent(id)}`).then(normalizeJob),
  fileUrl: (id: string) => `${apiUrl()}/api/v1/downloads/${encodeURIComponent(id)}/file`,
  resolvePlaylist: (url: string) =>
    request<PlaylistPreview>('/api/v1/playlists/resolve', { method: 'POST', body: JSON.stringify({ url }) }),
  spotifyConnectUrl: () => `${apiUrl()}/api/v1/spotify/connect`,
  spotifyStatus: () => request<{ connected: boolean; display_name: string | null }>('/api/v1/spotify/status'),
  spotifyLiked: (limit = 100, offset = 0) => request<{ total: number; tracks: SpotifyTrack[] }>(`/api/v1/spotify/liked?limit=${limit}&offset=${offset}`),
  spotifyPlaylists: () => request<{ playlists: SpotifyPlaylist[] }>('/api/v1/spotify/playlists'),
  spotifyPlaylistTracks: (id: string) => request<{ total: number; tracks: SpotifyTrack[] }>(`/api/v1/spotify/playlists/${encodeURIComponent(id)}/tracks`),
  discogsEnrich: (track: Pick<SpotifyTrack, 'title' | 'artists' | 'isrc'>) => request<DiscogsEnrichment | null>('/api/v1/discogs/enrich', { method: 'POST', body: JSON.stringify({ artist: track.artists.join(', '), title: track.title, isrc: track.isrc }) }),
  bpmCompute: (track: Pick<SpotifyTrack, 'id' | 'title' | 'artists' | 'isrc'>, sourceUrl?: string) => request<{ job_id: string; status: string; bpm?: number; confidence?: number }>('/api/v1/bpm/compute', { method: 'POST', body: JSON.stringify({ track_key: track.id, artist: track.artists[0] ?? '', title: track.title, isrc: track.isrc, source_url: sourceUrl }) }),
  bpmJob: (jobId: string) => request<{ id: string; status: string; bpm?: number; confidence?: number; error?: string }>(`/api/v1/bpm/job/${encodeURIComponent(jobId)}`),
}
