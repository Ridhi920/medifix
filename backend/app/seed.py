from sqlmodel import Session

from .models import User

HOME_VISIT = "Home visit"

SEED_SERVICES = [
    User(
        id="svc-medicine",
        name="Medicine Delivery",
        category="medicine",
        description="Upload a prescription and get doorstep delivery.",
        delivery_mode="Delivery",
    ),
    User(
        id="svc-clinic",
        name="Clinic Appointment",
        category="clinic",
        description="Book clinic or doctor visits by specialty.",
        delivery_mode="In-person",
    ),
    User(
        id="svc-lab",
        name="Lab Test Booking",
        category="lab",
        description="Home sample collection and diagnostic labs.",
        delivery_mode=HOME_VISIT,
    ),
    User(
        id="svc-dental",
        name="Dental Care",
        category="dental",
        description="Dental consultation and treatment scheduling.",
        delivery_mode="In-person",
    ),
    User(
        id="svc-ambulance",
        name="Ambulance Booking",
        category="ambulance",
        description="On-demand and scheduled ambulance dispatch.",
        delivery_mode="Dispatch",
    ),
    User(
        id="svc-physio",
        name="Physiotherapy",
        category="physiotherapy",
        description="In-home physiotherapy sessions.",
        delivery_mode=HOME_VISIT,
    ),
    User(
        id="svc-nursing",
        name="Nursing & Elderly Care",
        category="nursing",
        description="Post-surgery care and skilled nursing at home.",
        delivery_mode=HOME_VISIT,
    ),
    User(
        id="svc-equipment",
        name="Medical Equipment",
        category="equipment",
        description="Sales and rentals for home healthcare devices.",
        delivery_mode="Delivery",
    ),
]


def seed_services(session: Session) -> None:
    for service in SEED_SERVICES:
        session.merge(service)
    session.commit()
