import json
import time
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.schemas.analysis import AnalysisRequest
from app.services.incident_service import analyze_incident
from app.services.agents.workflow import stream_analysis_workflow
from app.core.responses import success_response
from app.config import get_settings
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/analyze", tags=["Analysis"])
settings = get_settings()


@router.post("", summary="Analyze incident, log, alert, or CVE")
async def analyze(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    wants_stream = request.stream and settings.ENABLE_STREAMING

    if wants_stream:
        async def event_generator():
            try:
                async for event in stream_analysis_workflow(
                    input_text=request.input_text,
                    source_type=request.source_type,
                    context=request.context,
                ):
                    yield f"data: {json.dumps(event)}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as exc:
                logger.error("streaming_analysis_failed", error=str(exc))
                yield f"data: {json.dumps({'event': 'error', 'message': str(exc)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
        )

    analysis = await analyze_incident(
        db=db,
        input_text=request.input_text,
        source_type=request.source_type,
        context=request.context,
    )

    return success_response({
        "id": analysis.id,
        "classification": analysis.classification,
        "severity_score": analysis.severity_score,
        "root_cause": analysis.root_cause,
        "remediation": analysis.remediation,
        "summary": analysis.summary,
        "citations": analysis.citations or [],
        "related_incidents": analysis.related_incidents or [],
        "graph_context": analysis.graph_context,
        "latency_ms": analysis.latency_ms,
        "created_at": analysis.created_at.isoformat(),
    })
