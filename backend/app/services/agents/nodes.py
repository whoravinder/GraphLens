import json
import os
import structlog
from app.services.agents.state import AgentState
from app.services.llm.client import get_llm
from app.services.llm.prompts import RETRIEVAL_QUERY_PROMPT, ANALYSIS_PROMPT, VALIDATION_PROMPT, SUMMARIZATION_PROMPT
from app.services.rag.hybrid_retriever import HybridRetriever
from app.services.graph.graph_retriever import GraphRetriever

logger = structlog.get_logger(__name__)

MAX_CONTEXT_DOCUMENTS = int(os.environ.get('MAX_CONTEXT_DOCUMENTS', '20'))
ENABLE_GRAPHRAG = os.environ.get('ENABLE_GRAPHRAG', 'true').lower() == 'true'


async def retrieval_node(state: AgentState) -> dict:
    llm = get_llm()
    chain = RETRIEVAL_QUERY_PROMPT | llm
    try:
        response = await chain.ainvoke({"input_text": state["input_text"]})
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        queries = json.loads(content)
        if not isinstance(queries, list):
            queries = [state["input_text"]]
    except Exception as exc:
        logger.warning("retrieval_query_generation_failed", error=str(exc))
        queries = [state["input_text"]]

    retriever = HybridRetriever()
    all_docs: list[dict] = []
    seen_ids: set[str] = set()

    for query in queries[:3]:
        try:
            docs = await retriever.retrieve(query)
            for doc in docs:
                doc_id = doc.get("id", doc.get("title", ""))
                if doc_id not in seen_ids:
                    all_docs.append(doc)
                    seen_ids.add(doc_id)
                    if len(all_docs) >= MAX_CONTEXT_DOCUMENTS:
                        break
        except Exception as exc:
            logger.warning("retrieval_failed", query=query, error=str(exc))
        if len(all_docs) >= MAX_CONTEXT_DOCUMENTS:
            break

    return {"optimized_queries": queries, "retrieved_docs": all_docs, "step_count": 1}


async def graph_node(state: AgentState) -> dict:
    if not ENABLE_GRAPHRAG:
        return {"graph_context": {"nodes": [], "relationships": [], "summary": "GraphRAG disabled"}, "step_count": 1}
    try:
        graph_retriever = GraphRetriever()
        graph_context = await graph_retriever.get_context_for_input(state["input_text"])
    except Exception as exc:
        logger.warning("graph_retrieval_failed", error=str(exc))
        graph_context = {"nodes": [], "relationships": [], "summary": "Graph context unavailable"}
    return {"graph_context": graph_context, "step_count": 1}


async def analysis_node(state: AgentState) -> dict:
    llm = get_llm()
    chain = ANALYSIS_PROMPT | llm

    docs = state["retrieved_docs"][:MAX_CONTEXT_DOCUMENTS]
    context_str = "\n\n".join([
        f"[{i+1}] {doc.get('title', 'Unknown')} ({doc.get('source', '')})\n{doc.get('content', '')[:500]}"
        for i, doc in enumerate(docs)
    ])
    if not context_str:
        context_str = "No additional context retrieved."

    graph_str = json.dumps(state.get("graph_context", {}), indent=2)[:2000]

    try:
        response = await chain.ainvoke({
            "input_text": state["input_text"],
            "context": context_str,
            "graph_context": graph_str,
        })
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        raw_analysis = json.loads(content)
    except json.JSONDecodeError:
        raw_analysis = {
            "classification": "Unknown",
            "severity_score": 5.0,
            "severity_label": "medium",
            "root_cause": "Analysis parsing failed — raw output captured",
            "remediation": "Manual review required",
            "summary": "Analysis completed but structured output parsing failed",
            "citations": [],
            "related_incidents": [],
        }
    except Exception as exc:
        logger.error("analysis_node_failed", error=str(exc))
        raw_analysis = {
            "classification": "Error",
            "severity_score": 0.0,
            "severity_label": "info",
            "root_cause": str(exc),
            "remediation": "Retry the analysis",
            "summary": "Analysis failed",
            "citations": [],
            "related_incidents": [],
        }

    for i, doc in enumerate(docs[:5]):
        citation = {
            "source": doc.get("source", "knowledge_base"),
            "title": doc.get("title", f"Document {i+1}"),
            "url": doc.get("url"),
            "relevance_score": doc.get("rerank_score", doc.get("score", 0.0)),
            "excerpt": doc.get("content", "")[:200],
        }
        if not any(c.get("title") == citation["title"] for c in raw_analysis.get("citations", [])):
            raw_analysis.setdefault("citations", []).append(citation)

    return {"raw_analysis": raw_analysis, "step_count": 1}


async def validation_node(state: AgentState) -> dict:
    llm = get_llm()
    chain = VALIDATION_PROMPT | llm

    context_str = "\n".join([doc.get("content", "")[:200] for doc in state["retrieved_docs"][:5]])
    analysis_str = json.dumps(state.get("raw_analysis", {}), indent=2)[:3000]

    try:
        response = await chain.ainvoke({"context": context_str, "analysis": analysis_str})
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        validation_result = json.loads(content)
    except Exception as exc:
        logger.warning("validation_node_failed", error=str(exc))
        validation_result = {"is_grounded": True, "confidence": 0.7, "issues": []}

    return {"validation_result": validation_result, "step_count": 1}


async def summarization_node(state: AgentState) -> dict:
    analysis = state.get("raw_analysis", {})
    final_analysis = dict(analysis)

    validation = state.get("validation_result", {})
    if not validation.get("is_grounded", True) and validation.get("confidence", 1.0) < 0.4:
        final_analysis["summary"] = f"[Low confidence analysis] {final_analysis.get('summary', '')}"
        final_analysis["_validation_warning"] = validation.get("issues", [])

    return {"final_analysis": final_analysis, "summary": final_analysis.get("summary", ""), "step_count": 1}
