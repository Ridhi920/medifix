from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# Authentication Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Doctor Schemas
class DoctorResponse(BaseModel):
    id: int
    name: str
    specialty: str
    qualification: str
    experience: int
    rating: float
    consultation_fee: int
    available_days: List[str]
    available_slots: List[str]
    image: str
    address: str
    is_active: bool


class DoctorCreate(BaseModel):
    name: str
    specialty: str
    qualification: str
    experience: int
    rating: float = 0.0
    consultation_fee: int
    available_days: List[str]
    available_slots: List[str]
    image: str
    address: str


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    rating: Optional[float] = None
    consultation_fee: Optional[int] = None
    available_days: Optional[List[str]] = None
    available_slots: Optional[List[str]] = None
    image: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


# Appointment Schemas
class AppointmentCreate(BaseModel):
    doctor_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    symptoms: Optional[str] = None
    appointment_day: str
    appointment_slot: str
    appointment_date: Optional[datetime] = None


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    doctor_id: int
    patient_name: str
    patient_age: int
    symptoms: Optional[str]
    appointment_day: str
    appointment_slot: str
    appointment_date: Optional[datetime]
    consultation_fee: int
    status: str
    created_at: datetime


class AppointmentWithDoctor(AppointmentResponse):
    doctor_name: str
    doctor_specialty: str
    doctor_image: str
