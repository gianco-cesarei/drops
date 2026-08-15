import { DiscoveryType } from '../domain/discovery'

export type DiscoveryView = 'discovery' | 'timeline' | 'map'

export type DiscoveryQueryState = {
  view: DiscoveryView
  query: string
  types: DiscoveryType[]
}

const views = new Set<DiscoveryView>(['discovery', 'timeline', 'map'])
const types = new Set(Object.values(DiscoveryType))

export function parseDiscoveryQuery(input: URLSearchParams): DiscoveryQueryState {
  const requestedView = input.get('view') as DiscoveryView | null
  const selectedTypes = (input.get('types') ?? '').split(',').filter((type): type is DiscoveryType => types.has(type as DiscoveryType))
  return {
    view: requestedView && views.has(requestedView) ? requestedView : 'discovery',
    query: input.get('q')?.trim() ?? '',
    types: [...new Set(selectedTypes)],
  }
}

export function serializeDiscoveryQuery(state: DiscoveryQueryState): string {
  const output = new URLSearchParams()
  if (state.view !== 'discovery') output.set('view', state.view)
  if (state.query) output.set('q', state.query)
  if (state.types.length) output.set('types', state.types.join(','))
  const query = output.toString()
  return query ? `?${query}` : ''
}
