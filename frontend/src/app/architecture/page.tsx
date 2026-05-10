import { motion } from 'framer-motion'
import { Server, Database, BrainCircuit, Shield, GitBranch, Terminal } from 'lucide-react'
import Link from 'next/link'

const techStack = [
  { name: 'FastAPI', description: 'High-performance async Python web framework handling all API routes and background tasks.', icon: Server },
  { name: 'LangGraph', description: 'Orchestrates multi-agent workflows, managing the state and routing between retrieval, analysis, and validation nodes.', icon: BrainCircuit },
  { name: 'Qdrant', description: 'High-performance vector database storing dense embeddings of CVEs and MITRE techniques for semantic search.', icon: Database },
  { name: 'Neo4j', description: 'Graph database modeling complex relationships between vulnerabilities, infrastructure, and incidents.', icon: GitBranch },
  { name: 'PostgreSQL', description: 'Relational database for storing persistent structured data, incident logs, and system state.', icon: Database },
  { name: 'Redis', description: 'In-memory data store providing rate-limiting, temporary caching, and Celery task brokering.', icon: Terminal },
]

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden p-8 md:p-16 max-w-5xl mx-auto space-y-12 pt-32">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">Backend Architecture & Implementation</h1>
        <p className="text-xl text-muted-foreground">A deep dive into the AI, retrieval, and data processing systems powering GraphLens.</p>
        <div className="pt-4">
          <Link href="/" className="btn-secondary text-sm inline-flex">← Back to Home</Link>
        </div>
      </div>

      <section className="relative z-10 glass-card p-8 space-y-6">
        <h2 className="text-2xl font-bold border-b border-border/50 pb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          System Overview
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          GraphLens AI is built on a highly modular, event-driven microservices architecture. The core backend relies on <strong>FastAPI</strong> to expose a RESTful interface, securely proxying requests to the AI reasoning engine.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The intelligence layer uses <strong>LangGraph</strong> to define an autonomous agent workflow. When an incident report arrives, the system does not just pass it to an LLM. Instead, the input is parsed and routed through a <strong>Hybrid RAG</strong> pipeline:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li><strong>Vector Retrieval:</strong> Queries <strong>Qdrant</strong> using OpenAI embeddings to find semantically similar CVEs and attack patterns.</li>
          <li><strong>Graph Traversal:</strong> Queries <strong>Neo4j</strong> using Cypher to find connected entities (e.g., matching a compromised IP to known vulnerable hardware).</li>
          <li><strong>Reranking:</strong> Fuses the results using Reciprocal Rank Fusion (RRF) to ensure maximum relevance.</li>
        </ul>
      </section>

      <section className="relative z-10 space-y-6">
        <h2 className="text-2xl font-bold border-b border-border/50 pb-4">Core Technologies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech) => (
            <div key={tech.name} className="glass-card p-6 space-y-3">
              <tech.icon className="w-8 h-8 text-primary" />
              <h3 className="text-xl font-semibold text-foreground">{tech.name}</h3>
              <p className="text-sm text-muted-foreground">{tech.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 glass-card p-8 space-y-6">
        <h2 className="text-2xl font-bold border-b border-border/50 pb-4">Data Ingestion & Lifecycle</h2>
        <p className="text-muted-foreground leading-relaxed">
          To provide grounded analysis, the system automatically seeds itself with real-world threat intelligence. On startup, a background task pulls the <strong>CISA Known Exploited Vulnerabilities (KEV)</strong> catalog, <strong>NVD CVE data</strong>, and the <strong>MITRE ATT&CK</strong> framework.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          These documents are embedded and upserted into Qdrant as points using deterministic UUIDs (via <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary">uuid5</code>), and simultaneously mirrored into Neo4j as isolated nodes. When the AI analyzes an incident, it establishes dynamic relationships (edges) between the newly created Incident node and the pre-existing CVE/MITRE nodes, organically growing the knowledge graph.
        </p>
      </section>

      <section className="relative z-10 glass-card p-8 space-y-6">
        <h2 className="text-2xl font-bold border-b border-border/50 pb-4">Deployment Topology</h2>
        <p className="text-muted-foreground leading-relaxed">
          The entire stack is containerized using Docker Compose. The environment consists of:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li><strong>backend:</strong> Python 3.12, Uvicorn, FastAPI</li>
          <li><strong>frontend:</strong> Next.js 15 (Standalone build), TailwindCSS</li>
          <li><strong>postgres:</strong> Persistent relational storage (Port 5432)</li>
          <li><strong>neo4j:</strong> Graph database (Port 7474 / 7687)</li>
          <li><strong>qdrant:</strong> Vector database (Port 6333)</li>
          <li><strong>nginx:</strong> Reverse proxy routing <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary">/api/:path*</code> to the backend and <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary">/</code> to the frontend (Port 80)</li>
        </ul>
      </section>
    </div>
  )
}
