import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, ApiError, Job, User } from './api'

const terminalStatuses = new Set(['completed', 'complete', 'ready', 'failed', 'error', 'cancelled'])
const readyStatuses = new Set(['completed', 'complete', 'ready'])
const failedStatuses = new Set(['failed', 'error', 'cancelled'])

export default function App() {
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

  if (checking) return <Loading />
  if (!user) return <Login onLogin={setUser} error={error} setError={setError} />
  return <Dashboard user={user} onUnauthorized={() => setUser(null)} onError={handleError} error={error} setError={setError} />
}

function Brand() {
  return <div className="brand"><div className="logo">Drops<span>.</span></div><p className="tagline">Musica e contenuti, nel tuo spazio.</p></div>
}

function Loading() {
  return <main className="center"><div className="login-card"><Brand /><p className="muted" role="status">Controllo sessione…</p></div></main>
}

function Login({ onLogin, error, setError }: { onLogin: (user: User) => void; error: string; setError: (value: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError('')
    try { onLogin(await api.login(username, password)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Accesso non riuscito.') }
    finally { setBusy(false) }
  }

  return <main className="center">
    <section className="login-card">
      <Brand />
      <div className="login-heading"><h1>Accedi</h1><p className="muted">Entra nel tuo spazio Drops.</p></div>
      <form onSubmit={submit} className="form-stack">
        <label>Username<input type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? 'Accesso…' : 'Accedi'}</button>
      </form>
    </section>
  </main>
}

function Dashboard({ user, onUnauthorized, onError, error, setError }: { user: User; onUnauthorized: () => void; onError: (e: unknown) => void; error: string; setError: (v: string) => void }) {
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

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setJob(null)
    try { setJob(await api.createDownload(url)); setUrl('') }
    catch (cause) { onError(cause) }
    finally { setBusy(false) }
  }

  async function logout() {
    setError('')
    try { await api.logout(); onUnauthorized() }
    catch (cause) { onError(cause) }
  }

  const displayName = user.name ?? user.username ?? user.email ?? 'Account'
  return <main className="shell">
    <header className="topbar"><Brand /><div className="account"><span>{displayName}</span><button className="secondary" onClick={logout}>Esci</button></div></header>
    <div className="workspace">
      <section className="card hero-card">
        <div><span className="eyebrow">NUOVO DOWNLOAD</span><h1>Incolla. Scarica.<br /><em>Fatto.</em></h1><p className="lead">Inserisci URL del contenuto da salvare. Drops farà il resto.</p></div>
        <form onSubmit={submit} className="download-form">
          <label htmlFor="download-url">URL contenuto</label>
          <div className="url-row"><input id="download-url" type="url" required placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} /><button className="primary" disabled={busy}>{busy ? 'Avvio…' : 'Scarica'}</button></div>
        </form>
        {error && <div className="alert" role="alert">{error}</div>}
      </section>
      <aside className="card status-card">
        <span className="eyebrow">STATO JOB</span>
        {!job ? <div className="empty"><span>↓</span><p>Nessun download attivo</p><small>Il prossimo job apparirà qui.</small></div> : <JobStatus job={job} />}
      </aside>
    </div>
    <footer>Drops Web · Download personali, senza distrazioni.</footer>
  </main>
}

function JobStatus({ job }: { job: Job }) {
  const ready = readyStatuses.has(job.status)
  const failed = failedStatuses.has(job.status)
  const progress = Math.max(0, Math.min(100, job.progress ?? (ready ? 100 : 0)))
  return <div className={`job ${ready ? 'ready' : failed ? 'failed' : ''}`}>
    <div className="job-head"><span className="status-dot" /><strong>{ready ? 'Pronto' : failed ? 'Download fallito' : 'In elaborazione'}</strong></div>
    <p className="job-title">{job.title ?? job.fileName ?? `Job ${job.id}`}</p>
    {!failed && <><div className="progress"><span style={{ width: `${progress}%` }} /></div><small>{progress ? `${progress}%` : 'Elaborazione in corso…'}</small></>}
    {failed && <div className="alert" role="alert">{job.message ?? 'Il job non è stato completato. Riprova.'}</div>}
    {ready && <a className="primary download-link" href={api.fileUrl(job.id)} download>Scarica artefatto</a>}
  </div>
}
