"""Service Request API — the unified transaction spine.

Lists/filters the ServiceRequest rows that every booking flow creates, exposes
a summary for dashboards, and drives the status lifecycle (validated, and
logged to the Digital Logbook) via PATCH.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel
from sqlmodel import Session, func, select

from ..core.auth import get_current_user
from ..core.db import get_session
from ..core.service_requests import ALL_STATUSES, InvalidTransition, advance_status
from ..models import ServiceRequest, User

router = APIRouter(prefix="/service-requests", tags=["service-requests"])


class StatusUpdate(BaseModel):
    status: str


@router.get("/summary")
def service_request_summary(
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Counts by status and by service — handy for dashboard KPI tiles."""
    by_status = dict(
        session.exec(
            select(ServiceRequest.status, func.count()).group_by(ServiceRequest.status)
        ).all()
    )
    by_service = dict(
        session.exec(
            select(ServiceRequest.service, func.count()).group_by(ServiceRequest.service)
        ).all()
    )
    total = sum(by_status.values())
    open_statuses = {"created", "confirmed", "scheduled", "in_progress"}
    return {
        "total": total,
        "open": sum(v for k, v in by_status.items() if k in open_statuses),
        "by_status": by_status,
        "by_service": by_service,
        "statuses": ALL_STATUSES,
    }


@router.get("", response_model=List[ServiceRequest])
def list_service_requests(
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
    service: str | None = Query(default=None),
    status: str | None = Query(default=None),
    provider_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
) -> List[ServiceRequest]:
    """List service requests, newest first, with optional filters."""
    stmt = select(ServiceRequest)
    if service is not None:
        stmt = stmt.where(ServiceRequest.service == service)
    if status is not None:
        stmt = stmt.where(ServiceRequest.status == status)
    if provider_id is not None:
        stmt = stmt.where(ServiceRequest.provider_id == provider_id)
    if patient_id is not None:
        stmt = stmt.where(ServiceRequest.patient_id == patient_id)
    stmt = stmt.order_by(ServiceRequest.created_at.desc()).offset(offset).limit(limit)
    return session.exec(stmt).all()


@router.get("/{request_id}", response_model=ServiceRequest)
def get_service_request(
    request_id: int,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> ServiceRequest:
    req = session.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Service request not found")
    return req


@router.patch("/{request_id}/status", response_model=ServiceRequest)
def update_service_request_status(
    request_id: int,
    body: StatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ServiceRequest:
    """Advance a service request through its lifecycle (validated + logged)."""
    req = session.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Service request not found")
    try:
        advance_status(
            session,
            req,
            body.status,
            actor=current_user.full_name,
            actor_user_id=current_user.id,
        )
    except InvalidTransition as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    return req
