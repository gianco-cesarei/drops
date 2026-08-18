import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { api, ApiError } from './api'
import type { Job, User } from './api'
import { postLoginRoute } from './lib/routes'
import { brainNodeTypes, contentFields, contentStages, radarDevelopmentFixtures } from './data/private.fixture'

export type PrivateSection = 'login' | 'download' | 'radar' | 'brain' | 'content' | 'editorial-suggestions' | 'settings'

const terminalStatuses = new Set(['completed', 'complete', 'ready', 'failed', 'error', 'cancelled'])
const readyStatuses = new Set(['completed', 'complete', 'ready'])
const failedStatuses = new Set(['failed', 'error', 'cancelled'])
const queuedStatuses = new Set(['queued', 'pending'])
const statusLabels: Record<string, string> = {
  queued: 'In coda', pending: 'In coda', downloading: 'Download in corso', processing: 'Elaborazione…',
}
const browserNavigate = (to: string) => window.location.assign(to)

export default function App({ section = 'login', navigate = browserNavigate }: { section?: PrivateSection; navigate?: (to: string) => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [logoutRedirecting, setLogoutRedirecting] = useState(false)

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) setUser(null)
    setError(cause instanceof Error ? cause.message : 'Errore imprevisto.')
  }, [])

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!checking && !user && section !== 'login' && !logoutRedirecting) {
      const next = encodeURIComponent(`/app/${section}`)
      navigate(`/app/login?next=${next}`)
    }
  }, [checking, logoutRedirecting, navigate, section, user])

  useEffect(() => {
    if (!checking && user && section === 'login') navigate(postLoginRoute(window.location.search))
  }, [checking, navigate, section, user])

  function completeLogin(loggedUser: User) {
    setUser(loggedUser)
  }

  function beginLogout() {
    setLogoutRedirecting(true)
    setUser(null)
  }

  function finishLogout() { navigate('/') }

  if (checking) return <Loading />
  if (logoutRedirecting) return <Loading />
  if (!user) return <Login onLogin={completeLogin} error={error} setError={setError} />
  if (section === 'download') return <PrivateFrame user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Download user={user} onError={handleError} error={error} setError={setError} /></PrivateFrame>
  if (section === 'radar') return <PrivateFrame user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Radar /></PrivateFrame>
  if (section === 'brain') return <PrivateFrame user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Brain /></PrivateFrame>
  if (section === 'content') return <PrivateFrame user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><Content /></PrivateFrame>
  return <PrivateFrame user={user} onLogoutStart={beginLogout} onLogoutEnd={finishLogout}><PrivatePlaceholder section={section} /></PrivateFrame>
}

function Brand() {
  return <div className="brand"><div className="logo">Drops<span>.</span></div></div>
}

function Loading() {
  return <main className="center"><div className="login-card"><Brand /><p className="muted" role="status">Controllo sessione…</p></div></main>
}

function Login({ onLogin, error, setError }: { onLogin: (user: User) => void; error: string; setError: (value: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setBusy(true); setError('')
    try { onLogin(await api.login(username, password)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Accesso non riuscito.') }
    finally { submitting.current = false; setBusy(false) }
  }

  return <main className="center"><section className="login-card">
    <Brand />
    <div className="login-heading"><h1>Accedi</h1><p className="muted">Entra nella tua area privata.</p></div>
    <form onSubmit={submit} className="form-stack">
      <label>Username<input type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <div className="alert" role="alert">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? 'Accesso…' : 'Accedi'}</button>
    </form>
  </section></main>
}

function PrivateFrame({ user, onLogoutStart, onLogoutEnd, children }: { user: User; onLogoutStart: () => void; onLogoutEnd: () => void; children: ReactNode }) {
  async function logout() {
    onLogoutStart()
    try { await api.logout() } catch { /* Local session remains invalidated. */ } finally { onLogoutEnd() }
  }
  return <div className="private-layout">
    <header className="private-header"><a href="/" className="logo">Drops<span>.</span></a><nav aria-label="Area privata"><a href="/">Discovery</a><a href="/app/download">Download</a><a href="/app/radar">Radar</a><a href="/app/brain">Brain</a><a href="/app/content">Content</a></nav><div className="account"><span>{user.name ?? user.username ?? user.email ?? 'Account'}</span><button className="secondary" onClick={logout}>Esci</button></div></header>
    {children}
  </div>
}

function PrivatePlaceholder({ section }: { section: PrivateSection }) {
  const labels: Record<PrivateSection, string> = {
    login: 'Login', download: 'Download', radar: 'Radar', brain: 'Brain', content: 'Content',
    'editorial-suggestions': 'Editorial suggestions', settings: 'Settings',
  }
  return <main className="private-placeholder"><span className="development-badge">Private development shell</span><h1>{labels[section]}</h1><p>Strumento non implementato in questa milestone.</p></main>
}

function Radar() {
  const actions = ['Salva', 'Scarta', 'Collega al Brain', 'Trasforma in contenuto']
  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Radar · development shell</span><h1>Radar</h1><p>Segnali guidati dal Brain, con fonti che possono emergere anche fuori dalle relazioni già presenti.</p></header><div className="radar-grid">{radarDevelopmentFixtures.map((item) => <article className="radar-card" key={item.id}><span className="fixture-label">Development fixture</span><h2>{item.title}</h2><dl><div><dt>Fonte</dt><dd>{item.source}</dd></div><div><dt>Data</dt><dd>{item.date}</dd></div><div><dt>Luogo</dt><dd>{item.location}</dd></div><div><dt>Categoria</dt><dd>{item.category}</dd></div></dl><section><h3>Perché è rilevante</h3><p>{item.relevance}</p></section><div className="planned-actions" aria-label="Azioni previste">{actions.map((action) => <button type="button" disabled key={action}>{action}</button>)}</div></article>)}</div></main>
}

function Brain() {
  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Brain · development shell</span><h1>Brain</h1><p>Shell privata per nodi e relazioni. Nessuna visualizzazione grafica definitiva.</p></header><section className="tool-shell"><h2>Tipi di nodo previsti</h2><div className="type-list">{brainNodeTypes.map((type) => <span key={type}>{type}</span>)}</div><div className="planned-actions" aria-label="Azioni Brain previste"><button disabled>Aggiungi nodo</button><button disabled>Aggiungi relazione</button><button disabled>Importa da Radar</button></div></section></main>
}

function Content() {
  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Content · development shell</span><h1>Content</h1><p>Pipeline editoriale strutturale. Nessun CMS implementato.</p></header><section className="content-pipeline" aria-label="Pipeline contenuti">{contentStages.map((stage) => <article key={stage}><h2>{stage}</h2><p>0 development items</p></article>)}</section><section className="tool-shell"><h2>Campi previsti</h2><div className="type-list">{contentFields.map((field) => <span key={field}>{field}</span>)}</div></section></main>
}

function Download({ user, onError, error, setError }: { user: User; onError: (error: unknown) => void; error: string; setError: (value: string) => void }) {
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<Job | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!job?.id || terminalStatuses.has(job.status)) return
    const timer = window.setInterval(async () => {
      try { setJob(await api.getDownload(job.id)) }
      catch (cause) { window.clearInterval(timer); onError(cause) }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [job?.id, job?.status, onError])

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setJob(null)
    try { setJob(await api.createDownload(url)); setUrl('') }
    catch (cause) { onError(cause) }
    finally { setBusy(false) }
  }

  return <main className="shell"><div className="workspace">
    <section className="card hero-card"><div><span className="eyebrow">DOWNLOAD PRIVATO</span><h1>Nuovo download</h1><p className="lead">Area personale di {user.name ?? user.username ?? 'utente'}.</p></div>
      <form onSubmit={submit} className="download-form"><label htmlFor="download-url">URL contenuto</label><div className="url-row"><input id="download-url" type="url" required placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} /><button className="primary" disabled={busy}>{busy ? 'Avvio…' : 'Scarica'}</button></div></form>{error && <div className="alert" role="alert">{error}</div>}
    </section>
    <aside className="card status-card"><span className="eyebrow">STATO JOB</span>{!job ? <div className="empty"><p>Nessun download attivo</p></div> : <TrackCard job={job} />}</aside>
  </div></main>
}

function TrackCard({ job }: { job: Job }) {
  const ready = readyStatuses.has(job.status)
  const failed = failedStatuses.has(job.status)
  const queued = queuedStatuses.has(job.status)
  const statusLabel = ready ? 'Pronto' : failed ? 'Download fallito' : statusLabels[job.status] ?? 'Elaborazione…'
  const progress = Math.max(0, Math.min(100, job.progress ?? (ready ? 100 : 0)))
  return <div className={`track-card ${ready ? 'ready' : failed ? 'failed' : ''}`}>
    <div className="track-cover" aria-hidden="true">{job.coverUrl ? <img src={job.coverUrl} alt="" /> : <span className="track-cover-fallback">♪</span>}</div>
    <div className="track-info">
      <p className="track-title">{job.title ?? job.fileName ?? `Job ${job.id}`}</p>
      {job.artist && <p className="track-artist">{job.artist}</p>}
      <div className="track-status-row"><span className="status-dot" /><span className="track-status-label">{statusLabel}</span></div>
      {!failed && !ready && <><div className="progress"><span style={{ width: `${queued ? 0 : progress}%` }} /></div><small>{!queued && progress ? `${progress}%` : ''}</small></>}
      {failed && <div className="alert" role="alert">{job.message ?? 'Il job non è stato completato. Riprova.'}</div>}
      {ready && <a className="primary download-link" href={api.fileUrl(job.id)} download>↓ Scarica file</a>}
    </div>
  </div>
}
