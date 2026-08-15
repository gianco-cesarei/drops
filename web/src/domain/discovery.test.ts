import { describe, expect, it } from 'vitest'
import { DiscoveryType, PartyKind, discoveryItemSchema } from './discovery'
import { developmentDiscoveryItems } from '../data/discovery.fixture'

const base = {
  id: 'test', slug: 'test-item', title: 'Test', summary: 'Test summary', type: DiscoveryType.Story,
  publishedAt: '2026-08-15T10:00:00.000Z', primaryLocation: { kind: 'geographic' as const, name: 'Lisbon', countryCode: 'PT' },
  tags: [], relations: [], mapEligible: false,
}

describe('DiscoveryItem schema', () => {
  it('valida dataset fixture development', () => {
    expect(developmentDiscoveryItems).toHaveLength(10)
  })

  it('richiede almeno una fonte', () => {
    expect(() => discoveryItemSchema.parse({ ...base, sources: [] })).toThrow()
  })

  it('richiede partyKind per Party', () => {
    expect(() => discoveryItemSchema.parse({ ...base, type: DiscoveryType.Party, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] })).toThrow()
    expect(discoveryItemSchema.parse({ ...base, type: DiscoveryType.Party, partyKind: PartyKind.Event, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] }).partyKind).toBe(PartyKind.Event)
  })

  it.each(['original', 'official', 'listen', 'reference'] as const)('accetta fonte %s', (kind) => {
    expect(discoveryItemSchema.parse({ ...base, sources: [{ url: 'https://example.com', label: 'Source', kind }] }).sources[0].kind).toBe(kind)
  })

  it.each([PartyKind.Event, PartyKind.Series, PartyKind.Collective, PartyKind.ClubNight, PartyKind.Festival])('accetta partyKind %s', (partyKind) => {
    expect(discoveryItemSchema.parse({ ...base, type: DiscoveryType.Party, partyKind, sources: [{ url: 'https://example.com', label: 'Source', kind: 'official' }] }).partyKind).toBe(partyKind)
  })

  it('richiede countryCode per luogo geografico', () => {
    expect(() => discoveryItemSchema.parse({ ...base, primaryLocation: { kind: 'geographic', name: 'Lisbon' }, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] })).toThrow()
  })

  it('richiede coordinate quando mapEligible è true', () => {
    expect(() => discoveryItemSchema.parse({ ...base, mapEligible: true, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] })).toThrow()
  })

  it('vieta paese e mapEligible per luogo online', () => {
    expect(() => discoveryItemSchema.parse({ ...base, mapEligible: true, primaryLocation: { kind: 'online', name: 'Online' }, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] })).toThrow()
    expect(() => discoveryItemSchema.parse({ ...base, primaryLocation: { kind: 'online', name: 'Online', countryCode: 'IT' }, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] })).toThrow()
    expect(discoveryItemSchema.parse({ ...base, primaryLocation: { kind: 'online', name: 'Online' }, sources: [{ url: 'https://example.com', label: 'Source', kind: 'original' }] }).mapEligible).toBe(false)
  })
})
