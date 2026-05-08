'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE = typeof window !== 'undefined' ? window.location.origin : ''

const endpoints = [
  {
    method: 'POST',
    path: '/api/analyze',
    summary: 'Analyze incident, log, alert, or CVE with AI',
    description: 'Runs a full agentic workflow: retrieval → graph context → AI analysis → validation → summarization. Supports streaming via SSE.',
    request: {
      input_text: 'SSH brute force detected from 192.168.1.100. CVE-2024-6387 suspected.',
      source_type: 'alert',
      stream: false,
    },
    response: {
      success: true,
      data: {
        id: 'uuid',
        classification: 'Brute Force Attack',
        severity_score: 8.2,
        severity_label: 'high',
        root_cause: 'Automated SSH credential stuffing...',
        remediation: '1. Block source IP. 2. Enable fail2ban...',
        summary: 'High-severity SSH brute force attack detected...',
        citations: [{ source: 'NVD', title: 'CVE-2024-6387', url: 'https://nvd.nist.gov/...' }],
        latency_ms: 1842,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/search',
    summary: 'Hybrid search across knowledge base',
    description: 'Combines semantic vector search (Qdrant) with BM25 keyword retrieval, fused via reciprocal rank fusion.',
    request: {
      query: 'Log4j remote code execution',
      search_type: 'hybrid',
      top_k: 10,
    },
    response: {
      success: true,
      data: [{ id: 'cve_2021_44228', title: 'CVE-2021-44228', excerpt: '...', score: 0.94, source: 'NVD' }],
      meta: { total: 10, search_type: 'hybrid' },
    },
  },
  {
    method: 'GET',
    path: '/api/incidents',
    summary: 'List incidents with filtering and pagination',
    description: 'Returns paginated incidents. Filter by severity and status.',
    params: [
      { name: 'page', type: 'integer', default: '1' },
      { name: 'per_page', type: 'integer', default: '20', max: '100' },
      { name: 'severity', type: 'string', values: 'critical | high | medium | low | info' },
      { name: 'status', type: 'string', values: 'open | investigating | resolved | closed' },
    ],
    response: {
      success: true,
      data: [],
      total: 0,
      page: 1,
      per_page: 20,
      has_next: false,
      has_prev: false,
    },
  },
  {
    method: 'POST',
    path: '/api/incidents',
    summary: 'Create a new incident',
    description: 'Create an incident record. Automatically synced to vector store and Neo4j graph.',
    request: {
      title: 'SSH brute force on production server',
      severity: 'high',
      source_type: 'alert',
      description: 'Multiple failed SSH authentication attempts detected',
    },
    response: { success: true, data: { id: 'uuid', title: '...', severity: 'high', status: 'open' } },
  },
  {
    method: 'POST',
    path: '/api/graph/query',
    summary: 'Query the knowledge graph',
    description: 'Execute natural language or Cypher queries against the Neo4j graph. Returns nodes and relationships.',
    request: { query: 'CVE-2024-6387', depth: 2, limit: 25 },
    response: {
      success: true,
      data: {
        nodes: [{ id: 'cve_CVE-2024-6387', labels: ['CVE'], properties: {} }],
        relationships: [],
        total_nodes: 1,
        total_relationships: 0,
      },
    },
  },
  {
    method: 'GET',
    path: '/api/health',
    summary: 'System health check',
    description: 'Returns health status of all platform services.',
    response: {
      status: 'ok',
      version: '1.0.0',
      services: { neo4j: 'ok', qdrant: 'ok' },
      uptime_seconds: 3600,
    },
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-400 border-green-500/20',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PUT: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/20',
}

export default function DocsPage() {
  const [expanded, setExpanded] = useState<number | null>(0)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied to clipboard')
  }

  const buildCurl = (ep: typeof endpoints[0]) => {
    if (ep.method === 'GET') {
      return `curl -X GET "${API_BASE}${ep.path}" \\\n  -H "Content-Type: application/json"`
    }
    return `curl -X ${ep.method} "${API_BASE}${ep.path}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.request, null, 2)}'`
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Documentation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete reference for the GraphLens AI REST API
          </p>
        </div>
        <a
          href="/api/docs"
          target="_blank"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          OpenAPI / Swagger
        </a>
      </div>

      <div className="glass-card p-5">
        <div className="section-header mb-3">Base URL</div>
        <div className="code-block text-sm">{API_BASE || 'https://your-deployment.run.app'}</div>
        <div className="mt-3 text-sm text-muted-foreground">
          No authentication required. Rate limited to 60 requests/minute per IP.
          All endpoints return JSON with <code className="text-primary">Content-Type: application/json</code>.
        </div>
      </div>

      <div className="space-y-3">
        {endpoints.map((ep, i) => (
          <motion.div
            key={ep.path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card overflow-hidden"
          >
            <button
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/10 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span className={`text-xs font-bold px-2 py-1 rounded border ${METHOD_COLORS[ep.method]}`}>
                {ep.method}
              </span>
              <span className="font-mono text-sm text-foreground">{ep.path}</span>
              <span className="text-sm text-muted-foreground flex-1">{ep.summary}</span>
              {expanded === i ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expanded === i && (
              <div className="border-t border-border/50 p-5 space-y-4">
                <p className="text-sm text-muted-foreground">{ep.description}</p>

                {ep.params && (
                  <div>
                    <div className="section-header mb-2">Query Parameters</div>
                    <div className="space-y-2">
                      {ep.params.map((p) => (
                        <div key={p.name} className="flex items-start gap-3 text-sm">
                          <code className="text-primary font-mono w-24 flex-shrink-0">{p.name}</code>
                          <span className="text-muted-foreground w-16">{p.type}</span>
                          <span className="text-muted-foreground text-xs">{p.values || `default: ${p.default}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ep.request && (
                  <div>
                    <div className="section-header mb-2">Request Body</div>
                    <div className="relative">
                      <button
                        className="absolute top-2 right-2 p-1.5 hover:bg-muted/50 rounded"
                        onClick={() => copyCode(JSON.stringify(ep.request, null, 2))}
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <pre className="code-block text-xs whitespace-pre-wrap">{JSON.stringify(ep.request, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div>
                  <div className="section-header mb-2">cURL Example</div>
                  <div className="relative">
                    <button
                      className="absolute top-2 right-2 p-1.5 hover:bg-muted/50 rounded"
                      onClick={() => copyCode(buildCurl(ep))}
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <pre className="code-block text-xs whitespace-pre-wrap">{buildCurl(ep)}</pre>
                  </div>
                </div>

                <div>
                  <div className="section-header mb-2">Response</div>
                  <pre className="code-block text-xs whitespace-pre-wrap">{JSON.stringify(ep.response, null, 2)}</pre>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-5">
        <div className="section-header mb-3">Rate Limits & Errors</div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-foreground font-medium mb-2">Rate Limits</div>
            <div className="space-y-1 text-muted-foreground text-xs">
              <div>• 60 requests / minute / IP</div>
              <div>• 429 response with <code className="text-primary">Retry-After</code> header</div>
              <div>• Max request body: 10MB</div>
              <div>• Request timeout: 120s</div>
            </div>
          </div>
          <div>
            <div className="text-foreground font-medium mb-2">Error Format</div>
            <pre className="code-block text-xs">{JSON.stringify({ error: { code: 'ERROR_CODE', message: 'Human readable message' } }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
