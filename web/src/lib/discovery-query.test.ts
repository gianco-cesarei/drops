import { describe, expect, it } from 'vitest'
import { DiscoveryType } from '../domain/discovery'
import { parseDiscoveryQuery, serializeDiscoveryQuery } from './discovery-query'

describe('Discovery query state', () => {
  it('legge vista, ricerca e filtri validi', () => {
    expect(parseDiscoveryQuery(new URLSearchParams('view=timeline&q=berlin&types=label,set,unknown'))).toEqual({
      view: 'timeline', query: 'berlin', types: [DiscoveryType.Label, DiscoveryType.Set],
    })
  })

  it('usa Discovery per vista non valida', () => {
    expect(parseDiscoveryQuery(new URLSearchParams('view=network')).view).toBe('discovery')
  })

  it('mantiene stato in query string', () => {
    const state = { view: 'map' as const, query: 'Lisbon', types: [DiscoveryType.Party] }
    expect(parseDiscoveryQuery(new URLSearchParams(serializeDiscoveryQuery(state)))).toEqual(state)
  })
})
