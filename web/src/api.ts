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
  fileName?: string
  message?: string
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
}

export type SpotifyPlaylist = { id: string; name: string; tracks_total: number }

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
  return {
    id: String(raw.id ?? raw.job_id ?? ''),
    status: String(raw.status ?? raw.state ?? 'queued').toLowerCase(),
    progress: typeof raw.progress === 'number' ? raw.progress : undefined,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    fileName: typeof raw.file_name === 'string' ? raw.file_name : typeof raw.filename === 'string' ? raw.filename : undefined,
    message: typeof raw.message === 'string' ? raw.message : typeof raw.error === 'string' ? raw.error : undefined,
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
  createDownload: (url: string) =>
    request<unknown>('/api/v1/downloads', { method: 'POST', body: JSON.stringify({ url }) }).then(normalizeJob),
  getDownload: (id: string) => request<unknown>(`/api/v1/downloads/${encodeURIComponent(id)}`).then(normalizeJob),
  fileUrl: (id: string) => `${apiUrl()}/api/v1/downloads/${encodeURIComponent(id)}/file`,
  spotifyConnectUrl: () => `${apiUrl()}/api/v1/spotify/connect`,
  spotifyStatus: () => request<{ connected: boolean; display_name: string | null }>('/api/v1/spotify/status'),
  spotifyLiked: (limit = 100, offset = 0) => request<{ total: number; tracks: SpotifyTrack[] }>(`/api/v1/spotify/liked?limit=${limit}&offset=${offset}`),
  spotifyPlaylists: () => request<{ playlists: SpotifyPlaylist[] }>('/api/v1/spotify/playlists'),
  spotifyPlaylistTracks: (id: string) => request<{ total: number; tracks: SpotifyTrack[] }>(`/api/v1/spotify/playlists/${encodeURIComponent(id)}/tracks`),
}
