import { describe, expect, it, vi } from 'vitest'
import { api, ApiError, normalizeJob } from './api'

describe('API client', () => {
  it.each([[401, 'Sessione scaduta'], [403, 'permessi'], [429, 'Troppe richieste']])('mappa errore HTTP %i', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status, headers: { 'content-type': 'application/json' } })))
    await expect(api.me()).rejects.toMatchObject({ status, message: expect.stringContaining(message) } satisfies Partial<ApiError>)
  })

  it('normalizza job wrapped e snake_case', () => {
    expect(normalizeJob({ job: { job_id: 42, state: 'COMPLETED', file_name: 'mix.mp3' } })).toEqual({
      id: '42', status: 'completed', progress: undefined, title: undefined, fileName: 'mix.mp3', message: undefined,
    })
  })
})
