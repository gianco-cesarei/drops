import { describe, expect, it } from 'vitest'
import { DiscoveryType } from '../domain/discovery'
import { parseArchiveQuery, serializeArchiveQuery } from './discovery-query'

describe('stato query ambiente', () => {
  it('Discovery legge ricerca e filtri validi', () => {
    expect(parseArchiveQuery(new URLSearchParams('q=berlin&types=label,set,unknown'))).toEqual({ query: 'berlin', types: [DiscoveryType.Label, DiscoveryType.Set] })
  })
  it('Timeline e Map ignorano ricerca generale', () => {
    expect(parseArchiveQuery(new URLSearchParams('q=berlin&types=party'), false)).toEqual({ query: '', types: [DiscoveryType.Party] })
  })
  it('serializza stato specifico ambiente', () => {
    expect(serializeArchiveQuery({ query: '', types: [DiscoveryType.Party] })).toBe('?types=party')
  })
})
