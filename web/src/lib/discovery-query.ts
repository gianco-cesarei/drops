import { DiscoveryType } from '../domain/discovery'

export type ArchiveQueryState = { query: string; types: DiscoveryType[] }
const validTypes = new Set(Object.values(DiscoveryType))

export function parseArchiveQuery(input: URLSearchParams, allowQuery = true): ArchiveQueryState {
  const selected = (input.get('types') ?? '').split(',').filter((type): type is DiscoveryType => validTypes.has(type as DiscoveryType))
  return { query: allowQuery ? input.get('q')?.trim() ?? '' : '', types: [...new Set(selected)] }
}

export function serializeArchiveQuery(state: ArchiveQueryState): string {
  const output = new URLSearchParams()
  if (state.query) output.set('q', state.query)
  if (state.types.length) output.set('types', state.types.join(','))
  return output.size ? `?${output}` : ''
}
