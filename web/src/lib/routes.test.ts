import { describe, expect, it } from 'vitest'
import { downloadRoute, loginRoute, postLoginRoute, privateRoute, publicNavigation } from './routes'

describe('routing', () => {
  it('mantiene route pubbliche approvate', () => {
    expect(publicNavigation).toEqual({ discovery: '/', suggests: '/suggests', login: '/app/login', download: '/app/download' })
  })

  it('porta Download al login con next quando sessione assente', () => {
    expect(downloadRoute(false)).toBe(loginRoute('/app/download'))
    expect(downloadRoute(true)).toBe('/app/download')
  })

  it('costruisce route private', () => {
    expect(privateRoute('graph')).toBe('/app/graph')
  })

  it('mantiene destinazione privata dopo login', () => {
    expect(postLoginRoute('?next=%2Fapp%2Fdownload')).toBe('/app/download')
    expect(postLoginRoute('?next=https%3A%2F%2Fevil.example')).toBe('/app')
  })
})
