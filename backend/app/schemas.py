from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# Authentication Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: Optional[str] = Field(default="user")  # 'user' or 'admin'


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
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
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[List[str]] = None
    price: Optional[int] = None
    report_time: Optional[str] = None
    fasting_required: Optional[bool] = None
    category: Optional[str] = None
    popular: Optional[bool] = None
    is_active: Optional[bool] = None


# Lab Booking Schemas
class LabBookingCreate(BaseModel):
    lab_test_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    patient_phone: str = Field(..., min_length=10)
    collection_date: str
    collection_time: str
    home_collection: bool = False
    address: Optional[str] = None
    center_name: Optional[str] = None


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
    address: Optional[str]
    center_name: Optional[str]
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
    name: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    estimated_time: Optional[str] = None
    base_price: Optional[int] = None
    image: Optional[str] = None
    ambulance_type: Optional[str] = None
    is_active: Optional[bool] = None


# Ambulance Booking Schemas
class AmbulanceBookingCreate(BaseModel):
    ambulance_id: int
    patient_name: str = Field(..., min_length=2)
    contact_number: str = Field(..., min_length=10)
    pickup_address: str = Field(..., min_length=5)
    dropoff_address: Optional[str] = None
    medical_condition: Optional[str] = None
    booking_type: str = "immediate"  # immediate or scheduled
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None


class AmbulanceBookingResponse(BaseModel):
    id: int
    user_id: int
    ambulance_id: int
    patient_name: str
    contact_number: str
    pickup_address: str
    dropoff_address: Optional[str]
    medical_condition: Optional[str]
    booking_type: str
    scheduled_date: Optional[str]
    scheduled_time: Optional[str]
    ambulance_price: int
    status: str
    created_at: datetime


class AmbulanceBookingWithAmbulance(AmbulanceBookingResponse):
    ambulance_name: str
    ambulance_type: str
    ambulance_image: str
