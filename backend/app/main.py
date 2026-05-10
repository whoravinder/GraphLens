from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.exceptions import HTTPException
from pydantic import ValidationError
from slowapi.errors import RateLimitExceeded

from app.core.logging import configure_logging
from app.core.errors import (
    GraphLensException,
    graphlens_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from app.middleware.security import SecurityHeadersMiddleware, RequestLoggerMiddleware, RequestSizeLimitMiddleware
from app.api.router import router
from app.db.session import create_tables, dispose_engine
from app.services.graph.neo4j_client import setup_constraints, close_driver
from app.services.rag.vector_store import ensure_collection
from app.services.ingestion.seeder import run_seed_in_background
import structlog

# Configuration from environment variables
APP_NAME = os.environ.get('APP_NAME', 'GraphLens AI')
APP_VERSION = os.environ.get('APP_VERSION', '1.0.0')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
DEBUG = os.environ.get('DEBUG', 'false').lower() == 'true'
HOST = os.environ.get('HOST', '0.0.0.0')
PORT = int(os.environ.get('PORT', '8000'))
WORKERS = int(os.environ.get('WORKERS', '1'))
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
LOG_FORMAT = os.environ.get('LOG_FORMAT', 'json')
ENABLE_DOCS = os.environ.get('ENABLE_DOCS', 'true').lower() == 'true'
ENABLE_PLAYGROUND = os.environ.get('ENABLE_PLAYGROUND', 'true').lower() == 'true'
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
CORS_ALLOW_CREDENTIALS = os.environ.get('CORS_ALLOW_CREDENTIALS', 'false').lower() == 'true'
MAX_REQUEST_SIZE_MB = int(os.environ.get('MAX_REQUEST_SIZE_MB', '10'))

configure_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("graphlens_starting", version=APP_VERSION, environment=ENVIRONMENT)

    try:
        await create_tables()
    except Exception as exc:
        logger.warning("db_init_failed", error=str(exc))

    try:
        await ensure_collection()
    except Exception as exc:
        logger.warning("qdrant_init_failed", error=str(exc))

    try:
        await setup_constraints()
    except Exception as exc:
        logger.warning("neo4j_init_failed", error=str(exc))

    await run_seed_in_background()
    logger.info("graphlens_started", seed_task="scheduled_in_background")
    yield

    await dispose_engine()
    await close_driver()
    logger.info("graphlens_shutdown")


app = FastAPI(
    title=APP_NAME,
    description="Network & Incident Intelligence API — AI-powered analysis, hybrid RAG, and graph intelligence",
    version=APP_VERSION,
    docs_url="/api/docs" if ENABLE_DOCS else None,
    redoc_url="/api/redoc" if ENABLE_DOCS else None,
    openapi_url="/api/openapi.json" if ENABLE_DOCS else None,
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_exception_handler(GraphLensException, graphlens_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size_mb=MAX_REQUEST_SIZE_MB)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

app.include_router(router)


@app.get("/", include_in_schema=False)
async def root():
    return {"name": "GraphLens AI", "version": APP_VERSION, "docs": "/api/docs"}
