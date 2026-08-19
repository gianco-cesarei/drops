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

  it('crea job e lo sposta tra gli scaricati quando pronto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })).mockResolvedValueOnce(jsonResponse({ id: 'abc', status: 'ready', filename: 'set.mp3' })))
    render(<App section="download" navigate={vi.fn()} />)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Link brano, playlist o set'), 'https://example.com/track')
    await user.click(screen.getByRole('button', { name: 'Aggiungi alla coda' }))
    const link = await screen.findByRole('link', { name: /Scarica set\.mp3/ }, { timeout: 3000 })
    expect(link).toHaveAttribute('href', expect.stringContaining('/api/v1/downloads/abc/file'))
  }, 15000)

  it('accoda il job e avanza da coda a pronto via polling', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ username: 'dj' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'job-1', status: 'queued', title: 'My Track', artist: 'DJ Someone' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'job-1', status: 'downloading', progress: 40, title: 'My Track', artist: 'DJ Someone' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'job-1', status: 'ready', title: 'My Track', artist: 'DJ Someone' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App section="download" navigate={vi.fn()} />)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Link brano, playlist o set'), 'https://soundcloud.com/example/track')
    await user.click(screen.getByRole('button', { name: 'Aggiungi alla coda' }))

    expect(await screen.findByText('My Track')).toBeInTheDocument()
    expect(await screen.findByText('In coda', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(await screen.findByText('Scarico…', {}, { timeout: 4000 })).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: /Scarica My Track/ }, { timeout: 8000 })
    expect(link).toHaveAttribute('href', expect.stringContaining('/api/v1/downloads/job-1/file'))
  }, 20000)

  it('mostra bpm e fonte tra gli scaricati', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ username: 'dj' }))
      .mockResolvedValueOnce(jsonResponse({
        id: 'job-rich',
        status: 'ready',
        title: 'Baby',
        artist: 'Four Tet',
        cover_url: 'https://img.test/fourtet.jpg',
        bpm: 122.0,
        source: 'soundcloud',
      }))
    vi.stubGlobal('fetch', fetchMock)
    render(<App section="download" navigate={vi.fn()} />)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Link brano, playlist o set'), 'https://youtube.com/watch?v=123')
    await user.click(screen.getByRole('button', { name: 'Aggiungi alla coda' }))

    const link = await screen.findByRole('link', { name: /Scarica Baby/ }, { timeout: 3000 })
    expect(link).toHaveAttribute('href', expect.stringContaining('/api/v1/downloads/job-rich/file'))
    expect(screen.getByText('Four Tet')).toBeInTheDocument()
    expect(screen.getByText('122 BPM')).toBeInTheDocument()
    expect(screen.getByText('fonte: soundcloud')).toBeInTheDocument()
  }, 15000)

  it('espone navigazione privata approvata senza History o Graph', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })))
    render(<App section="brain" navigate={vi.fn()} />)
    const nav = await screen.findByRole('navigation', { name: 'Area privata' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Discovery', 'Download', 'Spotify', 'Radar', 'Brain', 'Content'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/app/download', '/app/spotify', '/app/radar', '/app/brain', '/app/content'])
    expect(within(nav).queryByText('History')).not.toBeInTheDocument()
    expect(within(nav).queryByText('Graph')).not.toBeInTheDocument()
  })

  it('mostra Spotify collegato con Recenti, ricerca e selezione multipla per BPM/Download', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse({ username: 'dj' }))
      .mockResolvedValueOnce(jsonResponse({ connected: true, display_name: 'Gianco' }))
      .mockResolvedValueOnce(jsonResponse({ total: 2, tracks: [
        { id: '1', title: 'Signal A', artists: ['Artist A'], album: 'Album A', label: 'Night Label', cover_url: 'https://img.test/a.jpg', isrc: 'IT1', added_at: '2026-08-01T00:00:00Z', duration_ms: 1000, bpm: 124, in_catalog: true },
        { id: '2', title: 'Signal B', artists: ['Artist B'], album: 'Album B', label: null, cover_url: null, isrc: null, added_at: null, duration_ms: 2000, bpm: null, in_catalog: false },
      ] }))
      .mockResolvedValueOnce(jsonResponse(null))
      .mockResolvedValueOnce(jsonResponse(null)))
    render(<App section="spotify" navigate={vi.fn()} />)
    expect(await screen.findByText('Gianco')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recenti' })).toHaveClass('active')
    expect(await screen.findByText('Signal A')).toBeInTheDocument()
    expect(screen.getByText('124')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apri Signal A su YouTube' })).toHaveAttribute('target', '_blank')
    
    // Attiva selezione tracce
    await userEvent.click(screen.getByRole('button', { name: 'Seleziona manualmente' }))
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    
    // Seleziona la prima traccia
    await userEvent.click(screen.getAllByRole('checkbox')[0])
    expect(screen.getByRole('button', { name: '⚡ Calcola BPM (1)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '↓ Scarica selezione (1)' })).toBeInTheDocument()
  })

  it('mostra connessione Spotify quando account non collegato', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ username: 'dj' })).mockResolvedValueOnce(jsonResponse({ connected: false, display_name: null })))
    render(<App section="spotify" navigate={vi.fn()} />)
    expect(await screen.findByRole('link', { name: 'Connetti Spotify' })).toHaveAttribute('href', 'https://api.drops.test/api/v1/spotify/connect')
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

describe('libreria Spotify', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/app/spotify')
    vi.stubEnv('PUBLIC_API_URL', 'https://api.drops.test')
    window.localStorage.clear()
  })

  it('pagina automaticamente i Preferiti oltre le prime 100 tracce, senza fermarsi a 200', async () => {
    const total = 130
    const makeTrack = (i: number) => ({
      id: `t${i}`, title: `Track ${i}`, artists: [`Artist ${i}`], album: 'Album', label: 'Known Label',
      cover_url: null, isrc: null, added_at: '2026-08-01T00:00:00Z', duration_ms: 1000, bpm: null, in_catalog: false,
    })
    const likedCalls: string[] = []
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/v1/auth/me')) return jsonResponse({ username: 'dj' })
      if (url.includes('/api/v1/spotify/status')) return jsonResponse({ connected: true, display_name: 'DJ' })
      if (url.includes('/api/v1/spotify/liked')) {
        likedCalls.push(url)
        const parsed = new URL(url)
        const limit = Number(parsed.searchParams.get('limit'))
        const offset = Number(parsed.searchParams.get('offset'))
        const count = Math.max(0, Math.min(limit, total - offset))
        const tracks = Array.from({ length: count }, (_, i) => makeTrack(offset + i))
        return jsonResponse({ total, limit, offset, tracks })
      }
      throw new Error(`unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<App section="spotify" navigate={vi.fn()} />)

    await screen.findByText('Track 0')
    await waitFor(() => expect(screen.getByText('Track 129')).toBeInTheDocument())
    expect(screen.queryByText(/Caricamento preferiti/)).not.toBeInTheDocument()
    expect(likedCalls).toEqual([
      'https://api.drops.test/api/v1/spotify/liked?limit=100&offset=0',
      'https://api.drops.test/api/v1/spotify/liked?limit=100&offset=100',
    ])
  })
})
