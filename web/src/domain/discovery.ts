import { z } from 'zod'

export enum DiscoveryType {
  Label = 'label',
  Artist = 'artist',
  Playlist = 'playlist',
  Set = 'set',
  Release = 'release',
  Story = 'story',
  Party = 'party',
}

export enum PartyKind {
  Event = 'event',
  Series = 'series',
  Collective = 'collective',
}

export enum RelationType {
  Label = 'label',
  Artist = 'artist',
  Playlist = 'playlist',
  Set = 'set',
  Release = 'release',
  Story = 'story',
  Party = 'party',
  CityScene = 'city-scene',
  Content = 'content',
}

const sourceSchema = z.object({
  url: z.url(),
  label: z.string().min(1),
  kind: z.enum(['original', 'reference']),
})

const locationSchema = z.object({
  name: z.string().min(1),
  countryCode: z.string().length(2),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

const relationSchema = z.object({
  id: z.string().min(1),
  type: z.enum(RelationType),
  label: z.string().min(1),
  reason: z.string().min(1).optional(),
})

const baseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  publishedAt: z.iso.datetime(),
  originalPublishedAt: z.iso.datetime().optional(),
  primaryLocation: locationSchema,
  tags: z.array(z.string().min(1)),
  sources: z.array(sourceSchema).min(1),
  relations: z.array(relationSchema),
  mapEligible: z.boolean(),
})

const standardItemSchema = baseSchema.extend({
  type: z.enum([
    DiscoveryType.Label,
    DiscoveryType.Artist,
    DiscoveryType.Playlist,
    DiscoveryType.Set,
    DiscoveryType.Release,
    DiscoveryType.Story,
  ]),
  partyKind: z.never().optional(),
})

const partyItemSchema = baseSchema.extend({
  type: z.literal(DiscoveryType.Party),
  partyKind: z.enum(PartyKind),
})

export const discoveryItemSchema = z.discriminatedUnion('type', [standardItemSchema, partyItemSchema])
export const discoveryDatasetSchema = z.array(discoveryItemSchema)
export type DiscoveryItem = z.infer<typeof discoveryItemSchema>

export const categoryLabels: Record<DiscoveryType, string> = {
  [DiscoveryType.Label]: 'Labels',
  [DiscoveryType.Artist]: 'Artists',
  [DiscoveryType.Playlist]: 'Playlists',
  [DiscoveryType.Set]: 'Sets',
  [DiscoveryType.Release]: 'Releases',
  [DiscoveryType.Story]: 'Stories',
  [DiscoveryType.Party]: 'Parties',
}
