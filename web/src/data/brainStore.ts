import { useEffect, useState } from 'react'
import { brainGraphNodes } from './brainGraph.fixture'
import type { BrainCluster, BrainLinkFixture, BrainNodeFixture } from './brainGraph.fixture'
import type { RadarFixture } from './private.fixture'
import { publishedContentItems } from './content.data'

// PROTOTYPE STORAGE: state lives only in this browser's localStorage. No backend, no real data.
// When a real API exists, replace the bodies of the functions below — callers never touch
// localStorage directly, so nothing in Brain/Radar components has to change.

export type RadarStatus = 'saved' | 'discarded' | 'linked' | 'content'
export type StoredBrainNode = BrainNodeFixture & { origin: 'radar'; fromFixtureId: string }

export type PrototypeState = {
  extraNodes: StoredBrainNode[]
  extraLinks: BrainLinkFixture[]
  radarStatus: Record<string, RadarStatus>
  unlockedIds: string[]
  contentStatus: Record<string, 'Draft' | 'Published'>
  featuredId: string | null
}

const STORAGE_KEY = 'drops:dev-prototype:radar-brain:v1'
const isBrowser = () => typeof window !== 'undefined'

function emptyState(): PrototypeState {
  return { extraNodes: [], extraLinks: [], radarStatus: {}, unlockedIds: [], contentStatus: {}, featuredId: null }
}

export function loadPrototypeState(): PrototypeState {
  if (!isBrowser()) return emptyState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<PrototypeState>
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

function persist(state: PrototypeState): PrototypeState {
  if (isBrowser()) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage unavailable: prototype state just won't persist */ }
  }
  return state
}

export function resetPrototypeState(): PrototypeState {
  if (isBrowser()) { try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ } }
  return emptyState()
}

function clusterFor(targetId: string | undefined): BrainCluster {
  return brainGraphNodes.find((node) => node.id === targetId)?.cluster ?? 'house'
}

function nodeIdFor(fixture: RadarFixture): string {
  return `Radar · ${fixture.title.replace(/^\[Development]\s*/, '')}`
}

export function linkRadarToBrain(fixture: RadarFixture): PrototypeState {
  const state = loadPrototypeState()
  if (state.radarStatus[fixture.id] === 'linked') return state
  const id = nodeIdFor(fixture)
  const newNode: StoredBrainNode = {
    id, type: 'Signal', cluster: clusterFor(fixture.brainLinks[0]?.targetId), meta: fixture.relevance, origin: 'radar', fromFixtureId: fixture.id,
  }
  const newLinks: BrainLinkFixture[] = fixture.brainLinks.map((link) => ({ source: id, target: link.targetId, relation: link.relation }))
  const next: PrototypeState = {
    extraNodes: [...state.extraNodes, newNode],
    extraLinks: [...state.extraLinks, ...newLinks],
    radarStatus: { ...state.radarStatus, [fixture.id]: 'linked' },
    unlockedIds: [...new Set([...state.unlockedIds, ...fixture.unlocks])],
    contentStatus: state.contentStatus,
    featuredId: state.featuredId,
  }
  return persist(next)
}

export function setRadarStatus(id: string, status: RadarStatus): PrototypeState {
  const state = loadPrototypeState()
  const next = { ...state, radarStatus: { ...state.radarStatus, [id]: status } }
  return persist(next)
}

export function getArticleStatus(id: string, contentStatus: Record<string, 'Draft' | 'Published'>): 'Draft' | 'Published' {
  if (id in contentStatus) return contentStatus[id]
  const isReal = publishedContentItems.some((item) => item.id === id)
  if (!isReal) return 'Published'
  if (id === 'festival-houghton-norfolk' || id === 'festival-omana-kalamitsi') return 'Published'
  return 'Draft'
}

export function publishArticle(id: string): PrototypeState {
  const state = loadPrototypeState()
  const next = { ...state, contentStatus: { ...state.contentStatus, [id]: 'Published' as const } }
  return persist(next)
}

export function draftArticle(id: string): PrototypeState {
  const state = loadPrototypeState()
  const next = { ...state, contentStatus: { ...state.contentStatus, [id]: 'Draft' as const } }
  return persist(next)
}

export function getFeaturedId(state: PrototypeState): string {
  return state.featuredId ?? 'festival-houghton-norfolk'
}

export function setFeaturedArticle(id: string): PrototypeState {
  const state = loadPrototypeState()
  const next = { ...state, featuredId: id }
  return persist(next)
}

// Reads localStorage only after mount so server-rendered and first client render match (no hydration mismatch).
export function usePrototypeState() {
  const [state, setState] = useState<PrototypeState>(emptyState())
  useEffect(() => { setState(loadPrototypeState()) }, [])
  return [state, setState] as const
}
