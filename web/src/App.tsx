import { useCallback, useEffect, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { api, ApiError } from './api'
import type { Job, User } from './api'
import { postLoginRoute } from './lib/routes'

export type PrivateSection = 'home' | 'login' | 'download' | 'graph' | 'content' | 'editorial-suggestions' | 'history' | 'settings'

const terminalStatuses = new Set(['completed', 'complete', 'ready', 'failed', 'error', 'cancelled'])
const readyStatuses = new Set(['completed', 'complete', 'ready'])
const failedStatuses = new Set(['failed', 'error', 'cancelled'])

export default function App({ section = 'login', navigate = (to) => window.location.assign(to) }: { section?: PrivateSection; navigate?: (to: string) => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) setUser(null)
    setError(cause instanceof Error ? cause.message : 'Errore imprevisto.')
  }, [])

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (!checking && !user && section !== 'login') {
      const next = encodeURIComponent(`/app${section === 'home' ? '' : `/${section}`}`)
      navigate(`/app/login?next=${next}`)
    }
  }, [checking, navigate, section, user])

  function completeLogin(loggedUser: User) {
    setUser(loggedUser)
    if (section === 'login') navigate(postLoginRoute(window.location.search))
  }

  if (checking) return <Loading />
  if (!user) return <Login onLogin={completeLogin} error={error} setError={setError} />
  if (section === 'download') return <PrivateFrame user={user} onLogout={() => setUser(null)}><Download user={user} onError={handleError} error={error} setError={setError} /></PrivateFrame>
  return <PrivateFrame user={user} onLogout={() => setUser(null)}><PrivatePlaceholder section={section} /></PrivateFrame>
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

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try { onLogin(await api.login(username, password)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Accesso non riuscito.') }
    finally { setBusy(false) }
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

function PrivateFrame({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  async function logout() {
    try { await api.logout() } finally { onLogout(); window.location.assign('/app/login') }
  }
  return <div className="private-layout">
    <header className="private-header"><a href="/app" className="logo">Drops<span>.</span></a><nav><a href="/app/download">Download</a><a href="/app/content">Content</a><a href="/app/graph">Graph</a><a href="/app/history">History</a></nav><div className="account"><span>{user.name ?? user.username ?? user.email ?? 'Account'}</span><button className="secondary" onClick={logout}>Esci</button></div></header>
    {children}
  </div>
}

function PrivatePlaceholder({ section }: { section: PrivateSection }) {
  const labels: Record<PrivateSection, string> = {
    home: 'Area privata', login: 'Login', download: 'Download', graph: 'Graph', content: 'Content',
    'editorial-suggestions': 'Editorial suggestions', history: 'History', settings: 'Settings',
  }
  return <main className="private-placeholder"><span className="development-badge">Private development shell</span><h1>{labels[section]}</h1><p>Strumento non implementato in questa milestone.</p>{section === 'graph' && <p>Nessun grafo caricato o visualizzato.</p>}</main>
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
    }, 2000)
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
    <aside className="card status-card"><span className="eyebrow">STATO JOB</span>{!job ? <div className="empty"><p>Nessun download attivo</p></div> : <JobStatus job={job} />}</aside>
  </div></main>
}

function JobStatus({ job }: { job: Job }) {
  const ready = readyStatuses.has(job.status)
  const failed = failedStatuses.has(job.status)
  const progress = Math.max(0, Math.min(100, job.progress ?? (ready ? 100 : 0)))
  return <div className={`job ${ready ? 'ready' : failed ? 'failed' : ''}`}><div className="job-head"><span className="status-dot" /><strong>{ready ? 'Pronto' : failed ? 'Download fallito' : 'In elaborazione'}</strong></div><p className="job-title">{job.title ?? job.fileName ?? `Job ${job.id}`}</p>{!failed && <><div className="progress"><span style={{ width: `${progress}%` }} /></div><small>{progress ? `${progress}%` : 'Elaborazione in corso…'}</small></>}{failed && <div className="alert" role="alert">{job.message ?? 'Il job non è stato completato. Riprova.'}</div>}{ready && <a className="primary download-link" href={api.fileUrl(job.id)} download>Scarica artefatto</a>}</div>
}
