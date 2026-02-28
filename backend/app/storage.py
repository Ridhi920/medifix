from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from .schemas import Booking, BookingCreate, BookingStatus, Service, ServiceCategory

HOME_VISIT = "Home visit"

SERVICES: List[Service] = [
    Service(
        id="svc-medicine",
        name="Medicine Delivery",
        category=ServiceCategory.medicine,
        description="Upload a prescription and get doorstep delivery.",
        delivery_mode="Delivery",
    ),
    Service(
        id="svc-clinic",
        name="Clinic Appointment",
        category=ServiceCategory.clinic,
        description="Book clinic or doctor visits by specialty.",
        delivery_mode="In-person",
    ),
    Service(
        id="svc-lab",
        name="Lab Test Booking",
        category=ServiceCategory.lab,
        description="Home sample collection and diagnostic labs.",
    delivery_mode=HOME_VISIT,
    ),
    Service(
        id="svc-dental",
        name="Dental Care",
        category=ServiceCategory.dental,
        description="Dental consultation and treatment scheduling.",
        delivery_mode="In-person",
    ),
    Service(
        id="svc-ambulance",
        name="Ambulance Booking",
        category=ServiceCategory.ambulance,
        description="On-demand and scheduled ambulance dispatch.",
        delivery_mode="Dispatch",
    ),
    Service(
        id="svc-physio",
        name="Physiotherapy",
        category=ServiceCategory.physiotherapy,
        description="In-home physiotherapy sessions.",
    delivery_mode=HOME_VISIT,
    ),
    Service(
        id="svc-nursing",
        name="Nursing & Elderly Care",
        category=ServiceCategory.nursing,
        description="Post-surgery care and skilled nursing at home.",
    delivery_mode=HOME_VISIT,
    ),
    Service(
        id="svc-equipment",
        name="Medical Equipment",
        category=ServiceCategory.equipment,
        description="Sales and rentals for home healthcare devices.",
        delivery_mode="Delivery",
    ),
]

BOOKINGS: List[Booking] = []


def list_services() -> List[Service]:
    return SERVICES


def list_bookings() -> List[Booking]:
    return BOOKINGS


def create_booking(payload: BookingCreate) -> Booking:
    booking = Booking(
        id=f"bk-{uuid4().hex[:8]}",
        status=BookingStatus.requested,
    created_at=datetime.now(tz=timezone.utc),
        **payload.model_dump(),
    )
    BOOKINGS.append(booking)
    return booking
