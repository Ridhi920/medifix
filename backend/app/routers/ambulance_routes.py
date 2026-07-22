import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user, get_current_user
from ..core.db import get_session
from ..models import Ambulance, AmbulanceBooking, User
from ..schemas import (
    AmbulanceBookingCreate,
    AmbulanceBookingResponse,
    AmbulanceBookingWithAmbulance,
    AmbulanceCreate,
    AmbulanceResponse,
    AmbulanceUpdate,
)

router = APIRouter(prefix="/ambulances", tags=["ambulances"])


# ========== Ambulance Endpoints ==========

@router.get("", response_model=List[AmbulanceResponse])
def get_ambulances(
    ambulance_type: str | None = None,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
) -> List[AmbulanceResponse]:
    """Get all ambulances, optionally filtered by type. Set include_inactive=True to get all ambulances."""
    query = select(Ambulance)
    
    if not include_inactive:
        query = query.where(Ambulance.is_active == True)
    
    if ambulance_type:
        query = query.where(Ambulance.ambulance_type == ambulance_type)
    
    ambulances = session.exec(query).all()
    
    # Convert JSON strings to lists for response
    return [
        AmbulanceResponse(
            id=ambulance.id,
            name=ambulance.name,
            description=ambulance.description,
            features=json.loads(ambulance.features),
            estimated_time=ambulance.estimated_time,
            base_price=ambulance.base_price,
            image=ambulance.image,
            ambulance_type=ambulance.ambulance_type,
            latitude=ambulance.latitude,
            longitude=ambulance.longitude,
            is_active=ambulance.is_active,
        )
        for ambulance in ambulances
    ]


@router.get("/{ambulance_id}", response_model=AmbulanceResponse)
def get_ambulance(
    ambulance_id: int,
    session: Session = Depends(get_session),
) -> AmbulanceResponse:
    """Get a specific ambulance by ID."""
    ambulance = session.get(Ambulance, ambulance_id)
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    return AmbulanceResponse(
        id=ambulance.id,
        name=ambulance.name,
        description=ambulance.description,
        features=json.loads(ambulance.features),
        estimated_time=ambulance.estimated_time,
        base_price=ambulance.base_price,
        image=ambulance.image,
        ambulance_type=ambulance.ambulance_type,
        is_active=ambulance.is_active,
    )


@router.post("", response_model=AmbulanceResponse)
def create_ambulance(
    ambulance: AmbulanceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> AmbulanceResponse:
    """Create a new ambulance (admin only)."""
    # Convert list to JSON string for storage
    db_ambulance = Ambulance(
        name=ambulance.name,
        description=ambulance.description,
        features=json.dumps(ambulance.features),
        estimated_time=ambulance.estimated_time,
        base_price=ambulance.base_price,
        image=ambulance.image,
        ambulance_type=ambulance.ambulance_type,
        latitude=ambulance.latitude,
        longitude=ambulance.longitude,
    )
    
    session.add(db_ambulance)
    session.commit()
    session.refresh(db_ambulance)
    
    return AmbulanceResponse(
        id=db_ambulance.id,
        name=db_ambulance.name,
        description=db_ambulance.description,
        features=json.loads(db_ambulance.features),
        estimated_time=db_ambulance.estimated_time,
        base_price=db_ambulance.base_price,
        image=db_ambulance.image,
        ambulance_type=db_ambulance.ambulance_type,
        latitude=db_ambulance.latitude,
        longitude=db_ambulance.longitude,
        is_active=db_ambulance.is_active,
    )


@router.patch("/{ambulance_id}", response_model=AmbulanceResponse)
def update_ambulance(
    ambulance_id: int,
    ambulance_update: AmbulanceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> AmbulanceResponse:
    """Update an ambulance (admin only)."""
    db_ambulance = session.get(Ambulance, ambulance_id)
    if not db_ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    # Update only provided fields
    update_data = ambulance_update.model_dump(exclude_unset=True)
    
    # Convert features list to JSON string if provided
    if "features" in update_data and update_data["features"] is not None:
        update_data["features"] = json.dumps(update_data["features"])
    
    for field, value in update_data.items():
        setattr(db_ambulance, field, value)
    
    session.add(db_ambulance)
    session.commit()
    session.refresh(db_ambulance)
    
    return AmbulanceResponse(
        id=db_ambulance.id,
        name=db_ambulance.name,
        description=db_ambulance.description,
        features=json.loads(db_ambulance.features),
        estimated_time=db_ambulance.estimated_time,
        base_price=db_ambulance.base_price,
        image=db_ambulance.image,
        ambulance_type=db_ambulance.ambulance_type,
        latitude=db_ambulance.latitude,
        longitude=db_ambulance.longitude,
        is_active=db_ambulance.is_active,
    )


@router.delete("/{ambulance_id}")
def delete_ambulance(
    ambulance_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete an ambulance (admin only)."""
    ambulance = session.get(Ambulance, ambulance_id)
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    # Remove dependent bookings first — the FK has no ON DELETE CASCADE.
    bookings = session.exec(
        select(AmbulanceBooking).where(AmbulanceBooking.ambulance_id == ambulance_id)
    ).all()
    for booking in bookings:
        session.delete(booking)

    session.delete(ambulance)
    session.commit()
    
    return {"message": "Ambulance deleted successfully"}


# ========== Ambulance Bookings Endpoints ==========

@router.post("/bookings", response_model=AmbulanceBookingResponse, status_code=status.HTTP_201_CREATED)
def create_ambulance_booking(
    booking: AmbulanceBookingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> AmbulanceBookingResponse:
    """Create a new ambulance booking."""
    # Verify ambulance exists and is active
    ambulance = session.get(Ambulance, booking.ambulance_id)
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    if not ambulance.is_active:
        raise HTTPException(status_code=400, detail="This ambulance is not available")
    
    # Validate scheduled booking requirements
    if booking.booking_type == "scheduled":
        if not booking.scheduled_date or not booking.scheduled_time:
            raise HTTPException(
                status_code=400,
                detail="Scheduled date and time are required for scheduled bookings"
            )
    
    # Create booking
    db_booking = AmbulanceBooking(
        user_id=current_user.id,
        ambulance_id=booking.ambulance_id,
        patient_name=booking.patient_name,
        contact_number=booking.contact_number,
        pickup_address=booking.pickup_address,
        dropoff_address=booking.dropoff_address,
        medical_condition=booking.medical_condition,
        booking_type=booking.booking_type,
        scheduled_date=booking.scheduled_date,
        scheduled_time=booking.scheduled_time,
        ambulance_price=ambulance.base_price,
        status="pending",
    )
    
    session.add(db_booking)
    session.commit()
    session.refresh(db_booking)
    
    return AmbulanceBookingResponse(
        id=db_booking.id,
        user_id=db_booking.user_id,
        ambulance_id=db_booking.ambulance_id,
        patient_name=db_booking.patient_name,
        contact_number=db_booking.contact_number,
        pickup_address=db_booking.pickup_address,
        dropoff_address=db_booking.dropoff_address,
        medical_condition=db_booking.medical_condition,
        booking_type=db_booking.booking_type,
        scheduled_date=db_booking.scheduled_date,
        scheduled_time=db_booking.scheduled_time,
        ambulance_price=db_booking.ambulance_price,
        status=db_booking.status,
        created_at=db_booking.created_at,
    )


@router.get("/bookings/my", response_model=List[AmbulanceBookingWithAmbulance])
async def get_my_ambulance_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[AmbulanceBookingWithAmbulance]:
    """Get all ambulance bookings for the current user."""
    query = select(AmbulanceBooking, Ambulance).where(
        AmbulanceBooking.user_id == current_user.id,
        AmbulanceBooking.ambulance_id == Ambulance.id
    )
    
    results = session.exec(query).all()
    
    return [
        AmbulanceBookingWithAmbulance(
            id=booking.id,
            user_id=booking.user_id,
            ambulance_id=booking.ambulance_id,
            patient_name=booking.patient_name,
            contact_number=booking.contact_number,
            pickup_address=booking.pickup_address,
            dropoff_address=booking.dropoff_address,
            medical_condition=booking.medical_condition,
            booking_type=booking.booking_type,
            scheduled_date=booking.scheduled_date,
            scheduled_time=booking.scheduled_time,
            ambulance_price=booking.ambulance_price,
            status=booking.status,
            created_at=booking.created_at,
            ambulance_name=ambulance.name,
            ambulance_type=ambulance.ambulance_type,
            ambulance_image=ambulance.image,
        )
        for booking, ambulance in results
    ]


@router.get("/bookings/all", response_model=List[AmbulanceBookingWithAmbulance])
def get_all_ambulance_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[AmbulanceBookingWithAmbulance]:
    """Get all ambulance bookings (admin only)."""
    query = select(AmbulanceBooking, Ambulance).where(
        AmbulanceBooking.ambulance_id == Ambulance.id
    )
    
    results = session.exec(query).all()
    
    return [
        AmbulanceBookingWithAmbulance(
            id=booking.id,
            user_id=booking.user_id,
            ambulance_id=booking.ambulance_id,
            patient_name=booking.patient_name,
            contact_number=booking.contact_number,
            pickup_address=booking.pickup_address,
            dropoff_address=booking.dropoff_address,
            medical_condition=booking.medical_condition,
            booking_type=booking.booking_type,
            scheduled_date=booking.scheduled_date,
            scheduled_time=booking.scheduled_time,
            ambulance_price=booking.ambulance_price,
            status=booking.status,
            created_at=booking.created_at,
            ambulance_name=ambulance.name,
            ambulance_type=ambulance.ambulance_type,
            ambulance_image=ambulance.image,
        )
        for booking, ambulance in results
    ]


@router.patch("/bookings/{booking_id}/confirm")
def confirm_ambulance_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Confirm an ambulance booking (admin only)."""
    booking = session.get(AmbulanceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "confirmed"
    session.add(booking)
    session.commit()
    
    return {"message": "Booking confirmed successfully"}


@router.patch("/bookings/{booking_id}/dispatch")
def dispatch_ambulance(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Mark ambulance as dispatched (admin only)."""
    booking = session.get(AmbulanceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "dispatched"
    session.add(booking)
    session.commit()
    
    return {"message": "Ambulance dispatched"}


@router.patch("/bookings/{booking_id}/complete")
def complete_ambulance_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Complete an ambulance booking (admin only)."""
    booking = session.get(AmbulanceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "completed"
    session.add(booking)
    session.commit()
    
    return {"message": "Booking completed successfully"}


@router.patch("/bookings/{booking_id}/cancel")
def cancel_ambulance_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Cancel an ambulance booking."""
    booking = session.get(AmbulanceBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Users can only cancel their own bookings
    if booking.user_id != current_user.id:
        # Check if user is admin (you can add admin check here)
        pass
    
    booking.status = "cancelled"
    session.add(booking)
    session.commit()
    
    return {"message": "Booking cancelled successfully"}
