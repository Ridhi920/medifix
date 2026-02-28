from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from .db import get_session
from .models import BookingModel, ServiceModel
from .schemas import Booking, BookingCreate, BookingStatus, Service

router = APIRouter()


@router.get("/services", response_model=list[Service])
def get_services(session: Session = Depends(get_session)) -> list[Service]:
    services = session.exec(select(ServiceModel)).all()
    return [Service.model_validate(service, from_attributes=True) for service in services]


@router.get("/bookings", response_model=list[Booking])
def get_bookings(session: Session = Depends(get_session)) -> list[Booking]:
    bookings = session.exec(select(BookingModel)).all()
    return [Booking.model_validate(booking, from_attributes=True) for booking in bookings]


@router.post("/bookings", response_model=Booking, status_code=201)
def post_booking(
    payload: BookingCreate, session: Session = Depends(get_session)
) -> Booking:
    service = session.get(ServiceModel, payload.service_id)
    if service is None:
        raise HTTPException(status_code=400, detail="Unknown service_id")

    booking = BookingModel(
        id=f"bk-{uuid4().hex[:8]}",
        status=BookingStatus.requested,
        **payload.model_dump(),
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return Booking.model_validate(booking, from_attributes=True)
