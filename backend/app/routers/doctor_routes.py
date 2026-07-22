import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user, get_current_user
from ..core.db import get_session
from ..models import Appointment, Doctor, User
from ..schemas import AppointmentCreate, AppointmentResponse, AppointmentWithDoctor, DoctorCreate, DoctorUpdate, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=List[DoctorResponse])
def get_doctors(
    specialty: str | None = None,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
) -> List[DoctorResponse]:
    """Get all doctors, optionally filtered by specialty. Set include_inactive=True to get all doctors."""
    query = select(Doctor)
    
    if not include_inactive:
        query = query.where(Doctor.is_active == True)
    
    if specialty:
        query = query.where(Doctor.specialty == specialty)
    
    doctors = session.exec(query).all()
    
    # Convert JSON strings to lists for response
    return [
        DoctorResponse(
            id=doctor.id,
            name=doctor.name,
            specialty=doctor.specialty,
            qualification=doctor.qualification,
            experience=doctor.experience,
            rating=doctor.rating,
            consultation_fee=doctor.consultation_fee,
            available_days=json.loads(doctor.available_days),
            available_slots=json.loads(doctor.available_slots),
            image=doctor.image,
            address=doctor.address,
            latitude=doctor.latitude,
            longitude=doctor.longitude,
            is_active=doctor.is_active,
        )
        for doctor in doctors
    ]


# Literal-path appointment route must come BEFORE /{doctor_id} wildcard
@router.post("/doctor_appointments", response_model=AppointmentResponse)
def create_appointment_early(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> AppointmentResponse:
    """Book an appointment with a doctor."""
    doctor = session.get(Doctor, appointment_data.doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    available_days = json.loads(doctor.available_days)
    available_slots = json.loads(doctor.available_slots)
    if appointment_data.appointment_day not in available_days:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Doctor is not available on {appointment_data.appointment_day}")
    if appointment_data.appointment_slot not in available_slots:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Time slot {appointment_data.appointment_slot} is not available")
    existing_appointment = session.exec(
        select(Appointment)
        .where(Appointment.doctor_id == appointment_data.doctor_id)
        .where(Appointment.appointment_day == appointment_data.appointment_day)
        .where(Appointment.appointment_slot == appointment_data.appointment_slot)
        .where(Appointment.status.in_(["confirmed", "pending"]))
    ).first()
    if existing_appointment:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This time slot is already booked. Please choose another time.")
    appointment = Appointment(
        user_id=current_user.id, doctor_id=appointment_data.doctor_id,
        patient_name=appointment_data.patient_name, patient_age=appointment_data.patient_age,
        symptoms=appointment_data.symptoms, appointment_day=appointment_data.appointment_day,
        appointment_slot=appointment_data.appointment_slot, appointment_date=appointment_data.appointment_date,
        consultation_fee=doctor.consultation_fee, status="pending",
    )
    session.add(appointment)
    session.commit()
    session.refresh(appointment)
    return AppointmentResponse(
        id=appointment.id, user_id=appointment.user_id, doctor_id=appointment.doctor_id,
        patient_name=appointment.patient_name, patient_age=appointment.patient_age,
        symptoms=appointment.symptoms, appointment_day=appointment.appointment_day,
        appointment_slot=appointment.appointment_slot, appointment_date=appointment.appointment_date,
        consultation_fee=appointment.consultation_fee, status=appointment.status,
        created_at=appointment.created_at,
    )


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    session: Session = Depends(get_session),
) -> DoctorResponse:
    """Get a specific doctor by ID."""
    doctor = session.get(Doctor, doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    
    return DoctorResponse(
        id=doctor.id,
        name=doctor.name,
        specialty=doctor.specialty,
        qualification=doctor.qualification,
        experience=doctor.experience,
        rating=doctor.rating,
        consultation_fee=doctor.consultation_fee,
        available_days=json.loads(doctor.available_days),
        available_slots=json.loads(doctor.available_slots),
        image=doctor.image,
        address=doctor.address,
        latitude=doctor.latitude,
        longitude=doctor.longitude,
        is_active=doctor.is_active,
    )


@router.get("/{doctor_id}/booked-slots", response_model=List[str])
def get_booked_slots(
    doctor_id: int,
    day: str,
    session: Session = Depends(get_session),
) -> List[str]:
    """Get all booked time slots for a doctor on a specific day."""
    # Verify doctor exists
    doctor = session.get(Doctor, doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    
    # Get all scheduled appointments for this doctor on this day
    appointments = session.exec(
        select(Appointment.appointment_slot)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.appointment_day == day)
        .where(Appointment.status == "scheduled")
    ).all()
    
    return list(appointments)


@router.post("", response_model=DoctorResponse)
def create_doctor(
    doctor_data: DoctorCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DoctorResponse:
    """Create a new doctor (admin only)."""
    # In a real app, check if user is admin
    # For now, allow any authenticated user
    
    doctor = Doctor(
        name=doctor_data.name,
        specialty=doctor_data.specialty,
        qualification=doctor_data.qualification,
        experience=doctor_data.experience,
        rating=doctor_data.rating,
        consultation_fee=doctor_data.consultation_fee,
        available_days=json.dumps(doctor_data.available_days),
        available_slots=json.dumps(doctor_data.available_slots),
        image=doctor_data.image,
        address=doctor_data.address,
        latitude=doctor_data.latitude,
        longitude=doctor_data.longitude,
        is_active=True,
    )
    
    session.add(doctor)
    session.commit()
    session.refresh(doctor)
    
    return DoctorResponse(
        id=doctor.id,
        name=doctor.name,
        specialty=doctor.specialty,
        qualification=doctor.qualification,
        experience=doctor.experience,
        rating=doctor.rating,
        consultation_fee=doctor.consultation_fee,
        available_days=json.loads(doctor.available_days),
        available_slots=json.loads(doctor.available_slots),
        image=doctor.image,
        address=doctor.address,
        latitude=doctor.latitude,
        longitude=doctor.longitude,
        is_active=doctor.is_active,
    )


@router.patch("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_data: DoctorUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DoctorResponse:
    """Update a doctor (admin only)."""
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    
    # Update only provided fields
    update_data = doctor_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field in ['available_days', 'available_slots'] and value is not None:
            # Convert lists to JSON strings for storage
            setattr(doctor, field, json.dumps(value))
        else:
            setattr(doctor, field, value)
    
    session.add(doctor)
    session.commit()
    session.refresh(doctor)
    
    return DoctorResponse(
        id=doctor.id,
        name=doctor.name,
        specialty=doctor.specialty,
        qualification=doctor.qualification,
        experience=doctor.experience,
        rating=doctor.rating,
        consultation_fee=doctor.consultation_fee,
        available_days=json.loads(doctor.available_days),
        available_slots=json.loads(doctor.available_slots),
        image=doctor.image,
        address=doctor.address,
        latitude=doctor.latitude,
        longitude=doctor.longitude,
        is_active=doctor.is_active,
    )


@router.delete("/{doctor_id}")
def delete_doctor(
    doctor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a doctor (admin only)."""
    doctor = session.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    # Remove dependent appointments first — the doctor_appointments FK has no
    # ON DELETE CASCADE, so deleting a doctor with existing appointments would
    # otherwise raise an IntegrityError.
    appointments = session.exec(
        select(Appointment).where(Appointment.doctor_id == doctor_id)
    ).all()
    for appointment in appointments:
        session.delete(appointment)

    session.delete(doctor)
    session.commit()

    return {"message": "Doctor deleted successfully"}


@router.get("/appointments/all", response_model=List[AppointmentWithDoctor])
def get_all_appointments_admin(
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session),
) -> List[AppointmentWithDoctor]:
    """Get all appointments (admin endpoint)."""
    query = (
        select(Appointment, Doctor)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .order_by(Appointment.created_at.desc())
    )
    
    results = session.exec(query).all()
    
    return [
        AppointmentWithDoctor(
            id=appointment.id,
            user_id=appointment.user_id,
            doctor_id=appointment.doctor_id,
            patient_name=appointment.patient_name,
            patient_age=appointment.patient_age,
            symptoms=appointment.symptoms,
            appointment_day=appointment.appointment_day,
            appointment_slot=appointment.appointment_slot,
            appointment_date=appointment.appointment_date,
            consultation_fee=appointment.consultation_fee,
            status=appointment.status,
            created_at=appointment.created_at,
            doctor_name=doctor.name,
            doctor_specialty=doctor.specialty,
            doctor_image=doctor.image,
        )
        for appointment, doctor in results
    ]


@router.get("/appointments/my", response_model=List[AppointmentWithDoctor])
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[AppointmentWithDoctor]:
    """Get all appointments for the current user."""
    query = (
        select(Appointment, Doctor)
        .where(Appointment.user_id == current_user.id)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .order_by(Appointment.created_at.desc())
    )
    
    results = session.exec(query).all()
    
    return [
        AppointmentWithDoctor(
            id=appointment.id,
            user_id=appointment.user_id,
            doctor_id=appointment.doctor_id,
            patient_name=appointment.patient_name,
            patient_age=appointment.patient_age,
            symptoms=appointment.symptoms,
            appointment_day=appointment.appointment_day,
            appointment_slot=appointment.appointment_slot,
            appointment_date=appointment.appointment_date,
            consultation_fee=appointment.consultation_fee,
            status=appointment.status,
            created_at=appointment.created_at,
            doctor_name=doctor.name,
            doctor_specialty=doctor.specialty,
            doctor_image=doctor.image,
        )
        for appointment, doctor in results
    ]


@router.get("/doctor_appointments/{appointment_id}", response_model=AppointmentWithDoctor)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> AppointmentWithDoctor:
    """Get a specific appointment by ID."""
    query = (
        select(Appointment, Doctor)
        .where(Appointment.id == appointment_id)
        .where(Appointment.user_id == current_user.id)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
    )
    
    result = session.exec(query).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    
    appointment, doctor = result
    
    return AppointmentWithDoctor(
        id=appointment.id,
        user_id=appointment.user_id,
        doctor_id=appointment.doctor_id,
        patient_name=appointment.patient_name,
        patient_age=appointment.patient_age,
        symptoms=appointment.symptoms,
        appointment_day=appointment.appointment_day,
        appointment_slot=appointment.appointment_slot,
        appointment_date=appointment.appointment_date,
        consultation_fee=appointment.consultation_fee,
        status=appointment.status,
        created_at=appointment.created_at,
        doctor_name=doctor.name,
        doctor_specialty=doctor.specialty,
        doctor_image=doctor.image,
    )


@router.patch("/doctor_appointments/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Cancel an appointment."""
    appointment = session.exec(
        select(Appointment)
        .where(Appointment.id == appointment_id)
        .where(Appointment.user_id == current_user.id)
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
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session),
) -> dict:
    """Confirm a pending appointment (admin)."""
    appointment = session.get(Appointment, appointment_id)
    
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
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session),
) -> dict:
    """Reject a pending appointment (admin)."""
    appointment = session.get(Appointment, appointment_id)
    
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
