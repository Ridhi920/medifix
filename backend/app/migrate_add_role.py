"""
Migration script to add role column to users table.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, text
from app.db import engine


def add_role_column():
    """Add role column to users table."""
    with Session(engine) as session:
        try:
            # Check if column exists
            check_sql = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='role';
            """
            result = session.exec(text(check_sql)).first()
            
            if result:
                print("✅ Role column already exists")
                return
            
            # Add role column with default value 'user'
            alter_sql = """
            ALTER TABLE users 
            ADD COLUMN role VARCHAR DEFAULT 'user' NOT NULL;
            """
            session.exec(text(alter_sql))
            session.commit()
            
            print("✅ Successfully added role column to users table")
            print("   Default value: 'user'")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Adding role column to users table...")
    add_role_column()
