import { describe, expect, it } from 'vitest'
import { DiscoveryType, PartyKind, discoveryItemSchema } from './discovery'
import { developmentDiscoveryItems } from '../data/discovery.fixture'

const base = {
  id: 'test', slug: 'test-item', title: 'Test', summary: 'Test summary', type: DiscoveryType.Story,
  publishedAt: '2026-08-15T10:00:00.000Z', primaryLocation: { name: 'Lisbon', countryCode: 'PT' },
  tags: [], relations: [], mapEligible: false,
}

describe('DiscoveryItem schema', () => {
  it('valida dataset fixture development', () => {
    expect(developmentDiscoveryItems).toHaveLength(4)
  })

  it('richiede almeno una fonte', () => {
    expect(() => discoveryItemSchema.parse({ ...base, sources: [] })).toThrow()
  })

  it('richiede partyKind per Party', () => {
    expect(() => discoveryItemSchema.parse({ ...base, type: DiscoveryType.Party, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] })).toThrow()
    expect(discoveryItemSchema.parse({ ...base, type: DiscoveryType.Party, partyKind: PartyKind.Event, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] }).partyKind).toBe(PartyKind.Event)
  })
})
