import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, normalizeJob, resolveApiUrl } from './api'

describe('API client', () => {
  beforeEach(() => vi.stubEnv('PUBLIC_API_URL', 'https://api.drops.test'))

  it.each([[401, 'Sessione scaduta'], [403, 'permessi'], [429, 'Troppe richieste']])('mappa errore HTTP %i', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status, headers: { 'content-type': 'application/json' } })))
    await expect(api.me()).rejects.toMatchObject({ status, message: expect.stringContaining(message) } satisfies Partial<ApiError>)
  })

  it('distingue 401 login da sessione scaduta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })))
    await expect(api.login('dj', 'wrong')).rejects.toMatchObject({ status: 401, message: 'Credenziali non valide.' })
  })

  it('traduce errore di rete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(api.login('dj', 'secret')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Non riusciamo a contattare il servizio') })
  })

  it('non usa fallback ambiguo fuori ambiente locale', () => {
    expect(resolveApiUrl(undefined, true)).toBe('http://localhost:8000')
    expect(() => resolveApiUrl(undefined, false)).toThrow('Configurazione API mancante')
    expect(resolveApiUrl('https://api.example.com/', false)).toBe('https://api.example.com')
  })

  it('usa API configurata per login, sessione e logout', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { username: 'dj' } }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { username: 'dj' } }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.login('dj', 'secret')
    await api.me()
    await api.logout()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.drops.test/api/v1/auth/login',
      'https://api.drops.test/api/v1/auth/me',
      'https://api.drops.test/api/v1/auth/logout',
    ])
    expect(fetchMock.mock.calls.every(([, options]) => options.credentials === 'include')).toBe(true)
  })

  it('normalizza job wrapped e snake_case con metadati', () => {
    expect(normalizeJob({ job: { job_id: 42, state: 'COMPLETED', file_name: 'mix.mp3' } })).toEqual({
      id: '42', status: 'completed', progress: undefined, title: undefined, artist: undefined, fileName: 'mix.mp3', coverUrl: undefined, message: undefined,
      label: undefined, year: undefined, styles: undefined, bpm: undefined, source: undefined,
    })

    expect(normalizeJob({
      id: 'job-99',
      status: 'ready',
      title: 'Baby',
      artist: 'Four Tet',
      cover_url: 'https://img.test/cover.jpg',
      label: 'Text Records',
      year: 2020,
      style: ['Electronic', 'House'],
      bpm: 122.4,
      source: 'soundcloud',
    })).toEqual({
      id: 'job-99',
      status: 'ready',
      progress: undefined,
      title: 'Baby',
      artist: 'Four Tet',
      fileName: undefined,
      coverUrl: 'https://img.test/cover.jpg',
      message: undefined,
      label: 'Text Records',
      year: 2020,
      styles: ['Electronic', 'House'],
      bpm: 122.4,
      source: 'soundcloud',
    })
  })
})
