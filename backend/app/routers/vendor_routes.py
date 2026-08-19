"""Endpoints for vendor accounts (doctor, dentist, lab, ambulance, nurse,
physiotherapist, pharmacy).

A vendor only ever sees the bookings that belong to their own linked entity
record (users.vendor_id). Lab and pharmacy vendors operate the whole service,
so they see all lab bookings / medicine orders.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from ..core.auth import get_current_vendor_user
from ..core.db import get_session
from ..models import (
    Ambulance,
    AmbulanceBooking,
    Appointment,
    DentistAppointment,
    Dentist,
    Doctor,
    LabBooking,
    LabTest,
    MedicineOrder,
    Nurse,
    NurseBooking,
    Physiotherapist,
    PhysiotherapistBooking,
    User,
)

router = APIRouter(prefix="/vendor", tags=["vendor"])

# Maps a vendor role to the entity table that backs its profile. Lab and
# pharmacy vendors have no dedicated entity table - they operate the whole
# service rather than a single listed profile.
ENTITY_MODEL_BY_ROLE = {
    "doctor": Doctor,
    "dentist": Dentist,
    "ambulance": Ambulance,
    "nurse": Nurse,
    "physiotherapist": Physiotherapist,
}

# Entity fields stored as JSON-encoded strings; decoded to/from lists at the API boundary.
_JSON_LIST_FIELDS = {"available_days", "available_slots", "features", "services", "available_shifts", "languages"}

# Allowed status values a vendor can set, per vendor role.
ALLOWED_STATUSES = {
    "doctor": {"pending", "confirmed", "completed", "cancelled", "rejected"},
    "dentist": {"pending", "confirmed", "completed", "cancelled", "rejected"},
    "lab": {"pending", "confirmed", "sample_collected", "completed", "cancelled"},
    "ambulance": {"pending", "confirmed", "dispatched", "completed", "cancelled"},
    "nurse": {"pending", "confirmed", "in_progress", "completed", "cancelled"},
    "physiotherapist": {"pending", "confirmed", "in_progress", "completed", "cancelled"},
    "pharmacy": {"pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"},
}

# Roles whose bookings are tied to a specific entity record via users.vendor_id.
ENTITY_LINKED_ROLES = {"doctor", "dentist", "ambulance", "nurse", "physiotherapist"}


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., min_length=1)


class VendorProfileUpdate(BaseModel):
    """Fields a vendor may edit on their own business profile. Only the
    fields that exist on the vendor's entity type are applied; the rest are
    ignored. is_active/rating stay admin-controlled and aren't editable here.
    """

    name: str | None = None
    image: str | None = None

    # Doctor / Dentist
    specialty: str | None = None
    qualification: str | None = None
    experience: int | None = None
    consultation_fee: int | None = None
    address: str | None = None
    available_days: list[str] | None = None
    available_slots: list[str] | None = None

    # Ambulance
    ambulance_type: str | None = None
    base_price: int | None = None
    estimated_time: str | None = None
    description: str | None = None
    features: list[str] | None = None

    # Nurse / Physiotherapist
    specialization: str | None = None
    hourly_rate: int | None = None
    daily_rate: int | None = None
    gender: str | None = None
    services: list[str] | None = None
    available_shifts: list[str] | None = None
    languages: list[str] | None = None


class VendorBooking(BaseModel):
    id: int
    booking_kind: str  # e.g. "doctor_appointment", "lab_booking"
    patient_name: str
    status: str
    price: int
    created_at: datetime
    details: dict


def _require_linked_entity(vendor: User) -> int:
    if vendor.vendor_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your vendor account is not linked to a profile yet. Please contact the admin.",
        )
    return vendor.vendor_id


def _doctor_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    doctor_id = _require_linked_entity(vendor)
    results = session.exec(
        select(Appointment, Doctor)
        .where(Appointment.doctor_id == doctor_id)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .order_by(Appointment.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=a.id,
            booking_kind="doctor_appointment",
            patient_name=a.patient_name,
            status=a.status,
            price=a.consultation_fee,
            created_at=a.created_at,
            details={
                "patient_age": a.patient_age,
                "symptoms": a.symptoms,
                "appointment_day": a.appointment_day,
                "appointment_slot": a.appointment_slot,
                "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
                "doctor_name": d.name,
            },
        )
        for a, d in results
    ]


def _dentist_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    dentist_id = _require_linked_entity(vendor)
    results = session.exec(
        select(DentistAppointment, Dentist)
        .where(DentistAppointment.dentist_id == dentist_id)
        .join(Dentist, DentistAppointment.dentist_id == Dentist.id)
        .order_by(DentistAppointment.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=a.id,
            booking_kind="dentist_appointment",
            patient_name=a.patient_name,
            status=a.status,
            price=a.consultation_fee,
            created_at=a.created_at,
            details={
                "patient_age": a.patient_age,
                "symptoms": a.symptoms,
                "appointment_day": a.appointment_day,
                "appointment_slot": a.appointment_slot,
                "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
                "dentist_name": d.name,
            },
        )
        for a, d in results
    ]


def _lab_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    results = session.exec(
        select(LabBooking, LabTest)
        .join(LabTest, LabBooking.lab_test_id == LabTest.id)
        .order_by(LabBooking.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=b.id,
            booking_kind="lab_booking",
            patient_name=b.patient_name,
            status=b.status,
            price=b.test_price,
            created_at=b.created_at,
            details={
                "patient_age": b.patient_age,
                "patient_phone": b.patient_phone,
                "test_name": t.name,
                "collection_date": b.collection_date,
                "collection_time": b.collection_time,
                "home_collection": b.home_collection,
                "address": b.address,
                "center_name": b.center_name,
            },
        )
        for b, t in results
    ]


def _ambulance_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    ambulance_id = _require_linked_entity(vendor)
    results = session.exec(
        select(AmbulanceBooking, Ambulance)
        .where(AmbulanceBooking.ambulance_id == ambulance_id)
        .join(Ambulance, AmbulanceBooking.ambulance_id == Ambulance.id)
        .order_by(AmbulanceBooking.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=b.id,
            booking_kind="ambulance_booking",
            patient_name=b.patient_name,
            status=b.status,
            price=b.ambulance_price,
            created_at=b.created_at,
            details={
                "contact_number": b.contact_number,
                "pickup_address": b.pickup_address,
                "dropoff_address": b.dropoff_address,
                "medical_condition": b.medical_condition,
                "booking_type": b.booking_type,
                "scheduled_date": b.scheduled_date,
                "scheduled_time": b.scheduled_time,
                "ambulance_name": a.name,
            },
        )
        for b, a in results
    ]


def _nurse_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    nurse_id = _require_linked_entity(vendor)
    results = session.exec(
        select(NurseBooking, Nurse)
        .where(NurseBooking.nurse_id == nurse_id)
        .join(Nurse, NurseBooking.nurse_id == Nurse.id)
        .order_by(NurseBooking.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=b.id,
            booking_kind="nurse_booking",
            patient_name=b.patient_name,
            status=b.status,
            price=b.total_price,
            created_at=b.created_at,
            details={
                "patient_age": b.patient_age,
                "patient_gender": b.patient_gender,
                "contact_number": b.contact_number,
                "address": b.address,
                "medical_condition": b.medical_condition,
                "required_services": json.loads(b.required_services),
                "booking_type": b.booking_type,
                "duration": b.duration,
                "shift_preference": b.shift_preference,
                "start_date": b.start_date,
                "start_time": b.start_time,
                "nurse_name": n.name,
            },
        )
        for b, n in results
    ]


def _physiotherapist_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    physio_id = _require_linked_entity(vendor)
    results = session.exec(
        select(PhysiotherapistBooking, Physiotherapist)
        .where(PhysiotherapistBooking.physiotherapist_id == physio_id)
        .join(Physiotherapist, PhysiotherapistBooking.physiotherapist_id == Physiotherapist.id)
        .order_by(PhysiotherapistBooking.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=b.id,
            booking_kind="physiotherapist_booking",
            patient_name=b.patient_name,
            status=b.status,
            price=b.total_price,
            created_at=b.created_at,
            details={
                "patient_age": b.patient_age,
                "patient_gender": b.patient_gender,
                "contact_number": b.contact_number,
                "address": b.address,
                "medical_condition": b.medical_condition,
                "required_services": json.loads(b.required_services),
                "booking_type": b.booking_type,
                "duration": b.duration,
                "shift_preference": b.shift_preference,
                "start_date": b.start_date,
                "start_time": b.start_time,
                "physiotherapist_name": p.name,
            },
        )
        for b, p in results
    ]


def _pharmacy_bookings(vendor: User, session: Session) -> list[VendorBooking]:
    orders = session.exec(
        select(MedicineOrder).order_by(MedicineOrder.created_at.desc())
    ).all()
    return [
        VendorBooking(
            id=o.id,
            booking_kind="medicine_order",
            patient_name=o.patient_name,
            status=o.status,
            price=o.total_amount,
            created_at=o.created_at,
            details={
                "patient_phone": o.patient_phone,
                "delivery_address": o.delivery_address,
                "items": json.loads(o.items),
                "notes": o.notes,
            },
        )
        for o in orders
    ]


BOOKING_LOADERS = {
    "doctor": _doctor_bookings,
    "dentist": _dentist_bookings,
    "lab": _lab_bookings,
    "ambulance": _ambulance_bookings,
    "nurse": _nurse_bookings,
    "physiotherapist": _physiotherapist_bookings,
    "pharmacy": _pharmacy_bookings,
}


def _get_owned_booking(vendor: User, booking_id: int, session: Session):
    """Fetch a booking by id, verifying it belongs to this vendor."""
    role = vendor.role
    if role == "doctor":
        booking = session.get(Appointment, booking_id)
        owned = booking and booking.doctor_id == _require_linked_entity(vendor)
    elif role == "dentist":
        booking = session.get(DentistAppointment, booking_id)
        owned = booking and booking.dentist_id == _require_linked_entity(vendor)
    elif role == "lab":
        booking = session.get(LabBooking, booking_id)
        owned = booking is not None
    elif role == "ambulance":
        booking = session.get(AmbulanceBooking, booking_id)
        owned = booking and booking.ambulance_id == _require_linked_entity(vendor)
    elif role == "nurse":
        booking = session.get(NurseBooking, booking_id)
        owned = booking and booking.nurse_id == _require_linked_entity(vendor)
    elif role == "physiotherapist":
        booking = session.get(PhysiotherapistBooking, booking_id)
        owned = booking and booking.physiotherapist_id == _require_linked_entity(vendor)
    elif role == "pharmacy":
        booking = session.get(MedicineOrder, booking_id)
        owned = booking is not None
    else:
        booking, owned = None, False

    if not booking or not owned:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    return booking


def _serialize_entity(entity) -> dict:
    data = entity.model_dump(mode="json")
    for field in _JSON_LIST_FIELDS:
        if field in data and isinstance(data[field], str):
            try:
                data[field] = json.loads(data[field])
            except (TypeError, ValueError):
                pass
    return data


@router.get("/me", response_model=dict)
def get_vendor_profile(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Current vendor account info plus the linked entity name, if any."""
    entity_name = None
    if vendor.vendor_id is not None:
        entity_model = ENTITY_MODEL_BY_ROLE.get(vendor.role)
        if entity_model:
            entity = session.get(entity_model, vendor.vendor_id)
            entity_name = entity.name if entity else None
    return {
        "id": vendor.id,
        "email": vendor.email,
        "full_name": vendor.full_name,
        "role": vendor.role,
        "vendor_id": vendor.vendor_id,
        "approval_status": vendor.approval_status,
        "entity_name": entity_name,
        "logo": vendor.logo,
    }


@router.get("/profile", response_model=dict)
def get_my_business_profile(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Full editable business-profile fields for the logged-in vendor."""
    entity_model = ENTITY_MODEL_BY_ROLE.get(vendor.role)
    if entity_model is None or vendor.vendor_id is None:
        return {"profile": None}

    entity = session.get(entity_model, vendor.vendor_id)
    if entity is None:
        return {"profile": None}

    return {"profile": _serialize_entity(entity)}


@router.patch("/profile", response_model=dict)
def update_my_business_profile(
    update: VendorProfileUpdate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Let a vendor edit their own business profile (name, rates, availability, etc)."""
    entity_model = ENTITY_MODEL_BY_ROLE.get(vendor.role)
    if entity_model is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{vendor.role} accounts don't have a separate business profile to edit",
        )
    if vendor.vendor_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your profile hasn't been set up yet. Please contact the admin.",
        )

    entity = session.get(entity_model, vendor.vendor_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    entity_fields = type(entity).model_fields.keys()
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field not in entity_fields:
            continue
        if field in _JSON_LIST_FIELDS and value is not None:
            setattr(entity, field, json.dumps(value))
        else:
            setattr(entity, field, value)

    entity.updated_at = datetime.now(tz=timezone.utc)
    session.add(entity)
    session.commit()
    session.refresh(entity)

    return {"message": "Profile updated successfully", "profile": _serialize_entity(entity)}


@router.get("/bookings", response_model=list[VendorBooking])
def get_my_vendor_bookings(
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> list[VendorBooking]:
    """All bookings belonging to the logged-in vendor."""
    loader = BOOKING_LOADERS.get(vendor.role)
    if not loader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unknown vendor role",
        )
    return loader(vendor, session)


@router.patch("/bookings/{booking_id}/status", response_model=dict)
def update_booking_status(
    booking_id: int,
    update: BookingStatusUpdate,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Update the status of one of the vendor's own bookings."""
    allowed = ALLOWED_STATUSES.get(vendor.role, set())
    if update.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(allowed))}",
        )

    booking = _get_owned_booking(vendor, booking_id, session)
    booking.status = update.status
    if hasattr(booking, "updated_at"):
        booking.updated_at = datetime.now(tz=timezone.utc)
    session.add(booking)
    session.commit()

    return {"message": "Status updated successfully", "status": update.status}
