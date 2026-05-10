from app.services.rag.vector_store import semantic_search
from app.services.rag.bm25_retriever import bm25_search
import os
import structlog

logger = structlog.get_logger(__name__)

ENABLE_RERANKING = os.environ.get('ENABLE_RERANKING', 'true').lower() == 'true'
TOP_K_RERANK = int(os.environ.get('TOP_K_RERANK', '4'))
TOP_K_RETRIEVAL = int(os.environ.get('TOP_K_RETRIEVAL', '8'))
ENABLE_BM25 = os.environ.get('ENABLE_BM25', 'true').lower() == 'true'


def rrf_score(rank: int, k: int = 60) -> float:
    return 1.0 / (k + rank)


def reciprocal_rank_fusion(results_lists: list[list[dict]], top_k: int) -> list[dict]:
    scores: dict[str, float] = {}
    doc_map: dict[str, dict] = {}

    for results in results_lists:
        for rank, doc in enumerate(results):
            doc_id = doc.get("id", doc.get("title", f"doc_{rank}"))
            scores[doc_id] = scores.get(doc_id, 0.0) + rrf_score(rank)
            if doc_id not in doc_map:
                doc_map[doc_id] = doc

    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)[:top_k]
    fused = []
    for doc_id in sorted_ids:
        doc = dict(doc_map[doc_id])
        doc["score"] = scores[doc_id]
        doc["retrieval_method"] = "hybrid_rrf"
        fused.append(doc)
    return fused


async def _apply_reranking(query: str, documents: list[dict]) -> list[dict]:
    if not ENABLE_RERANKING or not documents:
        return documents
    try:
        from app.services.rag.reranker import rerank
        return rerank(query, documents, top_k=TOP_K_RERANK)
    except Exception as exc:
        logger.warning("reranking_failed", error=str(exc))
        return documents[:TOP_K_RERANK]


class HybridRetriever:
    async def retrieve(
        self,
        query: str,
        top_k: int | None = None,
        search_type: str = "hybrid",
        filters: dict | None = None,
    ) -> list[dict]:
        k = top_k if top_k is not None else TOP_K_RETRIEVAL

        if search_type == "semantic":
            results = await semantic_search(query, top_k=k, filters=filters)
            return await _apply_reranking(query, results)

        if search_type == "keyword":
            if not ENABLE_BM25:
                return await semantic_search(query, top_k=k, filters=filters)
            results = await bm25_search(query, top_k=k)
            return await _apply_reranking(query, results)

        semantic_results: list[dict] = []
        bm25_results: list[dict] = []

        try:
            semantic_results = await semantic_search(query, top_k=k, filters=filters)
        except Exception as exc:
            logger.warning("semantic_search_failed", error=str(exc))

        if ENABLE_BM25:
            try:
                bm25_results = await bm25_search(query, top_k=k)
            except Exception as exc:
                logger.warning("bm25_search_failed", error=str(exc))

        if not semantic_results and not bm25_results:
            return []

        if not bm25_results or not ENABLE_BM25:
            fused = semantic_results[:k]
        elif not semantic_results:
            fused = bm25_results[:k]
        else:
            fused = reciprocal_rank_fusion([semantic_results, bm25_results], top_k=k)

        return await _apply_reranking(query, fused)
