import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user
from ..core.db import get_session
from ..models import AppSettings, User

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
    # Optional map of service key -> ISO date string ("YYYY-MM-DD") for when
    # the service is expected to be back. Only kept for keys that are also
    # in unavailable_services.
    return_dates: dict[str, str | None] = {}


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


def _parse_return_dates(row: AppSettings | None, unavailable: list[str]) -> dict[str, str]:
    if not row or not getattr(row, "service_return_dates", None):
        return {}
    try:
        value = json.loads(row.service_return_dates)
        if isinstance(value, dict):
            return {k: v for k, v in value.items() if k in unavailable and v}
    except (ValueError, TypeError):
        pass
    return {}


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
    unavailable = _parse_unavailable(row)
    return {
        "known_services": KNOWN_SERVICES,
        "unavailable_services": unavailable,
        "return_dates": _parse_return_dates(row, unavailable),
    }


@router.put("/availability")
def update_availability(
    data: AvailabilityUpdate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    # Ignore anything that isn't a recognised service key.
    unavailable = [s for s in data.unavailable_services if s in KNOWN_SERVICES]
    return_dates = {
        k: v for k, v in data.return_dates.items() if k in unavailable and v
    }
    row = session.exec(select(AppSettings)).first()
    if not row:
        row = AppSettings(
            unavailable_services=json.dumps(unavailable),
            service_return_dates=json.dumps(return_dates),
        )
        session.add(row)
    else:
        row.unavailable_services = json.dumps(unavailable)
        row.service_return_dates = json.dumps(return_dates)
    session.commit()
    session.refresh(row)
    unavailable = _parse_unavailable(row)
    return {
        "known_services": KNOWN_SERVICES,
        "unavailable_services": unavailable,
        "return_dates": _parse_return_dates(row, unavailable),
    }
