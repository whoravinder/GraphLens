import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, JSON, Enum as SAEnum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base
import enum


class SeverityLevel(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class IncidentStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"
    resolved = "resolved"
    closed = "closed"


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    raw_input: Mapped[str | None] = mapped_column(Text)
    source_type: Mapped[str | None] = mapped_column(String(64))
    severity: Mapped[SeverityLevel] = mapped_column(SAEnum(SeverityLevel), default=SeverityLevel.medium)
    status: Mapped[IncidentStatus] = mapped_column(SAEnum(IncidentStatus), default=IncidentStatus.open)
    tags: Mapped[list | None] = mapped_column(JSON)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON)
    graph_node_id: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
