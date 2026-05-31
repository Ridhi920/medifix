import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from .auth import get_current_admin_user, get_current_user
from .db import get_session
from .models import Physiotherapist, PhysiotherapistBooking, User
from .schemas import (
    PhysiotherapistBookingCreate,
    PhysiotherapistBookingResponse,
    PhysiotherapistBookingStatusUpdate,
    PhysiotherapistBookingWithPhysiotherapist,
    PhysiotherapistCreate,
    PhysiotherapistResponse,
    PhysiotherapistUpdate,
)

router = APIRouter(prefix="/physiotherapists", tags=["physiotherapists"])


# ========== Physiotherapist Booking Endpoints ==========
# NOTE: Booking routes must come BEFORE /{physiotherapist_id} to avoid path conflicts

@router.post("/bookings", response_model=PhysiotherapistBookingResponse, status_code=status.HTTP_201_CREATED)
def create_physiotherapist_booking(
    booking_data: PhysiotherapistBookingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PhysiotherapistBookingResponse:
    """Create a new physiotherapist booking for the authenticated user."""
    # Verify physiotherapist exists
    physiotherapist = session.get(Physiotherapist, booking_data.physiotherapist_id)
    if not physiotherapist:
        raise HTTPException(status_code=404, detail="Physiotherapist not found")
    
    if not physiotherapist.is_active:
        raise HTTPException(status_code=400, detail="This physiotherapist is not available")
    
    # Calculate total price based on booking type
    if booking_data.booking_type == "session":
        total_price = physiotherapist.hourly_rate * booking_data.duration
    elif booking_data.booking_type == "daily":
        total_price = physiotherapist.daily_rate * booking_data.duration
    elif booking_data.booking_type == "weekly":
        total_price = (physiotherapist.daily_rate * 7) * booking_data.duration
    else:
        raise HTTPException(status_code=400, detail="Invalid booking type")
    
    # Create booking
    booking = PhysiotherapistBooking(
        user_id=current_user.id,
        physiotherapist_id=booking_data.physiotherapist_id,
        patient_name=booking_data.patient_name,
        patient_age=booking_data.patient_age,
        patient_gender=booking_data.patient_gender,
        contact_number=booking_data.contact_number,
        address=booking_data.address,
        medical_condition=booking_data.medical_condition,
        required_services=json.dumps(booking_data.required_services),
        booking_type=booking_data.booking_type,
        duration=booking_data.duration,
        shift_preference=booking_data.shift_preference,
        start_date=booking_data.start_date,
        start_time=booking_data.start_time,
        total_price=total_price,
        special_instructions=booking_data.special_instructions,
    )
    
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return PhysiotherapistBookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        physiotherapist_id=booking.physiotherapist_id,
        patient_name=booking.patient_name,
        patient_age=booking.patient_age,
        patient_gender=booking.patient_gender,
        contact_number=booking.contact_number,
        address=booking.address,
        medical_condition=booking.medical_condition,
        required_services=json.loads(booking.required_services),
        booking_type=booking.booking_type,
        duration=booking.duration,
        shift_preference=booking.shift_preference,
        start_date=booking.start_date,
        start_time=booking.start_time,
        total_price=booking.total_price,
        special_instructions=booking.special_instructions,
        status=booking.status,
        created_at=booking.created_at,
    )


@router.get("/bookings/my", response_model=List[PhysiotherapistBookingWithPhysiotherapist])
def get_my_physiotherapist_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[PhysiotherapistBookingWithPhysiotherapist]:
    """Get all bookings for the authenticated user."""
    statement = select(PhysiotherapistBooking).where(PhysiotherapistBooking.user_id == current_user.id)
    bookings = session.exec(statement).all()
    
    result = []
    for booking in bookings:
        physiotherapist = session.get(Physiotherapist, booking.physiotherapist_id)
        result.append(
            PhysiotherapistBookingWithPhysiotherapist(
                id=booking.id,
                user_id=booking.user_id,
                physiotherapist_id=booking.physiotherapist_id,
                patient_name=booking.patient_name,
                patient_age=booking.patient_age,
                patient_gender=booking.patient_gender,
                contact_number=booking.contact_number,
                address=booking.address,
                medical_condition=booking.medical_condition,
                required_services=json.loads(booking.required_services),
                booking_type=booking.booking_type,
                duration=booking.duration,
                shift_preference=booking.shift_preference,
                start_date=booking.start_date,
                start_time=booking.start_time,
                total_price=booking.total_price,
                special_instructions=booking.special_instructions,
                status=booking.status,
                created_at=booking.created_at,
                physiotherapist_name=physiotherapist.name if physiotherapist else "",
                physiotherapist_qualification=physiotherapist.qualification if physiotherapist else "",
                physiotherapist_specialization=physiotherapist.specialization if physiotherapist else "",
                physiotherapist_image=physiotherapist.image if physiotherapist else "",
            )
        )
    
    return result


@router.get("/bookings", response_model=List[PhysiotherapistBookingWithPhysiotherapist])
def get_all_physiotherapist_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[PhysiotherapistBookingWithPhysiotherapist]:
    """Get all physiotherapist bookings (admin only)."""
    statement = select(PhysiotherapistBooking)
    bookings = session.exec(statement).all()
    
    result = []
    for booking in bookings:
        physiotherapist = session.get(Physiotherapist, booking.physiotherapist_id)
        result.append(
            PhysiotherapistBookingWithPhysiotherapist(
                id=booking.id,
                user_id=booking.user_id,
                physiotherapist_id=booking.physiotherapist_id,
                patient_name=booking.patient_name,
                patient_age=booking.patient_age,
                patient_gender=booking.patient_gender,
                contact_number=booking.contact_number,
                address=booking.address,
                medical_condition=booking.medical_condition,
                required_services=json.loads(booking.required_services),
                booking_type=booking.booking_type,
                duration=booking.duration,
                shift_preference=booking.shift_preference,
                start_date=booking.start_date,
                start_time=booking.start_time,
                total_price=booking.total_price,
                special_instructions=booking.special_instructions,
                status=booking.status,
                created_at=booking.created_at,
                physiotherapist_name=physiotherapist.name if physiotherapist else "",
                physiotherapist_qualification=physiotherapist.qualification if physiotherapist else "",
                physiotherapist_specialization=physiotherapist.specialization if physiotherapist else "",
                physiotherapist_image=physiotherapist.image if physiotherapist else "",
            )
        )
    
    return result


@router.get("/bookings/{booking_id}", response_model=PhysiotherapistBookingWithPhysiotherapist)
def get_booking_by_id(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PhysiotherapistBookingWithPhysiotherapist:
    """Get a specific booking by ID."""
    booking = session.get(PhysiotherapistBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Non-admin users can only see their own bookings
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    physiotherapist = session.get(Physiotherapist, booking.physiotherapist_id)
    
    return PhysiotherapistBookingWithPhysiotherapist(
        id=booking.id,
        user_id=booking.user_id,
        physiotherapist_id=booking.physiotherapist_id,
        patient_name=booking.patient_name,
        patient_age=booking.patient_age,
        patient_gender=booking.patient_gender,
        contact_number=booking.contact_number,
        address=booking.address,
        medical_condition=booking.medical_condition,
        required_services=json.loads(booking.required_services),
        booking_type=booking.booking_type,
        duration=booking.duration,
        shift_preference=booking.shift_preference,
        start_date=booking.start_date,
        start_time=booking.start_time,
        total_price=booking.total_price,
        special_instructions=booking.special_instructions,
        status=booking.status,
        created_at=booking.created_at,
        physiotherapist_name=physiotherapist.name if physiotherapist else "",
        physiotherapist_qualification=physiotherapist.qualification if physiotherapist else "",
        physiotherapist_specialization=physiotherapist.specialization if physiotherapist else "",
        physiotherapist_image=physiotherapist.image if physiotherapist else "",
    )


@router.patch("/bookings/{booking_id}/cancel", response_model=PhysiotherapistBookingResponse)
def cancel_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PhysiotherapistBookingResponse:
    """Cancel a booking."""
    booking = session.get(PhysiotherapistBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only the user who created the booking can cancel it
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    if booking.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a booking that is already {booking.status}")
    
    booking.status = "cancelled"
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return PhysiotherapistBookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        physiotherapist_id=booking.physiotherapist_id,
        patient_name=booking.patient_name,
        patient_age=booking.patient_age,
        patient_gender=booking.patient_gender,
        contact_number=booking.contact_number,
        address=booking.address,
        medical_condition=booking.medical_condition,
        required_services=json.loads(booking.required_services),
        booking_type=booking.booking_type,
        duration=booking.duration,
        shift_preference=booking.shift_preference,
        start_date=booking.start_date,
        start_time=booking.start_time,
        total_price=booking.total_price,
        special_instructions=booking.special_instructions,
        status=booking.status,
        created_at=booking.created_at,
    )


@router.patch("/bookings/{booking_id}/status", response_model=PhysiotherapistBookingResponse)
def update_booking_status(
    booking_id: int,
    status_update: PhysiotherapistBookingStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> PhysiotherapistBookingResponse:
    """Update booking status (admin only)."""
    booking = session.get(PhysiotherapistBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = status_update.status
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return PhysiotherapistBookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        physiotherapist_id=booking.physiotherapist_id,
        patient_name=booking.patient_name,
        patient_age=booking.patient_age,
        patient_gender=booking.patient_gender,
        contact_number=booking.contact_number,
        address=booking.address,
        medical_condition=booking.medical_condition,
        required_services=json.loads(booking.required_services),
        booking_type=booking.booking_type,
        duration=booking.duration,
        shift_preference=booking.shift_preference,
        start_date=booking.start_date,
        start_time=booking.start_time,
        total_price=booking.total_price,
        special_instructions=booking.special_instructions,
        status=booking.status,
        created_at=booking.created_at,
    )


# ========== Physiotherapist CRUD Endpoints ==========

@router.get("", response_model=List[PhysiotherapistResponse])
def get_physiotherapists(
    specialization: str | None = None,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
) -> List[PhysiotherapistResponse]:
    """Get all physiotherapists, optionally filtered by specialization."""
    statement = select(Physiotherapist)
    
    if specialization:
        statement = statement.where(Physiotherapist.specialization == specialization)
    
    if not include_inactive:
        statement = statement.where(Physiotherapist.is_active == True)
    
    physiotherapists = session.exec(statement).all()
    
    return [
        PhysiotherapistResponse(
            id=p.id,
            name=p.name,
            qualification=p.qualification,
            specialization=p.specialization,
            experience=p.experience,
            rating=p.rating,
            services=json.loads(p.services),
            hourly_rate=p.hourly_rate,
            daily_rate=p.daily_rate,
            available_shifts=json.loads(p.available_shifts),
            languages=json.loads(p.languages),
            image=p.image,
            gender=p.gender,
            is_active=p.is_active,
        )
        for p in physiotherapists
    ]


@router.get("/{physiotherapist_id}", response_model=PhysiotherapistResponse)
def get_physiotherapist(
    physiotherapist_id: int,
    session: Session = Depends(get_session),
) -> PhysiotherapistResponse:
    """Get a specific physiotherapist by ID."""
    physiotherapist = session.get(Physiotherapist, physiotherapist_id)
    if not physiotherapist:
        raise HTTPException(status_code=404, detail="Physiotherapist not found")
    
    return PhysiotherapistResponse(
        id=physiotherapist.id,
        name=physiotherapist.name,
        qualification=physiotherapist.qualification,
        specialization=physiotherapist.specialization,
        experience=physiotherapist.experience,
        rating=physiotherapist.rating,
        services=json.loads(physiotherapist.services),
        hourly_rate=physiotherapist.hourly_rate,
        daily_rate=physiotherapist.daily_rate,
        available_shifts=json.loads(physiotherapist.available_shifts),
        languages=json.loads(physiotherapist.languages),
        image=physiotherapist.image,
        gender=physiotherapist.gender,
        latitude=physiotherapist.latitude,
        longitude=physiotherapist.longitude,
        is_active=physiotherapist.is_active,
    )


@router.post("", response_model=PhysiotherapistResponse, status_code=status.HTTP_201_CREATED)
def create_physiotherapist(
    physiotherapist_data: PhysiotherapistCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> PhysiotherapistResponse:
    """Create a new physiotherapist (admin only)."""
    physiotherapist = Physiotherapist(
        name=physiotherapist_data.name,
        qualification=physiotherapist_data.qualification,
        specialization=physiotherapist_data.specialization,
        experience=physiotherapist_data.experience,
        rating=physiotherapist_data.rating,
        services=json.dumps(physiotherapist_data.services),
        hourly_rate=physiotherapist_data.hourly_rate,
        daily_rate=physiotherapist_data.daily_rate,
        available_shifts=json.dumps(physiotherapist_data.available_shifts),
        languages=json.dumps(physiotherapist_data.languages),
        image=physiotherapist_data.image,
        gender=physiotherapist_data.gender,
        latitude=physiotherapist_data.latitude,
        longitude=physiotherapist_data.longitude,
    )
    
    session.add(physiotherapist)
    session.commit()
    session.refresh(physiotherapist)
    
    return PhysiotherapistResponse(
        id=physiotherapist.id,
        name=physiotherapist.name,
        qualification=physiotherapist.qualification,
        specialization=physiotherapist.specialization,
        experience=physiotherapist.experience,
        rating=physiotherapist.rating,
        services=json.loads(physiotherapist.services),
        hourly_rate=physiotherapist.hourly_rate,
        daily_rate=physiotherapist.daily_rate,
        available_shifts=json.loads(physiotherapist.available_shifts),
        languages=json.loads(physiotherapist.languages),
        image=physiotherapist.image,
        gender=physiotherapist.gender,
        latitude=physiotherapist.latitude,
        longitude=physiotherapist.longitude,
        is_active=physiotherapist.is_active,
    )


@router.patch("/{physiotherapist_id}", response_model=PhysiotherapistResponse)
def update_physiotherapist(
    physiotherapist_id: int,
    physiotherapist_update: PhysiotherapistUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> PhysiotherapistResponse:
    """Update a physiotherapist (admin only)."""
    physiotherapist = session.get(Physiotherapist, physiotherapist_id)
    if not physiotherapist:
        raise HTTPException(status_code=404, detail="Physiotherapist not found")
    
    update_data = physiotherapist_update.dict(exclude_unset=True)
    
    # Convert lists to JSON strings for database storage
    if "services" in update_data:
        update_data["services"] = json.dumps(update_data["services"])
    if "available_shifts" in update_data:
        update_data["available_shifts"] = json.dumps(update_data["available_shifts"])
    if "languages" in update_data:
        update_data["languages"] = json.dumps(update_data["languages"])
    
    for key, value in update_data.items():
        setattr(physiotherapist, key, value)
    
    session.add(physiotherapist)
    session.commit()
    session.refresh(physiotherapist)
    
    return PhysiotherapistResponse(
        id=physiotherapist.id,
        name=physiotherapist.name,
        qualification=physiotherapist.qualification,
        specialization=physiotherapist.specialization,
        experience=physiotherapist.experience,
        rating=physiotherapist.rating,
        services=json.loads(physiotherapist.services),
        hourly_rate=physiotherapist.hourly_rate,
        daily_rate=physiotherapist.daily_rate,
        available_shifts=json.loads(physiotherapist.available_shifts),
        languages=json.loads(physiotherapist.languages),
        image=physiotherapist.image,
        gender=physiotherapist.gender,
        latitude=physiotherapist.latitude,
        longitude=physiotherapist.longitude,
        is_active=physiotherapist.is_active,
    )


@router.delete("/{physiotherapist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_physiotherapist(
    physiotherapist_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> None:
    """Delete a physiotherapist (admin only)."""
    physiotherapist = session.get(Physiotherapist, physiotherapist_id)
    if not physiotherapist:
        raise HTTPException(status_code=404, detail="Physiotherapist not found")
    
    session.delete(physiotherapist)
    session.commit()
