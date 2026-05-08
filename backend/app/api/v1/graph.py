from fastapi import APIRouter
from app.models.schemas.graph import GraphQueryRequest, GraphQueryResult
from app.services.graph.graph_retriever import GraphRetriever
from app.core.responses import success_response

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.post("/query", summary="Query the knowledge graph")
async def graph_query(request: GraphQueryRequest):
    retriever = GraphRetriever()
    result = await retriever.execute_graph_query(
        query=request.query,
        depth=request.depth,
        limit=request.limit,
        node_types=request.node_types,
    )
    return success_response(result)


@router.get("/stats", summary="Get graph database statistics")
async def graph_stats():
    from app.services.graph.neo4j_client import run_query, verify_connectivity
    connected = await verify_connectivity()
    if not connected:
        return success_response({"connected": False, "nodes": 0, "relationships": 0})

    try:
        node_count = await run_query("MATCH (n) RETURN count(n) as count")
        rel_count = await run_query("MATCH ()-[r]->() RETURN count(r) as count")
        label_counts = await run_query("CALL db.labels() YIELD label RETURN label")

        return success_response({
            "connected": True,
            "total_nodes": node_count[0]["count"] if node_count else 0,
            "total_relationships": rel_count[0]["count"] if rel_count else 0,
            "labels": [r["label"] for r in label_counts],
        })
    except Exception:
        return success_response({"connected": False, "nodes": 0, "relationships": 0})
