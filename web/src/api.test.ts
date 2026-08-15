import { describe, expect, it, vi } from 'vitest'
import { api, ApiError, normalizeJob, resolveApiUrl } from './api'

describe('API client', () => {
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

  it('normalizza job wrapped e snake_case', () => {
    expect(normalizeJob({ job: { job_id: 42, state: 'COMPLETED', file_name: 'mix.mp3' } })).toEqual({
      id: '42', status: 'completed', progress: undefined, title: undefined, fileName: 'mix.mp3', message: undefined,
    })
  })
})
