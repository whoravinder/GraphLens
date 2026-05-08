from pydantic import BaseModel, Field
from datetime import datetime


class AnalysisRequest(BaseModel):
    input_text: str = Field(..., min_length=10, max_length=50000, description="Raw log, incident, alert, CVE, or event text")
    source_type: str | None = Field(None, description="Type: log, incident, alert, cve, event")
    context: dict | None = Field(None, description="Additional context metadata")
    stream: bool = Field(False, description="Enable streaming response")


class Citation(BaseModel):
    source: str
    title: str
    url: str | None = None
    relevance_score: float | None = None
    excerpt: str | None = None


class AnalysisResult(BaseModel):
    id: str
    classification: str
    severity_score: float
    severity_label: str
    root_cause: str
    remediation: str
    summary: str
    citations: list[Citation]
    related_incidents: list[dict]
    graph_context: dict | None
    llm_model: str
    tokens_used: int | None
    latency_ms: int
    created_at: datetime


class AnalysisOut(BaseModel):
    id: str
    raw_input: str
    classification: str | None
    severity_score: float | None
    root_cause: str | None
    remediation: str | None
    summary: str | None
    citations: list | None
    related_incidents: list | None
    created_at: datetime

    class Config:
        from_attributes = True
