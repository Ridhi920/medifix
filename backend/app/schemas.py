from __future__ import annotations

from datetime import datetime
from typing import List
from pydantic import BaseModel, EmailStr, Field


# Authentication Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    full_name: str = Field(..., min_length=2)
    phone: str | None = None
    role: str | None = Field(default="user")  # 'user' or 'admin'


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None = None
    role: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


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
    name: str | None = None
    specialty: str | None = None
    qualification: str | None = None
    experience: int | None = None
    rating: float | None = None
    consultation_fee: int | None = None
    available_days: List[str] | None = None
    available_slots: List[str] | None = None
    image: str | None = None
    address: str | None = None
    is_active: bool | None = None


# Appointment Schemas
class AppointmentCreate(BaseModel):
    doctor_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    symptoms: str | None = None
    appointment_day: str
    appointment_slot: str
    appointment_date: datetime | None = None


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    doctor_id: int
    patient_name: str
    patient_age: int
    symptoms: str | None
    appointment_day: str
    appointment_slot: str
    appointment_date: datetime | None
    consultation_fee: int
    status: str
    created_at: datetime


class AppointmentWithDoctor(AppointmentResponse):
    doctor_name: str
    doctor_specialty: str
    doctor_image: str


# Lab Test Schemas
class LabTestResponse(BaseModel):
    id: int
    name: str
    description: str
    parameters: List[str]
    price: int
    report_time: str
    fasting_required: bool
    category: str
    popular: bool
    is_active: bool


class LabTestCreate(BaseModel):
    name: str
    description: str
    parameters: List[str]
    price: int
    report_time: str
    fasting_required: bool = False
    category: str
    popular: bool = False


class LabTestUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    parameters: List[str] | None = None
    price: int | None = None
    report_time: str | None = None
    fasting_required: bool | None = None
    category: str | None = None
    popular: bool | None = None
    is_active: bool | None = None


# Lab Booking Schemas
class LabBookingCreate(BaseModel):
    lab_test_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    patient_phone: str = Field(..., min_length=10)
    collection_date: str
    collection_time: str
    home_collection: bool = False
    address: str | None = None
    center_name: str | None = None


class LabBookingResponse(BaseModel):
    id: int
    user_id: int
    lab_test_id: int
    patient_name: str
    patient_age: int
    patient_phone: str
    collection_date: str
    collection_time: str
    home_collection: bool
    address: str | None
    center_name: str | None
    test_price: int
    status: str
    created_at: datetime


class LabBookingWithTest(LabBookingResponse):
    test_name: str
    test_category: str
    test_parameters: List[str]


# Ambulance Schemas
class AmbulanceResponse(BaseModel):
    id: int
    name: str
    description: str
    features: List[str]
    estimated_time: str
    base_price: int
    image: str
    ambulance_type: str
    is_active: bool


class AmbulanceCreate(BaseModel):
    name: str
    description: str
    features: List[str]
    estimated_time: str
    base_price: int
    image: str
    ambulance_type: str


class AmbulanceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    features: List[str] | None = None
    estimated_time: str | None = None
    base_price: int | None = None
    image: str | None = None
    ambulance_type: str | None = None
    is_active: bool | None = None


# Ambulance Booking Schemas
class AmbulanceBookingCreate(BaseModel):
    ambulance_id: int
    patient_name: str = Field(..., min_length=2)
    contact_number: str = Field(..., min_length=10)
    pickup_address: str = Field(..., min_length=5)
    dropoff_address: str | None = None
    medical_condition: str | None = None
    booking_type: str = "immediate"  # immediate or scheduled
    scheduled_date: str | None = None
    scheduled_time: str | None = None


class AmbulanceBookingResponse(BaseModel):
    id: int
    user_id: int
    ambulance_id: int
    patient_name: str
    contact_number: str
    pickup_address: str
    dropoff_address: str | None
    medical_condition: str | None
    booking_type: str
    scheduled_date: str | None
    scheduled_time: str | None
    ambulance_price: int
    status: str
    created_at: datetime


class AmbulanceBookingWithAmbulance(AmbulanceBookingResponse):
    ambulance_name: str
    ambulance_type: str
    ambulance_image: str
