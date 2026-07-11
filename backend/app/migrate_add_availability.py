"""
Migration script to add unavailable_services column to app_settings table.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, text
from app.db import engine


def add_unavailable_services_column():
    """Add unavailable_services column to app_settings table."""
    with Session(engine) as session:
        try:
            check_sql = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='app_settings' AND column_name='unavailable_services';
            """
            result = session.exec(text(check_sql)).first()

            if result:
                print("✅ unavailable_services column already exists")
                return

            alter_sql = """
            ALTER TABLE app_settings
            ADD COLUMN unavailable_services VARCHAR DEFAULT '[]' NOT NULL;
            """
            session.exec(text(alter_sql))
            session.commit()

            print("✅ Successfully added unavailable_services column to app_settings table")
            print("   Default value: '[]'")

        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Adding unavailable_services column to app_settings table...")
    add_unavailable_services_column()
