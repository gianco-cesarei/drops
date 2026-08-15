import { describe, expect, it } from 'vitest'
import { downloadRoute, legacyPrivateRedirect, loginRoute, postLoginRoute, privateEntryRoute, privateRoute, publicNavigation } from './routes'

describe('routing', () => {
  it('mantiene route pubbliche approvate', () => {
    expect(publicNavigation).toEqual({ discovery: '/', timeline: '/timeline', map: '/map', suggests: '/suggests', login: '/app/login', download: '/app/download' })
  })

  it('porta Download al login con next quando sessione assente', () => {
    expect(downloadRoute(false)).toBe(loginRoute('/app/download'))
    expect(downloadRoute(true)).toBe('/app/download')
  })

  it('costruisce route private', () => {
    expect(privateRoute('radar')).toBe('/app/radar')
    expect(privateRoute('brain')).toBe('/app/brain')
  })

  it('mantiene destinazione privata dopo login', () => {
    expect(postLoginRoute('?next=%2Fapp%2Fdownload')).toBe('/app/download')
    expect(postLoginRoute('?next=%2Fapp%2Fcontent%3Ftab%3Ddrafts')).toBe('/app/content?tab=drafts')
    expect(postLoginRoute('?next=https%3A%2F%2Fevil.example')).toBe('/app/download')
    expect(postLoginRoute('?next=%2Fapplication')).toBe('/app/download')
  })

  it('/app reindirizza a download e non usa placeholder', () => {
    expect(postLoginRoute('')).toBe('/app/download')
    expect(privateEntryRoute()).toBe('/app/download')
  })

  it('mantiene redirect legacy sicuri', () => {
    expect(legacyPrivateRedirect('/app/graph')).toBe('/app/brain')
    expect(legacyPrivateRedirect('/app/history')).toBe('/app/download')
  })
})
