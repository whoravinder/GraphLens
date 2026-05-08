import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, JSON, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    raw_input: Mapped[str] = mapped_column(Text, nullable=False)
    classification: Mapped[str | None] = mapped_column(String(128))
    severity_score: Mapped[float | None] = mapped_column(Float)
    root_cause: Mapped[str | None] = mapped_column(Text)
    remediation: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    citations: Mapped[list | None] = mapped_column(JSON)
    related_incidents: Mapped[list | None] = mapped_column(JSON)
    graph_context: Mapped[dict | None] = mapped_column(JSON)
    llm_model: Mapped[str | None] = mapped_column(String(128))
    tokens_used: Mapped[int | None] = mapped_column()
    latency_ms: Mapped[int | None] = mapped_column()
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
