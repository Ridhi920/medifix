#!/usr/bin/env python3
"""
Fix database issues:
1. Delete all users (they have corrupted passwords from old bcrypt)
2. Ensure unique constraint on email
"""
import os
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine, text
import sys

# Add the app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import User

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medifix:medifix@localhost:5432/medifix")
engine = create_engine(DATABASE_URL)

def fix_database():
    """Fix database by removing corrupted users and ensuring constraints."""
    with Session(engine) as session:
        # Step 1: Count users
        result = session.exec(text("SELECT COUNT(*) FROM users"))
        count = result.first()[0]
        print(f"Found {count} user(s) in database")
        
        if count > 0:
            # Show users
            users = session.exec(text("SELECT id, email, full_name FROM users")).all()
            print("\nCurrent users:")
            for user in users:
                print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
            
            print("\n⚠️  These users were created with broken bcrypt and need to be deleted.")
            confirm = input("Delete all users? (yes/no): ")
            
            if confirm.lower() != 'yes':
                print("Cancelled. No changes made.")
                return
            
            # Delete all users
            session.exec(text("DELETE FROM users"))
            session.commit()
            print("✅ All users deleted")
        
        # Step 2: Ensure unique constraint exists
        print("\n🔧 Checking unique constraint on email...")
        constraint_check = session.exec(text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'users' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%email%'
        """)).all()
        
        if constraint_check:
            print(f"✅ Unique constraint exists: {constraint_check[0][0]}")
        else:
            print("⚠️  No unique constraint found on email. It should be created by SQLModel.")
            print("   Recreating the users table...")
            session.exec(text("DROP TABLE IF EXISTS users CASCADE"))
            session.commit()
            SQLModel.metadata.create_all(engine)
            print("✅ Users table recreated with proper constraints")
        
        print("\n✨ Database is ready!")
        print("You can now:")
        print("1. Start the backend: python main.py")
        print("2. Sign up fresh in the mobile app")
        print("3. Login will work correctly with properly hashed passwords")

if __name__ == "__main__":
    try:
        fix_database()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nIf you see connection errors, make sure PostgreSQL is running:")
        print("  brew services list")
        sys.exit(1)
