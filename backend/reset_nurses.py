"""
Script to delete all nurses and nurse bookings from the database
"""
from sqlmodel import Session, select
from app.models import Nurse, NurseBooking
from app.db import engine

def reset_nurses():
    """Delete all nurses and their bookings"""
    
    with Session(engine) as session:
        # Delete all nurse bookings first (foreign key constraint)
        bookings = session.exec(select(NurseBooking)).all()
        for booking in bookings:
            session.delete(booking)
        session.commit()
        print(f"Deleted {len(bookings)} nurse bookings")
        
        # Delete all nurses
        nurses = session.exec(select(Nurse)).all()
        for nurse in nurses:
            session.delete(nurse)
        session.commit()
        print(f"Deleted {len(nurses)} nurses")
        
        print("✓ All nurse data has been removed from the database")

if __name__ == "__main__":
    print("Removing all nurses and nurse bookings from database...")
    reset_nurses()
