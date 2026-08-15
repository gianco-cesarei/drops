import { useEffect, useMemo, useRef, useState } from 'react'
import { brainNodeTypes } from '../data/private.fixture'
import { brainGraphLinks, brainGraphNodes } from '../data/brainGraph.fixture'
import type { BrainCluster, BrainNodeFixture, BrainNodeType } from '../data/brainGraph.fixture'

type Position = BrainNodeFixture & { x: number; y: number; vx: number; vy: number; pinned: boolean }
type Tooltip = { node: BrainNodeFixture; x: number; y: number } | null

const clusterLabels: Record<BrainCluster, string> = {
  rom: 'Rominimal / hypnotic', house: 'House / tech', soul: 'Soulful / deep', mania: 'Mania / WOS', city: 'Geografia',
}

const radius: Record<BrainNodeType, number> = {
  Artist: 7, Label: 11, City: 5, Release: 8, Set: 8, Playlist: 8, Party: 10, Story: 8,
}

function initialPositions(): Position[] {
  return brainGraphNodes.map((node, index) => {
    const angle = (index / brainGraphNodes.length) * Math.PI * 2
    const ring = node.cluster === 'mania' ? 170 : node.cluster === 'city' ? 300 : 240
    return { ...node, x: 500 + Math.cos(angle) * ring, y: 330 + Math.sin(angle) * ring, vx: 0, vy: 0, pinned: false }
  })
}

export default function BrainGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const positions = useRef(initialPositions())
  const dragging = useRef<string | null>(null)
  const movedDuringDrag = useRef(false)
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<Tooltip>(null)

  const index = useMemo(() => new Map(positions.current.map((node) => [node.id, node])), [])
  const adjacency = useMemo(() => {
    const result = new Map(brainGraphNodes.map((node) => [node.id, new Set<string>()]))
    brainGraphLinks.forEach((link) => { result.get(link.source)?.add(link.target); result.get(link.target)?.add(link.source) })
    return result
  }, [])

  useEffect(() => {
    let frame = 0
    let animation = 0
    const tick = () => {
      const nodes = positions.current
      for (let aIndex = 0; aIndex < nodes.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < nodes.length; bIndex += 1) {
          const a = nodes[aIndex]; const b = nodes[bIndex]
          const dx = a.x - b.x; const dy = a.y - b.y
          const distanceSquared = dx * dx + dy * dy + .01
          const distance = Math.sqrt(distanceSquared)
          const force = 1800 / distanceSquared
          const fx = dx / distance * force; const fy = dy / distance * force
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
        }
      }
      brainGraphLinks.forEach((link) => {
        const a = index.get(link.source); const b = index.get(link.target)
        if (!a || !b) return
        const dx = b.x - a.x; const dy = b.y - a.y; const distance = Math.sqrt(dx * dx + dy * dy) + .01
        const force = (distance - 105) * .018
        const fx = dx / distance * force; const fy = dy / distance * force
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
      })
      nodes.forEach((node) => {
        node.vx += (500 - node.x) * .0018; node.vy += (330 - node.y) * .0018
        node.vx *= .86; node.vy *= .86
        if (!node.pinned) { node.x += node.vx; node.y += node.vy }
        node.x = Math.max(28, Math.min(972, node.x)); node.y = Math.max(42, Math.min(618, node.y))
      })
      setRevision((value) => value + 1)
      frame += 1
      if (frame < 360) animation = window.requestAnimationFrame(tick)
    }
    animation = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(animation)
  }, [index])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return
      const node = index.get(dragging.current)
      if (!node) return
      const rect = containerRef.current.getBoundingClientRect()
      node.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 1000
      node.y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 660
      node.x = Math.max(28, Math.min(972, node.x)); node.y = Math.max(42, Math.min(618, node.y))
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

  const visible = (id: string) => !selected || id === selected || adjacency.get(selected)?.has(id)
  const showTooltip = (node: BrainNodeFixture, clientX = 0, clientY = 0) => {
    const rect = containerRef.current?.getBoundingClientRect()
    setTooltip({ node, x: Math.max(12, Math.min((clientX || (rect?.left ?? 0) + 24) - (rect?.left ?? 0) + 14, (rect?.width ?? 900) - 300)), y: Math.max(12, Math.min((clientY || (rect?.top ?? 0) + 24) - (rect?.top ?? 0) + 14, (rect?.height ?? 620) - 150)) })
  }

  void revision
  return <section className="brain-panel" aria-labelledby="brain-graph-title">
    <header className="brain-panel-header">
      <div><span className="fixture-label">Fixture · seed v2</span><h2 id="brain-graph-title">Etichette, artisti, città e party</h2><p>Clicca un nodo per isolare relazioni. Trascina per riposizionare. Passa sopra per dettagli.</p></div>
      <button type="button" className="brain-reset" onClick={() => setSelected(null)} disabled={!selected}>Mostra tutto</button>
    </header>
    <div className="brain-type-legend" aria-label="Tipi di nodo">{brainNodeTypes.map((type) => <span key={type} data-type={type}>{type}</span>)}</div>
    <div className="brain-cluster-legend" aria-label="Cluster">{Object.entries(clusterLabels).filter(([cluster]) => cluster !== 'city').map(([cluster, label]) => <span key={cluster} data-cluster={cluster}><i />{label}</span>)}</div>
    <div className="brain-canvas" ref={containerRef}>
      <svg viewBox="0 0 1000 660" role="img" aria-label={`Grafo Brain con ${brainGraphNodes.length} nodi e ${brainGraphLinks.length} relazioni`} onClick={() => setSelected(null)}>
        <g className="brain-links">{brainGraphLinks.map((link) => {
          const source = index.get(link.source); const target = index.get(link.target)
          if (!source || !target) return null
          const connected = !selected || link.source === selected || link.target === selected
          return <line key={`${link.source}-${link.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} className={`${link.momentum ? 'momentum' : ''} ${selected && !connected ? 'dim' : ''} ${selected && connected ? 'highlighted' : ''}`} />
        })}</g>
        <g className="brain-nodes">{positions.current.map((node) => {
          const nodeRadius = radius[node.type]
          return <g key={node.id} role="button" tabIndex={0} aria-label={`${node.id}, ${node.type}`} aria-pressed={selected === node.id} className={`brain-node type-${node.type.toLowerCase()} cluster-${node.cluster} ${visible(node.id) ? '' : 'dim'} ${selected === node.id ? 'selected' : ''}`} transform={`translate(${node.x} ${node.y})`}
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
    <footer className="brain-panel-footer"><span>Verde tratteggiato: momentum</span><span>Seed statico · 15 agosto 2026 · da validare</span></footer>
  </section>
}
