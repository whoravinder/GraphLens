# GraphLens AI — Network & Incident Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/LangGraph-0.2-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Neo4j-5.25-blue?style=flat-square&logo=neo4j" />
  <img src="https://img.shields.io/badge/Qdrant-1.11-red?style=flat-square" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" />
</p>

> **GraphLens AI** is a production-grade, AI-powered network and incident intelligence platform. Submit logs, alerts, CVEs, or infrastructure events — get grounded AI analysis with root cause identification, graph-contextual relationships, and remediation guidance through a single public REST API.

---

## Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              Nginx Reverse Proxy              │
                    │         (rate limiting, TLS, headers)         │
                    └──────────────────┬───────────────────────────┘
                                       │
                    ┌──────────────────┴───────────────────────────┐
                    │                                              │
          ┌─────────▼─────────┐                    ┌─────────▼────────┐
          │   Next.js 15      │                    │   FastAPI + UV   │
          │   Frontend        │◄──── API Proxy ───►│   Backend API    │
          │   (TypeScript)    │                    │   (Python 3.12)  │
          └───────────────────┘                    └─────────┬────────┘
                                                             │
                         ┌───────────────────────────────────┼──────────────────────┐
                         │                                   │                      │
               ┌─────────▼────────┐              ┌──────────▼──────┐    ┌──────────▼──────┐
               │  LangGraph       │              │  Qdrant          │    │  Neo4j           │
               │  Agent Pipeline  │              │  Vector Store    │    │  Graph Database  │
               │  ┌────────────┐  │              │  (Embeddings)    │    │  (Relationships) │
               │  │ Retrieval  │  │              └──────────────────┘    └──────────────────┘
               │  │ Graph      │  │
               │  │ Analysis   │  │              ┌──────────────────┐    ┌──────────────────┐
               │  │ Validation │  │              │  PostgreSQL       │    │  Redis           │
               │  │ Summary    │  │              │  (Incidents DB)  │    │  (Rate Limiting) │
               │  └────────────┘  │              └──────────────────┘    └──────────────────┘
               └──────────────────┘
                         │
               ┌─────────▼────────────────────────────────┐
               │           Knowledge Base (RAG)            │
               │  NVD CVE API  ·  CISA KEV  ·  MITRE ATT&CK │
               │  User Incidents  ·  Historical Analyses    │
               └──────────────────────────────────────────┘
```

---

## Features

### AI Pipeline
- **5-agent LangGraph workflow**: Retrieval → Graph Context → Analysis → Validation → Summarization
- **Hybrid RAG**: Semantic (Qdrant) + BM25 keyword, fused via Reciprocal Rank Fusion
- **Grounded citations**: NVD, CISA KEV, MITRE ATT&CK — no hallucinated CVE IDs
- **Streaming SSE**: Watch agents reason in real-time

### Graph Intelligence
- Neo4j models incidents, CVEs, devices, alerts, and dependencies
- Graph traversal provides contextual relationship enrichment
- Auto-syncs new incidents and CVEs to the knowledge graph

### Public REST API
- No authentication required (MVP)
- Rate limited (60 req/min/IP), request size capped (10MB), timeout protected
- Full OpenAPI/Swagger documentation at `/api/docs`

### Frontend Dashboard
- **Landing page** — hero, features, quick-start
- **AI Playground** — streaming analysis with agent pipeline visualization
- **Incidents Explorer** — searchable, filterable incident table
- **Graph Visualization** — D3 force-directed interactive graph
- **Analytics** — charts for trends, severity, threat radar
- **API Docs** — interactive documentation with curl examples

---

## Quick Start

### Prerequisites
- Docker Desktop installed
- OpenAI API key (or compatible endpoint)

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/graphlens-ai.git
cd graphlens-ai
cp backend/.env.example backend/.env
# Edit backend/.env and set: OPENAI_API_KEY=sk-...
```

### 2. Start

```bash
bash scripts/start.sh
```

This builds all containers and starts:
- **Frontend**: http://localhost (via nginx)
- **API**: http://localhost/api
- **Swagger**: http://localhost/api/docs
- **Neo4j Browser**: http://localhost:7474
- **Qdrant Dashboard**: http://localhost:6333/dashboard

> **Knowledge base is seeded automatically.**
> On the first boot, the backend detects an empty Qdrant collection and runs ingestion of CISA KEV, MITRE ATT&CK, and NVD CVEs in the background — no manual step needed. Watch progress with `docker compose logs -f backend`.
> Set `AUTO_SEED_ON_STARTUP=false` to disable this behaviour.

---

## API Reference

### Analyze Incident

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "SSH brute force from 192.168.1.100. CVE-2024-6387 suspected.",
    "source_type": "alert",
    "stream": false
  }'
```

### Search Knowledge Base

```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Log4j remote code execution", "search_type": "hybrid", "top_k": 10}'
```

### Query Graph

```bash
curl -X POST http://localhost:8000/api/graph/query \
  -H "Content-Type: application/json" \
  -d '{"query": "CVE-2024-6387", "depth": 2}'
```

### List Incidents

```bash
curl "http://localhost:8000/api/incidents?severity=critical&page=1"
```

### Health Check

```bash
curl http://localhost:8000/api/health
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI or compatible API key | required |
| `OPENAI_BASE_URL` | API base URL (DeepSeek, local, etc.) | `https://api.openai.com/v1` |
| `LLM_MODEL` | Chat model name | `gpt-4o-mini` |
| `EMBEDDING_MODEL` | Embedding model name | `text-embedding-3-small` |
| `DATABASE_URL` | PostgreSQL async connection string | see `.env.example` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `QDRANT_URL` | Qdrant HTTP URL | `http://qdrant:6333` |
| `NEO4J_URI` | Neo4j Bolt URI | `bolt://neo4j:7687` |
| `NEO4J_PASSWORD` | Neo4j password | `graphlens123` |
| `RATE_LIMIT_PER_MINUTE` | API rate limit per IP | `60` |
| `ENVIRONMENT` | `development` or `production` | `development` |

---

## Using DeepSeek (Free Alternative)

```env
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
EMBEDDING_MODEL=text-embedding-3-small
```

The LangChain OpenAI client is fully compatible with any OpenAI-spec endpoint.

---

## Google Cloud Run Deployment

### Build and Push

```bash
PROJECT_ID=your-gcp-project
gcloud builds submit --tag gcr.io/$PROJECT_ID/graphlens-backend ./backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/graphlens-frontend ./frontend
```

### Deploy Backend

```bash
gcloud run deploy graphlens-backend \
  --image gcr.io/$PROJECT_ID/graphlens-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars OPENAI_API_KEY=sk-... \
  --set-env-vars DATABASE_URL=... \
  --set-env-vars QDRANT_URL=... \
  --set-env-vars NEO4J_URI=...
```

### Deploy Frontend

```bash
gcloud run deploy graphlens-frontend \
  --image gcr.io/$PROJECT_ID/graphlens-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=https://graphlens-backend-xxx.run.app
```

For production, use **Cloud SQL** (PostgreSQL), **Memorystore** (Redis), **Qdrant Cloud**, and **Neo4j AuraDB** instead of Docker services.

---

## Folder Structure

```
graphlens-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers (analyze, incidents, search, graph, health)
│   │   ├── core/            # Logging, errors, response utilities
│   │   ├── db/              # SQLAlchemy engine and session
│   │   ├── middleware/       # Rate limiting, security headers, request logging
│   │   ├── models/
│   │   │   ├── db/          # SQLAlchemy ORM models
│   │   │   └── schemas/     # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── agents/      # LangGraph workflow (state, nodes, workflow)
│   │   │   ├── graph/       # Neo4j client and graph retriever
│   │   │   ├── ingestion/   # NVD, CISA KEV, MITRE ATT&CK pipelines
│   │   │   ├── llm/         # LLM client factory and prompt templates
│   │   │   └── rag/         # Hybrid retriever, vector store, BM25
│   │   ├── config.py        # Pydantic settings
│   │   └── main.py          # FastAPI application factory
│   └── Dockerfile
├── frontend/
│   └── src/app/
│       ├── (dashboard)/     # Dashboard layout group
│       │   ├── dashboard/   # Main dashboard
│       │   ├── playground/  # AI playground
│       │   ├── incidents/   # Incident explorer
│       │   ├── graph/       # Graph visualization
│       │   ├── analytics/   # Analytics charts
│       │   └── docs/        # API documentation
│       └── page.tsx         # Landing page
├── nginx/nginx.conf
├── scripts/
│   ├── start.sh
│   └── seed.sh
├── docker-compose.yml
└── .env.example
```

---

## Security

- No secrets committed to repository
- Environment variable driven configuration
- Non-root users inside containers
- Security headers on all responses
- Rate limiting at nginx and application layer
- Request size and timeout limits
- CORS restricted as needed

---

## Scaling Notes

- **Horizontal scaling**: Backend is stateless. Add replicas behind a load balancer.
- **Qdrant**: Use Qdrant Cloud or self-hosted cluster for high-availability.
- **Neo4j**: Use Neo4j AuraDB Enterprise for clustered deployments.
- **PostgreSQL**: Use Cloud SQL or RDS with read replicas for read-heavy workloads.
- **Embeddings**: Switch to local `sentence-transformers` with `EMBEDDING_MODEL=local` to eliminate OpenAI embedding costs.

---

## License

MIT — Build on top of this. Attribution appreciated but not required.
