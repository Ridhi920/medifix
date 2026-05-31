import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from .auth import get_current_user
from .db import get_session
from .models import DentistAppointment, Dentist, User
from .schemas import DentistAppointmentCreate, DentistAppointmentResponse, DentistAppointmentWithDentist, DentistCreate, DentistUpdate, DentistResponse

router = APIRouter(prefix="/dentists", tags=["dentists"])


@router.get("", response_model=List[DentistResponse])
def get_dentists(
    specialty: str | None = None,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
) -> List[DentistResponse]:
    """Get all dentists, optionally filtered by specialty. Set include_inactive=True to get all dentists."""
    query = select(Dentist)
    
    if not include_inactive:
        query = query.where(Dentist.is_active == True)
    
    if specialty:
        query = query.where(Dentist.specialty == specialty)
    
    dentists = session.exec(query).all()
    
    # Convert JSON strings to lists for response
    return [
        DentistResponse(
            id=dentist.id,
            name=dentist.name,
            specialty=dentist.specialty,
            qualification=dentist.qualification,
            experience=dentist.experience,
            rating=dentist.rating,
            consultation_fee=dentist.consultation_fee,
            available_days=json.loads(dentist.available_days),
            available_slots=json.loads(dentist.available_slots),
            image=dentist.image,
            address=dentist.address,
            latitude=dentist.latitude,
            longitude=dentist.longitude,
            is_active=dentist.is_active,
        )
        for dentist in dentists
    ]


@router.get("/{dentist_id}", response_model=DentistResponse)
def get_dentist(
    dentist_id: int,
    session: Session = Depends(get_session),
) -> DentistResponse:
    """Get a specific dentist by ID."""
    dentist = session.get(Dentist, dentist_id)
    if not dentist or not dentist.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dentist not found",
        )
    
    return DentistResponse(
        id=dentist.id,
        name=dentist.name,
        specialty=dentist.specialty,
        qualification=dentist.qualification,
        experience=dentist.experience,
        rating=dentist.rating,
        consultation_fee=dentist.consultation_fee,
        available_days=json.loads(dentist.available_days),
        available_slots=json.loads(dentist.available_slots),
        image=dentist.image,
        address=dentist.address,
        is_active=dentist.is_active,
    )


@router.get("/{dentist_id}/booked-slots", response_model=List[str])
def get_booked_slots(
    dentist_id: int,
    day: str,
    session: Session = Depends(get_session),
) -> List[str]:
    """Get all booked time slots for a dentist on a specific day."""
    # Verify dentist exists
    dentist = session.get(Dentist, dentist_id)
    if not dentist or not dentist.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dentist not found",
        )
    
    # Get all scheduled appointments for this dentist on this day
    appointments = session.exec(
        select(DentistAppointment.appointment_slot)
        .where(DentistAppointment.dentist_id == dentist_id)
        .where(DentistAppointment.appointment_day == day)
        .where(DentistAppointment.status == "scheduled")
    ).all()
    
    return list(appointments)


@router.post("", response_model=DentistResponse)
def create_dentist(
    dentist_data: DentistCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DentistResponse:
    """Create a new dentist (admin only)."""
    dentist = Dentist(
        name=dentist_data.name,
        specialty=dentist_data.specialty,
        qualification=dentist_data.qualification,
        experience=dentist_data.experience,
        rating=dentist_data.rating,
        consultation_fee=dentist_data.consultation_fee,
        available_days=json.dumps(dentist_data.available_days),
        available_slots=json.dumps(dentist_data.available_slots),
        image=dentist_data.image,
        address=dentist_data.address,
        latitude=dentist_data.latitude,
        longitude=dentist_data.longitude,
        is_active=True,
    )
    
    session.add(dentist)
    session.commit()
    session.refresh(dentist)
    
    return DentistResponse(
        id=dentist.id,
        name=dentist.name,
        specialty=dentist.specialty,
        qualification=dentist.qualification,
        experience=dentist.experience,
        rating=dentist.rating,
        consultation_fee=dentist.consultation_fee,
        available_days=json.loads(dentist.available_days),
        available_slots=json.loads(dentist.available_slots),
        image=dentist.image,
        address=dentist.address,
        is_active=dentist.is_active,
    )


@router.patch("/{dentist_id}", response_model=DentistResponse)
def update_dentist(
    dentist_id: int,
    dentist_data: DentistUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DentistResponse:
    """Update a dentist (admin only)."""
    dentist = session.get(Dentist, dentist_id)
    if not dentist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dentist not found",
        )
    
    # Update only provided fields
    update_data = dentist_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field in ['available_days', 'available_slots'] and value is not None:
            # Convert lists to JSON strings for storage
            setattr(dentist, field, json.dumps(value))
        else:
            setattr(dentist, field, value)
    
    session.add(dentist)
    session.commit()
    session.refresh(dentist)
    
    return DentistResponse(
        id=dentist.id,
        name=dentist.name,
        specialty=dentist.specialty,
        qualification=dentist.qualification,
        experience=dentist.experience,
        rating=dentist.rating,
        consultation_fee=dentist.consultation_fee,
        available_days=json.loads(dentist.available_days),
        available_slots=json.loads(dentist.available_slots),
        image=dentist.image,
        address=dentist.address,
        is_active=dentist.is_active,
    )


@router.delete("/{dentist_id}")
def delete_dentist(
    dentist_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a dentist (admin only)."""
    dentist = session.get(Dentist, dentist_id)
    if not dentist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dentist not found",
        )
    
    session.delete(dentist)
    session.commit()
    
    return {"message": "Dentist deleted successfully"}


@router.post("/dentist_appointments", response_model=DentistAppointmentResponse)
def create_appointment(
    appointment_data: DentistAppointmentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DentistAppointmentResponse:
    """Book an appointment with a dentist."""
    # Verify dentist exists and is active
    dentist = session.get(Dentist, appointment_data.dentist_id)
    if not dentist or not dentist.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dentist not found",
        )
    
    # Verify the selected day and slot are available
    available_days = json.loads(dentist.available_days)
    available_slots = json.loads(dentist.available_slots)
    
    if appointment_data.appointment_day not in available_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dentist is not available on {appointment_data.appointment_day}",
        )
    
    if appointment_data.appointment_slot not in available_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Time slot {appointment_data.appointment_slot} is not available",
        )
    
    # Check if the slot is already booked
    existing_appointment = session.exec(
        select(DentistAppointment)
        .where(DentistAppointment.dentist_id == appointment_data.dentist_id)
        .where(DentistAppointment.appointment_day == appointment_data.appointment_day)
        .where(DentistAppointment.appointment_slot == appointment_data.appointment_slot)
        .where(DentistAppointment.status.in_(["confirmed", "pending"]))
    ).first()
    
    if existing_appointment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This time slot is already booked. Please choose another time.",
        )
    
    # Create appointment with pending status
    appointment = DentistAppointment(
        user_id=current_user.id,
        dentist_id=appointment_data.dentist_id,
        patient_name=appointment_data.patient_name,
        patient_age=appointment_data.patient_age,
        symptoms=appointment_data.symptoms,
        appointment_day=appointment_data.appointment_day,
        appointment_slot=appointment_data.appointment_slot,
        appointment_date=appointment_data.appointment_date,
        consultation_fee=dentist.consultation_fee,
        status="pending",
    )
    
    session.add(appointment)
    session.commit()
    session.refresh(appointment)
    
    return DentistAppointmentResponse(
        id=appointment.id,
        user_id=appointment.user_id,
        dentist_id=appointment.dentist_id,
        patient_name=appointment.patient_name,
        patient_age=appointment.patient_age,
        symptoms=appointment.symptoms,
        appointment_day=appointment.appointment_day,
        appointment_slot=appointment.appointment_slot,
        appointment_date=appointment.appointment_date,
        consultation_fee=appointment.consultation_fee,
        status=appointment.status,
        created_at=appointment.created_at,
    )


@router.get("/appointments/all", response_model=List[DentistAppointmentWithDentist])
def get_all_appointments_admin(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[DentistAppointmentWithDentist]:
    """Get all appointments (admin endpoint)."""
    query = (
        select(DentistAppointment, Dentist)
        .join(Dentist, DentistAppointment.dentist_id == Dentist.id)
        .order_by(DentistAppointment.created_at.desc())
    )
    
    results = session.exec(query).all()
    
    return [
        DentistAppointmentWithDentist(
            id=appointment.id,
            user_id=appointment.user_id,
            dentist_id=appointment.dentist_id,
            patient_name=appointment.patient_name,
            patient_age=appointment.patient_age,
            symptoms=appointment.symptoms,
            appointment_day=appointment.appointment_day,
            appointment_slot=appointment.appointment_slot,
            appointment_date=appointment.appointment_date,
            consultation_fee=appointment.consultation_fee,
            status=appointment.status,
            created_at=appointment.created_at,
            dentist_name=dentist.name,
            dentist_specialty=dentist.specialty,
            dentist_image=dentist.image,
        )
        for appointment, dentist in results
    ]


@router.get("/appointments/my", response_model=List[DentistAppointmentWithDentist])
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[DentistAppointmentWithDentist]:
    """Get all appointments for the current user."""
    query = (
        select(DentistAppointment, Dentist)
        .where(DentistAppointment.user_id == current_user.id)
        .join(Dentist, DentistAppointment.dentist_id == Dentist.id)
        .order_by(DentistAppointment.created_at.desc())
    )
    
    results = session.exec(query).all()
    
    return [
        DentistAppointmentWithDentist(
            id=appointment.id,
            user_id=appointment.user_id,
            dentist_id=appointment.dentist_id,
            patient_name=appointment.patient_name,
            patient_age=appointment.patient_age,
            symptoms=appointment.symptoms,
            appointment_day=appointment.appointment_day,
            appointment_slot=appointment.appointment_slot,
            appointment_date=appointment.appointment_date,
            consultation_fee=appointment.consultation_fee,
            status=appointment.status,
            created_at=appointment.created_at,
            dentist_name=dentist.name,
            dentist_specialty=dentist.specialty,
            dentist_image=dentist.image,
        )
        for appointment, dentist in results
    ]


@router.get("/dentist_appointments/{appointment_id}", response_model=DentistAppointmentWithDentist)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DentistAppointmentWithDentist:
    """Get a specific appointment by ID."""
    query = (
        select(DentistAppointment, Dentist)
        .where(DentistAppointment.id == appointment_id)
        .where(DentistAppointment.user_id == current_user.id)
        .join(Dentist, DentistAppointment.dentist_id == Dentist.id)
    )
    
    result = session.exec(query).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    
    appointment, dentist = result
    
    return DentistAppointmentWithDentist(
        id=appointment.id,
        user_id=appointment.user_id,
        dentist_id=appointment.dentist_id,
        patient_name=appointment.patient_name,
        patient_age=appointment.patient_age,
        symptoms=appointment.symptoms,
        appointment_day=appointment.appointment_day,
        appointment_slot=appointment.appointment_slot,
        appointment_date=appointment.appointment_date,
        consultation_fee=appointment.consultation_fee,
        status=appointment.status,
        created_at=appointment.created_at,
        dentist_name=dentist.name,
        dentist_specialty=dentist.specialty,
        dentist_image=dentist.image,
    )


@router.patch("/dentist_appointments/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Cancel an appointment."""
    appointment = session.exec(
        select(DentistAppointment)
        .where(DentistAppointment.id == appointment_id)
        .where(DentistAppointment.user_id == current_user.id)
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    
    if appointment.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment is already cancelled",
        )
    
    appointment.status = "cancelled"
    session.add(appointment)
    session.commit()
    
    return {"message": "Appointment cancelled successfully"}


@router.patch("/appointments/{appointment_id}/confirm")
def confirm_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Confirm a pending appointment (admin)."""
    appointment = session.get(DentistAppointment, appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    
    if appointment.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm appointment with status: {appointment.status}",
        )
    
    appointment.status = "confirmed"
    session.add(appointment)
    session.commit()
    
    return {"message": "Appointment confirmed successfully"}


@router.patch("/appointments/{appointment_id}/reject")
def reject_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Reject a pending appointment (admin)."""
    appointment = session.get(DentistAppointment, appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    
    if appointment.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject appointment with status: {appointment.status}",
        )
    
    appointment.status = "rejected"
    session.add(appointment)
    session.commit()
    
    return {"message": "Appointment rejected successfully"}
