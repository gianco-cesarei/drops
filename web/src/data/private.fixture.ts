export type RadarBrainLink = { targetId: string; relation: string }

export type RadarFixture = {
  id: string
  title: string
  source: string
  date: string
  location: string
  category: string
  relevance: string
  // Fictional links used only to demo "Collega al Brain": ids of existing Brain nodes this signal would attach to.
  brainLinks: RadarBrainLink[]
  // Ids of other development fixtures that appear in the Radar queue once this one is linked to the Brain.
  unlocks: string[]
}

// DEVELOPMENT FIXTURES: structural examples only. No item represents real editorial data.
export const radarDevelopmentFixtures: RadarFixture[] = [
  {
    id: 'radar-development-1',
    title: '[Development] Signal example from a connected label',
    source: 'Development source A',
    date: '2026-08-15',
    location: 'Berlin · development fixture',
    category: 'Label signal',
    relevance: 'Development reason: possible connection to an existing Brain entity.',
    brainLinks: [
      { targetId: 'Anthea', relation: 'possibile affinità (development)' },
      { targetId: '📍Berlino', relation: 'stessa città (development)' },
    ],
    unlocks: ['radar-development-3'],
  },
  {
    id: 'radar-development-2',
    title: '[Development] External signal outside current Brain',
    source: 'Development source B',
    date: '2026-08-14',
    location: 'Online · development fixture',
    category: 'External source',
    relevance: 'Development reason: useful editorial signal not yet represented in Brain.',
    brainLinks: [],
    unlocks: ['radar-development-4'],
  },
]

// Hidden until an unlocking fixture above is linked to the Brain — demonstrates "Brain cresce → Radar propone altro".
export const radarLockedFixtures: RadarFixture[] = [
  {
    id: 'radar-development-3',
    title: '[Development] Berlin label follow-up surfaced after linking',
    source: 'Development source C',
    date: '2026-08-16',
    location: 'Berlin · development fixture',
    category: 'Label signal',
    relevance: 'Development reason: emerged because an adjacent Berlin node just joined the Brain.',
    brainLinks: [{ targetId: 'Marmo Music', relation: 'possibile affinità (development)' }],
    unlocks: ['radar-development-5'],
  },
  {
    id: 'radar-development-4',
    title: '[Development] Independent scene signal, still outside Brain',
    source: 'Development source D',
    date: '2026-08-16',
    location: 'Bristol · development fixture',
    category: 'External source',
    relevance: 'Development reason: shares a city with an existing Brain node, worth tracking.',
    brainLinks: [{ targetId: '📍Bristol', relation: 'possibile affinità (development)' }],
    unlocks: [],
  },
  {
    id: 'radar-development-5',
    title: '[Development] Roma/Berlino cross-scene follow-up',
    source: 'Development source E',
    date: '2026-08-16',
    location: 'Roma · development fixture',
    category: 'Scene signal',
    relevance: 'Development reason: extends the Roma↔Berlino axis already present in the Brain.',
    brainLinks: [{ targetId: 'Mania', relation: 'possibile affinità (development)' }],
    unlocks: [],
  },
]

export const brainNodeTypes = ['Artist', 'Label', 'City', 'Release', 'Set', 'Playlist', 'Party', 'Story'] as const
export const contentStages = ['Draft', 'Ready', 'Published', 'Archived'] as const
export const contentFields = ['Titolo', 'Tipo', 'Data', 'Luogo', 'Tag', 'Fonti', 'Relazioni Brain'] as const
