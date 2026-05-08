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
from app.config import get_settings
from app.services.llm.client import embed_query, embed_texts
import structlog
import uuid

logger = structlog.get_logger(__name__)
settings = get_settings()

_client: AsyncQdrantClient | None = None


def get_qdrant_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(url=settings.QDRANT_URL, timeout=30)
    return _client


async def ensure_collection() -> None:
    if not settings.AUTO_CREATE_COLLECTIONS:
        return
    client = get_qdrant_client()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]
    if settings.QDRANT_COLLECTION not in names:
        await client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=settings.EMBEDDING_DIMENSIONS, distance=Distance.COSINE),
        )
        logger.info("qdrant_collection_created", name=settings.QDRANT_COLLECTION)


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

    await client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)
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
        collection_name=settings.QDRANT_COLLECTION,
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
    client = get_qdrant_client()
    try:
        info = await client.get_collection(settings.QDRANT_COLLECTION)
        return {
            "name": settings.QDRANT_COLLECTION,
            "vectors_count": getattr(info, "vectors_count", info.points_count),
            "indexed_vectors_count": info.indexed_vectors_count,
            "points_count": info.points_count,
            "status": str(info.status),
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"name": settings.QDRANT_COLLECTION, "status": "unavailable"}
