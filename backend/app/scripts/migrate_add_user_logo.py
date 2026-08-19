"""Migration script to add a `logo` column to the users table.

Stores a vendor's brand logo (base64 data-URL or URL), shown in the vendor
dashboard header.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import inspect
from sqlmodel import Session, text
from app.core.db import engine


def add_logo_column():
    existing = {col["name"] for col in inspect(engine).get_columns("users")}
    with Session(engine) as session:
        try:
            if "logo" in existing:
                print("✅ logo column already exists")
            else:
                session.exec(text("ALTER TABLE users ADD COLUMN logo VARCHAR;"))
                print("✅ Added logo column to users table")
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Adding logo column to users table...")
    add_logo_column()
