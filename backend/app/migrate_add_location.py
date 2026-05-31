"""
Migration script to add latitude and longitude columns to all service provider tables.
Run once: python -m app.migrate_add_location
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, text
from app.db import engine

TABLES = ["doctors", "dentists", "nurses", "physiotherapists", "ambulances"]


def add_location_columns():
    with Session(engine) as session:
        for table in TABLES:
            for col in ("latitude", "longitude"):
                try:
                    check_sql = f"""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name='{table}' AND column_name='{col}';
                    """
                    result = session.exec(text(check_sql)).first()
                    if result:
                        print(f"✅ {table}.{col} already exists")
                        continue

                    alter_sql = f"ALTER TABLE {table} ADD COLUMN {col} DOUBLE PRECISION DEFAULT NULL;"
                    session.exec(text(alter_sql))
                    session.commit()
                    print(f"✅ Added {table}.{col}")
                except Exception as e:
                    session.rollback()
                    print(f"❌ Error on {table}.{col}: {e}")
                    raise


if __name__ == "__main__":
    print("🔧 Adding latitude/longitude columns to service provider tables...")
    add_location_columns()
    print("✅ Done")
