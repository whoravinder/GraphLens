'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Brain,
  GitBranch,
  Network,
  Search,
  Shield,
  Zap,
  ChevronRight,
  Globe,
  Lock,
  BarChart3,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Agentic AI Analysis',
    description: 'Multi-agent LangGraph workflows orchestrate retrieval, analysis, validation, and summarization — producing grounded, hallucination-reduced insights.',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
  },
  {
    icon: Search,
    title: 'Hybrid RAG',
    description: 'Combines semantic vector retrieval (Qdrant) with BM25 keyword search, fused via reciprocal rank fusion for maximum recall and precision.',
    color: 'from-violet-500/20 to-violet-600/5',
    border: 'border-violet-500/20',
  },
  {
    icon: Network,
    title: 'Graph Intelligence',
    description: 'Neo4j-powered knowledge graph models incidents, CVEs, devices, and dependencies — enabling traversal-based contextual intelligence.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
  },
  {
    icon: Shield,
    title: 'Grounded Citations',
    description: 'Every analysis references NVD CVEs, CISA KEV, and MITRE ATT&CK with source citations — zero hallucinated CVE IDs or techniques.',
    color: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/20',
  },
  {
    icon: Zap,
    title: 'Streaming Responses',
    description: 'Server-sent events stream analysis progress in real-time — watch the agents reason step by step as they process your incident.',
    color: 'from-yellow-500/20 to-yellow-600/5',
    border: 'border-yellow-500/20',
  },
  {
    icon: Globe,
    title: 'Public REST API',
    description: 'Fully documented OpenAPI endpoints. No auth required in MVP. Rate limited, CORS-configured, and production hardened from day one.',
    color: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/20',
  },
]

const stats = [
  { label: 'CVEs in Knowledge Base', value: '250K+' },
  { label: 'MITRE Techniques', value: '700+' },
  { label: 'CISA KEV Entries', value: '1,200+' },
  { label: 'API Response Time', value: '<2s' },
]

const exampleCode = `curl -X POST https://graphlens-ai.run.app/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "input_text": "SSH brute force detected from 192.168.1.100 targeting 10.0.0.5. 2,400 failed auth attempts in 60 seconds. CVE-2024-6387 suspected.",
    "source_type": "alert",
    "stream": false
  }'`

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-noise pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <nav className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground">GraphLens AI</span>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">Beta</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/playground" className="hover:text-foreground transition-colors">Playground</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm">
              Dashboard
            </Link>
            <Link href="/playground" className="btn-primary text-sm flex items-center gap-1.5">
              Try API <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 text-center">
        <motion.div {...fadeUp} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Powered by LangGraph + Hybrid RAG + Neo4j</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="text-foreground">Network Intelligence,</span>
          <br />
          <span className="text-gradient">AI-Powered.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Send logs, incidents, alerts, or CVEs. Get grounded AI analysis with root cause identification,
          remediation guidance, and graph-contextual relationships — all through a single public API.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/playground" className="btn-primary text-base px-6 py-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Open AI Playground
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/api/docs" target="_blank" className="btn-secondary text-base px-6 py-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            API Reference
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5 text-center">
              <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to analyze infrastructure events
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enterprise-grade AI pipeline from ingestion to remediation — built for security teams, DevOps, and developers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`glass-card-hover p-6 bg-gradient-to-br ${feature.color} ${feature.border}`}
            >
              <div className="w-10 h-10 rounded-lg bg-background/50 border border-border flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="section-header mb-3">Quick Start</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Start analyzing in 30 seconds</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                No API key required. No sign-up. Send your first incident analysis with a single curl command.
              </p>
              <div className="space-y-3 text-sm">
                {[
                  'Logs, alerts, CVEs, infrastructure events',
                  'Grounded citations from NVD, CISA, MITRE',
                  'Streaming or batch response modes',
                  'Graph-contextual relationship analysis',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-muted-foreground">
                    <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <Link href="/playground" className="btn-primary text-sm flex items-center gap-1.5">
                  Open Playground <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/docs" className="btn-secondary text-sm">
                  View Docs
                </Link>
              </div>
            </div>
            <div>
              <div className="section-header mb-3">Example Request</div>
              <div className="code-block text-xs overflow-x-auto whitespace-pre">{exampleCode}</div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card p-12"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Backend Tools & Implementation</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              A highly modular, event-driven microservices architecture powering the AI analysis and data orchestration pipelines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-border/50 pb-2">Tools Used (Backend)</h3>
              <div className="flex flex-wrap gap-2">
                {['FastAPI', 'LangGraph', 'Qdrant Vector DB', 'Neo4j Graph DB', 'PostgreSQL', 'Redis', 'Docker Compose', 'OpenAI Embeddings', 'Llama3 Reranker'].map(tool => (
                  <span key={tool} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-sm font-medium">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-border/50 pb-2">Implementation Summary</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                The backend utilizes FastAPI to expose a RESTful interface, proxying requests to an autonomous reasoning engine managed by LangGraph. Incident reports are routed through a Hybrid RAG pipeline combining dense vector retrieval (Qdrant) and graph traversals (Neo4j). Responses are fused via Reciprocal Rank Fusion, ensuring perfectly grounded security context and mitigating AI hallucinations.
              </p>
              <Link href="/architecture" className="btn-secondary inline-flex items-center gap-2 mt-2">
                <Network className="w-4 h-4" />
                View Full Architecture Details
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-border/50 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Activity className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">GraphLens AI — Created by Ravinder Singh</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/api/docs" target="_blank" className="hover:text-foreground transition-colors">API Docs</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/playground" className="hover:text-foreground transition-colors">Playground</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
