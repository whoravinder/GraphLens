from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db.incident import Incident
from app.models.db.analysis import Analysis
from app.models.schemas.incident import IncidentCreate, IncidentUpdate
from app.services.agents.workflow import run_analysis_workflow, stream_analysis_workflow
from app.services.graph.neo4j_client import create_incident_node
from app.services.rag.vector_store import upsert_documents
from app.core.errors import NotFoundException
import structlog
import time
import uuid

logger = structlog.get_logger(__name__)


async def create_incident(db: AsyncSession, data: IncidentCreate) -> Incident:
    incident = Incident(
        id=str(uuid.uuid4()),
        title=data.title,
        description=data.description,
        raw_input=data.raw_input,
        source_type=data.source_type,
        severity=data.severity,
        tags=data.tags,
        metadata_=data.metadata_,
    )
    db.add(incident)
    await db.flush()

    try:
        node_id = await create_incident_node(incident.id, incident.title, incident.severity, incident.tags)
        incident.graph_node_id = node_id
    except Exception as exc:
        logger.warning("graph_node_creation_failed", incident_id=incident.id, error=str(exc))

    try:
        await upsert_documents([{
            "id": incident.id,
            "title": incident.title,
            "content": f"{incident.title}\n{incident.description or ''}\n{incident.raw_input or ''}",
            "source": "incidents",
            "tags": incident.tags or [],
            "metadata": {"severity": incident.severity, "status": incident.status},
        }])
    except Exception as exc:
        logger.warning("incident_vector_upsert_failed", error=str(exc))

    return incident


async def get_incident(db: AsyncSession, incident_id: str) -> Incident:
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise NotFoundException("Incident", incident_id)
    return incident


async def list_incidents(
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    severity: str | None = None,
    status: str | None = None,
) -> tuple[list[Incident], int]:
    query = select(Incident).order_by(desc(Incident.created_at))
    count_query = select(func.count(Incident.id))
    if severity:
        query = query.where(Incident.severity == severity)
        count_query = count_query.where(Incident.severity == severity)
    if status:
        query = query.where(Incident.status == status)
        count_query = count_query.where(Incident.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return result.scalars().all(), total


async def analyze_incident(
    db: AsyncSession,
    input_text: str,
    source_type: str | None = None,
    context: dict | None = None,
) -> Analysis:
    start_time = time.time()
    workflow_result = await run_analysis_workflow(input_text, source_type, context)
    latency_ms = int((time.time() - start_time) * 1000)

    final = workflow_result.get("final_analysis", {}) or {}
    citations = final.get("citations", [])
    related = final.get("related_incidents", [])

    analysis = Analysis(
        id=str(uuid.uuid4()),
        raw_input=input_text,
        classification=final.get("classification"),
        severity_score=final.get("severity_score"),
        root_cause=final.get("root_cause"),
        remediation=final.get("remediation"),
        summary=final.get("summary"),
        citations=citations,
        related_incidents=related,
        graph_context=workflow_result.get("graph_context"),
        llm_model="workflow",
        latency_ms=latency_ms,
    )
    db.add(analysis)
    await db.flush()

    logger.info("analysis_complete", analysis_id=analysis.id, latency_ms=latency_ms)
    return analysis


async def get_analytics(db: AsyncSession) -> dict:
    total_incidents = (await db.execute(select(func.count(Incident.id)))).scalar_one()
    total_analyses = (await db.execute(select(func.count(Analysis.id)))).scalar_one()

    severity_rows = await db.execute(
        select(Incident.severity, func.count(Incident.id)).group_by(Incident.severity)
    )
    severity_dist = {row[0]: row[1] for row in severity_rows}

    status_rows = await db.execute(
        select(Incident.status, func.count(Incident.id)).group_by(Incident.status)
    )
    status_dist = {row[0]: row[1] for row in status_rows}

    return {
        "total_incidents": total_incidents,
        "total_analyses": total_analyses,
        "severity_distribution": severity_dist,
        "status_distribution": status_dist,
    }
