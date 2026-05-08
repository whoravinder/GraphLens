'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Network, Search, Info, Loader2 } from 'lucide-react'
import * as d3 from 'd3'

type GraphNode = {
  id: string
  labels: string[]
  properties: Record<string, unknown>
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

type GraphLink = {
  id: string
  type: string
  source: string | GraphNode
  target: string | GraphNode
  properties: Record<string, unknown>
}

type RawRelationship = {
  id: string
  type: string
  start_node: string
  end_node: string
  properties: Record<string, unknown>
}

const LABEL_COLORS: Record<string, string> = {
  Incident: '#3b82f6',
  CVE: '#ef4444',
  Device: '#22c55e',
  Alert: '#f97316',
  Vulnerability: '#a855f7',
  Default: '#6b7280',
}

const getLabelColor = (labels: string[]) => {
  for (const label of labels) {
    if (LABEL_COLORS[label]) return LABEL_COLORS[label]
  }
  return LABEL_COLORS.Default
}

export default function GraphPage() {
  const [query, setQuery] = useState('')
  const [depth, setDepth] = useState(2)
  const [loading, setLoading] = useState(false)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  useEffect(() => {
    fetch('/api/graph/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data || {}))
      .catch(() => {})
  }, [])

  const runQuery = useCallback(async () => {
    setLoading(true)
    setSelectedNode(null)
    try {
      const response = await fetch('/api/graph/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, depth, limit: 50 }),
      })
      const data = await response.json()
      if (data.data) {
        setNodes(data.data.nodes || [])
        const rawLinks = (data.data.relationships || []).map((r: RawRelationship): GraphLink => ({
          id: r.id,
          type: r.type,
          source: r.start_node,
          target: r.end_node,
          properties: r.properties,
        }))
        setLinks(rawLinks)
      }
    } catch {
      // handle error silently
    } finally {
      setLoading(false)
    }
  }, [query, depth])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    const g = svg.append('g')

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40))

    simulationRef.current = simulation

    g.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#374151')

    const link = g.selectAll('.link')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)')

    const linkLabel = g.selectAll('.link-label')
      .data(links)
      .join('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#6b7280')
      .text((d) => d.type)

    const node = g.selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (_, d) => setSelectedNode(d))

    node.append('circle')
      .attr('r', 18)
      .attr('fill', (d) => getLabelColor(d.labels))
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d) => getLabelColor(d.labels))
      .attr('stroke-width', 2)

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', (d) => getLabelColor(d.labels))
      .text((d) => d.labels[0]?.[0] || '?')

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 28)
      .attr('font-size', '9px')
      .attr('fill', '#9ca3af')
      .text((d) => {
        const name = d.properties.title || d.properties.name || d.properties.cve_id || d.id
        return String(name).slice(0, 16)
      })

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0)

      linkLabel
        .attr('x', (d) => (((d.source as GraphNode).x || 0) + ((d.target as GraphNode).x || 0)) / 2)
        .attr('y', (d) => (((d.source as GraphNode).y || 0) + ((d.target as GraphNode).y || 0)) / 2)

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`)
    })

    return () => simulation.stop()
  }, [nodes, links])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Graph Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore relationships between incidents, CVEs, devices, and vulnerabilities
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Nodes', value: stats.total_nodes ?? '—' },
          { label: 'Relationships', value: stats.total_relationships ?? '—' },
          { label: 'Connected', value: stats.connected ? 'Yes' : 'No' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3 col-span-1">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-lg font-bold text-foreground">{String(s.value)}</div>
          </div>
        ))}
        {Object.entries(LABEL_COLORS).filter(([k]) => k !== 'Default').map(([label, color]) => (
          <div key={label} className="glass-card p-3 col-span-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="input-field pl-9"
            placeholder="Search entities (CVE-2024-1234, hostname, incident keyword...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runQuery()}
          />
        </div>
        <select className="input-field w-32" value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Depth {d}</option>)}
        </select>
        <button onClick={runQuery} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
          Query
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-card" style={{ height: '560px' }}>
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Network className="w-7 h-7 text-primary/60" />
              </div>
              <div>
                <div className="text-base font-medium text-foreground mb-1">No graph data</div>
                <div className="text-sm text-muted-foreground">Search for entities to visualize the knowledge graph</div>
              </div>
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height="100%" className="rounded-xl" />
          )}
        </div>

        <div className="space-y-4">
          {selectedNode ? (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: getLabelColor(selectedNode.labels) }}
                />
                <span className="font-semibold text-sm text-foreground">{selectedNode.labels.join(', ')}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(selectedNode.properties).slice(0, 10).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-xs text-muted-foreground">{key}</div>
                    <div className="text-xs text-foreground break-all">{String(value).slice(0, 100)}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-4 text-center text-sm text-muted-foreground">
              <Info className="w-5 h-5 mx-auto mb-2 opacity-50" />
              Click a node to view its properties
            </div>
          )}

          <div className="glass-card p-4">
            <div className="section-header mb-3">Graph Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nodes shown</span>
                <span className="text-foreground font-medium">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationships</span>
                <span className="text-foreground font-medium">{links.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
