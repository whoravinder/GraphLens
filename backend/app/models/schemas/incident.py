from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal
import uuid


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=512)
    description: str | None = Field(None, max_length=4096)
    raw_input: str | None = Field(None, max_length=50000)
    source_type: str | None = Field(None, max_length=64)
    severity: Literal["critical", "high", "medium", "low", "info"] = "medium"
    tags: list[str] | None = None
    metadata_: dict | None = Field(None, alias="metadata")

    class Config:
        populate_by_name = True


class IncidentUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=512)
    description: str | None = Field(None, max_length=4096)
    severity: Literal["critical", "high", "medium", "low", "info"] | None = None
    status: Literal["open", "investigating", "resolved", "closed"] | None = None
    tags: list[str] | None = None


class IncidentOut(BaseModel):
    id: str
    title: str
    description: str | None
    source_type: str | None
    severity: str
    status: str
    tags: list[str] | None
    graph_node_id: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
