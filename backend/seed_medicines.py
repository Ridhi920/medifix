#!/usr/bin/env python3
"""
Seed the pharmacy catalogue with the same medicines the mobile app ships with
(mobile/src/data/medicines.ts), so the admin portal lists them too.

Safe to re-run: a medicine is inserted only if no medicine with the same name
already exists. Uses the app's own engine, so it targets the exact database the
API serves from.

Run:  python seed_medicines.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from sqlmodel import Session, select

from app.db import engine, init_db
from app.models import Medicine

# name, generic_name, manufacturer, category, dosage_form, price, stock,
# requires_prescription, description
MEDICINES = [
    # Pain Relief
    ("Crocin 500mg", "Paracetamol", "GSK Pharma", "Pain Relief", "Tablet", 28, 200, False,
     "Relieves mild to moderate pain and reduces fever. Commonly used for headache, toothache and cold."),
    ("Brufen 400mg", "Ibuprofen", "Abbott India", "Pain Relief", "Tablet", 45, 150, False,
     "Anti-inflammatory painkiller for headaches, dental pain, menstrual cramps and arthritis."),
    ("Voveran 50mg", "Diclofenac", "Novartis India", "Pain Relief", "Tablet", 48, 120, True,
     "NSAID used for pain and inflammation in conditions like arthritis and muscle injuries."),
    ("Ecosprin 75mg", "Aspirin", "USV Pharma", "Pain Relief", "Tablet", 24, 180, False,
     "Low-dose aspirin for pain relief and used as a blood thinner in cardiac conditions."),
    ("Combiflam", "Ibuprofen + Paracetamol", "Sanofi India", "Pain Relief", "Tablet", 50, 90, False,
     "Combination tablet providing faster pain relief for fever, body ache and headache."),
    # Antibiotics
    ("Mox 500", "Amoxicillin", "Ranbaxy", "Antibiotics", "Capsule", 98, 80, True,
     "Broad-spectrum antibiotic for bacterial infections of the ear, throat, urinary tract and skin."),
    ("Azithral 500", "Azithromycin", "Alembic Pharma", "Antibiotics", "Tablet", 118, 60, True,
     "Antibiotic for respiratory tract infections, skin infections and sexually transmitted diseases."),
    ("Ciplox 500", "Ciprofloxacin", "Cipla Ltd", "Antibiotics", "Tablet", 90, 70, True,
     "Fluoroquinolone antibiotic for urinary, gastrointestinal and respiratory infections."),
    ("Sporidex 500", "Cephalexin", "Ranbaxy", "Antibiotics", "Capsule", 135, 50, True,
     "First-generation cephalosporin antibiotic for skin, bone and urinary tract infections."),
    # Vitamins & Supplements
    ("Limcee 500mg", "Vitamin C", "Abbott India", "Vitamins", "Chewable Tablet", 44, 250, False,
     "Chewable vitamin C tablet that boosts immunity and promotes skin and bone health."),
    ("D-Rise 60K", "Vitamin D3", "USV Pharma", "Vitamins", "Capsule", 70, 160, False,
     "High-potency Vitamin D3 for bone health, calcium absorption and immune function."),
    ("Becosules", "Vitamin B Complex", "Pfizer India", "Vitamins", "Capsule", 78, 200, False,
     "Complete B-complex with Vitamin C for energy, nerve health and stress relief."),
    ("Shelcal 500", "Calcium + Vitamin D3", "Torrent Pharma", "Vitamins", "Tablet", 98, 140, False,
     "Calcium supplement with Vitamin D3 for strong bones and prevention of osteoporosis."),
    ("Revital H", "Multivitamin + Ginseng", "Ranbaxy", "Vitamins", "Capsule", 230, 100, False,
     "Daily multivitamin and mineral supplement with ginseng for energy and vitality."),
    # Cough & Cold
    ("Benadryl Cough", "Diphenhydramine", "J&J India", "Cough & Cold", "Syrup", 80, 130, False,
     "Cough suppressant and antihistamine syrup for dry cough and cold symptoms."),
    ("Grilinctus-BM", "Bromhexine + Guaifenesin", "Franco-Indian Pharma", "Cough & Cold", "Syrup", 62, 110, False,
     "Expectorant syrup that helps loosen and clear mucus from the chest and throat."),
    ("Sinarest", "Paracetamol + Phenylephrine", "Centaur Pharma", "Cough & Cold", "Tablet", 36, 170, False,
     "Decongestant and analgesic tablet for cold, nasal congestion, headache and fever."),
    ("Strepsils", "Dichlorobenzyl Alcohol", "Reckitt India", "Cough & Cold", "Lozenge", 52, 200, False,
     "Antiseptic throat lozenges for sore throat, mouth infections and throat irritation."),
    # Acidity & Digestion
    ("Pan 40", "Pantoprazole", "Alkem Labs", "Acidity", "Tablet", 52, 180, False,
     "Proton pump inhibitor for acid reflux, peptic ulcers and gastroesophageal reflux disease."),
    ("Omez 20", "Omeprazole", "Dr Reddy's", "Acidity", "Capsule", 44, 160, False,
     "Reduces stomach acid production for treatment of acidity, GERD and gastric ulcers."),
    ("Digene Gel", "Aluminium Hydroxide + Simethicone", "Abbott India", "Acidity", "Gel", 92, 90, False,
     "Antacid gel for quick relief from acidity, heartburn, gas and indigestion."),
    # Allergy
    ("Allegra 120", "Fexofenadine", "Sanofi India", "Allergy", "Tablet", 118, 120, False,
     "Non-drowsy antihistamine for seasonal allergies, hay fever, hives and skin rashes."),
    ("Cetirizine 10mg", "Cetirizine", "Generic Pharma", "Allergy", "Tablet", 22, 200, False,
     "Antihistamine for relief from allergic rhinitis, urticaria and other allergy symptoms."),
    # Diabetes
    ("Glycomet 500", "Metformin", "USV Pharma", "Diabetes", "Tablet", 34, 100, True,
     "Oral anti-diabetic for Type 2 diabetes management. Controls blood sugar levels."),
    ("Amaryl 2mg", "Glimepiride", "Sanofi India", "Diabetes", "Tablet", 63, 80, True,
     "Sulfonylurea that stimulates insulin secretion for Type 2 diabetes management."),
    # Blood Pressure
    ("Amlip 5", "Amlodipine", "Cipla Ltd", "Blood Pressure", "Tablet", 44, 110, True,
     "Calcium channel blocker for hypertension and angina. Relaxes blood vessel walls."),
    ("Atorva 10", "Atorvastatin", "Cadila Pharma", "Blood Pressure", "Tablet", 72, 90, True,
     "Statin for lowering bad cholesterol (LDL) and reducing risk of heart attack and stroke."),
    # First Aid
    ("Savlon Antiseptic", "Chlorhexidine + Cetrimide", "ITC Limited", "First Aid", "Liquid", 78, 150, False,
     "Antiseptic liquid for cleaning wounds, cuts and abrasions to prevent infection."),
    ("Soframycin Cream", "Framycetin Sulphate", "Sanofi India", "First Aid", "Cream", 58, 120, False,
     "Antibiotic cream for prevention and treatment of infection in minor wounds and burns."),
    ("Bandage Roll", "Sterile Gauze Bandage", "Romsons", "First Aid", "Bandage", 38, 300, False,
     "Sterile cotton bandage roll for dressing wounds and securing splints."),
]


def seed_medicines() -> None:
    init_db()
    added = 0
    skipped = 0
    with Session(engine) as session:
        for (name, generic, manufacturer, category, form, price,
             stock, rx, description) in MEDICINES:
            exists = session.exec(
                select(Medicine).where(Medicine.name == name)
            ).first()
            if exists:
                print(f"  skip (exists): {name}")
                skipped += 1
                continue
            session.add(Medicine(
                name=name,
                generic_name=generic,
                manufacturer=manufacturer,
                category=category,
                dosage_form=form,
                price=price,
                stock=stock,
                requires_prescription=rx,
                description=description,
                is_active=True,
            ))
            print(f"  added: {name}")
            added += 1
        session.commit()
    print(f"\n✅ Done. Added {added}, skipped {skipped} (already present).")


if __name__ == "__main__":
    seed_medicines()
