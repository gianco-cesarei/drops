import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'
import { api, ApiError } from './api'
import type { Job, User } from './api'
import { postLoginRoute } from './lib/routes'
import { contentFields, contentStages, radarDevelopmentFixtures, radarLockedFixtures } from './data/private.fixture'
import type { RadarFixture } from './data/private.fixture'
import BrainGraph from './components/BrainGraph'
import { linkRadarToBrain, resetPrototypeState, setRadarStatus, usePrototypeState } from './data/brainStore'
import type { RadarStatus } from './data/brainStore'

export type PrivateSection = 'login' | 'download' | 'radar' | 'brain' | 'content' | 'editorial-suggestions' | 'settings'

const terminalStatuses = new Set(['completed', 'complete', 'ready', 'failed', 'error', 'cancelled'])
const readyStatuses = new Set(['completed', 'complete', 'ready'])
const failedStatuses = new Set(['failed', 'error', 'cancelled'])
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
  return <main className="private-placeholder"><span className="development-badge">Private development shell</span><h1 className="sr-only">{labels[section]}</h1><p>Strumento non implementato in questa milestone.</p></main>
}

const radarStatusLabels: Record<RadarStatus, string> = { saved: 'Salvato', discarded: 'Scartato', linked: 'Collegato al Brain', content: 'Trasformato in contenuto' }

function Radar() {
  const [state, setState] = usePrototypeState()
  const visibleFixtures = [...radarDevelopmentFixtures, ...radarLockedFixtures.filter((fixture) => state.unlockedIds.includes(fixture.id))]
  const hasPrototypeData = state.extraNodes.length > 0 || Object.keys(state.radarStatus).length > 0

  function save(id: string) { setState(setRadarStatus(id, 'saved')) }
  function discard(id: string) { setState(setRadarStatus(id, 'discarded')) }
  function link(fixture: RadarFixture) { setState(linkRadarToBrain(fixture)) }
  function convert(id: string) { setState(setRadarStatus(id, 'content')) }
  function resetPrototype() { setState(resetPrototypeState()) }

  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Radar · development shell</span><h1 className="sr-only">Radar</h1><p>Segnali guidati dal Brain, con fonti che possono emergere anche fuori dalle relazioni già presenti.</p></header>
    <div className="radar-toolbar">
      <p className="prototype-note">Prototipo — stato salvato solo in questo browser (localStorage), non è ancora il database reale. “Collega al Brain” aggiunge davvero un nodo al grafo e può sbloccare nuove proposte qui sotto.</p>
      <button type="button" className="radar-reset" onClick={resetPrototype} disabled={!hasPrototypeData}>Reset prototipo</button>
    </div>
    <div className="brain-preview" aria-label="Anteprima Brain">
      <strong>Nel Brain (prototipo):</strong>
      {state.extraNodes.length === 0
        ? <span className="brain-preview-empty">Ancora nessun nodo aggiunto dal Radar.</span>
        : state.extraNodes.map((node) => <span className="brain-preview-chip" key={node.id}>{node.id.replace(/^Radar · /, '')}</span>)}
    </div>
    <div className="radar-grid">{visibleFixtures.map((item) => {
      const status = state.radarStatus[item.id]
      const isNew = radarLockedFixtures.some((locked) => locked.id === item.id) && status === undefined
      return <article className={`radar-card ${status ? `is-${status}` : ''} ${isNew ? 'is-new' : ''}`} key={item.id}>
        <div className="radar-card-head"><span className="fixture-label">Development fixture</span>{status && <span className="radar-status-badge">{radarStatusLabels[status]}</span>}{isNew && <span className="radar-status-badge">Nuovo · sbloccato dal Brain</span>}</div>
        <h2>{item.title}</h2>
        <dl><div><dt>Fonte</dt><dd>{item.source}</dd></div><div><dt>Data</dt><dd>{item.date}</dd></div><div><dt>Luogo</dt><dd>{item.location}</dd></div><div><dt>Categoria</dt><dd>{item.category}</dd></div></dl>
        <section><h3>Perché è rilevante</h3><p>{item.relevance}</p></section>
        <div className="planned-actions" aria-label="Azioni">
          <button type="button" data-action="save" className={status === 'saved' ? 'is-active' : ''} disabled={status === 'linked' || status === 'content'} onClick={() => save(item.id)}>Salva</button>
          <button type="button" data-action="discard" className={status === 'discarded' ? 'is-active' : ''} disabled={status === 'linked' || status === 'content'} onClick={() => discard(item.id)}>Scarta</button>
          <button type="button" data-action="link" disabled={status === 'linked'} onClick={() => link(item)}>{status === 'linked' ? 'Collegato ✓' : 'Collega al Brain'}</button>
          <button type="button" data-action="content" disabled={status === 'content'} onClick={() => convert(item.id)}>{status === 'content' ? 'Trasformato ✓' : 'Trasforma in contenuto'}</button>
        </div>
      </article>
    })}</div>
  </main>
}

function Brain() {
  const [state] = usePrototypeState()
  return <main className="private-workspace brain-workspace"><header className="workspace-heading"><span className="development-badge">Brain · fixture locale + prototipo</span><h1 className="sr-only">Brain</h1><p>Mappa relazionale privata di scene, persone, luoghi e segnali editoriali. I nodi con anello ambra arrivano dal Radar (prototipo, salvato solo in questo browser).</p></header><BrainGraph extraNodes={state.extraNodes} extraLinks={state.extraLinks} /></main>
}

function Content() {
  return <main className="private-workspace"><header className="workspace-heading"><span className="development-badge">Content · development shell</span><h1 className="sr-only">Content</h1><p>Pipeline editoriale strutturale. Nessun CMS implementato.</p></header><section className="content-pipeline" aria-label="Pipeline contenuti">{contentStages.map((stage) => <article key={stage}><h2>{stage}</h2><p>0 development items</p></article>)}</section><section className="tool-shell"><h2>Campi previsti</h2><div className="type-list">{contentFields.map((field) => <span key={field}>{field}</span>)}</div></section></main>
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
    <section className="card hero-card"><div><span className="eyebrow">DOWNLOAD PRIVATO</span><h1 className="sr-only">Nuovo download</h1><p className="lead">Area personale di {user.name ?? user.username ?? 'utente'}.</p></div>
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
