import { describe, expect, it } from 'vitest'
import { publishedContentItems } from './content.data'
import { DiscoveryType, PartyKind } from '../domain/discovery'

describe('contenuti editoriali pubblicati', () => {
  it('contiene tutti i 13 contenuti editoriali (8 radar/festival/release + 5 guide)', () => {
    expect(publishedContentItems.length).toBe(13)
  })

  it('tutti i contenuti hanno slug unici e id univoci', () => {
    const slugs = publishedContentItems.map((i) => i.slug)
    const ids = publishedContentItems.map((i) => i.id)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ogni articolo possiede un corpo (body) strutturato in sezioni con heading', () => {
    for (const item of publishedContentItems) {
      const body = item.body ?? []
      expect(body.length).toBeGreaterThanOrEqual(3)
      for (const block of body) {
        expect(block.html).toBeTruthy()
      }
    }
  })

  it('ogni articolo ha fonti attive con url validi', () => {
    for (const item of publishedContentItems) {
      expect(item.sources.length).toBeGreaterThanOrEqual(2)
      for (const source of item.sources) {
        expect(source.url.startsWith('http://') || source.url.startsWith('https://')).toBe(true)
        expect(source.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('verifica i dati specifici di XEXA — Kissom', () => {
    const xexa = publishedContentItems.find((i) => i.slug === 'xexa-kissom')
    expect(xexa).toBeTruthy()
    expect(xexa?.type).toBe(DiscoveryType.Release)
    expect(xexa?.kicker).toBe('Artista Emergente')
    expect(xexa?.primaryLocation.kind).toBe('geographic')
    expect(xexa?.tags).toContain('lisbona')
    expect(xexa?.tags).toContain('principe')
    expect(xexa?.sources.some((s) => s.label.includes('Bandcamp'))).toBe(true)
    expect(xexa?.sources.some((s) => s.label.includes('Spotify'))).toBe(true)
  })

  it('verifica i dati specifici di Timedance — TD10', () => {
    const td10 = publishedContentItems.find((i) => i.slug === 'timedance-td10')
    expect(td10).toBeTruthy()
    expect(td10?.type).toBe(DiscoveryType.Release)
    expect(td10?.kicker).toBe('Release')
    expect(td10?.primaryLocation.kind).toBe('geographic')
    expect(td10?.tags).toContain('bristol')
  })

  it('verifica i dati specifici di Oroko Radio', () => {
    const oroko = publishedContentItems.find((i) => i.slug === 'oroko-radio-pausa-infrastrutture-indipendenti')
    expect(oroko).toBeTruthy()
    expect(oroko?.type).toBe(DiscoveryType.Story)
    expect(oroko?.tags).toContain('community-radio')
  })

  it('verifica i festival (CTM, AVA, L.E.V., MOSTRA, Nyege Nyege)', () => {
    const festivals = publishedContentItems.filter((i) => i.type === DiscoveryType.Party && i.partyKind === PartyKind.Festival)
    expect(festivals.length).toBe(5)
    const slugs = festivals.map((f) => f.slug)
    expect(slugs).toContain('ctm-festival-berlino-2026')
    expect(slugs).toContain('ava-festival-belfast-2026')
    expect(slugs).toContain('lev-festival-gijon-2026')
    expect(slugs).toContain('mostra-festival-barcellona-2026')
    expect(slugs).toContain('nyege-nyege-festival-jinja-2026')
  })

  it('verifica le 5 guide di settore', () => {
    const guides = publishedContentItems.filter((i) => i.tags.includes('guida'))
    expect(guides.length).toBe(5)
    const guideSlugs = guides.map((g) => g.slug)
    expect(guideSlugs).toContain('come-si-pubblica-la-musica-oggi')
    expect(guideSlugs).toContain('beatport-spiegato-classifiche-generi')
    expect(guideSlugs).toContain('isrc-upc-codici-royalty')
    expect(guideSlugs).toContain('vinile-2026-stampa-tempi-costi')
    expect(guideSlugs).toContain('musicbrainz-identita-mbid')
  })
})
