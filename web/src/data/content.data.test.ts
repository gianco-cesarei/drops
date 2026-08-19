import { describe, expect, it } from 'vitest'
import { publishedContentItems } from './content.data'
import { DiscoveryType, PartyKind } from '../domain/discovery'

describe('contenuti editoriali pubblicati', () => {
  it('contiene tutti i 26 contenuti editoriali (radar, release, festival 2026, scene, etichette e guide DJ)', () => {
    expect(publishedContentItems.length).toBe(26)
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

  it('ogni articolo possiede un coverUrl valido ed univoco con immagine ad alta risoluzione o locale', () => {
    const coverUrls = publishedContentItems.map((item) => item.coverUrl)
    for (const item of publishedContentItems) {
      expect(item.coverUrl).toBeTruthy()
      expect(item.coverUrl?.startsWith('https://') || item.coverUrl?.startsWith('/assets/')).toBe(true)
    }
    expect(new Set(coverUrls).size).toBe(publishedContentItems.length)
  })

  it('verifica i dati specifici di XEXA — Kissom', () => {
    const xexa = publishedContentItems.find((i) => i.slug === 'xexa-kissom')
    expect(xexa).toBeTruthy()
    expect(xexa?.type).toBe(DiscoveryType.Artist)
    expect(xexa?.kicker).toBe('Radar')
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
    expect(td10?.kicker).toBe('Radar')
    expect(td10?.primaryLocation.kind).toBe('geographic')
    expect(td10?.tags).toContain('bristol')
  })

  it('verifica i dati specifici di Oroko Radio', () => {
    const oroko = publishedContentItems.find((i) => i.slug === 'oroko-radio-pausa-infrastrutture-indipendenti')
    expect(oroko).toBeTruthy()
    expect(oroko?.kicker).toBe('Radar')
    expect(oroko?.primaryLocation.kind).toBe('geographic')
    expect(oroko?.primaryLocation.name).toContain('Accra')
  })

  it('verifica i festival (Dekmantel, Sónar, Primavera Sound, CTM, AVA, L.E.V., MOSTRA, Nyege Nyege, Houghton, Omana)', () => {
    const festivals = publishedContentItems.filter((i) => i.type === DiscoveryType.Party && i.partyKind === PartyKind.Festival)
    expect(festivals.length).toBe(10)
    const slugs = festivals.map((f) => f.slug)
    expect(slugs).toContain('dekmantel-festival-amsterdam-2026')
    expect(slugs).toContain('sonar-festival-barcellona-2026')
    expect(slugs).toContain('primavera-sound-barcellona-2026-clubbing-circuit')
    expect(slugs).toContain('ctm-festival-berlino-2026')
    expect(slugs).toContain('ava-festival-belfast-2026')
    expect(slugs).toContain('lev-festival-gijon-2026')
    expect(slugs).toContain('mostra-festival-barcellona-2026')
    expect(slugs).toContain('nyege-nyege-festival-jinja-2026')
    expect(slugs).toContain('houghton-festival-norfolk')
    expect(slugs).toContain('omana-festival-kalamitsi')
  })

  it('verifica le scene e guide di clubbing (Lisbona e Milano)', () => {
    const lisbona = publishedContentItems.find((i) => i.slug === 'guida-clubbing-lisbona-scene-club-radio')
    expect(lisbona).toBeTruthy()
    expect(lisbona?.primaryLocation.name).toContain('Lisbona')
    expect(lisbona?.tags).toContain('lux-fragil')

    const milano = publishedContentItems.find((i) => i.slug === 'guida-clubbing-milano-scene-elettronica')
    expect(milano).toBeTruthy()
    expect(milano?.primaryLocation.name).toContain('Milano')
    expect(milano?.tags).toContain('tunnel-club')
  })

  it('verifica le guide pratiche DJ e di settore (Borderò SIAE/SPA, Rekordbox, Beatport, ISRC/UPC, Vinile, MusicBrainz)', () => {
    const guides = publishedContentItems.filter((i) => i.tags.includes('guida'))
    expect(guides.length).toBe(9)
    const guideSlugs = guides.map((g) => g.slug)
    expect(guideSlugs).toContain('guida-bordero-siae-spa-dj-diritto-autore')
    expect(guideSlugs).toContain('guida-rekordbox-usb-cdj-3000-workflow-professionale')
    expect(guideSlugs).toContain('come-si-pubblica-la-musica-oggi')
    expect(guideSlugs).toContain('beatport-spiegato-classifiche-generi')
    expect(guideSlugs).toContain('isrc-upc-codici-royalty')
    expect(guideSlugs).toContain('vinile-2026-stampa-tempi-costi')
    expect(guideSlugs).toContain('musicbrainz-identita-mbid')
    expect(guideSlugs).toContain('guida-clubbing-lisbona-scene-club-radio')
    expect(guideSlugs).toContain('guida-clubbing-milano-scene-elettronica')

    const bordero = publishedContentItems.find((i) => i.slug === 'guida-bordero-siae-spa-dj-diritto-autore')
    expect(bordero?.tags).toContain('miobordero')
    expect(bordero?.tags).toContain('spa')

    const rekordbox = publishedContentItems.find((i) => i.slug === 'guida-rekordbox-usb-cdj-3000-workflow-professionale')
    expect(rekordbox?.tags).toContain('cdj-3000')
  })

  it('verifica le etichette discografiche (Defected, Innervisions, XL, Warp)', () => {
    const labels = publishedContentItems.filter((i) => i.type === DiscoveryType.Label)
    expect(labels.length).toBe(4)
    const slugs = labels.map((l) => l.slug)
    expect(slugs).toContain('defected-records-house-music-heritage')
    expect(slugs).toContain('innervisions-berlino-dixon-ame')
    expect(slugs).toContain('xl-recordings-da-rave-a-potenza-indipendente')
    expect(slugs).toContain('warp-records-artificial-intelligence-avanguardia')
  })
})

