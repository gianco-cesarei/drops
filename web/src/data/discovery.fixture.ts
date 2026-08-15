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
  {
    id: 'dev-artist-london', slug: 'development-london-artist', type: DiscoveryType.Artist,
    title: '[Development] London artist profile', summary: 'Fixture per riempire la griglia e mostrare badge categoria.',
    publishedAt: '2024-02-12T12:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'London', countryCode: 'GB', latitude: 51.5072, longitude: -0.1276 }, mapEligible: true,
    tags: ['artist', 'bass'], sources: [{ url: 'https://example.com/development/artist', label: 'Development artist source', kind: 'reference' }], relations: [],
  },
  {
    id: 'dev-set-milan', slug: 'development-milan-set', type: DiscoveryType.Set,
    title: '[Development] Milan late set', summary: 'Fixture set geografico per la griglia europea.',
    publishedAt: '2023-11-05T12:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Milan', countryCode: 'IT', latitude: 45.4642, longitude: 9.19 }, mapEligible: true,
    tags: ['set', 'club'], sources: [{ url: 'https://example.com/development/milan', label: 'Development set source', kind: 'original' }], relations: [],
  },
  {
    id: 'dev-story-prague', slug: 'development-prague-story', type: DiscoveryType.Story,
    title: '[Development] Prague scene story', summary: 'Fixture editoriale storica per lo scorrimento Timeline.',
    publishedAt: '2022-08-20T12:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Prague', countryCode: 'CZ', latitude: 50.0755, longitude: 14.4378 }, mapEligible: true,
    tags: ['story', 'scene'], sources: [{ url: 'https://example.com/development/prague', label: 'Development story source', kind: 'official' }], relations: [],
  },
  {
    id: 'dev-party-madrid', slug: 'development-madrid-party', type: DiscoveryType.Party, partyKind: PartyKind.Festival,
    title: '[Development] Madrid festival notes', summary: 'Fixture party per testare selezione luogo e categoria.',
    publishedAt: '2021-07-14T12:00:00.000Z', primaryLocation: { kind: 'geographic', name: 'Madrid', countryCode: 'ES', latitude: 40.4168, longitude: -3.7038 }, mapEligible: true,
    tags: ['party', 'festival'], sources: [{ url: 'https://example.com/development/madrid', label: 'Development party source', kind: 'original' }], relations: [],
  },
])
