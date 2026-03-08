"""Seed script to populate doctors in the database."""
import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, create_engine

from app.db import DATABASE_URL
from app.models import Doctor, SQLModel

# Doctor data from mobile app
DOCTORS_DATA = [
    {
        "name": "Dr. Sarah Johnson",
        "specialty": "Cardiologist",
        "qualification": "MD, DM (Cardiology)",
        "experience": 15,
        "rating": 4.8,
        "consultation_fee": 1500,
        "available_days": ["Monday", "Wednesday", "Friday"],
        "available_slots": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"],
        "image": "👩‍⚕️",
        "address": "Apollo Hospital, Sector 26, Delhi"
    },
    {
        "name": "Dr. Rahul Sharma",
        "specialty": "Dentist",
        "qualification": "BDS, MDS (Orthodontics)",
        "experience": 10,
        "rating": 4.6,
        "consultation_fee": 800,
        "available_days": ["Tuesday", "Thursday", "Saturday"],
        "available_slots": ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
        "image": "👨‍⚕️",
        "address": "Smile Dental Clinic, Connaught Place, Delhi"
    },
    {
        "name": "Dr. Priya Patel",
        "specialty": "Pediatrician",
        "qualification": "MBBS, MD (Pediatrics)",
        "experience": 12,
        "rating": 4.9,
        "consultation_fee": 1000,
        "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "available_slots": ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM", "03:30 PM", "05:00 PM"],
        "image": "👩‍⚕️",
        "address": "MaxHealthcare, Saket, Delhi"
    },
    {
        "name": "Dr. Amit Kumar",
        "specialty": "General Physician",
        "qualification": "MBBS, MD (Medicine)",
        "experience": 20,
        "rating": 4.7,
        "consultation_fee": 700,
        "available_days": ["Monday", "Wednesday", "Thursday", "Saturday"],
        "available_slots": ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "04:00 PM", "05:00 PM"],
        "image": "👨‍⚕️",
        "address": "Fortis Hospital, Vasant Kunj, Delhi"
    },
    {
        "name": "Dr. Neha Gupta",
        "specialty": "Dermatologist",
        "qualification": "MBBS, MD (Dermatology)",
        "experience": 8,
        "rating": 4.5,
        "consultation_fee": 1200,
        "available_days": ["Tuesday", "Thursday", "Friday", "Saturday"],
        "available_slots": ["10:00 AM", "11:30 AM", "01:00 PM", "03:00 PM", "04:30 PM"],
        "image": "👩‍⚕️",
        "address": "SkinCare Clinic, Lajpat Nagar, Delhi"
    }
]


def seed_doctors():
    """Seed the database with doctor data."""
    engine = create_engine(DATABASE_URL, echo=True)
    
    # Create tables if they don't exist
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Check if doctors already exist
        existing_doctors = session.query(Doctor).count()
        
        if existing_doctors > 0:
            print(f"⚠️  Database already has {existing_doctors} doctor(s).")
            response = input("Do you want to add more doctors? (y/n): ")
            if response.lower() != 'y':
                print("❌ Seeding cancelled.")
                return
        
        # Add doctors
        print("\n🌱 Seeding doctors...")
        for doctor_data in DOCTORS_DATA:
            doctor = Doctor(
                name=doctor_data["name"],
                specialty=doctor_data["specialty"],
                qualification=doctor_data["qualification"],
                experience=doctor_data["experience"],
                rating=doctor_data["rating"],
                consultation_fee=doctor_data["consultation_fee"],
                available_days=json.dumps(doctor_data["available_days"]),
                available_slots=json.dumps(doctor_data["available_slots"]),
                image=doctor_data["image"],
                address=doctor_data["address"],
                is_active=True
            )
            session.add(doctor)
            print(f"  ✅ Added: {doctor.name} ({doctor.specialty})")
        
        session.commit()
        
        print(f"\n✨ Successfully seeded {len(DOCTORS_DATA)} doctors!")


if __name__ == "__main__":
    seed_doctors()
