import { useEffect, useMemo, useRef, useState } from 'react'
import { brainNodeTypes } from '../data/private.fixture'
import { brainGraphLinks, brainGraphNodes } from '../data/brainGraph.fixture'
import type { BrainCluster, BrainLinkFixture, BrainNodeFixture, BrainNodeType } from '../data/brainGraph.fixture'

type Position = BrainNodeFixture & { x: number; y: number; vx: number; vy: number; pinned: boolean }
type Tooltip = { node: BrainNodeFixture; x: number; y: number } | null

const clusterLabels: Record<BrainCluster, string> = {
  rom: 'Rominimal / hypnotic', house: 'House / tech', soul: 'Soulful / deep', mania: 'Mania / WOS', city: 'Geografia',
}

const radius: Record<BrainNodeType, number> = {
  Artist: 7, Label: 11, City: 5, Release: 8, Set: 8, Playlist: 8, Party: 10, Story: 8, Signal: 9,
}

const VIEW_W = 1000
const VIEW_H = 660
const CX = 500
const CY = 330
const X_MIN = 36
const X_MAX = 940
const Y_MIN = 48
const Y_MAX = 596

function clampX(x: number) { return Math.max(X_MIN, Math.min(X_MAX, x)) }
function clampY(y: number) { return Math.max(Y_MIN, Math.min(Y_MAX, y)) }

function initialPositions(nodes: BrainNodeFixture[]): Position[] {
  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2
    const ring = node.cluster === 'mania' ? 170 : node.cluster === 'city' ? 300 : 240
    return { ...node, x: clampX(CX + Math.cos(angle) * ring), y: clampY(CY + Math.sin(angle) * ring), vx: 0, vy: 0, pinned: false }
  })
}

type Props = { extraNodes?: BrainNodeFixture[]; extraLinks?: BrainLinkFixture[] }

export default function BrainGraph({ extraNodes = [], extraLinks = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<string | null>(null)
  const movedDuringDrag = useRef(false)
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [activeTypes, setActiveTypes] = useState<Set<BrainNodeType>>(new Set())
  const [activeClusters, setActiveClusters] = useState<Set<BrainCluster>>(new Set())
  const [tooltip, setTooltip] = useState<Tooltip>(null)

  const nodes = useMemo(() => [...brainGraphNodes, ...extraNodes], [extraNodes])
  const links = useMemo(() => [...brainGraphLinks, ...extraLinks], [extraLinks])
  const nodeKey = nodes.map((node) => node.id).join('|')

  const positions = useRef<Position[]>(initialPositions(nodes))
  const nodeKeyRef = useRef(nodeKey)
  if (nodeKeyRef.current !== nodeKey) { positions.current = initialPositions(nodes); nodeKeyRef.current = nodeKey }
  const index = useMemo(() => new Map(positions.current.map((node) => [node.id, node])), [nodeKey])
  const adjacency = useMemo(() => {
    const result = new Map(nodes.map((node) => [node.id, new Set<string>()]))
    links.forEach((link) => { result.get(link.source)?.add(link.target); result.get(link.target)?.add(link.source) })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey, links.length])

  useEffect(() => {
    let frame = 0
    let animation = 0
    const tick = () => {
      const list = positions.current
      for (let aIndex = 0; aIndex < list.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < list.length; bIndex += 1) {
          const a = list[aIndex]; const b = list[bIndex]
          const dx = a.x - b.x; const dy = a.y - b.y
          const distanceSquared = dx * dx + dy * dy + .01
          const distance = Math.sqrt(distanceSquared)
          const force = 1800 / distanceSquared
          const fx = dx / distance * force; const fy = dy / distance * force
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
        }
      }
      links.forEach((link) => {
        const a = index.get(link.source); const b = index.get(link.target)
        if (!a || !b) return
        const dx = b.x - a.x; const dy = b.y - a.y; const distance = Math.sqrt(dx * dx + dy * dy) + .01
        const force = (distance - 105) * .018
        const fx = dx / distance * force; const fy = dy / distance * force
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
      })
      list.forEach((node) => {
        node.vx += (CX - node.x) * .0018; node.vy += (CY - node.y) * .0018
        node.vx *= .86; node.vy *= .86
        if (!node.pinned) { node.x += node.vx; node.y += node.vy }
        node.x = clampX(node.x); node.y = clampY(node.y)
      })
      setRevision((value) => value + 1)
      frame += 1
      if (frame < 360) animation = window.requestAnimationFrame(tick)
    }
    animation = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(animation)
  }, [index, links, nodeKey])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return
      const node = index.get(dragging.current)
      if (!node) return
      const rect = containerRef.current.getBoundingClientRect()
      node.x = clampX(((event.clientX - rect.left) / Math.max(rect.width, 1)) * VIEW_W)
      node.y = clampY(((event.clientY - rect.top) / Math.max(rect.height, 1)) * VIEW_H)
      movedDuringDrag.current = true
      setRevision((value) => value + 1)
    }
    const up = () => {
      if (dragging.current) { const node = index.get(dragging.current); if (node) node.pinned = false }
      dragging.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [index])

  const filtersActive = activeTypes.size > 0 || activeClusters.size > 0
  const passesFilter = (node: BrainNodeFixture) => (activeTypes.size === 0 || activeTypes.has(node.type)) && (activeClusters.size === 0 || activeClusters.has(node.cluster))
  const visible = (node: BrainNodeFixture) => passesFilter(node) && (!selected || node.id === selected || adjacency.get(selected)?.has(node.id))
  const showTooltip = (node: BrainNodeFixture, clientX = 0, clientY = 0) => {
    const rect = containerRef.current?.getBoundingClientRect()
    setTooltip({ node, x: Math.max(12, Math.min((clientX || (rect?.left ?? 0) + 24) - (rect?.left ?? 0) + 14, (rect?.width ?? 900) - 300)), y: Math.max(12, Math.min((clientY || (rect?.top ?? 0) + 24) - (rect?.top ?? 0) + 14, (rect?.height ?? 620) - 150)) })
  }

  function toggleType(type: BrainNodeType) {
    setActiveTypes((current) => { const next = new Set(current); next.has(type) ? next.delete(type) : next.add(type); return next })
  }
  function toggleCluster(cluster: BrainCluster) {
    setActiveClusters((current) => { const next = new Set(current); next.has(cluster) ? next.delete(cluster) : next.add(cluster); return next })
  }
  function resetView() { setSelected(null); setActiveTypes(new Set()); setActiveClusters(new Set()) }

  void revision
  return <section className="brain-panel" aria-labelledby="brain-graph-title">
    <div className="brain-controls-overlay">
      <header className="brain-panel-header">
        <span className="fixture-label">Brain · fixture seed v2</span><h2 id="brain-graph-title" className="sr-only">Etichette, artisti, città e party</h2>
        <button type="button" className="brain-reset" onClick={resetView} disabled={!selected && !filtersActive}>Mostra tutto</button>
      </header>
      <div className="brain-type-legend" aria-label="Filtra per tipo di nodo">{brainNodeTypes.map((type) => <button type="button" key={type} data-type={type} aria-pressed={activeTypes.has(type)} onClick={() => toggleType(type)}>{type}</button>)}</div>
      <div className="brain-cluster-legend" aria-label="Filtra per cluster">{Object.entries(clusterLabels).filter(([cluster]) => cluster !== 'city').map(([cluster, label]) => <button type="button" key={cluster} data-cluster={cluster} aria-pressed={activeClusters.has(cluster as BrainCluster)} onClick={() => toggleCluster(cluster as BrainCluster)}><i />{label}</button>)}</div>
    </div>
    <div className="brain-canvas" ref={containerRef}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Grafo Brain con ${nodes.length} nodi e ${links.length} relazioni`} onClick={() => setSelected(null)}>
        <g className="brain-links">{links.map((link) => {
          const source = index.get(link.source); const target = index.get(link.target)
          if (!source || !target) return null
          const connected = !selected || link.source === selected || link.target === selected
          const filtered = !passesFilter(source) || !passesFilter(target)
          return <line key={`${link.source}-${link.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} className={`${link.momentum ? 'momentum' : ''} ${(selected && !connected) || filtered ? 'dim' : ''} ${selected && connected ? 'highlighted' : ''}`} />
        })}</g>
        <g className="brain-nodes">{positions.current.map((node) => {
          const nodeRadius = radius[node.type]
          return <g key={node.id} role="button" tabIndex={0} aria-label={`${node.id}, ${node.type}`} aria-pressed={selected === node.id} className={`brain-node type-${node.type.toLowerCase()} cluster-${node.cluster} ${visible(node) ? '' : 'dim'} ${selected === node.id ? 'selected' : ''}`} transform={`translate(${node.x} ${node.y})`}
            onClick={(event) => { event.stopPropagation(); if (!movedDuringDrag.current) setSelected((value) => value === node.id ? null : node.id); movedDuringDrag.current = false }}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected((value) => value === node.id ? null : node.id) } }}
            onPointerDown={(event) => { event.stopPropagation(); dragging.current = node.id; movedDuringDrag.current = false; node.pinned = true }}
            onPointerEnter={(event) => showTooltip(node, event.clientX, event.clientY)} onPointerMove={(event) => showTooltip(node, event.clientX, event.clientY)} onPointerLeave={() => setTooltip(null)} onFocus={() => showTooltip(node)} onBlur={() => setTooltip(null)}>
            {node.type === 'Party' ? <rect x={-nodeRadius} y={-nodeRadius} width={nodeRadius * 2} height={nodeRadius * 2} rx="2" transform="rotate(45)" /> : <circle r={nodeRadius} />}
            <text x={nodeRadius + 5} y="4">{node.type === 'City' ? node.id.slice(2) : node.id}</text>
          </g>
        })}</g>
      </svg>
      {tooltip && <aside className="brain-tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}><strong>{tooltip.node.type === 'City' ? tooltip.node.id.slice(2) : tooltip.node.id}</strong><span>{tooltip.node.type}{tooltip.node.city ? ` · ${tooltip.node.city}` : ''}</span><p>{tooltip.node.meta}</p><em>{clusterLabels[tooltip.node.cluster]}</em></aside>}
    </div>
    <footer className="brain-panel-footer"><span>Verde tratteggiato: momentum · Anello ambra: collegato dal Radar</span><span>Seed statico · 15 agosto 2026 · da validare</span></footer>
  </section>
}
