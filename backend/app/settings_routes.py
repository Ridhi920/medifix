import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from .auth import get_current_admin_user
from .db import get_session
from .models import AppSettings, User

router = APIRouter(prefix="/settings", tags=["settings"])

_DEFAULTS = {"convenience_fee": 7.0, "delivery_fee": 20.0, "free_delivery_threshold": 400.0}

# Service keys that support an availability toggle. Keep in sync with the
# admin panel and mobile app.
KNOWN_SERVICES = [
    "doctor",
    "pharmacy",
    "ambulance",
    "lab",
    "nurse",
    "physiotherapist",
    "dentist",
]


class FeeUpdate(BaseModel):
    convenience_fee: float
    delivery_fee: float
    free_delivery_threshold: float


class AvailabilityUpdate(BaseModel):
    unavailable_services: list[str]


def _parse_unavailable(row: AppSettings | None) -> list[str]:
    if not row or not getattr(row, "unavailable_services", None):
        return []
    try:
        value = json.loads(row.unavailable_services)
        if isinstance(value, list):
            return [s for s in value if s in KNOWN_SERVICES]
    except (ValueError, TypeError):
        pass
    return []


@router.get("/fees")
def get_fees(session: Session = Depends(get_session)):
    row = session.exec(select(AppSettings)).first()
    if not row:
        return _DEFAULTS
    return {
        "convenience_fee": row.convenience_fee,
        "delivery_fee": row.delivery_fee,
        "free_delivery_threshold": row.free_delivery_threshold,
    }


@router.put("/fees")
def update_fees(
    data: FeeUpdate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = session.exec(select(AppSettings)).first()
    if not row:
        row = AppSettings(
            convenience_fee=data.convenience_fee,
            delivery_fee=data.delivery_fee,
            free_delivery_threshold=data.free_delivery_threshold,
        )
        session.add(row)
    else:
        row.convenience_fee = data.convenience_fee
        row.delivery_fee = data.delivery_fee
        row.free_delivery_threshold = data.free_delivery_threshold
    session.commit()
    session.refresh(row)
    return {
        "convenience_fee": row.convenience_fee,
        "delivery_fee": row.delivery_fee,
        "free_delivery_threshold": row.free_delivery_threshold,
    }


@router.get("/availability")
def get_availability(session: Session = Depends(get_session)):
    row = session.exec(select(AppSettings)).first()
    return {
        "known_services": KNOWN_SERVICES,
        "unavailable_services": _parse_unavailable(row),
    }


@router.put("/availability")
def update_availability(
    data: AvailabilityUpdate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    # Ignore anything that isn't a recognised service key.
    unavailable = [s for s in data.unavailable_services if s in KNOWN_SERVICES]
    row = session.exec(select(AppSettings)).first()
    if not row:
        row = AppSettings(unavailable_services=json.dumps(unavailable))
        session.add(row)
    else:
        row.unavailable_services = json.dumps(unavailable)
    session.commit()
    session.refresh(row)
    return {
        "known_services": KNOWN_SERVICES,
        "unavailable_services": _parse_unavailable(row),
    }
