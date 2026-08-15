import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

async function fillLogin(username = 'dj', password = 'secret') {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Password'), password)
  return user
}

describe('autenticazione App', () => {
  beforeEach(() => window.history.replaceState({}, '', '/app/login'))

  it('mostra credenziali non valide senza confonderle con sessione scaduta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)).mockResolvedValueOnce(jsonResponse({}, 401)))
    render(<App section="login" navigate={vi.fn()} />)
    const user = await fillLogin('errato', 'errata')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenziali non valide.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('Sessione scaduta')
  })

  it('mostra messaggio italiano quando API non è raggiungibile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<App section="login" navigate={vi.fn()} />)
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Accedi' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Non riusciamo a contattare il servizio')
  })

  it('impedisce invii login duplicati mentre richiesta è attiva', async () => {
    let resolveLogin!: (response: Response) => void
    const pendingLogin = new Promise<Response>((resolve) => { resolveLogin = resolve })
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)).mockReturnValueOnce(pendingLogin)
    vi.stubGlobal('fetch', fetchMock)
    render(<App section="login" navigate={vi.fn()} />)
    await fillLogin()
    const form = screen.getByRole('button', { name: 'Accedi' }).closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Accesso…' })).toBeDisabled()
    await act(async () => resolveLogin(jsonResponse({ user: { username: 'dj' } })))
  })

  it('mantiene redirect next dopo login', async () => {
    window.history.replaceState({}, '', '/app/login?next=%2Fapp%2Fdownload')
    const navigate = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)).mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } })))
    render(<App section="login" navigate={navigate} />)
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Accedi' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/app/download'))
  })

  it('reindirizza sessione esistente aperta su login', async () => {
    window.history.replaceState({}, '', '/app/login?next=%2Fapp%2Fcontent')
    const navigate = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } })))
    render(<App section="login" navigate={navigate} />)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/app/content'))
  })

  it('protegge route privata e preserva destinazione', async () => {
    const navigate = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)))
    render(<App section="graph" navigate={navigate} />)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/app/login?next=%2Fapp%2Fgraph'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('logout invalida stato locale e torna al login anche se chiamata termina', async () => {
    const navigate = vi.fn()
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } })).mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App section="home" navigate={navigate} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Esci' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/app/login'))
    expect(await screen.findByLabelText('Username')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/auth/logout'), expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('non mostra errori durante controllo iniziale silenzioso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('offline')))
    render(<App section="login" navigate={vi.fn()} />)
    expect(await screen.findByLabelText('Username')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('crea job e mostra download artefatto quando sessione valida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })).mockResolvedValueOnce(jsonResponse({ id: 'abc', status: 'ready', filename: 'set.mp3' })))
    render(<App section="download" navigate={vi.fn()} />)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('URL contenuto'), 'https://example.com/track')
    await user.click(screen.getByRole('button', { name: 'Scarica' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Scarica artefatto' })).toHaveAttribute('href', expect.stringContaining('/api/v1/downloads/abc/file')))
  })
})
