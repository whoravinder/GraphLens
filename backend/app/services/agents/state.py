from typing import TypedDict, Annotated
import operator


class AgentState(TypedDict):
    input_text: str
    source_type: str | None
    context: dict | None
    optimized_queries: list[str]
    retrieved_docs: list[dict]
    graph_context: dict | None
    raw_analysis: dict | None
    validation_result: dict | None
    final_analysis: dict | None
    summary: str | None
    error: str | None
    step_count: Annotated[int, operator.add]
