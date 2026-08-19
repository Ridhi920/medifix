"""Service Request helpers.

`create_service_request` mirrors the Digital Logbook philosophy: it is
best-effort so it can never break the booking it accompanies (add it to the
caller's session; it commits atomically with the booking). `advance_status`
validates a lifecycle transition and writes a matching Digital Logbook entry.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlmodel import Session

from .logbook import log_activity
from ..models import ServiceRequest

logger = logging.getLogger("medefix.service_requests")

# Canonical lifecycle. Each status lists the states it may move to.
STATUS_FLOW: dict[str, list[str]] = {
    "created": ["confirmed", "cancelled"],
    "confirmed": ["scheduled", "in_progress", "cancelled"],
    "scheduled": ["in_progress", "cancelled"],
    "in_progress": ["completed", "cancelled"],
    "completed": ["closed"],
    "closed": [],
    "cancelled": [],
}

ALL_STATUSES = list(STATUS_FLOW.keys())


def create_service_request(
    session: Session,
    *,
    patient_name: str,
    service: str,
    request_type: str,
    patient_id: int | None = None,
    provider_id: int | None = None,
    provider_name: str | None = None,
    status: str = "created",
    scheduled_date: datetime | None = None,
    priority: str = "normal",
    amount: float | None = None,
    source_type: str | None = None,
    source_id: int | None = None,
    notes: str | None = None,
) -> ServiceRequest | None:
    """Create the unifying ServiceRequest for a booking. Best-effort."""
    try:
        req = ServiceRequest(
            patient_id=patient_id,
            patient_name=patient_name,
            provider_id=provider_id,
            provider_name=provider_name,
            service=service,
            request_type=request_type,
            status=status,
            scheduled_date=scheduled_date,
            priority=priority,
            amount=amount,
            source_type=source_type,
            source_id=source_id,
            notes=notes,
        )
        session.add(req)
        return req
    except Exception:  # never let this break the primary booking
        logger.exception("Failed to create ServiceRequest for %s/%s", service, request_type)
        return None


class InvalidTransition(ValueError):
    """Raised when a status change is not allowed by STATUS_FLOW."""


def advance_status(
    session: Session,
    request: ServiceRequest,
    new_status: str,
    *,
    actor: str = "System",
    actor_user_id: int | None = None,
    commit: bool = True,
) -> ServiceRequest:
    """Move a ServiceRequest to `new_status`, validating the transition and
    writing a Digital Logbook entry. Raises InvalidTransition if not allowed."""
    current = request.status
    if new_status == current:
        return request
    allowed = STATUS_FLOW.get(current, [])
    if new_status not in allowed:
        raise InvalidTransition(
            f"Cannot move service request from '{current}' to '{new_status}'. "
            f"Allowed: {allowed or 'none (terminal state)'}"
        )
    request.status = new_status
    request.updated_at = datetime.now(tz=timezone.utc)
    session.add(request)
    log_activity(
        session,
        action=f"Request {new_status.replace('_', ' ').title()}",
        module="ServiceRequest",
        actor=actor,
        actor_user_id=actor_user_id,
        entity_type="ServiceRequest",
        entity_id=request.id,
        provider_id=request.provider_id,
        patient_id=request.patient_id,
        meta={"service": request.service, "from": current, "to": new_status},
    )
    if commit:
        session.commit()
        session.refresh(request)
    return request
