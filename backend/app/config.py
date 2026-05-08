from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    APP_NAME: str = "GraphLens AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1

    DATABASE_URL: str
    REDIS_URL: str

    QDRANT_URL: str
    QDRANT_COLLECTION: str = "graphlens_incidents"

    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str

    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_TIMEOUT_SECONDS: int = 120
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 4096
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 100

    TOP_K_RETRIEVAL: int = 8
    TOP_K_RERANK: int = 4

    ENABLE_RERANKING: bool = True
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"

    ENABLE_STREAMING: bool = True
    ENABLE_BM25: bool = True
    ENABLE_GRAPHRAG: bool = True

    GRAPH_MAX_DEPTH: int = 3
    GRAPH_MAX_RELATIONS: int = 25

    ENABLE_CACHE: bool = True
    CACHE_TTL_SECONDS: int = 3600

    MAX_CONTEXT_DOCUMENTS: int = 20
    MAX_GRAPH_NODES: int = 50

    AUTO_CREATE_COLLECTIONS: bool = True
    AUTO_CREATE_INDEXES: bool = True
    AUTO_SEED_ON_STARTUP: bool = True

    NVD_API_KEY: str = ""
    NVD_BASE_URL: str = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    MITRE_ATTACK_URL: str = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
    CISA_KEV_URL: str = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_REQUEST_SIZE_MB: int = 10
    REQUEST_TIMEOUT_SECONDS: int = 120

    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = False

    ENABLE_DOCS: bool = True
    ENABLE_PLAYGROUND: bool = True

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
