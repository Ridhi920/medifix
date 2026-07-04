from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from .auth import get_current_admin_user
from .db import get_session
from .models import AppSettings, User

router = APIRouter(prefix="/settings", tags=["settings"])

_DEFAULTS = {"convenience_fee": 7.0, "delivery_fee": 20.0, "free_delivery_threshold": 400.0}


class FeeUpdate(BaseModel):
    convenience_fee: float
    delivery_fee: float
    free_delivery_threshold: float


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
