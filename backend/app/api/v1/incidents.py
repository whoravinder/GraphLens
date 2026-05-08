from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.schemas.incident import IncidentCreate, IncidentOut
from app.services.incident_service import create_incident, get_incident, list_incidents, get_analytics
from app.core.responses import success_response, paginated_response

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.post("", response_model=None, summary="Create a new incident")
async def create(data: IncidentCreate, db: AsyncSession = Depends(get_db)):
    incident = await create_incident(db, data)
    out = IncidentOut.model_validate(incident)
    return success_response(out.model_dump())


@router.get("", summary="List incidents with pagination")
async def list_all(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    incidents, total = await list_incidents(db, page=page, per_page=per_page, severity=severity, status=status)
    data = [IncidentOut.model_validate(i).model_dump() for i in incidents]
    return paginated_response(data, total=total, page=page, per_page=per_page)


@router.get("/analytics", summary="Get incident analytics and statistics")
async def analytics(db: AsyncSession = Depends(get_db)):
    stats = await get_analytics(db)
    return success_response(stats)


@router.get("/{incident_id}", summary="Get a specific incident by ID")
async def get_one(incident_id: str, db: AsyncSession = Depends(get_db)):
    incident = await get_incident(db, incident_id)
    return success_response(IncidentOut.model_validate(incident).model_dump())
