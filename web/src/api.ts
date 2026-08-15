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

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const errorMessage = (status: number, payload: unknown) => {
  if (status === 401) return 'Sessione scaduta. Accedi di nuovo.'
  if (status === 403) return 'Non hai i permessi per questa operazione.'
  if (status === 429) return 'Troppe richieste. Attendi e riprova.'
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    const detail = data.detail ?? data.message ?? data.error
    if (typeof detail === 'string') return detail
  }
  return `Richiesta non riuscita (${status}).`
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new ApiError(response.status, errorMessage(response.status, payload))
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
  login: (email: string, password: string) =>
    request<User | { user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(unwrapUser),
  me: () => request<User | { user: User }>('/api/v1/auth/me').then(unwrapUser),
  logout: () => request<void>('/api/v1/auth/logout', { method: 'POST' }),
  createDownload: (url: string) =>
    request<unknown>('/api/v1/downloads', { method: 'POST', body: JSON.stringify({ url }) }).then(normalizeJob),
  getDownload: (id: string) => request<unknown>(`/api/v1/downloads/${encodeURIComponent(id)}`).then(normalizeJob),
  fileUrl: (id: string) => `${API_URL}/api/v1/downloads/${encodeURIComponent(id)}/file`,
}
