from fastapi import APIRouter
from app.api.v1 import analyze, incidents, search, graph, health

router = APIRouter(prefix="/api")
router.include_router(analyze.router)
router.include_router(incidents.router)
router.include_router(search.router)
router.include_router(graph.router)
router.include_router(health.router)
