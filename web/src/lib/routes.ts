export const publicNavigation = {
  discovery: '/',
  timeline: '/timeline',
  map: '/map',
  suggests: '/suggests',
  login: '/app/login',
  download: '/app/download',
} as const

export const privateSections = ['download', 'spotify', 'radar', 'brain', 'content', 'editorial-suggestions', 'settings'] as const
export type RoutedPrivateSection = typeof privateSections[number]

export function privateRoute(section: RoutedPrivateSection): `/app/${RoutedPrivateSection}` {
  return `/app/${section}`
}

export function loginRoute(next?: string): string {
  return next ? `/app/login?next=${encodeURIComponent(next)}` : '/app/login'
}

export function downloadRoute(authenticated: boolean): string {
  return authenticated ? publicNavigation.download : loginRoute(publicNavigation.download)
}

export function postLoginRoute(search: string): string {
  const next = new URLSearchParams(search).get('next')
  if (!next?.startsWith('/')) return publicNavigation.download
  const parsed = new URL(next, 'https://drops.local')
  if (parsed.origin !== 'https://drops.local') return publicNavigation.download
  if (parsed.pathname !== '/app' && !parsed.pathname.startsWith('/app/')) return publicNavigation.download
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

export const privateEntryRoute = () => publicNavigation.download

export function legacyPrivateRedirect(pathname: '/app/graph' | '/app/history'): '/app/brain' | '/app/download' {
  return pathname === '/app/graph' ? '/app/brain' : '/app/download'
}
