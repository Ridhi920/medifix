"""Vendor clinical workspace: patients, clinical notes, reports and billing.

Builds on `vendor_routes` (auth, booking loaders, entity linkage). A vendor only
ever sees/creates records scoped to their own role and linked provider record.
Files (prescriptions, reports) are stored as base64 data-URLs or plain URLs,
matching the existing `prescription_image` convention — no object storage yet.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..core.auth import get_current_vendor_user
from ..core.db import get_session
from ..core.logbook import log_activity
from ..models import Admission, ClinicalNote, User, VendorBill, VendorReport
from .vendor_routes import BOOKING_LOADERS

router = APIRouter(prefix="/vendor", tags=["vendor-workspace"])


# ── Request bodies ────────────────────────────────────────────────────────

class ClinicalNoteCreate(BaseModel):
    patient_name: str
    patient_user_id: int | None = None
    source_type: str | None = None
    source_id: int | None = None
    diagnosis: str | None = None
    remark: str | None = None
    prescription_file: str | None = None  # base64 data-URL or URL
    prescription_filename: str | None = None


class ReportCreate(BaseModel):
    patient_name: str
    patient_user_id: int | None = None
    source_type: str | None = None
    source_id: int | None = None
    title: str
    report_type: str = "General"
    file: str | None = None
    filename: str | None = None
    status: str = "final"


class BillItem(BaseModel):
    description: str
    quantity: float = 1
    price: float = 0.0


class BillCreate(BaseModel):
    patient_name: str
    patient_user_id: int | None = None
    source_type: str | None = None
    source_id: int | None = None
    items: list[BillItem] = []
    tax: float = 0.0
    discount: float = 0.0
    notes: str | None = None
    status: str = "unpaid"


class BillStatusUpdate(BaseModel):
    status: str


class LogoUpdate(BaseModel):
    logo: str | None = None  # base64 data-URL or URL; null clears it


class TestEntry(BaseModel):
    name: str
    result: str | None = None
    date: str | None = None
    notes: str | None = None


class AdmissionCreate(BaseModel):
    patient_name: str
    patient_user_id: int | None = None
    source_type: str | None = None
    source_id: int | None = None
    age: int | None = None
    gender: str | None = None
    contact: str | None = None
    ward: str | None = None
    bed_number: str | None = None
    diagnosis: str | None = None
    attending_doctor: str | None = None
    notes: str | None = None
    tests: list[TestEntry] = []


class AdmissionUpdate(BaseModel):
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


# ── Scoping helpers ───────────────────────────────────────────────────────

def _scope_provider_id(vendor: User) -> int | None:
    """The provider record id this vendor owns (None for lab/pharmacy)."""
    return vendor.vendor_id


def _scope(stmt, model, vendor: User):
    """Restrict a query to the vendor's own role + provider record."""
    stmt = stmt.where(model.vendor_role == vendor.role)
    if vendor.vendor_id is not None:
        stmt = stmt.where(model.provider_id == vendor.vendor_id)
    return stmt


# ── Vendor logo ───────────────────────────────────────────────────────────

@router.put("/logo")
def update_vendor_logo(
    body: LogoUpdate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Set (or clear) the vendor's brand logo shown in the dashboard header."""
    vendor.logo = body.logo
    vendor.updated_at = datetime.now(tz=timezone.utc)
    session.add(vendor)
    session.commit()
    return {"logo": body.logo}


# ── Patients ──────────────────────────────────────────────────────────────

@router.get("/patients")
def list_patients(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    """Aggregate the vendor's patients from their bookings, enriched with each
    patient's booking history and clinical notes. Grouped by patient name."""
    loader = BOOKING_LOADERS.get(vendor.role)
    if not loader:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unknown vendor role")
    bookings = loader(vendor, session)

    # Preload this vendor's clinical notes, grouped by patient name.
    notes = session.exec(_scope(select(ClinicalNote), ClinicalNote, vendor)).all()
    notes_by_patient: dict[str, list[ClinicalNote]] = {}
    for n in notes:
        notes_by_patient.setdefault(n.patient_name, []).append(n)

    groups: dict[str, dict] = {}
    for b in bookings:
        g = groups.setdefault(
            b.patient_name,
            {
                "patient_name": b.patient_name,
                "total_bookings": 0,
                "last_visit": None,
                "condition": None,
                "contact": None,
                "bookings": [],
            },
        )
        g["total_bookings"] += 1
        created = b.created_at.isoformat() if hasattr(b.created_at, "isoformat") else b.created_at
        if g["last_visit"] is None or str(created) > str(g["last_visit"]):
            g["last_visit"] = created
        # Disease / condition + contact pulled from booking details when present.
        details = b.details or {}
        g["condition"] = g["condition"] or details.get("symptoms") or details.get("medical_condition")
        g["contact"] = g["contact"] or details.get("contact_number") or details.get("patient_phone")
        g["bookings"].append(
            {
                "id": b.id,
                "booking_kind": b.booking_kind,
                "status": b.status,
                "price": b.price,
                "created_at": created,
                "details": details,
            }
        )

    result = []
    for name, g in groups.items():
        patient_notes = notes_by_patient.get(name, [])
        g["notes_count"] = len(patient_notes)
        g["clinical_notes"] = [
            {
                "id": n.id,
                "diagnosis": n.diagnosis,
                "remark": n.remark,
                "prescription_file": n.prescription_file,
                "prescription_filename": n.prescription_filename,
                "source_type": n.source_type,
                "source_id": n.source_id,
                "created_at": n.created_at.isoformat(),
            }
            for n in sorted(patient_notes, key=lambda x: x.created_at, reverse=True)
        ]
        result.append(g)

    result.sort(key=lambda x: str(x["last_visit"]), reverse=True)
    return result


# ── Clinical notes ────────────────────────────────────────────────────────

@router.get("/clinical-notes", response_model=list[ClinicalNote])
def list_clinical_notes(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
    patient_name: str | None = Query(default=None),
    source_id: int | None = Query(default=None),
) -> list[ClinicalNote]:
    stmt = _scope(select(ClinicalNote), ClinicalNote, vendor)
    if patient_name is not None:
        stmt = stmt.where(ClinicalNote.patient_name == patient_name)
    if source_id is not None:
        stmt = stmt.where(ClinicalNote.source_id == source_id)
    stmt = stmt.order_by(ClinicalNote.created_at.desc())
    return session.exec(stmt).all()


@router.post("/clinical-notes", response_model=ClinicalNote, status_code=status.HTTP_201_CREATED)
def create_clinical_note(
    body: ClinicalNoteCreate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> ClinicalNote:
    note = ClinicalNote(
        vendor_role=vendor.role,
        provider_id=vendor.vendor_id,
        patient_user_id=body.patient_user_id,
        patient_name=body.patient_name,
        source_type=body.source_type,
        source_id=body.source_id,
        diagnosis=body.diagnosis,
        remark=body.remark,
        prescription_file=body.prescription_file,
        prescription_filename=body.prescription_filename,
    )
    session.add(note)
    session.flush()
    log_activity(
        session,
        action="Clinical Note Added",
        module="Clinical",
        actor=vendor.full_name,
        actor_user_id=vendor.id,
        entity_type="ClinicalNote",
        entity_id=note.id,
        provider_id=vendor.vendor_id,
        patient_id=body.patient_user_id,
        meta={"patient": body.patient_name, "has_prescription": bool(body.prescription_file)},
    )
    session.commit()
    session.refresh(note)
    return note


@router.delete("/clinical-notes/{note_id}", response_model=dict)
def delete_clinical_note(
    note_id: int,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    note = session.get(ClinicalNote, note_id)
    if not note or note.vendor_role != vendor.role or (
        vendor.vendor_id is not None and note.provider_id != vendor.vendor_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    session.delete(note)
    session.commit()
    return {"message": "Clinical note deleted"}


# ── Reports ───────────────────────────────────────────────────────────────

@router.get("/reports", response_model=list[VendorReport])
def list_reports(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
    patient_name: str | None = Query(default=None),
) -> list[VendorReport]:
    stmt = _scope(select(VendorReport), VendorReport, vendor)
    if patient_name is not None:
        stmt = stmt.where(VendorReport.patient_name == patient_name)
    stmt = stmt.order_by(VendorReport.created_at.desc())
    return session.exec(stmt).all()


@router.post("/reports", response_model=VendorReport, status_code=status.HTTP_201_CREATED)
def create_report(
    body: ReportCreate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> VendorReport:
    report = VendorReport(
        vendor_role=vendor.role,
        provider_id=vendor.vendor_id,
        patient_user_id=body.patient_user_id,
        patient_name=body.patient_name,
        source_type=body.source_type,
        source_id=body.source_id,
        title=body.title,
        report_type=body.report_type,
        file=body.file,
        filename=body.filename,
        status=body.status,
    )
    session.add(report)
    session.flush()
    log_activity(
        session,
        action="Report Uploaded",
        module="Reports",
        actor=vendor.full_name,
        actor_user_id=vendor.id,
        entity_type="VendorReport",
        entity_id=report.id,
        provider_id=vendor.vendor_id,
        patient_id=body.patient_user_id,
        meta={"patient": body.patient_name, "title": body.title, "type": body.report_type},
    )
    session.commit()
    session.refresh(report)
    return report


@router.delete("/reports/{report_id}", response_model=dict)
def delete_report(
    report_id: int,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    report = session.get(VendorReport, report_id)
    if not report or report.vendor_role != vendor.role or (
        vendor.vendor_id is not None and report.provider_id != vendor.vendor_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    session.delete(report)
    session.commit()
    return {"message": "Report deleted"}


# ── Billing ───────────────────────────────────────────────────────────────

def _serialize_bill(bill: VendorBill) -> dict:
    data = bill.model_dump(mode="json")
    try:
        data["items"] = json.loads(bill.items)
    except (TypeError, ValueError):
        data["items"] = []
    return data


@router.get("/bills")
def list_bills(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
    patient_name: str | None = Query(default=None),
) -> list[dict]:
    stmt = _scope(select(VendorBill), VendorBill, vendor)
    if patient_name is not None:
        stmt = stmt.where(VendorBill.patient_name == patient_name)
    stmt = stmt.order_by(VendorBill.created_at.desc())
    return [_serialize_bill(b) for b in session.exec(stmt).all()]


@router.post("/bills", status_code=status.HTTP_201_CREATED)
def create_bill(
    body: BillCreate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    subtotal = sum(i.quantity * i.price for i in body.items)
    total = subtotal + body.tax - body.discount
    bill = VendorBill(
        vendor_role=vendor.role,
        provider_id=vendor.vendor_id,
        patient_user_id=body.patient_user_id,
        patient_name=body.patient_name,
        source_type=body.source_type,
        source_id=body.source_id,
        items=json.dumps([i.model_dump() for i in body.items]),
        subtotal=subtotal,
        tax=body.tax,
        discount=body.discount,
        total=total,
        status=body.status,
        notes=body.notes,
    )
    session.add(bill)
    session.flush()
    log_activity(
        session,
        action="Bill Created",
        module="Billing",
        actor=vendor.full_name,
        actor_user_id=vendor.id,
        entity_type="VendorBill",
        entity_id=bill.id,
        provider_id=vendor.vendor_id,
        patient_id=body.patient_user_id,
        meta={"patient": body.patient_name, "total": total, "status": body.status},
    )
    session.commit()
    session.refresh(bill)
    return _serialize_bill(bill)


@router.patch("/bills/{bill_id}/status")
def update_bill_status(
    bill_id: int,
    body: BillStatusUpdate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    bill = session.get(VendorBill, bill_id)
    if not bill or bill.vendor_role != vendor.role or (
        vendor.vendor_id is not None and bill.provider_id != vendor.vendor_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    if body.status not in {"unpaid", "paid", "cancelled"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bill status")
    bill.status = body.status
    bill.updated_at = datetime.now(tz=timezone.utc)
    session.add(bill)
    session.commit()
    session.refresh(bill)  # repopulate attributes expired by commit before serializing
    return _serialize_bill(bill)


@router.delete("/bills/{bill_id}", response_model=dict)
def delete_bill(
    bill_id: int,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    bill = session.get(VendorBill, bill_id)
    if not bill or bill.vendor_role != vendor.role or (
        vendor.vendor_id is not None and bill.provider_id != vendor.vendor_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    session.delete(bill)
    session.commit()
    return {"message": "Bill deleted"}


# ── Inpatient admissions ──────────────────────────────────────────────────

def _serialize_admission(a: Admission) -> dict:
    data = a.model_dump(mode="json")
    try:
        data["tests"] = json.loads(a.tests)
    except (TypeError, ValueError):
        data["tests"] = []
    return data


def _owned_admission(vendor: User, admission_id: int, session: Session) -> Admission:
    a = session.get(Admission, admission_id)
    if not a or a.vendor_role != vendor.role or (
        vendor.vendor_id is not None and a.provider_id != vendor.vendor_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    return a


@router.get("/admissions")
def list_admissions(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[dict]:
    """Inpatient admissions for this vendor, newest first."""
    stmt = _scope(select(Admission), Admission, vendor)
    if status_filter is not None:
        stmt = stmt.where(Admission.status == status_filter)
    stmt = stmt.order_by(Admission.admission_date.desc())
    return [_serialize_admission(a) for a in session.exec(stmt).all()]


@router.post("/admissions", status_code=status.HTTP_201_CREATED)
def create_admission(
    body: AdmissionCreate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Admit a patient (create an inpatient record)."""
    admission = Admission(
        vendor_role=vendor.role,
        provider_id=vendor.vendor_id,
        patient_user_id=body.patient_user_id,
        patient_name=body.patient_name,
        source_type=body.source_type,
        source_id=body.source_id,
        age=body.age,
        gender=body.gender,
        contact=body.contact,
        ward=body.ward,
        bed_number=body.bed_number,
        diagnosis=body.diagnosis,
        attending_doctor=body.attending_doctor,
        notes=body.notes,
        tests=json.dumps([t.model_dump() for t in body.tests]),
    )
    session.add(admission)
    session.flush()
    log_activity(
        session,
        action="Patient Admitted",
        module="Inpatient",
        actor=vendor.full_name,
        actor_user_id=vendor.id,
        entity_type="Admission",
        entity_id=admission.id,
        provider_id=vendor.vendor_id,
        patient_id=body.patient_user_id,
        meta={"patient": body.patient_name, "ward": body.ward, "bed": body.bed_number},
    )
    session.commit()
    session.refresh(admission)
    return _serialize_admission(admission)


@router.patch("/admissions/{admission_id}")
def update_admission(
    admission_id: int,
    body: AdmissionUpdate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Update an admission (edit fields, replace the tests list, or discharge)."""
    admission = _owned_admission(vendor, admission_id, session)
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
            action="Patient Discharged",
            module="Inpatient",
            actor=vendor.full_name,
            actor_user_id=vendor.id,
            entity_type="Admission",
            entity_id=admission.id,
            provider_id=vendor.vendor_id,
            patient_id=admission.patient_user_id,
            meta={"patient": admission.patient_name},
        )
    session.commit()
    session.refresh(admission)
    return _serialize_admission(admission)


@router.post("/admissions/{admission_id}/tests")
def add_admission_test(
    admission_id: int,
    body: TestEntry,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Append a single test entry to an admission."""
    admission = _owned_admission(vendor, admission_id, session)
    try:
        tests = json.loads(admission.tests)
    except (TypeError, ValueError):
        tests = []
    tests.append(body.model_dump())
    admission.tests = json.dumps(tests)
    admission.updated_at = datetime.now(tz=timezone.utc)
    session.add(admission)
    session.commit()
    session.refresh(admission)
    return _serialize_admission(admission)


@router.delete("/admissions/{admission_id}", response_model=dict)
def delete_admission(
    admission_id: int,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    admission = _owned_admission(vendor, admission_id, session)
    session.delete(admission)
    session.commit()
    return {"message": "Admission deleted"}
