from sentence_transformers import CrossEncoder
from app.config import get_settings
import structlog

logger = structlog.get_logger(__name__)
settings = get_settings()

_reranker: CrossEncoder | None = None


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(settings.RERANKER_MODEL)
        logger.info("reranker_loaded", model=settings.RERANKER_MODEL)
    return _reranker


def rerank(query: str, documents: list[dict], top_k: int | None = None) -> list[dict]:
    if not documents:
        return documents
    k = top_k if top_k is not None else settings.TOP_K_RERANK
    reranker = get_reranker()
    pairs = [(query, doc.get("content", "") or doc.get("title", "")) for doc in documents]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(scores, documents), key=lambda x: x[0], reverse=True)
    result = []
    for score, doc in ranked[:k]:
        d = dict(doc)
        d["rerank_score"] = float(score)
        result.append(d)
    return result
