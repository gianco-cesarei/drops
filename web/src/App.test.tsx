import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('App', () => {
  it('mostra login dopo sessione 401 e apre dashboard', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ user: { email: 'dj@example.com' } }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'dj@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))
    expect(await screen.findByText('dj@example.com')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/auth/login'), expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('crea job e mostra download artefatto quando pronto', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ email: 'dj@example.com' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'abc', status: 'ready', filename: 'set.mp3' })))
    render(<App />)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('URL contenuto'), 'https://example.com/track')
    await user.click(screen.getByRole('button', { name: 'Scarica' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Scarica artefatto' })).toHaveAttribute('href', expect.stringContaining('/api/v1/downloads/abc/file')))
  })
})
