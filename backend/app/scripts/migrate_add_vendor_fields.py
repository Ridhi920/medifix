"""
Migration script to add vendor_id and approval_status columns to users table.
Works on both PostgreSQL and SQLite.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import inspect
from sqlmodel import Session, text
from app.core.db import engine


def add_vendor_columns():
    """Add vendor_id and approval_status columns to users table."""
    existing = {col["name"] for col in inspect(engine).get_columns("users")}

    with Session(engine) as session:
        try:
            if "vendor_id" in existing:
                print("✅ vendor_id column already exists")
            else:
                session.exec(text("ALTER TABLE users ADD COLUMN vendor_id INTEGER;"))
                print("✅ Added vendor_id column to users table")

            if "approval_status" in existing:
                print("✅ approval_status column already exists")
            else:
                session.exec(text(
                    "ALTER TABLE users ADD COLUMN approval_status VARCHAR DEFAULT 'approved' NOT NULL;"
                ))
                # Existing accounts (users/admins) are treated as approved
                session.exec(text("UPDATE users SET approval_status = 'approved';"))
                print("✅ Added approval_status column to users table (default 'approved')")

            session.commit()
        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Adding vendor columns to users table...")
    add_vendor_columns()
