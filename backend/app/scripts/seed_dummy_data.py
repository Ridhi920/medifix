"""
Fill every table with realistic dummy data for demos and testing.

Usage (from backend/):
    DATABASE_URL=postgresql://... python -m app.scripts.seed_dummy_data

Idempotent: skips if the demo admin (admin@medefix.demo) already exists.
Every demo account uses the password "Demo@123".
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.core.auth import get_password_hash
from app.core.db import engine, init_db
from app.models import (
    Admission, Ambulance, AmbulanceBooking, AppSettings, Appointment, ClinicalNote,
    Dentist, DentistAppointment, DigitalLogEntry, Doctor, HomeFeature, LabBooking,
    LabTest, Medicine, MedicineOrder, Nurse, NurseBooking, PharmacyCustomer,
    PharmacyPurchase, PharmacySale, PharmacyStore, Physiotherapist,
    PhysiotherapistBooking, PrescriptionSubmission, ServiceRequest, StockBatch,
    Testimonial, User, VendorBill, VendorReport,
)

PASSWORD = "Demo@123"
NOW = datetime.now(tz=timezone.utc)
# 1x1 transparent PNG, stands in for uploaded files.
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
PDF = "data:application/pdf;base64,JVBERi0xLjQKJSBkZW1vIHJlcG9ydAolJUVPRgo="


def j(value) -> str:
    return json.dumps(value)


def days(n: int) -> datetime:
    return NOW + timedelta(days=n)


def add_all(session: Session, rows: list) -> list:
    session.add_all(rows)
    session.flush()
    return rows


def seed(session: Session) -> None:
    pw = get_password_hash(PASSWORD)

    # ── Platform content ──────────────────────────────────────────────────
    add_all(session, [AppSettings(
        convenience_fee=7.0, delivery_fee=20.0, free_delivery_threshold=400.0,
        unavailable_services=j(["physiotherapist"]),
        service_return_dates=j({"physiotherapist": days(14).date().isoformat()}),
    )])
    add_all(session, [
        Testimonial(name="Priya Sharma", role="Mumbai", avatar="👩", quote="Booked a home lab test in two minutes. Reports came the same evening!", accent="#FF6B35", bg="#ffedd5", display_order=1),
        Testimonial(name="Rahul Verma", role="Delhi", avatar="👨", quote="The ambulance reached us in 12 minutes. Truly a lifesaver.", accent="#2563eb", bg="#dbeafe", display_order=2),
        Testimonial(name="Anjali Nair", role="Bengaluru", avatar="👩‍🦱", quote="Medicines delivered home with the prescription verified. Super smooth.", accent="#16a34a", bg="#dcfce7", display_order=3),
        Testimonial(name="Vikram Singh", role="Jaipur", avatar="🧔", quote="Found a great physiotherapist for my father's knee recovery.", accent="#9333ea", bg="#f3e8ff", display_order=4, is_active=False),
    ])
    add_all(session, [
        HomeFeature(icon="⚡", title="Fast Booking", subtitle="Book doctors, labs and more in under a minute", bg="#ecfdf5", icon_bg="#bbf7d0", display_order=1),
        HomeFeature(icon="🩺", title="Verified Experts", subtitle="Every provider is verified by our team", bg="#eff6ff", icon_bg="#bfdbfe", display_order=2),
        HomeFeature(icon="🏠", title="Care at Home", subtitle="Nurses, physios and sample collection at your door", bg="#fff7ed", icon_bg="#fed7aa", display_order=3),
        HomeFeature(icon="🔒", title="Secure Records", subtitle="ABDM-ready health records you control", bg="#faf5ff", icon_bg="#e9d5ff", display_order=4),
    ])

    # ── Providers ─────────────────────────────────────────────────────────
    doctors = add_all(session, [
        Doctor(name="Dr. Arjun Mehta", specialty="Cardiologist", qualification="MBBS, MD, DM (Cardiology)", experience=15, rating=4.8, consultation_fee=800, available_days=j(["Monday", "Wednesday", "Friday"]), available_slots=j(["09:00 AM", "10:00 AM", "11:00 AM", "05:00 PM"]), image="👨‍⚕️", address="Apollo Clinic, Andheri West, Mumbai", latitude=19.1364, longitude=72.8296),
        Doctor(name="Dr. Sneha Kapoor", specialty="Dermatologist", qualification="MBBS, MD (Dermatology)", experience=9, rating=4.6, consultation_fee=600, available_days=j(["Tuesday", "Thursday", "Saturday"]), available_slots=j(["10:00 AM", "12:00 PM", "04:00 PM"]), image="👩‍⚕️", address="SkinCare Centre, Bandra, Mumbai", latitude=19.0596, longitude=72.8295),
        Doctor(name="Dr. Rakesh Iyer", specialty="General Physician", qualification="MBBS", experience=20, rating=4.7, consultation_fee=400, available_days=j(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]), available_slots=j(["08:00 AM", "09:00 AM", "06:00 PM", "07:00 PM"]), image="🧑‍⚕️", address="City Health Clinic, Powai, Mumbai", latitude=19.1176, longitude=72.9060),
        Doctor(name="Dr. Meera Joshi", specialty="Pediatrician", qualification="MBBS, DCH", experience=12, rating=4.9, consultation_fee=700, available_days=j(["Monday", "Thursday", "Saturday"]), available_slots=j(["11:00 AM", "03:00 PM"]), image="👩‍⚕️", address="Little Steps Hospital, Thane", latitude=19.2183, longitude=72.9781),
    ])
    dentists = add_all(session, [
        Dentist(name="Dr. Kavita Rao", specialty="Orthodontist", qualification="BDS, MDS (Orthodontics)", experience=11, rating=4.7, consultation_fee=500, available_days=j(["Monday", "Wednesday", "Saturday"]), available_slots=j(["10:00 AM", "11:30 AM", "05:00 PM"]), image="🦷", address="Smile Studio, Juhu, Mumbai", latitude=19.1075, longitude=72.8263),
        Dentist(name="Dr. Sameer Khan", specialty="Endodontist", qualification="BDS, MDS (Endodontics)", experience=8, rating=4.5, consultation_fee=450, available_days=j(["Tuesday", "Friday"]), available_slots=j(["09:00 AM", "02:00 PM"]), image="🦷", address="RootCare Dental, Malad, Mumbai", latitude=19.1874, longitude=72.8484),
        Dentist(name="Dr. Pooja Desai", specialty="General Dentist", qualification="BDS", experience=5, rating=4.4, consultation_fee=300, available_days=j(["Monday", "Tuesday", "Thursday"]), available_slots=j(["11:00 AM", "04:00 PM", "06:00 PM"]), image="🦷", address="Bright Teeth Clinic, Vashi, Navi Mumbai", latitude=19.0771, longitude=72.9986),
    ])
    lab_tests = add_all(session, [
        LabTest(name="Complete Blood Count (CBC)", description="Measures red cells, white cells and platelets.", parameters=j(["Hemoglobin", "RBC Count", "WBC Count", "Platelets"]), price=350, report_time="6 hours", category="Blood Test", popular=True),
        LabTest(name="Lipid Profile", description="Cholesterol and triglyceride levels for heart health.", parameters=j(["Total Cholesterol", "HDL", "LDL", "Triglycerides"]), price=600, report_time="12 hours", fasting_required=True, category="Blood Test", popular=True),
        LabTest(name="Thyroid Profile (T3, T4, TSH)", description="Checks thyroid gland function.", parameters=j(["T3", "T4", "TSH"]), price=550, report_time="24 hours", category="Hormone Test", popular=True),
        LabTest(name="HbA1c", description="Average blood sugar over the last 3 months.", parameters=j(["HbA1c", "Estimated Average Glucose"]), price=450, report_time="12 hours", category="Diabetes"),
        LabTest(name="Urine Routine", description="Physical, chemical and microscopic urine exam.", parameters=j(["Colour", "pH", "Protein", "Glucose", "Pus Cells"]), price=200, report_time="6 hours", category="Urine Test"),
    ])
    nurses = add_all(session, [
        Nurse(name="Sister Mary Thomas", qualification="BSc Nursing", specialization="ICU", experience=10, rating=4.8, services=j(["Ventilator care", "IV administration", "Vitals monitoring"]), hourly_rate=400, daily_rate=3500, available_shifts=j(["Day", "Night", "24-hour"]), languages=j(["English", "Hindi", "Malayalam"]), image="👩‍⚕️", gender="Female", latitude=19.0760, longitude=72.8777),
        Nurse(name="Ravi Kumar", qualification="GNM", specialization="Geriatric", experience=6, rating=4.5, services=j(["Elderly care", "Medication management", "Mobility assistance"]), hourly_rate=300, daily_rate=2500, available_shifts=j(["Day", "Night"]), languages=j(["English", "Hindi", "Marathi"]), image="🧑‍⚕️", gender="Male", latitude=19.0330, longitude=73.0297),
        Nurse(name="Sunita Patil", qualification="ANM", specialization="Pediatric", experience=4, rating=4.6, services=j(["Newborn care", "Vaccination support", "Feeding assistance"]), hourly_rate=250, daily_rate=2000, available_shifts=j(["Day"]), languages=j(["Hindi", "Marathi"]), image="👩‍⚕️", gender="Female", latitude=19.2183, longitude=72.9781),
    ])
    physios = add_all(session, [
        Physiotherapist(name="Dr. Aman Gupta", qualification="MPT (Sports)", specialization="Sports", experience=8, rating=4.7, services=j(["Sports injury rehab", "Manual therapy", "Kinesio taping"]), hourly_rate=700, daily_rate=1200, available_shifts=j(["Morning", "Evening"]), languages=j(["English", "Hindi"]), image="🏃", gender="Male", latitude=19.1136, longitude=72.8697),
        Physiotherapist(name="Dr. Neha Bhatt", qualification="MPT (Neuro)", specialization="Neurological", experience=10, rating=4.8, services=j(["Stroke rehab", "Balance training", "Electrotherapy"]), hourly_rate=800, daily_rate=1400, available_shifts=j(["Morning", "Afternoon"]), languages=j(["English", "Hindi", "Gujarati"]), image="🧘", gender="Female", latitude=19.0544, longitude=72.8402),
        Physiotherapist(name="Dr. Imran Sheikh", qualification="BPT", specialization="Orthopedic", experience=5, rating=4.4, services=j(["Post-surgery rehab", "Back pain therapy", "Exercise therapy"]), hourly_rate=500, daily_rate=900, available_shifts=j(["Afternoon", "Evening"]), languages=j(["English", "Hindi", "Urdu"]), image="💪", gender="Male", latitude=19.1726, longitude=72.9425),
    ])
    stores = add_all(session, [
        PharmacyStore(name="MedPlus Pharmacy", address="Shop 4, Hiranandani Gardens, Powai", city="Mumbai", phone="+91 98200 11111", image="🏥", rating=4.6, delivery_time="30-45 mins", opening_hours="8:00 AM - 11:00 PM", latitude=19.1197, longitude=72.9081),
        PharmacyStore(name="Wellness Forever", address="12 Linking Road, Bandra West", city="Mumbai", phone="+91 98200 22222", image="💊", rating=4.4, delivery_time="20-30 mins", opening_hours="24 hours", latitude=19.0607, longitude=72.8362),
    ])

    # ── Accounts ──────────────────────────────────────────────────────────
    def user(email, name, phone, role="user", vendor_id=None, status="approved", logo=None):
        return User(email=email, full_name=name, phone=phone, hashed_password=pw, role=role, vendor_id=vendor_id, approval_status=status, logo=logo)

    admin, p1, p2, p3 = add_all(session, [
        user("admin@medefix.demo", "MedEfix Admin", "+91 90000 00001", role="admin"),
        user("priya@medefix.demo", "Priya Sharma", "+91 90000 00002"),
        user("rahul@medefix.demo", "Rahul Verma", "+91 90000 00003"),
        user("anjali@medefix.demo", "Anjali Nair", "+91 90000 00004"),
    ])
    v_doc, v_dent, v_lab, v_amb, v_nurse, v_physio, v_pharm, _v_pending = add_all(session, [
        user("doctor@medefix.demo", doctors[0].name, "+91 90000 00010", "doctor", doctors[0].id, logo=PNG),
        user("dentist@medefix.demo", dentists[0].name, "+91 90000 00011", "dentist", dentists[0].id),
        user("lab@medefix.demo", "PathCare Labs", "+91 90000 00012", "lab"),
        user("ambulance@medefix.demo", "LifeLine Ambulance Services", "+91 90000 00013", "ambulance"),
        user("nurse@medefix.demo", nurses[0].name, "+91 90000 00014", "nurse", nurses[0].id),
        user("physio@medefix.demo", physios[0].name, "+91 90000 00015", "physiotherapist", physios[0].id),
        user("pharmacy@medefix.demo", "MedPlus Pharmacy", "+91 90000 00016", "pharmacy", stores[0].id, logo=PNG),
        user("pending@medefix.demo", physios[2].name, "+91 90000 00017", "physiotherapist", physios[2].id, status="pending"),
    ])

    ambulances = add_all(session, [
        Ambulance(operator_id=v_amb.id, name="LifeLine BLS 1", description="Basic life support for non-critical transfers.", features=j(["Oxygen supply", "First aid kit", "Stretcher"]), estimated_time="10-15 mins", base_price=1500, image="🚑", ambulance_type="BLS", vehicle_number="MH 02 AB 1234", driver_name="Suresh Yadav", driver_phone="+91 98111 00001", availability="available", latitude=19.0760, longitude=72.8777),
        Ambulance(operator_id=v_amb.id, name="LifeLine ALS 1", description="Advanced life support with paramedic and cardiac monitor.", features=j(["Ventilator", "Defibrillator", "Cardiac monitor", "Paramedic"]), estimated_time="15-20 mins", base_price=3500, image="🚑", ambulance_type="ALS", vehicle_number="MH 02 CD 5678", driver_name="Mahesh Pawar", driver_phone="+91 98111 00002", availability="on_trip", latitude=19.1136, longitude=72.8697),
        Ambulance(name="MedEfix Neonatal", description="Neonatal transport with incubator.", features=j(["Incubator", "Neonatal ventilator", "Pediatric nurse"]), estimated_time="20-30 mins", base_price=5000, image="👶", ambulance_type="Neonatal", vehicle_number="MH 04 EF 9012", driver_name="Ajay Shinde", driver_phone="+91 98111 00003", availability="off_duty", latitude=19.2183, longitude=72.9781),
    ])
    v_amb.vendor_id = ambulances[0].id

    medicines = add_all(session, [
        Medicine(store_id=s.id, name=n, generic_name=g, manufacturer=m, category=c, price=p, stock=st, requires_prescription=rx, description=d, dosage_form=f, strength=sr, image="💊", barcode=f"89012345{s.id}{i:04d}", min_stock=10)
        for s in stores
        for i, (n, g, m, c, p, st, rx, d, f, sr) in enumerate([
            ("Dolo 650", "Paracetamol", "Micro Labs", "Pain Relief", 32, 120, False, "Fever and mild pain relief.", "Tablet", "650mg"),
            ("Azithral 500", "Azithromycin", "Alembic", "Antibiotics", 120, 8, True, "Antibiotic for bacterial infections.", "Tablet", "500mg"),
            ("Becosules", "Vitamin B Complex", "Pfizer", "Vitamins", 45, 200, False, "Vitamin B complex with vitamin C.", "Capsule", "Multi"),
            ("Benadryl Cough Syrup", "Diphenhydramine", "Johnson & Johnson", "Cough & Cold", 110, 40, False, "Relief from cough and cold.", "Syrup", "100ml"),
            ("Band-Aid Pack", "Adhesive bandage", "Johnson & Johnson", "First Aid", 60, 5, False, "Assorted adhesive bandages.", "Strip", "20 pcs"),
        ])
    ])

    # ── Bookings ──────────────────────────────────────────────────────────
    appts = add_all(session, [
        Appointment(user_id=p1.id, doctor_id=doctors[0].id, patient_name=p1.full_name, patient_age=34, symptoms="Chest discomfort after exercise", appointment_day="Monday", appointment_slot="10:00 AM", appointment_date=days(3), consultation_fee=800, status="scheduled"),
        Appointment(user_id=p2.id, doctor_id=doctors[0].id, patient_name=p2.full_name, patient_age=52, symptoms="Follow-up for high BP", appointment_day="Wednesday", appointment_slot="05:00 PM", appointment_date=days(-5), consultation_fee=800, status="completed"),
        Appointment(user_id=p3.id, doctor_id=doctors[1].id, patient_name=p3.full_name, patient_age=28, symptoms="Skin rash on arms", appointment_day="Tuesday", appointment_slot="12:00 PM", appointment_date=days(-2), consultation_fee=600, status="cancelled"),
    ])
    dent_appts = add_all(session, [
        DentistAppointment(user_id=p1.id, dentist_id=dentists[0].id, patient_name=p1.full_name, patient_age=34, symptoms="Braces consultation", appointment_day="Saturday", appointment_slot="11:30 AM", appointment_date=days(5), consultation_fee=500, status="scheduled"),
        DentistAppointment(user_id=p3.id, dentist_id=dentists[0].id, patient_name=p3.full_name, patient_age=28, symptoms="Tooth sensitivity", appointment_day="Monday", appointment_slot="10:00 AM", appointment_date=days(-7), consultation_fee=500, status="completed"),
    ])
    lab_bookings = add_all(session, [
        LabBooking(user_id=p1.id, lab_test_id=lab_tests[0].id, patient_name=p1.full_name, patient_age=34, patient_phone=p1.phone, collection_date=days(1).date().isoformat(), collection_time="08:00 AM", home_collection=True, address="Flat 302, Lake View Apts, Powai, Mumbai", test_price=350, status="confirmed"),
        LabBooking(user_id=p2.id, lab_test_id=lab_tests[1].id, patient_name=p2.full_name, patient_age=52, patient_phone=p2.phone, collection_date=days(-3).date().isoformat(), collection_time="07:30 AM", home_collection=False, center_name="PathCare Labs, Andheri", test_price=600, status="completed"),
        LabBooking(user_id=p3.id, lab_test_id=lab_tests[2].id, patient_name=p3.full_name, patient_age=28, patient_phone=p3.phone, collection_date=days(2).date().isoformat(), collection_time="09:00 AM", home_collection=True, address="B-14, Sea Breeze CHS, Bandra, Mumbai", test_price=550, status="pending"),
    ])
    amb_bookings = add_all(session, [
        AmbulanceBooking(user_id=p2.id, ambulance_id=ambulances[1].id, patient_name="Sunil Verma", contact_number=p2.phone, pickup_address="Sector 5, Kharghar, Navi Mumbai", dropoff_address="Apollo Hospital, Belapur", medical_condition="Suspected cardiac arrest", booking_type="immediate", ambulance_price=3500, status="dispatched"),
        AmbulanceBooking(user_id=p1.id, ambulance_id=ambulances[0].id, patient_name="Kamla Sharma", contact_number=p1.phone, pickup_address="Lake View Apts, Powai", dropoff_address="Hiranandani Hospital, Powai", medical_condition="Scheduled dialysis transfer", booking_type="scheduled", scheduled_date=days(2).date().isoformat(), scheduled_time="07:00 AM", ambulance_price=1500, status="confirmed"),
    ])
    nurse_bookings = add_all(session, [
        NurseBooking(user_id=p2.id, nurse_id=nurses[0].id, patient_name="Sunil Verma", patient_age=78, patient_gender="Male", contact_number=p2.phone, address="Sector 5, Kharghar, Navi Mumbai", medical_condition="Post-ICU recovery", required_services=j(["Vitals monitoring", "IV administration"]), booking_type="daily", duration=7, shift_preference="24-hour", start_date=days(1).date().isoformat(), start_time="08:00 AM", total_price=24500, special_instructions="Diabetic; check sugar twice a day.", status="confirmed"),
        NurseBooking(user_id=p3.id, nurse_id=nurses[2].id, patient_name="Baby Nair", patient_age=0, patient_gender="Female", contact_number=p3.phone, address="B-14, Sea Breeze CHS, Bandra", medical_condition="Newborn care", required_services=j(["Newborn care", "Feeding assistance"]), booking_type="hourly", duration=6, shift_preference="Day", start_date=days(-1).date().isoformat(), start_time="10:00 AM", total_price=1500, special_instructions="First-time parents; please explain bathing routine.", status="completed"),
    ])
    physio_bookings = add_all(session, [
        PhysiotherapistBooking(user_id=p1.id, physiotherapist_id=physios[0].id, patient_name=p1.full_name, patient_age=34, patient_gender="Female", contact_number=p1.phone, address="Flat 302, Lake View Apts, Powai", medical_condition="ACL sprain from running", required_services=j(["Sports injury rehab", "Kinesio taping"]), booking_type="session", duration=6, shift_preference="Morning", start_date=days(1).date().isoformat(), start_time="07:00 AM", total_price=4200, special_instructions="Has a resistance band at home.", status="in_progress"),
        PhysiotherapistBooking(user_id=p2.id, physiotherapist_id=physios[1].id, patient_name="Sunil Verma", patient_age=78, patient_gender="Male", contact_number=p2.phone, address="Sector 5, Kharghar, Navi Mumbai", medical_condition="Stroke recovery, left side weakness", required_services=j(["Stroke rehab", "Balance training"]), booking_type="weekly", duration=2, shift_preference="Afternoon", start_date=days(4).date().isoformat(), start_time="03:00 PM", total_price=19600, status="pending"),
    ])
    orders = add_all(session, [
        MedicineOrder(user_id=p1.id, store_id=stores[0].id, store_name=stores[0].name, patient_name=p1.full_name, patient_phone=p1.phone, delivery_address="Flat 302, Lake View Apts, Powai, Mumbai", items=j([{"medicine_id": medicines[0].id, "medicine_name": medicines[0].name, "quantity": 2, "price": 32}, {"medicine_id": medicines[2].id, "medicine_name": medicines[2].name, "quantity": 1, "price": 45}]), total_amount=109, notes="Please ring the bell twice.", status="out_for_delivery"),
        MedicineOrder(user_id=p2.id, store_id=stores[0].id, store_name=stores[0].name, patient_name=p2.full_name, patient_phone=p2.phone, delivery_address="Sector 5, Kharghar, Navi Mumbai", items=j([{"medicine_id": medicines[1].id, "medicine_name": medicines[1].name, "quantity": 1, "price": 120}]), total_amount=120, prescription_image=PNG, notes="Prescription attached.", status="pending"),
        MedicineOrder(user_id=p3.id, store_id=stores[1].id, store_name=stores[1].name, patient_name=p3.full_name, patient_phone=p3.phone, delivery_address="B-14, Sea Breeze CHS, Bandra", items=j([{"medicine_id": medicines[8].id, "medicine_name": medicines[8].name, "quantity": 1, "price": 110}]), total_amount=110, status="delivered"),
    ])
    add_all(session, [
        PrescriptionSubmission(user_id=p2.id, image_data=PNG, status="pending"),
        PrescriptionSubmission(user_id=p1.id, image_data=PNG, status="reviewed", admin_notes="Verified. Azithral 500 approved for 3 days."),
    ])

    # ── Unified service-request spine ─────────────────────────────────────
    sr = lambda patient, service, rtype, status, amount, stype, sid, **kw: ServiceRequest(patient_id=patient.id, patient_name=patient.full_name, service=service, request_type=rtype, status=status, amount=amount, source_type=stype, source_id=sid, **kw)
    add_all(session, [
        sr(p1, "doctor", "Consultation", "scheduled", 800, "doctor_appointment", appts[0].id, provider_id=doctors[0].id, provider_name=doctors[0].name, scheduled_date=days(3), priority="high", notes="Chest discomfort"),
        sr(p2, "doctor", "Consultation", "completed", 800, "doctor_appointment", appts[1].id, provider_id=doctors[0].id, provider_name=doctors[0].name, scheduled_date=days(-5)),
        sr(p1, "dentist", "Consultation", "scheduled", 500, "dentist_appointment", dent_appts[0].id, provider_id=dentists[0].id, provider_name=dentists[0].name, scheduled_date=days(5)),
        sr(p1, "lab", "Home Collection", "confirmed", 350, "lab_booking", lab_bookings[0].id, provider_name="PathCare Labs", scheduled_date=days(1)),
        sr(p2, "lab", "Diagnostic", "completed", 600, "lab_booking", lab_bookings[1].id, provider_name="PathCare Labs", scheduled_date=days(-3)),
        sr(p2, "ambulance", "Transport", "in_progress", 3500, "ambulance_booking", amb_bookings[0].id, provider_id=ambulances[1].id, provider_name=ambulances[1].name, priority="emergency"),
        sr(p2, "nurse", "Home Care", "confirmed", 24500, "nurse_booking", nurse_bookings[0].id, provider_id=nurses[0].id, provider_name=nurses[0].name, scheduled_date=days(1)),
        sr(p1, "physiotherapist", "Home Care", "in_progress", 4200, "physiotherapist_booking", physio_bookings[0].id, provider_id=physios[0].id, provider_name=physios[0].name, scheduled_date=days(1), priority="low"),
        sr(p1, "pharmacy", "Medicine", "in_progress", 109, "medicine_order", orders[0].id, provider_id=stores[0].id, provider_name=stores[0].name),
        sr(p3, "pharmacy", "Medicine", "closed", 110, "medicine_order", orders[2].id, provider_id=stores[1].id, provider_name=stores[1].name),
    ])

    # ── Vendor workspace records ──────────────────────────────────────────
    add_all(session, [
        ClinicalNote(vendor_role="doctor", provider_id=doctors[0].id, patient_user_id=p2.id, patient_name=p2.full_name, source_type="doctor_appointment", source_id=appts[1].id, diagnosis="Stage 1 hypertension, well controlled", remark="Continue Telmisartan 40mg. Reduce salt. Review in 3 months.", prescription_file=PDF, prescription_filename="rx_rahul_verma.pdf"),
        ClinicalNote(vendor_role="dentist", provider_id=dentists[0].id, patient_user_id=p3.id, patient_name=p3.full_name, source_type="dentist_appointment", source_id=dent_appts[1].id, diagnosis="Dentin hypersensitivity, lower molars", remark="Use desensitising toothpaste. Avoid very cold drinks.", prescription_file=PNG, prescription_filename="rx_anjali_nair.png"),
    ])
    add_all(session, [
        VendorReport(vendor_role="lab", provider_id=v_lab.id, patient_user_id=p2.id, patient_name=p2.full_name, source_type="lab_booking", source_id=lab_bookings[1].id, title="Lipid Profile Report", report_type="Lab", file=PDF, filename="lipid_profile_rahul.pdf", status="final"),
        VendorReport(vendor_role="doctor", provider_id=doctors[0].id, patient_user_id=p2.id, patient_name=p2.full_name, source_type="doctor_appointment", source_id=appts[1].id, title="ECG Report", report_type="Radiology", file=PDF, filename="ecg_rahul.pdf", status="draft"),
    ])
    add_all(session, [
        VendorBill(vendor_role="doctor", provider_id=doctors[0].id, patient_user_id=p2.id, patient_name=p2.full_name, source_type="doctor_appointment", source_id=appts[1].id, items=j([{"description": "Consultation", "quantity": 1, "price": 800}, {"description": "ECG", "quantity": 1, "price": 300}]), subtotal=1100, tax=55, discount=100, total=1055, status="paid", notes="Paid via UPI"),
        VendorBill(vendor_role="lab", provider_id=v_lab.id, patient_user_id=p1.id, patient_name=p1.full_name, source_type="lab_booking", source_id=lab_bookings[0].id, items=j([{"description": "CBC", "quantity": 1, "price": 350}, {"description": "Home collection", "quantity": 1, "price": 50}]), subtotal=400, tax=20, discount=0, total=420, status="unpaid", notes="Collect at sample pickup"),
    ])
    add_all(session, [
        Admission(vendor_role="doctor", provider_id=doctors[0].id, patient_user_id=p2.id, patient_name="Sunil Verma", source_type="ambulance_booking", source_id=amb_bookings[0].id, age=78, gender="Male", contact=p2.phone, ward="Cardiac ICU", bed_number="CICU-04", diagnosis="Acute myocardial infarction", attending_doctor=doctors[0].name, notes="Angioplasty planned.", tests=j([{"name": "Troponin I", "result": "2.4 ng/mL (high)", "date": days(-1).date().isoformat(), "notes": "Repeat in 6h"}, {"name": "ECG", "result": "ST elevation V2-V4", "date": days(-1).date().isoformat(), "notes": ""}]), admission_date=days(-1), status="admitted"),
        Admission(vendor_role="doctor", provider_id=doctors[2].id, patient_user_id=p3.id, patient_name=p3.full_name, age=28, gender="Female", contact=p3.phone, ward="General Ward", bed_number="GW-12", diagnosis="Dengue fever", attending_doctor=doctors[2].name, notes="Platelets recovered; discharged stable.", tests=j([{"name": "Platelet count", "result": "1.6 lakh/µL", "date": days(-8).date().isoformat(), "notes": "Normal"}]), admission_date=days(-12), discharge_date=days(-8), status="discharged"),
    ])

    # ── Pharmacy point of sale (store 1) ──────────────────────────────────
    customers = add_all(session, [
        PharmacyCustomer(store_id=stores[0].id, name="Ramesh Gupta", phone="+91 98765 43210", email="ramesh@example.com", address="Powai, Mumbai"),
        PharmacyCustomer(store_id=stores[0].id, name="Fatima Shaikh", phone="+91 98765 43211", email="fatima@example.com", address="Chandivali, Mumbai"),
    ])
    lines = [(medicines[0], "DL2401", 365, 200, 22.0, 32.0), (medicines[1], "AZ2402", 20, 30, 85.0, 120.0), (medicines[2], "BC2403", 540, 150, 30.0, 45.0)]
    purchase = add_all(session, [PharmacyPurchase(
        store_id=stores[0].id, supplier_name="Mahavir Pharma Distributors", invoice_no="MPD/2026/0412", purchase_date=days(-10),
        items=j([{"medicine_id": m.id, "medicine_name": m.name, "batch_no": b, "expiry_date": days(e).date().isoformat(), "quantity": q, "purchase_price": pp, "sale_price": sp} for m, b, e, q, pp, sp in lines]),
        total_amount=sum(q * pp for _, _, _, q, pp, _ in lines), notes="30-day credit",
    )])[0]
    add_all(session, [
        StockBatch(store_id=stores[0].id, medicine_id=m.id, purchase_id=purchase.id, batch_no=b, expiry_date=days(e), quantity=q // 2, purchase_price=pp, sale_price=sp)
        for m, b, e, q, pp, sp in lines
    ])
    add_all(session, [
        PharmacySale(store_id=stores[0].id, receipt_no="RCPT-0001", customer_id=customers[0].id, customer_name=customers[0].name, sale_type="cash", items=j([{"medicine_id": medicines[0].id, "medicine_name": medicines[0].name, "quantity": 3, "price": 32, "amount": 96}]), subtotal=96, discount=6, total=90, paid_amount=90),
        PharmacySale(store_id=stores[0].id, receipt_no="RCPT-0002", customer_id=customers[1].id, customer_name=customers[1].name, sale_type="credit", items=j([{"medicine_id": medicines[1].id, "medicine_name": medicines[1].name, "quantity": 1, "price": 120, "amount": 120}, {"medicine_id": medicines[2].id, "medicine_name": medicines[2].name, "quantity": 2, "price": 45, "amount": 90}]), subtotal=210, discount=0, total=210, paid_amount=100),
        PharmacySale(store_id=stores[0].id, receipt_no="RCPT-0003", customer_name="Walk-in", sale_type="cash", items=j([{"medicine_id": medicines[4].id, "medicine_name": medicines[4].name, "quantity": 1, "price": 60, "amount": 60}]), subtotal=60, discount=0, total=60, paid_amount=60),
    ])

    # ── Activity timeline ─────────────────────────────────────────────────
    add_all(session, [
        DigitalLogEntry(actor=p1.full_name, actor_user_id=p1.id, action="Patient Registered", module="Registration", entity_type="Patient", entity_id=p1.id, patient_id=p1.id, meta=j({"channel": "mobile"})),
        DigitalLogEntry(actor=p1.full_name, actor_user_id=p1.id, action="Appointment Booked", module="Appointments", entity_type="Appointment", entity_id=appts[0].id, provider_id=doctors[0].id, patient_id=p1.id, meta=j({"slot": "10:00 AM"})),
        DigitalLogEntry(actor="PathCare Labs", actor_user_id=v_lab.id, action="Report Uploaded", module="Reports", entity_type="Report", entity_id=lab_bookings[1].id, provider_id=v_lab.id, patient_id=p2.id, meta=j({"test": "Lipid Profile"})),
        DigitalLogEntry(actor=stores[0].name, actor_user_id=v_pharm.id, action="Order Dispatched", module="Pharmacy", entity_type="Order", entity_id=orders[0].id, provider_id=stores[0].id, patient_id=p1.id, meta=j({"eta": "20 mins"})),
        DigitalLogEntry(actor="LifeLine Ambulance Services", actor_user_id=v_amb.id, action="Ambulance Dispatched", module="Ambulance", entity_type="Booking", entity_id=amb_bookings[0].id, provider_id=ambulances[1].id, patient_id=p2.id, meta=j({"vehicle": "MH 02 CD 5678"})),
        DigitalLogEntry(actor="System", action="ABHA Linked", module="ABDM", entity_type="Patient", entity_id=p2.id, patient_id=p2.id, meta=j({"abha": "91-1234-5678-9012"})),
    ])


def main() -> None:
    engine.echo = False
    init_db()
    with Session(engine) as session:
        if session.exec(select(User).where(User.email == "admin@medefix.demo")).first():
            print("Demo data already present; skipping.")
            return
        seed(session)
        session.commit()
    print(f"Seeded demo data. All demo accounts use password {PASSWORD!r}.")


if __name__ == "__main__":
    main()
