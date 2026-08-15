import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  beforeEach(() => {
    window.history.replaceState({}, '', '/app/login')
    vi.stubEnv('PUBLIC_API_URL', 'https://api.drops.test')
    window.localStorage.clear()
  })

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

  it('login diretto apre download', async () => {
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

  it('reindirizza sessione esistente senza next verso download', async () => {
    const navigate = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } })))
    render(<App section="login" navigate={navigate} />)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/app/download'))
  })

  it('protegge route privata e preserva destinazione', async () => {
    const navigate = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({}, 401)))
    render(<App section="radar" navigate={navigate} />)
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/app/login?next=%2Fapp%2Fradar'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('logout invalida subito stato locale e torna a Discovery', async () => {
    const navigate = vi.fn()
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } })).mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App section="content" navigate={navigate} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Esci' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'))
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/v1/auth/logout'), expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('dopo logout header pubblico torna a Login', async () => {
    const navigate = vi.fn()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ user: { username: 'dj' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({}, 401))
    vi.stubGlobal('fetch', fetchMock)
    const privateView = render(<App section="content" navigate={navigate} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Esci' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/'))
    privateView.unmount()
    const { default: PublicHeader } = await import('./components/PublicHeader')
    render(<PublicHeader />)
    expect(await screen.findAllByRole('link', { name: 'Login' })).toHaveLength(2)
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

  it('espone navigazione privata approvata senza History o Graph', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })))
    render(<App section="brain" navigate={vi.fn()} />)
    const nav = await screen.findByRole('navigation', { name: 'Area privata' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Discovery', 'Download', 'Radar', 'Brain', 'Content'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/app/download', '/app/radar', '/app/brain', '/app/content'])
    expect(within(nav).queryByText('History')).not.toBeInTheDocument()
    expect(within(nav).queryByText('Graph')).not.toBeInTheDocument()
  })

  it('mantiene sessione tornando da Discovery nell’area privata', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ username: 'dj' }))
      .mockResolvedValueOnce(jsonResponse({ username: 'dj' }))
    vi.stubGlobal('fetch', fetchMock)
    const first = render(<App section="radar" navigate={vi.fn()} />)
    expect(await screen.findByRole('link', { name: 'Discovery' })).toHaveAttribute('href', '/')
    first.unmount()
    render(<App section="brain" navigate={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Brain', level: 1 })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.every(([url, options]) => String(url).endsWith('/api/v1/auth/me') && options.credentials === 'include')).toBe(true)
  })

  it('mostra Radar con fixture development, azioni attive e prototipo in localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })))
    render(<App section="radar" navigate={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Radar', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText('Development fixture')).toHaveLength(2)
    expect(screen.getByText(/possono emergere anche fuori/)).toBeInTheDocument()
    expect(screen.getByText(/salvato solo in questo browser/)).toBeInTheDocument()
    for (const action of ['Salva', 'Scarta', 'Collega al Brain', 'Trasforma in contenuto']) expect(screen.getAllByRole('button', { name: action })[0]).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset prototipo' })).toBeDisabled()

    await userEvent.click(screen.getAllByRole('button', { name: 'Collega al Brain' })[0])
    expect(await screen.findByRole('button', { name: 'Collegato ✓' })).toBeDisabled()
    expect(screen.getByText('Berlin label follow-up surfaced after linking', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset prototipo' })).not.toBeDisabled()
    expect(JSON.parse(window.localStorage.getItem('drops:dev-prototype:radar-brain:v1') ?? '{}').extraNodes).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Reset prototipo' }))
    expect(window.localStorage.getItem('drops:dev-prototype:radar-brain:v1')).toBeNull()
    expect(screen.queryByText('Berlin label follow-up surfaced after linking', { exact: false })).not.toBeInTheDocument()
  })

  it('mostra grafo Brain esistente con tipi, cluster e interazioni', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })))
    render(<App section="brain" navigate={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Brain', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Grafo Brain con 48 nodi e 82 relazioni/ })).toBeInTheDocument()
    for (const type of ['Artist', 'Label', 'City', 'Release', 'Set', 'Playlist', 'Party', 'Story']) expect(screen.getByText(type)).toBeInTheDocument()
    for (const cluster of ['Rominimal / hypnotic', 'House / tech', 'Soulful / deep', 'Mania / WOS']) expect(screen.getByText(cluster)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aggiungi nodo' })).not.toBeInTheDocument()

    const jane = screen.getByRole('button', { name: 'Jane Fitz, Artist' })
    fireEvent.pointerEnter(jane, { clientX: 100, clientY: 100 })
    expect(screen.getByRole('tooltip')).toHaveTextContent('co-fondatrice Night Moves')
    fireEvent.click(jane)
    expect(jane).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Andrea Saba, Artist' })).toHaveClass('dim')
    expect(screen.getByRole('button', { name: 'GNMR, Artist' })).not.toHaveClass('dim')
    fireEvent.click(screen.getByRole('button', { name: 'Mostra tutto' }))
    expect(screen.getByRole('button', { name: 'Andrea Saba, Artist' })).not.toHaveClass('dim')
    const beforeDrag = jane.getAttribute('transform')
    fireEvent.pointerDown(jane, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(window, { clientX: 240, clientY: 180 })
    fireEvent.pointerUp(window)
    expect(jane.getAttribute('transform')).not.toBe(beforeDrag)
  })

  it('mostra pipeline e campi Content senza CMS', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })))
    render(<App section="content" navigate={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Content', level: 1 })).toBeInTheDocument()
    for (const stage of ['Draft', 'Ready', 'Published', 'Archived']) expect(screen.getByText(stage)).toBeInTheDocument()
    for (const field of ['Titolo', 'Tipo', 'Data', 'Luogo', 'Tag', 'Fonti', 'Relazioni Brain']) expect(screen.getByText(field)).toBeInTheDocument()
    expect(screen.getByText(/Nessun CMS implementato\./)).toBeInTheDocument()
  })
})
