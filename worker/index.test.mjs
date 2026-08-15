import assert from 'node:assert/strict'
import { test } from 'node:test'
import worker, { apiOrigin } from './index.js'

function env(overrides = {}) {
  return { API_ORIGIN: 'https://mp3-ytb.onrender.com', ASSETS: { fetch: async () => new Response('asset-body', { headers: { 'content-type': 'text/html' } }) }, ...overrides }
}

test('serves non-API requests from Worker Static Assets', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('asset route must not call upstream') }
  try {
    const response = await worker.fetch(new Request('https://drops.giancarlocesarei.workers.dev/'), env())
    assert.equal(await response.text(), 'asset-body')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('proxies API method, query, body, Origin and streaming response unchanged', async () => {
  const originalFetch = globalThis.fetch
  let captured
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('chunk-1')); controller.enqueue(new TextEncoder().encode('chunk-2')); controller.close() } })
  globalThis.fetch = async request => {
    captured = request
    return new Response(stream, { status: 201, headers: { 'content-type': 'text/plain', 'set-cookie': 'drops_session=abc; HttpOnly; Secure' } })
  }
  try {
    const request = new Request('https://drops.giancarlocesarei.workers.dev/api/v1/downloads?next=%2Fitem', {
      method: 'POST',
      headers: { Origin: 'https://drops.giancarlocesarei.workers.dev', 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://youtu.be/example' }),
    })
    const response = await worker.fetch(request, env())
    assert.equal(captured.url, 'https://mp3-ytb.onrender.com/api/v1/downloads?next=%2Fitem')
    assert.equal(captured.method, 'POST')
    assert.equal(captured.headers.get('origin'), 'https://drops.giancarlocesarei.workers.dev')
    assert.deepEqual(await captured.json(), { url: 'https://youtu.be/example' })
    assert.equal(response.status, 201)
    assert.equal(response.headers.get('set-cookie'), 'drops_session=abc; HttpOnly; Secure')
    assert.equal(await response.text(), 'chunk-1chunk-2')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('does not create an open proxy', async () => {
  const originalFetch = globalThis.fetch
  let called = false
  globalThis.fetch = async () => { called = true; return new Response('unexpected') }
  try {
    const response = await worker.fetch(new Request('https://drops.giancarlocesarei.workers.dev/?url=https://attacker.example'), env())
    assert.equal(await response.text(), 'asset-body')
    assert.equal(called, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('accepts only HTTPS origin configuration without path', () => {
  assert.equal(apiOrigin({ API_ORIGIN: 'https://api.example.test' }), 'https://api.example.test')
  assert.throws(() => apiOrigin({ API_ORIGIN: 'http://api.example.test' }))
  assert.throws(() => apiOrigin({ API_ORIGIN: 'https://api.example.test/route' }))
})
