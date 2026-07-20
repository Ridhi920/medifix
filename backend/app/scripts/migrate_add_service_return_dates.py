"""
Migration script to add service_return_dates column to app_settings table.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlmodel import Session, text
from app.core.db import engine


def add_service_return_dates_column():
    """Add service_return_dates column to app_settings table."""
    with Session(engine) as session:
        try:
            check_sql = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='app_settings' AND column_name='service_return_dates';
            """
            result = session.exec(text(check_sql)).first()

            if result:
                print("✅ service_return_dates column already exists")
                return

            alter_sql = """
            ALTER TABLE app_settings
            ADD COLUMN service_return_dates VARCHAR DEFAULT '{}' NOT NULL;
            """
            session.exec(text(alter_sql))
            session.commit()

            print("✅ Successfully added service_return_dates column to app_settings table")
            print("   Default value: '{}'")

        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Adding service_return_dates column to app_settings table...")
    add_service_return_dates_column()
