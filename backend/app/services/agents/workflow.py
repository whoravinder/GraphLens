from langgraph.graph import StateGraph, END
from app.services.agents.state import AgentState
from app.services.agents.nodes import (
    retrieval_node,
    graph_node,
    analysis_node,
    validation_node,
    summarization_node,
)
import structlog
import asyncio

logger = structlog.get_logger(__name__)

_workflow_app = None


def build_workflow():
    graph = StateGraph(AgentState)

    graph.add_node("retrieval", retrieval_node)
    graph.add_node("graph", graph_node)
    graph.add_node("analysis", analysis_node)
    graph.add_node("validation", validation_node)
    graph.add_node("summarization", summarization_node)

    graph.set_entry_point("retrieval")
    graph.add_edge("retrieval", "graph")
    graph.add_edge("graph", "analysis")
    graph.add_edge("analysis", "validation")
    graph.add_edge("validation", "summarization")
    graph.add_edge("summarization", END)

    return graph.compile()


def get_workflow():
    global _workflow_app
    if _workflow_app is None:
        _workflow_app = build_workflow()
    return _workflow_app


async def run_analysis_workflow(
    input_text: str,
    source_type: str | None = None,
    context: dict | None = None,
) -> dict:
    workflow = get_workflow()
    initial_state: AgentState = {
        "input_text": input_text,
        "source_type": source_type,
        "context": context or {},
        "optimized_queries": [],
        "retrieved_docs": [],
        "graph_context": None,
        "raw_analysis": None,
        "validation_result": None,
        "final_analysis": None,
        "summary": None,
        "error": None,
        "step_count": 0,
    }

    try:
        result = await workflow.ainvoke(initial_state)
        return result
    except Exception as exc:
        logger.error("workflow_execution_failed", error=str(exc))
        raise


async def stream_analysis_workflow(
    input_text: str,
    source_type: str | None = None,
    context: dict | None = None,
):
    workflow = get_workflow()
    initial_state: AgentState = {
        "input_text": input_text,
        "source_type": source_type,
        "context": context or {},
        "optimized_queries": [],
        "retrieved_docs": [],
        "graph_context": None,
        "raw_analysis": None,
        "validation_result": None,
        "final_analysis": None,
        "summary": None,
        "error": None,
        "step_count": 0,
    }

    node_display = {
        "retrieval": "Retrieving relevant context",
        "graph": "Analyzing graph relationships",
        "analysis": "Running AI analysis",
        "validation": "Validating grounding",
        "summarization": "Generating summary",
    }

    async for event in workflow.astream(initial_state):
        for node_name, node_output in event.items():
            yield {
                "event": "node_complete",
                "node": node_name,
                "message": node_display.get(node_name, node_name),
                "data": node_output,
            }
