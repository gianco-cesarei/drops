import { useEffect, useState } from 'react'
import { api } from '../api'
import { publicNavigation } from '../lib/routes'

export default function PublicHeader({ pathname = '/' }: { pathname?: string }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    api.me()
      .then(() => { if (active) setAuthenticated(true) })
      .catch(() => { if (active) setAuthenticated(false) })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.querySelector<HTMLButtonElement>('.mobile-menu-button')?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const [currentPath, setCurrentPath] = useState(pathname)
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      setCurrentPath(window.location.pathname)
    }
  }, [pathname])

  const effectivePath = pathname !== '/' ? pathname : currentPath
  const normalized = effectivePath.replace(/\/+$/, '') || '/'
  const isGrid = normalized === '/'
  const isTimeline = normalized.startsWith('/timeline')
  const isMap = normalized.startsWith('/map')

  const accountHref = authenticated ? publicNavigation.download : publicNavigation.login
  const accountLabel = authenticated ? 'Area privata' : 'Login'
  const accountLink = <a className="public-auth-link" href={accountHref} aria-busy={checking}>{accountLabel}</a>

  return <header className="public-header">
    <nav className="desktop-nav" aria-label="Navigazione principale">
      <div className="nav-side nav-left"><a href={publicNavigation.discovery}>Discovery</a><a href={publicNavigation.suggests}>Suggests</a></div>
      <a className="public-logo" href="/" aria-label="Drops home">Drops<span>.</span></a>
      <div className="nav-side nav-right">{accountLink}<a href={publicNavigation.download}>Download</a></div>
    </nav>
    <nav className="environment-nav" role="navigation" aria-label="Ambienti di esplorazione">
      <a className={isGrid ? 'active' : undefined} href="/">Grid</a>
      <a className={isTimeline ? 'active' : undefined} href="/timeline">Timeline</a>
      <a className={isMap ? 'active' : undefined} href="/map">Map</a>
    </nav>
    <nav className="mobile-nav" aria-label="Navigazione mobile">
      <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      <a className="public-logo" href="/" aria-label="Drops home">Drops<span>.</span></a>
      {accountLink}
      <div className="mobile-menu" id="mobile-menu" hidden={!menuOpen}>
        <a href={publicNavigation.discovery} onClick={() => setMenuOpen(false)}>Discovery</a>
        <a href={publicNavigation.timeline} onClick={() => setMenuOpen(false)}>Timeline</a>
        <a href={publicNavigation.map} onClick={() => setMenuOpen(false)}>Map</a>
        <a href={publicNavigation.suggests} onClick={() => setMenuOpen(false)}>Suggests</a>
        <a href={publicNavigation.download} onClick={() => setMenuOpen(false)}>Download</a>
      </div>
    </nav>
  </header>
}
