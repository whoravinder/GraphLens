import os

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    SearchRequest as QdrantSearchRequest,
)
from app.services.llm.client import embed_query, embed_texts
import structlog
import uuid

logger = structlog.get_logger(__name__)

QDRANT_COLLECTION = os.environ.get('QDRANT_COLLECTION', 'graphlens_incidents')
AUTO_CREATE_COLLECTIONS = os.environ.get('AUTO_CREATE_COLLECTIONS', 'true').lower() == 'true'
EMBEDDING_DIMENSIONS = int(os.environ.get('EMBEDDING_DIMENSIONS', '1536'))

_client: AsyncQdrantClient | None = None


def get_qdrant_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        qdrant_url = os.getenv("QDRANT_URL")
        if not qdrant_url:
            raise RuntimeError("QDRANT_URL environment variable is required")
        _client = AsyncQdrantClient(url=qdrant_url, timeout=30)
    return _client


async def ensure_collection() -> None:
    if not AUTO_CREATE_COLLECTIONS:
        return
    client = get_qdrant_client()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]
    collection_name = QDRANT_COLLECTION
    if collection_name not in names:
        await client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=EMBEDDING_DIMENSIONS, distance=Distance.COSINE),
        )
        logger.info("qdrant_collection_created", name=collection_name)


async def upsert_documents(documents: list[dict]) -> int:
    client = get_qdrant_client()
    await ensure_collection()

    texts = [doc.get("content", "") for doc in documents]
    vectors = await embed_texts(texts)

    points = [
        PointStruct(
            id=doc.get("id", str(uuid.uuid4())),
            vector=vector,
            payload={
                "title": doc.get("title", ""),
                "content": doc.get("content", "")[:2000],
                "source": doc.get("source", ""),
                "url": doc.get("url"),
                "tags": doc.get("tags", []),
                "metadata": doc.get("metadata", {}),
            },
        )
        for doc, vector in zip(documents, vectors)
    ]

    await client.upsert(collection_name=QDRANT_COLLECTION, points=points)
    logger.info("qdrant_upsert_complete", count=len(points))
    return len(points)


async def semantic_search(query: str, top_k: int = 10, filters: dict | None = None) -> list[dict]:
    client = get_qdrant_client()
    vector = await embed_query(query)

    qdrant_filter = None
    if filters:
        conditions = []
        for key, value in filters.items():
            conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
        if conditions:
            qdrant_filter = Filter(must=conditions)

    results = await client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=vector,
        limit=top_k,
        query_filter=qdrant_filter,
        with_payload=True,
    )

    return [
        {
            "id": str(r.id),
            "title": r.payload.get("title", ""),
            "content": r.payload.get("content", ""),
            "source": r.payload.get("source", ""),
            "url": r.payload.get("url"),
            "tags": r.payload.get("tags", []),
            "score": r.score,
        }
        for r in results.points
    ]


async def get_collection_stats() -> dict:
    collection_name = QDRANT_COLLECTION
    try:
        client = get_qdrant_client()
        info = await client.get_collection(collection_name)
        return {
            "name": collection_name,
            "vectors_count": getattr(info, "vectors_count", info.points_count),
            "indexed_vectors_count": info.indexed_vectors_count,
            "points_count": info.points_count,
            "status": str(info.status),
        }
    except Exception:
        return {"name": collection_name, "status": "unavailable"}
