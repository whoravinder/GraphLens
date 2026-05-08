from fastapi import APIRouter
from app.models.schemas.graph import SearchRequest, SearchResult
from app.services.rag.hybrid_retriever import HybridRetriever
from app.core.responses import success_response

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", summary="Hybrid search across incident knowledge base")
async def search(request: SearchRequest):
    retriever = HybridRetriever()
    results = await retriever.retrieve(
        query=request.query,
        top_k=request.top_k,
        search_type=request.search_type,
        filters=request.filters,
    )

    search_results = [
        SearchResult(
            id=r.get("id", ""),
            title=r.get("title", ""),
            excerpt=r.get("content", "")[:300],
            score=r.get("score", 0.0),
            source=r.get("source", ""),
            metadata=r.get("metadata"),
        ).model_dump()
        for r in results
    ]

    return success_response(
        search_results,
        meta={"total": len(search_results), "search_type": request.search_type},
    )
