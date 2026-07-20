from __future__ import annotations

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class AppSettings(SQLModel, table=True):
    __tablename__ = "app_settings"
    id: int | None = Field(default=None, primary_key=True)
    convenience_fee: float = Field(default=7.0)
    delivery_fee: float = Field(default=20.0)
    free_delivery_threshold: float = Field(default=400.0)
    # JSON array of service keys that are currently marked unavailable,
    # e.g. ["pharmacy", "lab"]. Consumed by the mobile app to show
    # "Store/Service unavailable" on the corresponding service.
    unavailable_services: str = Field(default="[]")
    # JSON object mapping a service key to an optional ISO date string
    # (e.g. {"pharmacy": "2026-08-01"}) indicating when that service is
    # expected to be back. Only meaningful for keys also present in
    # unavailable_services.
    service_return_dates: str = Field(default="{}")


class Testimonial(SQLModel, table=True):
    """A user review shown in the mobile app's "What Our Users Say" carousel."""

    __tablename__ = "testimonials"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    role: str  # shown as location, e.g. "Mumbai"
    avatar: str = Field(default="👤")  # emoji
    quote: str
    accent: str = Field(default="#FF6B35")  # accent colour (hex)
    bg: str = Field(default="#ffedd5")  # card background colour (hex)
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class HomeFeature(SQLModel, table=True):
    """A card in the mobile app's "Why Choose MedEfix" carousel."""

    __tablename__ = "home_features"

    id: int | None = Field(default=None, primary_key=True)
    icon: str = Field(default="✅")  # emoji
    title: str
    subtitle: str
    bg: str = Field(default="#ecfdf5")  # card background colour (hex)
    icon_bg: str = Field(default="#bbf7d0")  # icon circle colour (hex)
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    phone: str | None = None
    hashed_password: str
    # 'user', 'admin', or a vendor role: 'doctor', 'dentist', 'lab',
    # 'ambulance', 'nurse', 'physiotherapist', 'pharmacy'
    role: str = Field(default="user")
    # For vendor roles: id of the linked record in the matching table
    # (doctors, dentists, nurses, physiotherapists, ambulances).
    vendor_id: int | None = Field(default=None)
    # 'pending', 'approved', 'rejected'. Vendors start as 'pending' and can
    # only log in after an admin approves them.
    approval_status: str = Field(default="approved")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Doctor(SQLModel, table=True):
    __tablename__ = "doctors"

    id: int | None = Field(default=None, primary_key=True)
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
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Appointment(SQLModel, table=True):
    __tablename__ = "doctor_appointments"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    doctor_id: int = Field(foreign_key="doctors.id", index=True)
    patient_name: str
    patient_age: int
    symptoms: str | None = None
    appointment_day: str  # e.g., "Monday"
    appointment_slot: str  # e.g., "09:00 AM"
    appointment_date: datetime | None = None  # actual date of appointment
    consultation_fee: int  # fee at time of booking
    status: str = Field(default="scheduled")  # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Dentist(SQLModel, table=True):
    __tablename__ = "dentists"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    specialty: str = Field(index=True)  # e.g., "General Dentist", "Orthodontist", "Endodontist"
    qualification: str
    experience: int  # years of experience
    rating: float = Field(default=0.0)
    consultation_fee: int  # in rupees
    available_days: str  # JSON string of array: ["Monday", "Wednesday"]
    available_slots: str  # JSON string of array: ["09:00 AM", "10:00 AM"]
    image: str  # emoji or image URL
    address: str
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class DentistAppointment(SQLModel, table=True):
    __tablename__ = "dentist_appointments"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    dentist_id: int = Field(foreign_key="dentists.id", index=True)
    patient_name: str
    patient_age: int
    symptoms: str | None = None
    appointment_day: str  # e.g., "Monday"
    appointment_slot: str  # e.g., "09:00 AM"
    appointment_date: datetime | None = None  # actual date of appointment
    consultation_fee: int  # fee at time of booking
    status: str = Field(default="scheduled")  # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class LabTest(SQLModel, table=True):
    __tablename__ = "lab_tests"

    id: int | None = Field(default=None, primary_key=True)
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

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    lab_test_id: int = Field(foreign_key="lab_tests.id", index=True)
    patient_name: str
    patient_age: int
    patient_phone: str
    collection_date: str  # e.g., "Tomorrow", "2024-03-15"
    collection_time: str  # e.g., "08:00 AM"
    home_collection: bool = Field(default=False)
    address: str | None = None
    center_name: str | None = None  # if not home collection
    test_price: int  # price at time of booking
    status: str = Field(default="pending")  # pending, confirmed, sample_collected, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Ambulance(SQLModel, table=True):
    __tablename__ = "ambulances"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str
    features: str  # JSON string of array: ["Oxygen supply", "First aid kit"]
    estimated_time: str  # e.g., "10-15 mins"
    base_price: int  # in rupees
    image: str  # emoji or image URL
    ambulance_type: str = Field(index=True)  # BLS, ALS, Neonatal, Air
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class AmbulanceBooking(SQLModel, table=True):
    __tablename__ = "ambulance_bookings"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    ambulance_id: int = Field(foreign_key="ambulances.id", index=True)
    patient_name: str
    contact_number: str
    pickup_address: str
    dropoff_address: str | None = None
    medical_condition: str | None = None
    booking_type: str = Field(default="immediate")  # immediate or scheduled
    scheduled_date: str | None = None
    scheduled_time: str | None = None
    ambulance_price: int  # price at time of booking
    status: str = Field(default="pending")  # pending, confirmed, dispatched, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Nurse(SQLModel, table=True):
    __tablename__ = "nurses"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    qualification: str  # e.g., "BSc Nursing", "GNM"
    specialization: str = Field(index=True)  # ICU, Pediatric, Geriatric, General
    experience: int  # years of experience
    rating: float = Field(default=0.0)
    services: str  # JSON string of array: ["Wound care", "IV administration"]
    hourly_rate: int  # per hour in rupees
    daily_rate: int  # per day (12 hours) in rupees
    available_shifts: str  # JSON string of array: ["Day", "Night", "24-hour"]
    languages: str  # JSON string of array: ["English", "Hindi"]
    image: str  # emoji or image URL
    gender: str  # Male, Female
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class NurseBooking(SQLModel, table=True):
    __tablename__ = "nurse_bookings"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    nurse_id: int = Field(foreign_key="nurses.id", index=True)
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_number: str
    address: str
    medical_condition: str | None = None
    required_services: str  # JSON string of array of required services
    booking_type: str = Field(default="hourly")  # hourly, daily, weekly
    duration: int  # number of hours/days
    shift_preference: str  # Day, Night, 24-hour
    start_date: str  # e.g., "2024-03-15"
    start_time: str | None = None  # e.g., "09:00 AM"
    total_price: int  # price at time of booking
    special_instructions: str | None = None
    status: str = Field(default="pending")  # pending, confirmed, in_progress, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Physiotherapist(SQLModel, table=True):
    __tablename__ = "physiotherapists"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    qualification: str  # e.g., "BPT", "MPT"
    specialization: str = Field(index=True)  # Sports, Orthopedic, Neurological, Pediatric, Geriatric
    experience: int  # years of experience
    rating: float = Field(default=0.0)
    services: str  # JSON string of array: ["Manual therapy", "Exercise therapy", "Electrotherapy"]
    hourly_rate: int  # per hour in rupees
    daily_rate: int  # per day (session) in rupees
    available_shifts: str  # JSON string of array: ["Morning", "Afternoon", "Evening"]
    languages: str  # JSON string of array: ["English", "Hindi"]
    image: str  # emoji or image URL
    gender: str  # Male, Female
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class PhysiotherapistBooking(SQLModel, table=True):
    __tablename__ = "physiotherapist_bookings"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    physiotherapist_id: int = Field(foreign_key="physiotherapists.id", index=True)
    patient_name: str
    patient_age: int
    patient_gender: str
    contact_number: str
    address: str
    medical_condition: str | None = None
    required_services: str  # JSON string of array of required services
    booking_type: str = Field(default="session")  # session, daily, weekly
    duration: int  # number of sessions/days
    shift_preference: str  # Morning, Afternoon, Evening
    start_date: str  # e.g., "2024-03-15"
    start_time: str | None = None  # e.g., "09:00 AM"
    total_price: int  # price at time of booking
    special_instructions: str | None = None
    status: str = Field(default="pending")  # pending, confirmed, in_progress, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Medicine(SQLModel, table=True):
    __tablename__ = "medicines"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    generic_name: str
    manufacturer: str
    category: str = Field(index=True)  # Pain Relief, Antibiotics, Vitamins, First Aid
    price: int  # in rupees
    stock: int = Field(default=0)
    requires_prescription: bool = Field(default=False)
    description: str | None = None
    dosage_form: str | None = None  # Tablet, Capsule, Syrup, etc.
    strength: str | None = None  # e.g., "500mg", "10ml"
    image: str | None = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class MedicineOrder(SQLModel, table=True):
    __tablename__ = "medicine_orders"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    patient_name: str
    patient_phone: str
    delivery_address: str
    items: str  # JSON string of array: [{"medicine_id": 1, "medicine_name": "Paracetamol", "quantity": 2, "price": 50}]
    total_amount: int  # total price
    prescription_image: str | None = None  # URL or base64 of prescription image
    notes: str | None = None
    status: str = Field(default="pending")  # pending, confirmed, preparing, out_for_delivery, delivered, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class PrescriptionSubmission(SQLModel, table=True):
    __tablename__ = "prescription_submissions"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    image_data: str  # base64 encoded image
    status: str = Field(default="pending")  # pending, reviewed
    admin_notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))

