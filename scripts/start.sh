#!/usr/bin/env bash
set -euo pipefail

echo "GraphLens AI — Starting platform..."

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found. Install Docker Desktop first."
    exit 1
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env — set OPENAI_API_KEY inside it before continuing."
    exit 1
fi

docker compose pull --quiet
docker compose build --parallel
docker compose up -d

echo ""
echo "GraphLens AI is running."
echo "Knowledge base is seeded automatically on first boot (CISA KEV, MITRE ATT&CK, NVD)."
echo ""
echo "  Frontend:  http://localhost"
echo "  API:       http://localhost/api"
echo "  Swagger:   http://localhost/api/docs"
echo "  Neo4j UI:  http://localhost:7474"
echo "  Qdrant UI: http://localhost:6333/dashboard"
echo ""
echo "Tail logs: docker compose logs -f backend"
