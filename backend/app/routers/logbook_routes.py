"""Digital Logbook read API.

Exposes the platform-wide activity timeline for provider workspaces and admin.
Entries are written via `app.core.logbook.log_activity` from the various
business flows; this router only reads them back.
"""

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from ..core.auth import get_current_user
from ..core.db import get_session
from ..models import DigitalLogEntry, User

router = APIRouter(prefix="/logbook", tags=["logbook"])


@router.get("", response_model=List[DigitalLogEntry])
def list_logbook(
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
    provider_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    module: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
) -> List[DigitalLogEntry]:
    """Return timeline entries, newest first, with optional filters."""
    stmt = select(DigitalLogEntry)
    if provider_id is not None:
        stmt = stmt.where(DigitalLogEntry.provider_id == provider_id)
    if patient_id is not None:
        stmt = stmt.where(DigitalLogEntry.patient_id == patient_id)
    if module is not None:
        stmt = stmt.where(DigitalLogEntry.module == module)
    stmt = stmt.order_by(DigitalLogEntry.created_at.desc()).offset(offset).limit(limit)
    return session.exec(stmt).all()
