export type RadarFixture = {
  id: string
  title: string
  source: string
  date: string
  location: string
  category: string
  relevance: string
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
  },
  {
    id: 'radar-development-2',
    title: '[Development] External signal outside current Brain',
    source: 'Development source B',
    date: '2026-08-14',
    location: 'Online · development fixture',
    category: 'External source',
    relevance: 'Development reason: useful editorial signal not yet represented in Brain.',
  },
]

export const brainNodeTypes = ['Artist', 'Label', 'City', 'Release', 'Set', 'Playlist', 'Party', 'Story'] as const
export const contentStages = ['Draft', 'Ready', 'Published', 'Archived'] as const
export const contentFields = ['Titolo', 'Tipo', 'Data', 'Luogo', 'Tag', 'Fonti', 'Relazioni Brain'] as const
