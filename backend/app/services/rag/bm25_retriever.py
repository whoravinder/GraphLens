from rank_bm25 import BM25Okapi
import re
import structlog
import os
from app.services.rag.vector_store import get_qdrant_client

logger = structlog.get_logger(__name__)

QDRANT_COLLECTION = os.environ.get('QDRANT_COLLECTION', 'graphlens_incidents')

_corpus: list[dict] = []
_bm25: BM25Okapi | None = None


def tokenize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return [t for t in text.split() if len(t) > 1]


async def refresh_bm25_index() -> None:
    global _corpus, _bm25
    try:
        client = get_qdrant_client()
        records, _ = await client.scroll(
            collection_name=QDRANT_COLLECTION,
            limit=10000,
            with_payload=True,
            with_vectors=False,
        )
        _corpus = [
            {
                "id": str(r.id),
                "title": r.payload.get("title", ""),
                "content": r.payload.get("content", ""),
                "source": r.payload.get("source", ""),
                "url": r.payload.get("url"),
                "tags": r.payload.get("tags", []),
            }
            for r in records
        ]
        tokenized = [tokenize(f"{doc['title']} {doc['content']}") for doc in _corpus]
        if tokenized:
            _bm25 = BM25Okapi(tokenized)
        logger.info("bm25_index_refreshed", corpus_size=len(_corpus))
    except Exception as exc:
        logger.warning("bm25_index_refresh_failed", error=str(exc))


async def bm25_search(query: str, top_k: int = 10) -> list[dict]:
    global _bm25, _corpus
    if _bm25 is None or not _corpus:
        await refresh_bm25_index()
    if not _bm25 or not _corpus:
        return []
    tokens = tokenize(query)
    scores = _bm25.get_scores(tokens)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    results = []
    for idx in top_indices:
        if scores[idx] > 0:
            doc = dict(_corpus[idx])
            doc["score"] = float(scores[idx])
            results.append(doc)
    return results
