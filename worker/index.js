const DEFAULT_API_ORIGIN = 'https://mp3-ytb.onrender.com'
const WORKER_ORIGIN = 'https://drops.giancarlocesarei.workers.dev'

function apiOrigin(env) {
  const configured = String(env.API_ORIGIN || DEFAULT_API_ORIGIN).trim()
  try {
    const origin = new URL(configured)
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
      throw new Error('API_ORIGIN must be an HTTPS origin without path')
    }
    return origin.origin
  } catch {
    throw new Error('Invalid API_ORIGIN')
  }
}

function shouldProxy(pathname) {
  return pathname.startsWith('/api/')
}

function upstreamRequest(request, env, pathname) {
  const target = new URL(pathname + new URL(request.url).search, apiOrigin(env))
  return new Request(target, request)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (shouldProxy(url.pathname) || url.pathname === '/health') {
      let upstream
      try {
        upstream = await fetch(upstreamRequest(request, env, url.pathname))
      } catch {
        return new Response('API upstream unavailable', { status: 502 })
      }
      return upstream
    }

    return env.ASSETS.fetch(request)
  },
}

export { DEFAULT_API_ORIGIN, WORKER_ORIGIN, apiOrigin, shouldProxy, upstreamRequest }
