import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user, get_current_user
from ..core.db import get_session
from ..core.logbook import log_activity
from ..core.service_requests import create_service_request
from ..models import Nurse, NurseBooking, User
from ..schemas import (
    NurseBookingCreate,
    NurseBookingResponse,
    NurseBookingStatusUpdate,
    NurseBookingWithNurse,
    NurseCreate,
    NurseResponse,
    NurseUpdate,
)

router = APIRouter(prefix="/nurses", tags=["nurses"])


# ========== Nurse Booking Endpoints ==========
# NOTE: Booking routes must come BEFORE /{nurse_id} to avoid path conflicts

@router.post("/bookings", response_model=NurseBookingResponse, status_code=status.HTTP_201_CREATED)
def create_nurse_booking(
    booking_data: NurseBookingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> NurseBookingResponse:
    """Create a new nurse booking for the authenticated user."""
    # Verify nurse exists
    nurse = session.get(Nurse, booking_data.nurse_id)
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
    
    if not nurse.is_active:
        raise HTTPException(status_code=400, detail="This nurse is not available")
    
    # Calculate total price based on booking type
    if booking_data.booking_type == "hourly":
        total_price = nurse.hourly_rate * booking_data.duration
    elif booking_data.booking_type == "daily":
        total_price = nurse.daily_rate * booking_data.duration
    elif booking_data.booking_type == "weekly":
        total_price = (nurse.daily_rate * 7) * booking_data.duration
    else:
        raise HTTPException(status_code=400, detail="Invalid booking type")
    
    # Create booking
    booking = NurseBooking(
        user_id=current_user.id,
        nurse_id=booking_data.nurse_id,
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
    session.flush()  # assign booking.id before logging
    log_activity(
        session,
        action="Nurse Booked",
        module="Nurse",
        actor=current_user.full_name,
        actor_user_id=current_user.id,
        entity_type="NurseBooking",
        entity_id=booking.id,
        provider_id=booking.nurse_id,
        patient_id=current_user.id,
        meta={
            "nurse": nurse.name,
            "booking_type": booking.booking_type,
            "start_date": str(booking.start_date),
        },
    )
    create_service_request(
        session,
        patient_name=booking.patient_name,
        patient_id=current_user.id,
        service="nurse",
        request_type="Home Care",
        provider_id=nurse.id,
        provider_name=nurse.name,
        scheduled_date=booking.start_date,
        amount=booking.total_price,
        source_type="nurse_booking",
        source_id=booking.id,
    )
    session.commit()
    session.refresh(booking)
    
    return NurseBookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        nurse_id=booking.nurse_id,
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


@router.get("/bookings/my", response_model=List[NurseBookingWithNurse])
def get_my_nurse_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[NurseBookingWithNurse]:
    """Get all nurse bookings for the authenticated user."""
    query = select(NurseBooking, Nurse).join(
        Nurse, NurseBooking.nurse_id == Nurse.id
    ).where(NurseBooking.user_id == current_user.id)
    
    query = query.order_by(NurseBooking.created_at.desc())
    
    results = session.exec(query).all()
    
    return [
        NurseBookingWithNurse(
            id=booking.id,
            user_id=booking.user_id,
            nurse_id=booking.nurse_id,
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
            nurse_name=nurse.name,
            nurse_qualification=nurse.qualification,
            nurse_specialization=nurse.specialization,
            nurse_image=nurse.image,
        )
        for booking, nurse in results
    ]


@router.get("/bookings", response_model=List[NurseBookingWithNurse])
def get_all_nurse_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[NurseBookingWithNurse]:
    """Get all nurse bookings (admin only)."""
    query = select(NurseBooking, Nurse).join(
        Nurse, NurseBooking.nurse_id == Nurse.id
    )
    
    query = query.order_by(NurseBooking.created_at.desc())
    
    results = session.exec(query).all()
    
    return [
        NurseBookingWithNurse(
            id=booking.id,
            user_id=booking.user_id,
            nurse_id=booking.nurse_id,
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
            nurse_name=nurse.name,
            nurse_qualification=nurse.qualification,
            nurse_specialization=nurse.specialization,
            nurse_image=nurse.image,
        )
        for booking, nurse in results
    ]


@router.get("/bookings/{booking_id}", response_model=NurseBookingWithNurse)
def get_nurse_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> NurseBookingWithNurse:
    """Get a specific nurse booking by ID."""
    query = select(NurseBooking, Nurse).join(
        Nurse, NurseBooking.nurse_id == Nurse.id
    ).where(
        NurseBooking.id == booking_id
    )
    
    result = session.exec(query).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking, nurse = result
    
    # Users can only view their own bookings, admins can view all
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    return NurseBookingWithNurse(
        id=booking.id,
        user_id=booking.user_id,
        nurse_id=booking.nurse_id,
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
        nurse_name=nurse.name,
        nurse_qualification=nurse.qualification,
        nurse_specialization=nurse.specialization,
        nurse_image=nurse.image,
    )


@router.patch("/bookings/{booking_id}/cancel", response_model=NurseBookingResponse)
def cancel_nurse_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> NurseBookingResponse:
    """Cancel a nurse booking."""
    booking = session.get(NurseBooking, booking_id)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Users can only cancel their own bookings, admins can cancel any
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
    
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed booking")
    
    booking.status = "cancelled"
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return NurseBookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        nurse_id=booking.nurse_id,
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


@router.patch("/bookings/{booking_id}/status", response_model=NurseBookingResponse)
def update_booking_status(
    booking_id: int,
    status_data: NurseBookingStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> NurseBookingResponse:
    """Update a nurse booking status. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update booking status",
        )
    
    booking = session.get(NurseBooking, booking_id)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Validate status transition
    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
    if status_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    booking.status = status_data.status
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return NurseBookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        nurse_id=booking.nurse_id,
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


# ========== Nurse Endpoints ==========

@router.get("", response_model=List[NurseResponse])
def get_nurses(
    specialization: str | None = None,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
) -> List[NurseResponse]:
    """Get all nurses, optionally filtered by specialization. Set include_inactive=True to get all nurses."""
    query = select(Nurse)
    
    if not include_inactive:
        query = query.where(Nurse.is_active == True)
    
    if specialization:
        query = query.where(Nurse.specialization == specialization)
    
    nurses = session.exec(query).all()
    
    # Convert JSON strings to lists for response
    return [
        NurseResponse(
            id=nurse.id,
            name=nurse.name,
            qualification=nurse.qualification,
            specialization=nurse.specialization,
            experience=nurse.experience,
            rating=nurse.rating,
            services=json.loads(nurse.services),
            hourly_rate=nurse.hourly_rate,
            daily_rate=nurse.daily_rate,
            available_shifts=json.loads(nurse.available_shifts),
            languages=json.loads(nurse.languages),
            image=nurse.image,
            gender=nurse.gender,
            latitude=nurse.latitude,
            longitude=nurse.longitude,
            is_active=nurse.is_active,
        )
        for nurse in nurses
    ]


@router.get("/{nurse_id}", response_model=NurseResponse)
def get_nurse(
    nurse_id: int,
    session: Session = Depends(get_session),
) -> NurseResponse:
    """Get a specific nurse by ID."""
    nurse = session.get(Nurse, nurse_id)
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
    
    return NurseResponse(
        id=nurse.id,
        name=nurse.name,
        qualification=nurse.qualification,
        specialization=nurse.specialization,
        experience=nurse.experience,
        rating=nurse.rating,
        services=json.loads(nurse.services),
        hourly_rate=nurse.hourly_rate,
        daily_rate=nurse.daily_rate,
        available_shifts=json.loads(nurse.available_shifts),
        languages=json.loads(nurse.languages),
        image=nurse.image,
        gender=nurse.gender,
        is_active=nurse.is_active,
    )


@router.post("", response_model=NurseResponse, status_code=status.HTTP_201_CREATED)
def create_nurse(
    nurse_data: NurseCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> NurseResponse:
    """Create a new nurse. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create nurses",
        )
    
    # Convert lists to JSON strings for storage
    nurse = Nurse(
        name=nurse_data.name,
        qualification=nurse_data.qualification,
        specialization=nurse_data.specialization,
        experience=nurse_data.experience,
        rating=nurse_data.rating,
        services=json.dumps(nurse_data.services),
        hourly_rate=nurse_data.hourly_rate,
        daily_rate=nurse_data.daily_rate,
        available_shifts=json.dumps(nurse_data.available_shifts),
        languages=json.dumps(nurse_data.languages),
        image=nurse_data.image,
        gender=nurse_data.gender,
        latitude=nurse_data.latitude,
        longitude=nurse_data.longitude,
    )
    
    session.add(nurse)
    session.commit()
    session.refresh(nurse)
    
    return NurseResponse(
        id=nurse.id,
        name=nurse.name,
        qualification=nurse.qualification,
        specialization=nurse.specialization,
        experience=nurse.experience,
        rating=nurse.rating,
        services=json.loads(nurse.services),
        hourly_rate=nurse.hourly_rate,
        daily_rate=nurse.daily_rate,
        available_shifts=json.loads(nurse.available_shifts),
        languages=json.loads(nurse.languages),
        image=nurse.image,
        gender=nurse.gender,
        is_active=nurse.is_active,
    )


@router.patch("/{nurse_id}", response_model=NurseResponse)
def update_nurse(
    nurse_id: int,
    nurse_data: NurseUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> NurseResponse:
    """Update a nurse. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update nurses",
        )
    
    nurse = session.get(Nurse, nurse_id)
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
    
    # Update fields that are provided
    update_data = nurse_data.model_dump(exclude_unset=True)
    
    # Convert lists to JSON strings for storage
    if "services" in update_data and update_data["services"] is not None:
        update_data["services"] = json.dumps(update_data["services"])
    if "available_shifts" in update_data and update_data["available_shifts"] is not None:
        update_data["available_shifts"] = json.dumps(update_data["available_shifts"])
    if "languages" in update_data and update_data["languages"] is not None:
        update_data["languages"] = json.dumps(update_data["languages"])
    
    for key, value in update_data.items():
        setattr(nurse, key, value)
    
    session.add(nurse)
    session.commit()
    session.refresh(nurse)
    
    return NurseResponse(
        id=nurse.id,
        name=nurse.name,
        qualification=nurse.qualification,
        specialization=nurse.specialization,
        experience=nurse.experience,
        rating=nurse.rating,
        services=json.loads(nurse.services),
        hourly_rate=nurse.hourly_rate,
        daily_rate=nurse.daily_rate,
        available_shifts=json.loads(nurse.available_shifts),
        languages=json.loads(nurse.languages),
        image=nurse.image,
        gender=nurse.gender,
        is_active=nurse.is_active,
    )


@router.delete("/{nurse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nurse(
    nurse_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a nurse (mark as inactive). Admin only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete nurses",
        )
    
    nurse = session.get(Nurse, nurse_id)
    if not nurse:
        raise HTTPException(status_code=404, detail="Nurse not found")
    
    nurse.is_active = False
    session.add(nurse)
    session.commit()

