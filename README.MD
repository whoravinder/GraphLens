# GraphLens AI



GraphLens AI is a comprehensive Network & Incident Intelligence Platform that leverages graph databases, large language models, and advanced retrieval-augmented generation (RAG) techniques to provide deep insights into cybersecurity incidents, network topologies, and threat analysis.

## Features

- **Graph-Based Analysis**: Visualize and analyze complex relationships between network entities, incidents, and vulnerabilities using Neo4j
- **AI-Powered Insights**: Utilize LangChain and OpenAI models for intelligent analysis and recommendations
- **Real-Time Incident Tracking**: Monitor and respond to security incidents with automated ingestion from CISA and NVD feeds
- **Hybrid Search**: Combine BM25 keyword search with vector similarity search for comprehensive information retrieval
- **Interactive Dashboard**: Modern web interface built with Next.js for intuitive data exploration
- **API-First Design**: RESTful API built with FastAPI for seamless integration
- **Scalable Architecture**: Containerized deployment with Docker and orchestration support

## Architecture

GraphLens AI follows a microservices-inspired architecture with clear separation of concerns:

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Databases     │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   • Neo4j       │
│                 │    │                 │    │   • Qdrant      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Interface│    │   Business Logic│    │   Data Layer    │
│   • Dashboard   │    │   • Services    │    │   • Graph Data  │
│   • Analytics   │    │   • Agents      │    │   • Vectors     │
│   • Graph View  │    │   • Workflows   │    │   • Embeddings  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Details

#### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with Radix UI components
- **Visualization**: D3.js and Recharts for interactive graphs and charts
- **State Management**: SWR for data fetching and caching

#### Backend
- **Framework**: FastAPI with async support
- **Database**: Neo4j for graph storage and traversal
- **Vector Store**: Qdrant for high-performance vector similarity search
- **LLM Integration**: LangChain with OpenAI GPT models
- **Search**: Hybrid BM25 + vector search with reranking

#### Services
- **Incident Service**: Manages security incident data and workflows
- **Graph Service**: Handles graph operations and traversals
- **Ingestion Service**: Automated data ingestion from external sources (CISA, NVD)
- **RAG Service**: Retrieval-augmented generation for intelligent responses
- **LLM Service**: AI-powered analysis and recommendations

#### Data Flow
1. **Ingestion**: External data sources feed into Neo4j and vector stores
2. **Processing**: AI agents analyze and enrich data relationships
3. **Query**: Hybrid search retrieves relevant information
4. **Presentation**: Frontend visualizes insights and allows interaction

## Tech Stack

### Backend
- **Python 3.12+**
- **FastAPI**: High-performance async web framework
- **Neo4j**: Graph database for relationship modeling
- **Qdrant**: Vector database for embeddings
- **LangChain**: LLM framework and orchestration
- **OpenAI**: GPT models for AI capabilities
- **SQLAlchemy**: ORM for potential relational data
- **Pydantic**: Data validation and settings

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Recharts**: Composable charting library
- **D3.js**: Data visualization library

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancing
- **Supervisor**: Process management

## Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local development)
- Node.js 18+ (for local development)
- Neo4j instance (can be run via Docker)
- OpenAI API key

## Installation

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/graphlens.git
   cd graphlens
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Configure environment variables
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Usage

### Dashboard
- **Analytics**: View incident trends and statistics
- **Graph Explorer**: Interactive network visualization
- **Incident Management**: Track and analyze security events
- **Playground**: Test AI queries and analysis

### API Endpoints

#### Health Check
```http
GET /api/v1/health
```

#### Graph Operations
```http
GET /api/v1/graph/nodes
POST /api/v1/graph/query
```

#### Incident Management
```http
GET /api/v1/incidents
POST /api/v1/incidents/analyze
```

#### Search
```http
POST /api/v1/search/hybrid
```

For complete API documentation, visit `/docs` when the backend is running.

## Development

### Project Structure
```
graphlens/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── db/             # Database connections
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Custom middleware
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/            # App router pages
│   │   └── components/     # Reusable components
│   ├── package.json
│   └── next.config.ts
├── nginx/                   # Nginx configuration
├── scripts/                 # Utility scripts
└── docker-compose.yml       # Container orchestration
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality
- **Linting**: ESLint for frontend, Ruff for backend
- **Formatting**: Prettier for frontend, Black for backend
- **Type Checking**: TypeScript for frontend, mypy for backend

## Deployment

### Production Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d
```

### Cloud Run Deployment
The application is configured for Google Cloud Run deployment with:
- Nginx as reverse proxy
- Supervisord for process management
- Environment-specific configurations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Development Guidelines
- Follow the existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Ensure all CI checks pass

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Next.js](https://nextjs.org/)
- Powered by [Neo4j](https://neo4j.com/) and [OpenAI](https://openai.com/)
- Data sources: [CISA](https://www.cisa.gov/) and [NVD](https://nvd.nist.gov/)
