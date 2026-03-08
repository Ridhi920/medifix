"""
Seed script to create an admin user.
Run this once to create the initial admin account.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.db import engine
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password."""
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def seed_admin():
    """Create an admin user if it doesn't exist."""
    with Session(engine) as session:
        # Check if admin already exists
        statement = select(User).where(User.email == "admin@medifix.com")
        existing_admin = session.exec(statement).first()
        
        if existing_admin:
            print("⚠️  Admin user already exists")
            print(f"   Email: {existing_admin.email}")
            print(f"   Role: {existing_admin.role}")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@medifix.com",
            full_name="System Administrator",
            phone="+91 9876543210",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: admin123")
        print(f"   Role: {admin_user.role}")
        print("\n⚠️  IMPORTANT: Change the password after first login!")


if __name__ == "__main__":
    print("🔧 Creating admin user...")
    seed_admin()
