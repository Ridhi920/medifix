#!/usr/bin/env python3
"""
Reset users in the database.
This deletes all users so you can sign up fresh with the fixed bcrypt.
"""
import os
from dotenv import load_dotenv
from sqlmodel import Session, create_engine, select
import sys

# Add the app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import User

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medifix:medifix@localhost:5432/medifix")
engine = create_engine(DATABASE_URL)

def reset_users():
    """Delete all users from the database."""
    with Session(engine) as session:
        # Get all users
        users = session.exec(select(User)).all()
        
        if not users:
            print("No users found in database.")
            return
        
        print(f"Found {len(users)} user(s):")
        for user in users:
            print(f"  - {user.email} ({user.full_name})")
        
        confirm = input("\nDelete all users? (yes/no): ")
        if confirm.lower() == 'yes':
            for user in users:
                session.delete(user)
            session.commit()
            print("✅ All users deleted successfully!")
            print("You can now sign up again with the fixed authentication.")
        else:
            print("Cancelled.")

if __name__ == "__main__":
    reset_users()
