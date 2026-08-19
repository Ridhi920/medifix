"""Admin-side inpatient management.

Lets an admin view, admit, discharge and delete inpatient admissions across
ALL providers (the vendor endpoints are scoped to a single provider). Admin
admissions may be attached to a specific provider (so they also show in that
provider's Inpatient tab) or left unattached.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user
from ..core.db import get_session
from ..core.logbook import log_activity
from ..models import Admission, User
from .vendor_workspace_routes import TestEntry, _serialize_admission

router = APIRouter(prefix="/admin/inpatient", tags=["admin-inpatient"])


class AdminAdmissionCreate(BaseModel):
    patient_name: str
    vendor_role: str = "doctor"
    provider_id: int | None = None
    provider_name: str | None = None  # informational, stored in attending_doctor if given
    age: int | None = None
    gender: str | None = None
    contact: str | None = None
    ward: str | None = None
    bed_number: str | None = None
    diagnosis: str | None = None
    attending_doctor: str | None = None
    notes: str | None = None
    tests: list[TestEntry] = []


class AdminAdmissionUpdate(BaseModel):
    age: int | None = None
    gender: str | None = None
    contact: str | None = None
    ward: str | None = None
    bed_number: str | None = None
    diagnosis: str | None = None
    attending_doctor: str | None = None
    notes: str | None = None
    tests: list[TestEntry] | None = None
    status: str | None = None


@router.get("")
def list_all_admissions(
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
    status_filter: str | None = Query(default=None, alias="status"),
    provider_id: int | None = Query(default=None),
) -> list[dict]:
    stmt = select(Admission)
    if status_filter is not None:
        stmt = stmt.where(Admission.status == status_filter)
    if provider_id is not None:
        stmt = stmt.where(Admission.provider_id == provider_id)
    stmt = stmt.order_by(Admission.admission_date.desc())
    return [_serialize_admission(a) for a in session.exec(stmt).all()]


@router.get("/summary")
def admissions_summary(
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
) -> dict:
    rows = session.exec(select(Admission)).all()
    admitted = sum(1 for a in rows if a.status == "admitted")
    return {"total": len(rows), "admitted": admitted, "discharged": len(rows) - admitted}


@router.post("", status_code=status.HTTP_201_CREATED)
def admin_admit(
    body: AdminAdmissionCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin_user),
) -> dict:
    admission = Admission(
        vendor_role=body.vendor_role,
        provider_id=body.provider_id,
        patient_name=body.patient_name,
        age=body.age,
        gender=body.gender,
        contact=body.contact,
        ward=body.ward,
        bed_number=body.bed_number,
        diagnosis=body.diagnosis,
        attending_doctor=body.attending_doctor or body.provider_name,
        notes=body.notes,
        tests=json.dumps([t.model_dump() for t in body.tests]),
    )
    session.add(admission)
    session.flush()
    log_activity(
        session,
        action="Patient Admitted (Admin)",
        module="Inpatient",
        actor=admin.full_name,
        actor_user_id=admin.id,
        entity_type="Admission",
        entity_id=admission.id,
        provider_id=body.provider_id,
        meta={"patient": body.patient_name, "ward": body.ward, "bed": body.bed_number},
    )
    session.commit()
    session.refresh(admission)
    return _serialize_admission(admission)


@router.patch("/{admission_id}")
def admin_update_admission(
    admission_id: int,
    body: AdminAdmissionUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin_user),
) -> dict:
    admission = session.get(Admission, admission_id)
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    data = body.model_dump(exclude_unset=True)
    discharging = data.get("status") == "discharged" and admission.status != "discharged"
    for field, value in data.items():
        if field == "tests" and value is not None:
            admission.tests = json.dumps([t if isinstance(t, dict) else t.model_dump() for t in value])
        elif field == "status" and value not in {"admitted", "discharged"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid admission status")
        elif field != "tests":
            setattr(admission, field, value)
    if discharging and admission.discharge_date is None:
        admission.discharge_date = datetime.now(tz=timezone.utc)
    admission.updated_at = datetime.now(tz=timezone.utc)
    session.add(admission)
    if discharging:
        log_activity(
            session,
            action="Patient Discharged (Admin)",
            module="Inpatient",
            actor=admin.full_name,
            actor_user_id=admin.id,
            entity_type="Admission",
            entity_id=admission.id,
            provider_id=admission.provider_id,
            meta={"patient": admission.patient_name},
        )
    session.commit()
    session.refresh(admission)
    return _serialize_admission(admission)


@router.delete("/{admission_id}", response_model=dict)
def admin_delete_admission(
    admission_id: int,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
) -> dict:
    admission = session.get(Admission, admission_id)
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    session.delete(admission)
    session.commit()
    return {"message": "Admission deleted"}
