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


class DigitalLogEntry(SQLModel, table=True):
    """A single row in MedEfix's Digital Logbook / activity timeline.

    Every significant action across the platform (registrations, appointments,
    orders, report uploads, deliveries, claim updates, ABDM events) appends one
    entry here so a provider workspace — or a patient — can render an
    operational timeline. Kept deliberately denormalised for cheap reads.
    """

    __tablename__ = "digital_logbook"

    id: int | None = Field(default=None, primary_key=True)
    # Display label for who/what acted, e.g. "Lab", "Dr. Sharma", "System",
    # or a patient's name. Denormalised so the timeline renders without joins.
    actor: str = Field(default="System")
    # Optional link to the acting user account.
    actor_user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    action: str  # e.g. "Patient Registered", "Sample Collected", "Report Uploaded"
    module: str  # e.g. "Registration", "Lab", "Reports", "Pharmacy", "ABDM", "Claims"
    entity_type: str | None = None  # e.g. "Patient", "Visit", "Report", "Appointment"
    entity_id: int | None = None
    # Optional scoping so a workspace / patient can filter their own timeline.
    provider_id: int | None = Field(default=None, index=True)
    patient_id: int | None = Field(default=None, index=True)
    # Free-form JSON string for extra context (named `meta`, not `metadata`,
    # which is reserved by SQLAlchemy's declarative base).
    meta: str = Field(default="{}")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(tz=timezone.utc), index=True
    )


class ServiceRequest(SQLModel, table=True):
    """The core, unifying transaction object of MedEfix.

    Every patient-facing transaction (doctor/dentist consultation, lab test,
    pharmacy order, nurse/physiotherapy/ambulance booking) also creates one
    ServiceRequest so the platform has a single spine to list, filter, and drive
    a common status lifecycle:

        created -> confirmed -> scheduled -> in_progress -> completed -> closed
                                                          -> cancelled

    It does NOT replace the specialised booking tables; `source_type` /
    `source_id` link back to the row that owns the domain-specific fields.
    """

    __tablename__ = "service_requests"

    id: int | None = Field(default=None, primary_key=True)
    patient_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    patient_name: str
    # The service provider being engaged (doctor/dentist/nurse/physio/ambulance
    # id). Null for services without a provider record yet (lab test, medicine).
    provider_id: int | None = Field(default=None, index=True)
    provider_name: str | None = None
    # Service key: "doctor", "dentist", "lab", "pharmacy", "nurse",
    # "physiotherapist", "ambulance".
    service: str = Field(index=True)
    # Catalogue request type: Consultation / Diagnostic / Medicine /
    # Home Collection / Transport / Home Care / Insurance.
    request_type: str
    status: str = Field(default="created", index=True)
    booking_date: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    scheduled_date: datetime | None = None
    priority: str = Field(default="normal")  # low / normal / high / emergency
    amount: float | None = None
    # Link back to the specialised booking row that owns the domain fields.
    source_type: str | None = None  # e.g. "doctor_appointment", "lab_booking"
    source_id: int | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class ClinicalNote(SQLModel, table=True):
    """A clinical record a vendor (doctor/dentist/physio/...) attaches to a
    patient encounter: diagnosis (disease details), a free-text remark, and an
    optional prescription file (stored as a base64 data-URL or external URL,
    matching the existing prescription_image convention)."""

    __tablename__ = "clinical_notes"

    id: int | None = Field(default=None, primary_key=True)
    vendor_role: str = Field(index=True)  # doctor / dentist / physiotherapist / ...
    provider_id: int | None = Field(default=None, index=True)  # doctor/dentist id
    patient_user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    patient_name: str = Field(index=True)
    # Links back to the appointment/booking this note is about.
    source_type: str | None = None  # e.g. "doctor_appointment"
    source_id: int | None = None
    diagnosis: str | None = None  # disease details
    remark: str | None = None  # doctor's remark / advice
    prescription_file: str | None = None  # base64 data-URL or URL
    prescription_filename: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class VendorReport(SQLModel, table=True):
    """A report/document a vendor issues for a patient (lab result, scan,
    discharge summary...). File stored as base64 data-URL or URL."""

    __tablename__ = "vendor_reports"

    id: int | None = Field(default=None, primary_key=True)
    vendor_role: str = Field(index=True)
    provider_id: int | None = Field(default=None, index=True)
    patient_user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    patient_name: str = Field(index=True)
    source_type: str | None = None
    source_id: int | None = None
    title: str
    report_type: str = Field(default="General")  # Lab / Radiology / Prescription / General
    file: str | None = None  # base64 data-URL or URL
    filename: str | None = None
    status: str = Field(default="final")  # draft / final
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class VendorBill(SQLModel, table=True):
    """A simple bill/invoice a vendor raises for a patient. `items` is a
    JSON-encoded list of {description, quantity, price}."""

    __tablename__ = "vendor_bills"

    id: int | None = Field(default=None, primary_key=True)
    vendor_role: str = Field(index=True)
    provider_id: int | None = Field(default=None, index=True)
    patient_user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    patient_name: str = Field(index=True)
    source_type: str | None = None
    source_id: int | None = None
    items: str = Field(default="[]")  # JSON list of {description, quantity, price}
    subtotal: float = Field(default=0.0)
    tax: float = Field(default=0.0)
    discount: float = Field(default=0.0)
    total: float = Field(default=0.0)
    status: str = Field(default="unpaid")  # unpaid / paid / cancelled
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Admission(SQLModel, table=True):
    """An inpatient admission: a patient hospitalised (overnight) under a
    vendor/provider. Holds ward/bed, diagnosis, admission & discharge dates,
    and a JSON list of test entries ({name, result, date, notes}). Outpatients
    are just bookings; this record only exists for admitted patients."""

    __tablename__ = "admissions"

    id: int | None = Field(default=None, primary_key=True)
    vendor_role: str = Field(index=True)
    provider_id: int | None = Field(default=None, index=True)
    patient_user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    patient_name: str = Field(index=True)
    source_type: str | None = None
    source_id: int | None = None
    age: int | None = None
    gender: str | None = None
    contact: str | None = None
    ward: str | None = None
    bed_number: str | None = None
    diagnosis: str | None = None
    attending_doctor: str | None = None
    notes: str | None = None
    # JSON list of {name, result, date, notes}
    tests: str = Field(default="[]")
    admission_date: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    discharge_date: datetime | None = None
    status: str = Field(default="admitted")  # admitted / discharged
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
    # Vendor's own brand logo, stored as a base64 data-URL or URL. Shown in the
    # vendor dashboard header. Null for most accounts.
    logo: str | None = Field(default=None)
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
    """One vehicle in an operator's fleet.

    An ambulance vendor account (users.role == "ambulance") runs a fleet: every
    vehicle it operates points back at that account via `operator_id`, and the
    vendor sees the trips booked on any of them. `users.vendor_id` still names
    the vehicle created at signup, which is the one an admin's approval
    activates. Rows with a null `operator_id` are platform-owned vehicles that
    predate fleets.
    """

    __tablename__ = "ambulances"

    id: int | None = Field(default=None, primary_key=True)
    # The vendor account that runs this vehicle. Null for platform-owned ones.
    operator_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    name: str = Field(index=True)
    description: str
    features: str  # JSON string of array: ["Oxygen supply", "First aid kit"]
    estimated_time: str  # e.g., "10-15 mins"
    base_price: int  # in rupees
    image: str  # emoji or image URL
    ambulance_type: str = Field(index=True)  # BLS, ALS, Neonatal, Air
    # Registration plate and the crew on this vehicle, shown to the operator in
    # their fleet view and to dispatch once a trip is assigned.
    vehicle_number: str | None = Field(default=None)
    driver_name: str | None = Field(default=None)
    driver_phone: str | None = Field(default=None)
    # Operational state the operator controls, distinct from `is_active` (which
    # is the admin's listed/unlisted switch): available / on_trip / off_duty.
    # Only "available" vehicles are offered to customers.
    availability: str = Field(default="available", index=True)
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


class PharmacyStore(SQLModel, table=True):
    """A physical pharmacy/chemist shop the user can order medicines from.

    Every Medicine row belongs to exactly one store, so each store keeps its
    own price and stock for the products it sells. A customer picks a store,
    browses that store's shelf, and may fill a cart from several stores at
    once - checkout then splits the cart into one MedicineOrder per store.
    """

    __tablename__ = "pharmacy_stores"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    address: str
    city: str | None = Field(default=None, index=True)
    phone: str | None = None
    # Emoji or image URL / base64 data-URL used as the store's avatar.
    image: str = Field(default="🏥")
    rating: float = Field(default=0.0)
    # Human-readable delivery estimate shown on the store card, e.g. "30-45 mins".
    delivery_time: str = Field(default="30-45 mins")
    opening_hours: str | None = None  # e.g. "8:00 AM - 10:00 PM"
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class Medicine(SQLModel, table=True):
    __tablename__ = "medicines"

    id: int | None = Field(default=None, primary_key=True)
    # The store that stocks this product. Each store keeps its own row for a
    # product so price/stock are per-store. Null only for legacy rows created
    # before stores existed.
    store_id: int | None = Field(default=None, foreign_key="pharmacy_stores.id", index=True)
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
    # Point-of-sale fields used by the pharmacy vendor workspace.
    barcode: str | None = Field(default=None, index=True)
    # Reorder level: stock at or below this is flagged as low.
    min_stock: int = Field(default=10)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class MedicineOrder(SQLModel, table=True):
    __tablename__ = "medicine_orders"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    # The store fulfilling this order. A cart spanning several stores is split
    # into one order per store at checkout.
    store_id: int | None = Field(default=None, foreign_key="pharmacy_stores.id", index=True)
    store_name: str | None = None  # denormalised for cheap listing
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



# ── Pharmacy point-of-sale (walk-in counter, purchases, batches) ───────────
# These belong to one PharmacyStore and are managed from the pharmacy vendor's
# web workspace. Online app orders stay in MedicineOrder; these cover the
# store's own counter business.


class PharmacyCustomer(SQLModel, table=True):
    """A walk-in customer a pharmacy keeps on file (for credit sales, history)."""

    __tablename__ = "pharmacy_customers"

    id: int | None = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="pharmacy_stores.id", index=True)
    name: str = Field(index=True)
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class PharmacyPurchase(SQLModel, table=True):
    """Stock bought from a supplier. Each line creates a StockBatch.
    `items` is a JSON list of {medicine_id, medicine_name, batch_no,
    expiry_date, quantity, purchase_price, sale_price}."""

    __tablename__ = "pharmacy_purchases"

    id: int | None = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="pharmacy_stores.id", index=True)
    supplier_name: str
    invoice_no: str | None = None
    purchase_date: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc), index=True)
    items: str = Field(default="[]")
    total_amount: float = Field(default=0.0)
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class StockBatch(SQLModel, table=True):
    """One batch (lot) of a medicine with its own expiry and remaining qty.
    Sales draw down batches earliest-expiry first."""

    __tablename__ = "pharmacy_stock_batches"

    id: int | None = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="pharmacy_stores.id", index=True)
    medicine_id: int = Field(foreign_key="medicines.id", index=True)
    purchase_id: int | None = Field(default=None, foreign_key="pharmacy_purchases.id", index=True)
    batch_no: str
    expiry_date: datetime | None = Field(default=None, index=True)
    quantity: int = Field(default=0)  # units remaining
    purchase_price: float = Field(default=0.0)  # cost per unit
    sale_price: float = Field(default=0.0)  # MRP per unit
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class PharmacySale(SQLModel, table=True):
    """A counter sale with its receipt. `items` is a JSON list of
    {medicine_id, medicine_name, quantity, price, amount}."""

    __tablename__ = "pharmacy_sales"

    id: int | None = Field(default=None, primary_key=True)
    store_id: int = Field(foreign_key="pharmacy_stores.id", index=True)
    receipt_no: str = Field(index=True)
    customer_id: int | None = Field(default=None, foreign_key="pharmacy_customers.id", index=True)
    customer_name: str = Field(default="Walk-in")
    sale_type: str = Field(default="cash")  # cash / credit
    items: str = Field(default="[]")
    subtotal: float = Field(default=0.0)
    discount: float = Field(default=0.0)
    total: float = Field(default=0.0)
    paid_amount: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc), index=True)
