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


class VendorSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    full_name: str = Field(..., min_length=2)
    phone: str | None = None
    # Vendor role: doctor, dentist, lab, ambulance, nurse, physiotherapist, pharmacy
    role: str

    # Doctor / Dentist profile fields
    specialty: str | None = None
    qualification: str | None = None
    experience: int | None = None
    consultation_fee: int | None = None
    address: str | None = None

    # Ambulance profile fields (describe the operator's first vehicle)
    ambulance_type: str | None = None
    base_price: int | None = None
    estimated_time: str | None = None
    description: str | None = None
    vehicle_number: str | None = None
    driver_name: str | None = None

    # Nurse / Physiotherapist profile fields
    specialization: str | None = None
    hourly_rate: int | None = None
    daily_rate: int | None = None
    gender: str | None = None

    # Pharmacy profile fields (backs a PharmacyStore). `address` above is the
    # store address; `phone` doubles as the store's contact number.
    city: str | None = None
    delivery_time: str | None = None
    opening_hours: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None = None
    role: str
    vendor_id: int | None = None
    approval_status: str = "approved"
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=72)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


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
    latitude: float | None = None
    longitude: float | None = None
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
    latitude: float | None = None
    longitude: float | None = None


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
    latitude: float | None = None
    longitude: float | None = None
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


# Dentist Schemas
class DentistResponse(BaseModel):
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
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool


class DentistCreate(BaseModel):
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
    latitude: float | None = None
    longitude: float | None = None


class DentistUpdate(BaseModel):
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
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool | None = None


# Dentist Appointment Schemas
class DentistAppointmentCreate(BaseModel):
    dentist_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    symptoms: str | None = None
    appointment_day: str
    appointment_slot: str
    appointment_date: datetime | None = None


class DentistAppointmentResponse(BaseModel):
    id: int
    user_id: int
    dentist_id: int
    patient_name: str
    patient_age: int
    symptoms: str | None
    appointment_day: str
    appointment_slot: str
    appointment_date: datetime | None
    consultation_fee: int
    status: str
    created_at: datetime


class DentistAppointmentWithDentist(DentistAppointmentResponse):
    dentist_name: str
    dentist_specialty: str
    dentist_image: str


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
    operator_id: int | None = None
    name: str
    description: str
    features: List[str]
    estimated_time: str
    base_price: int
    image: str
    ambulance_type: str
    vehicle_number: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    availability: str = "available"
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool


class AmbulanceCreate(BaseModel):
    name: str
    description: str
    features: List[str]
    estimated_time: str
    base_price: int
    image: str
    ambulance_type: str
    vehicle_number: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    availability: str = Field(default="available", pattern="^(available|on_trip|off_duty)$")
    latitude: float | None = None
    longitude: float | None = None


class AmbulanceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    features: List[str] | None = None
    estimated_time: str | None = None
    base_price: int | None = None
    image: str | None = None
    ambulance_type: str | None = None
    vehicle_number: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    availability: str | None = Field(default=None, pattern="^(available|on_trip|off_duty)$")
    latitude: float | None = None
    longitude: float | None = None
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


# Nurse Schemas
class NurseResponse(BaseModel):
    id: int
    name: str
    qualification: str
    specialization: str
    experience: int
    rating: float
    services: List[str]
    hourly_rate: int
    daily_rate: int
    available_shifts: List[str]
    languages: List[str]
    image: str
    gender: str
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool


class NurseCreate(BaseModel):
    name: str
    qualification: str
    specialization: str
    experience: int
    rating: float = 0.0
    services: List[str]
    hourly_rate: int
    daily_rate: int
    available_shifts: List[str]
    languages: List[str]
    image: str
    gender: str
    latitude: float | None = None
    longitude: float | None = None


class NurseUpdate(BaseModel):
    name: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    experience: int | None = None
    rating: float | None = None
    services: List[str] | None = None
    hourly_rate: int | None = None
    daily_rate: int | None = None
    available_shifts: List[str] | None = None
    languages: List[str] | None = None
    image: str | None = None
    gender: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool | None = None


# Nurse Booking Schemas
class NurseBookingCreate(BaseModel):
    nurse_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    patient_gender: str
    contact_number: str = Field(..., min_length=10)
    address: str = Field(..., min_length=5)
    medical_condition: str | None = None
    required_services: List[str]
    booking_type: str = "hourly"  # hourly, daily, weekly
    duration: int = Field(..., gt=0)
    shift_preference: str
    start_date: str
    start_time: str | None = None
    special_instructions: str | None = None


class NurseBookingResponse(BaseModel):
    id: int
    user_id: int
    nurse_id: int
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_number: str
    address: str
    medical_condition: str | None
    required_services: List[str]
    booking_type: str
    duration: int
    shift_preference: str
    start_date: str
    start_time: str | None
    total_price: int
    special_instructions: str | None
    status: str
    created_at: datetime


class NurseBookingWithNurse(NurseBookingResponse):
    nurse_name: str
    nurse_qualification: str
    nurse_specialization: str
    nurse_image: str


class NurseBookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|in_progress|completed|cancelled)$")


# Physiotherapist Schemas
class PhysiotherapistResponse(BaseModel):
    id: int
    name: str
    qualification: str
    specialization: str
    experience: int
    rating: float
    services: List[str]
    hourly_rate: int
    daily_rate: int
    available_shifts: List[str]
    languages: List[str]
    image: str
    gender: str
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool


class PhysiotherapistCreate(BaseModel):
    name: str
    qualification: str
    specialization: str
    experience: int
    rating: float = 0.0
    services: List[str]
    hourly_rate: int
    daily_rate: int
    available_shifts: List[str]
    languages: List[str]
    image: str
    gender: str
    latitude: float | None = None
    longitude: float | None = None


class PhysiotherapistUpdate(BaseModel):
    name: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    experience: int | None = None
    rating: float | None = None
    services: List[str] | None = None
    hourly_rate: int | None = None
    daily_rate: int | None = None
    available_shifts: List[str] | None = None
    languages: List[str] | None = None
    image: str | None = None
    gender: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool | None = None


# Physiotherapist Booking Schemas
class PhysiotherapistBookingCreate(BaseModel):
    physiotherapist_id: int
    patient_name: str = Field(..., min_length=2)
    patient_age: int = Field(..., gt=0, lt=150)
    patient_gender: str
    contact_number: str = Field(..., min_length=10)
    address: str = Field(..., min_length=5)
    medical_condition: str | None = None
    required_services: List[str]
    booking_type: str = "session"  # session, daily, weekly
    duration: int = Field(..., gt=0)
    shift_preference: str
    start_date: str
    start_time: str | None = None
    special_instructions: str | None = None


class PhysiotherapistBookingResponse(BaseModel):
    id: int
    user_id: int
    physiotherapist_id: int
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_number: str
    address: str
    medical_condition: str | None
    required_services: List[str]
    booking_type: str
    duration: int
    shift_preference: str
    start_date: str
    start_time: str | None
    total_price: int
    special_instructions: str | None
    status: str
    created_at: datetime


class PhysiotherapistBookingWithPhysiotherapist(PhysiotherapistBookingResponse):
    physiotherapist_name: str
    physiotherapist_qualification: str
    physiotherapist_specialization: str
    physiotherapist_image: str


class PhysiotherapistBookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|in_progress|completed|cancelled)$")


# ========== Pharmacy Schemas ==========

class PharmacyStoreResponse(BaseModel):
    id: int
    name: str
    address: str
    city: str | None
    phone: str | None
    image: str
    rating: float
    delivery_time: str
    opening_hours: str | None
    latitude: float | None
    longitude: float | None
    is_active: bool
    # Number of active medicines currently on this store's shelf.
    medicine_count: int = 0
    created_at: datetime


class PharmacyStoreCreate(BaseModel):
    name: str
    address: str
    city: str | None = None
    phone: str | None = None
    image: str = "🏥"
    rating: float = Field(default=0.0, ge=0, le=5)
    delivery_time: str = "30-45 mins"
    opening_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PharmacyStoreUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    image: str | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    delivery_time: str | None = None
    opening_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool | None = None


class MedicineResponse(BaseModel):
    id: int
    store_id: int | None
    store_name: str | None = None
    name: str
    generic_name: str
    manufacturer: str
    category: str
    price: int
    stock: int
    requires_prescription: bool
    description: str | None
    dosage_form: str | None
    strength: str | None
    image: str | None
    barcode: str | None = None
    min_stock: int = 10
    is_active: bool
    created_at: datetime


class MedicineCreate(BaseModel):
    store_id: int | None = None
    name: str
    generic_name: str
    manufacturer: str
    category: str
    price: int = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    requires_prescription: bool = Field(default=False)
    description: str | None = None
    dosage_form: str | None = None
    strength: str | None = None
    image: str | None = None
    barcode: str | None = None
    min_stock: int = Field(default=10, ge=0)


class MedicineUpdate(BaseModel):
    store_id: int | None = None
    name: str | None = None
    generic_name: str | None = None
    manufacturer: str | None = None
    category: str | None = None
    price: int | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    requires_prescription: bool | None = None
    description: str | None = None
    dosage_form: str | None = None
    strength: str | None = None
    image: str | None = None
    barcode: str | None = None
    min_stock: int | None = Field(default=None, ge=0)


class MedicineOrderItem(BaseModel):
    medicine_id: int
    medicine_name: str
    quantity: int = Field(..., gt=0)
    price: int = Field(..., gt=0)


class MedicineOrderCreate(BaseModel):
    patient_name: str
    patient_phone: str
    delivery_address: str
    items: list[MedicineOrderItem]
    # Optional: when omitted the store is derived from the ordered medicines.
    # All items must come from the same store.
    store_id: int | None = None
    prescription_image: str | None = None
    notes: str | None = None


class StoreCartCreate(BaseModel):
    """One store's basket inside a multi-store checkout."""

    store_id: int
    items: list[MedicineOrderItem]


class MultiStoreOrderCreate(BaseModel):
    """Check out a cart spanning several pharmacies in one go.

    Creates one MedicineOrder per store, all sharing the same delivery
    details, and returns them in the order the carts were sent.
    """

    patient_name: str
    patient_phone: str
    delivery_address: str
    carts: list[StoreCartCreate] = Field(..., min_length=1)
    prescription_image: str | None = None
    notes: str | None = None


class MedicineOrderResponse(BaseModel):
    id: int
    user_id: int
    store_id: int | None
    store_name: str | None
    patient_name: str
    patient_phone: str
    delivery_address: str
    items: list[MedicineOrderItem]
    total_amount: int
    prescription_image: str | None
    notes: str | None
    status: str
    created_at: datetime


class MedicineOrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|preparing|out_for_delivery|delivered|cancelled)$")


class PrescriptionSubmissionCreate(BaseModel):
    image_data: str  # base64 encoded image


class PrescriptionSubmissionResponse(BaseModel):
    id: int
    user_id: int | None
    image_data: str
    status: str
    admin_notes: str | None
    created_at: datetime
