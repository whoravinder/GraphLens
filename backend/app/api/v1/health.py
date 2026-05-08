from fastapi import APIRouter
from app.services.graph.neo4j_client import verify_connectivity
from app.services.rag.vector_store import get_collection_stats
from app.config import get_settings
import time

router = APIRouter(prefix="/health", tags=["Health"])
settings = get_settings()
_start_time = time.time()


@router.get("", summary="System health check")
async def health():
    neo4j_ok = await verify_connectivity()

    try:
        qdrant_stats = await get_collection_stats()
        qdrant_ok = qdrant_stats.get("status") != "unavailable"
    except Exception:
        qdrant_ok = False
        qdrant_stats = {"status": "unavailable"}

    uptime_seconds = int(time.time() - _start_time)

    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime_seconds,
        "services": {
            "neo4j": "ok" if neo4j_ok else "degraded",
            "qdrant": "ok" if qdrant_ok else "degraded",
        },
        "qdrant": qdrant_stats,
    }


@router.get("/ready", summary="Readiness probe")
async def ready():
    return {"ready": True}


@router.get("/live", summary="Liveness probe")
async def live():
    return {"alive": True}
