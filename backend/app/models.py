from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    phone: Optional[str] = None
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Doctor(SQLModel, table=True):
    __tablename__ = "doctors"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    specialty: str = Field(index=True)
    qualification: str
    experience: int  # years of experience
    rating: float = Field(default=0.0)
    consultation_fee: int  # in rupees
    available_days: str  # JSON string of array: ["Monday", "Wednesday"]
    available_slots: str  # JSON string of array: ["09:00 AM", "10:00 AM"]
    image: str  # emoji or image URL
    address: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Appointment(SQLModel, table=True):
    __tablename__ = "doctor_appointments"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    doctor_id: int = Field(foreign_key="doctors.id", index=True)
    patient_name: str
    patient_age: int
    symptoms: Optional[str] = None
    appointment_day: str  # e.g., "Monday"
    appointment_slot: str  # e.g., "09:00 AM"
    appointment_date: Optional[datetime] = None  # actual date of appointment
    consultation_fee: int  # fee at time of booking
    status: str = Field(default="scheduled")  # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))

