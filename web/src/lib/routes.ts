export const publicNavigation = {
  discovery: '/',
  suggests: '/suggests',
  login: '/app/login',
  download: '/app/download',
} as const

export const privateSections = ['download', 'graph', 'content', 'editorial-suggestions', 'history', 'settings'] as const
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
  return next?.startsWith('/app') && !next.startsWith('//') ? next : '/app'
}
