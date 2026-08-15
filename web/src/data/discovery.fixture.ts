import { DiscoveryType, PartyKind, RelationType, discoveryDatasetSchema } from '../domain/discovery'

// DEVELOPMENT FIXTURE: structural content only. Not final editorial material.
export const developmentDiscoveryItems = discoveryDatasetSchema.parse([
  {
    id: 'dev-story-berlin', slug: 'development-berlin-listening-notes', type: DiscoveryType.Story,
    title: '[Development] Listening notes from Berlin', summary: 'Fixture editoriale per verificare card, filtri e relazioni.',
    publishedAt: '2026-08-15T10:00:00.000Z', originalPublishedAt: '2026-08-12T20:00:00.000Z',
    primaryLocation: { kind: 'geographic', name: 'Berlin', countryCode: 'DE', latitude: 52.52, longitude: 13.405 }, mapEligible: true,
    tags: ['deep', 'scene'], sources: [{ url: 'https://example.com/development/story', label: 'Development source', kind: 'original' }],
    relations: [{ id: 'dev-label-a', type: RelationType.Label, label: 'Development Label A' }],
  },
  {
    id: 'dev-set-lisbon', slug: 'development-lisbon-set', type: DiscoveryType.Set,
    title: '[Development] Lisbon set selection', summary: 'Fixture set per testare ordinamento e fonte originale.',
    publishedAt: '2026-08-14T09:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Lisbon', countryCode: 'PT', latitude: 38.7223, longitude: -9.1393 }, mapEligible: true,
    tags: ['set', 'house'], sources: [{ url: 'https://example.com/development/set', label: 'Original set', kind: 'original' }], relations: [],
  },
  {
    id: 'dev-party-bucharest', slug: 'development-bucharest-series', type: DiscoveryType.Party, partyKind: PartyKind.Series,
    title: '[Development] Bucharest party series', summary: 'Fixture party con partyKind obbligatorio.',
    publishedAt: '2026-08-13T08:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Bucharest', countryCode: 'RO', latitude: 44.4268, longitude: 26.1025 }, mapEligible: true,
    tags: ['party', 'minimal'], sources: [{ url: 'https://example.com/development/party', label: 'Party source', kind: 'original' }],
    relations: [{ id: 'dev-artist-a', type: RelationType.Artist, label: 'Development Artist A' }],
  },
  {
    id: 'dev-release-online', slug: 'development-release-without-map', type: DiscoveryType.Release,
    title: '[Development] Digital release', summary: 'Fixture non idonea alla mappa.',
    publishedAt: '2026-08-12T07:00:00.000Z', originalPublishedAt: '2026-08-01T00:00:00.000Z',
    primaryLocation: { kind: 'online', name: 'Online' }, mapEligible: false,
    tags: ['release'], sources: [{ url: 'https://example.com/development/release', label: 'Release page', kind: 'original' }], relations: [],
  },
  {
    id: 'dev-label-paris', slug: 'development-paris-label', type: DiscoveryType.Label,
    title: '[Development] Paris label archive', summary: 'Fixture storica per densità Timeline e selezione geografica.',
    publishedAt: '2025-03-10T12:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Paris', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522 }, mapEligible: true,
    tags: ['label', 'archive'], sources: [{ url: 'https://example.com/development/label', label: 'Development label source', kind: 'official' }], relations: [],
  },
  {
    id: 'dev-playlist-amsterdam', slug: 'development-amsterdam-playlist', type: DiscoveryType.Playlist,
    title: '[Development] Amsterdam playlist', summary: 'Fixture pluriennale per verificare condensazione temporale.',
    publishedAt: '2024-06-01T12:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Amsterdam', countryCode: 'NL', latitude: 52.3676, longitude: 4.9041 }, mapEligible: true,
    tags: ['playlist', 'archive'], sources: [{ url: 'https://example.com/development/playlist', label: 'Development playlist source', kind: 'listen' }], relations: [],
  },
])
