"""
Migration script for ambulance fleets.

Adds ``ambulances.operator_id`` (the vendor account that runs the vehicle)
plus ``vehicle_number`` / ``driver_name`` / ``driver_phone`` / ``availability``,
then back-links every vehicle a vendor already owns via ``users.vendor_id`` so
existing ambulance vendors keep seeing their trips.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlmodel import Session, SQLModel, text
from app.core.db import engine


def _scalar(row):
    """Unwrap the single column of a raw-SQL result row (a Row, not a tuple)."""
    if row is None:
        return None
    return row[0]


def _column_exists(session: Session, table: str, column: str) -> bool:
    result = session.exec(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name=:table AND column_name=:column"
        ).bindparams(table=table, column=column)
    ).first()
    return result is not None


# column name -> the DDL that adds it
NEW_COLUMNS = {
    "operator_id": "ALTER TABLE ambulances ADD COLUMN operator_id INTEGER REFERENCES users(id)",
    "vehicle_number": "ALTER TABLE ambulances ADD COLUMN vehicle_number VARCHAR",
    "driver_name": "ALTER TABLE ambulances ADD COLUMN driver_name VARCHAR",
    "driver_phone": "ALTER TABLE ambulances ADD COLUMN driver_phone VARCHAR",
    "availability": (
        "ALTER TABLE ambulances ADD COLUMN availability VARCHAR "
        "DEFAULT 'available' NOT NULL"
    ),
}


def migrate() -> None:
    # Create any missing tables (no-op on an up-to-date database).
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        try:
            for column, ddl in NEW_COLUMNS.items():
                if _column_exists(session, "ambulances", column):
                    print(f"✅ ambulances.{column} already exists")
                else:
                    session.exec(text(ddl))
                    print(f"✅ Added ambulances.{column}")

            session.exec(text(
                "CREATE INDEX IF NOT EXISTS ix_ambulances_operator_id "
                "ON ambulances (operator_id)"
            ))
            session.exec(text(
                "CREATE INDEX IF NOT EXISTS ix_ambulances_availability "
                "ON ambulances (availability)"
            ))
            session.commit()

            # Back-link the vehicle each ambulance vendor registered with, so
            # their fleet isn't empty on first login.
            linked = session.exec(text(
                "UPDATE ambulances SET operator_id = u.id "
                "FROM users u "
                "WHERE u.role = 'ambulance' "
                "  AND u.vendor_id = ambulances.id "
                "  AND ambulances.operator_id IS NULL"
            ))
            session.commit()
            print(f"✅ Linked {linked.rowcount} existing vehicle(s) to their operator")

            unowned = _scalar(session.exec(
                text("SELECT COUNT(*) FROM ambulances WHERE operator_id IS NULL")
            ).one())
            if unowned:
                print(
                    f"ℹ️  {unowned} vehicle(s) have no operator — these stay platform-owned "
                    "and are managed from the admin portal."
                )

        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Migrating ambulances to operator-owned fleets...")
    migrate()
