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
    role: str = Field(default="user")  # 'user' or 'admin'
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


class LabTest(SQLModel, table=True):
    __tablename__ = "lab_tests"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str
    parameters: str  # JSON string of array: ["Hemoglobin", "RBC Count"]
    price: int  # in rupees
    report_time: str  # e.g., "6 hours", "24 hours"
    fasting_required: bool = Field(default=False)
    category: str = Field(index=True)  # Blood Test, Urine Test, etc.
    popular: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class LabBooking(SQLModel, table=True):
    __tablename__ = "lab_bookings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    lab_test_id: int = Field(foreign_key="lab_tests.id", index=True)
    patient_name: str
    patient_age: int
    patient_phone: str
    collection_date: str  # e.g., "Tomorrow", "2024-03-15"
    collection_time: str  # e.g., "08:00 AM"
    home_collection: bool = Field(default=False)
    address: Optional[str] = None
    center_name: Optional[str] = None  # if not home collection
    test_price: int  # price at time of booking
    status: str = Field(default="pending")  # pending, confirmed, sample_collected, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Ambulance(SQLModel, table=True):
    __tablename__ = "ambulances"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str
    features: str  # JSON string of array: ["Oxygen supply", "First aid kit"]
    estimated_time: str  # e.g., "10-15 mins"
    base_price: int  # in rupees
    image: str  # emoji or image URL
    ambulance_type: str = Field(index=True)  # BLS, ALS, Neonatal, Air
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class AmbulanceBooking(SQLModel, table=True):
    __tablename__ = "ambulance_bookings"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    ambulance_id: int = Field(foreign_key="ambulances.id", index=True)
    patient_name: str
    contact_number: str
    pickup_address: str
    dropoff_address: Optional[str] = None
    medical_condition: Optional[str] = None
    booking_type: str = Field(default="immediate")  # immediate or scheduled
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    ambulance_price: int  # price at time of booking
    status: str = Field(default="pending")  # pending, confirmed, dispatched, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))

