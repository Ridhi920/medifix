"""
Migration script for per-store pharmacy ordering.

Creates the ``pharmacy_stores`` table, adds ``medicines.store_id`` and
``medicine_orders.store_id`` / ``medicine_orders.store_name``, then moves any
pre-existing medicines and orders onto a default store so nothing is orphaned
(the mobile app only lists medicines that belong to a store).
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlmodel import Session, SQLModel, text
from app.core.db import engine
from app.models import PharmacyStore  # noqa: F401 - registers the table

DEFAULT_STORE_NAME = "MedEfix Pharmacy"


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


def migrate() -> None:
    # 1. Create pharmacy_stores (and any other missing tables).
    SQLModel.metadata.create_all(engine)
    print("✅ pharmacy_stores table ready")

    with Session(engine) as session:
        try:
            # 2. medicines.store_id
            if _column_exists(session, "medicines", "store_id"):
                print("✅ medicines.store_id already exists")
            else:
                session.exec(text(
                    "ALTER TABLE medicines ADD COLUMN store_id INTEGER "
                    "REFERENCES pharmacy_stores(id)"
                ))
                session.exec(text(
                    "CREATE INDEX IF NOT EXISTS ix_medicines_store_id "
                    "ON medicines (store_id)"
                ))
                print("✅ Added medicines.store_id")

            # 3. medicine_orders.store_id / store_name
            if _column_exists(session, "medicine_orders", "store_id"):
                print("✅ medicine_orders.store_id already exists")
            else:
                session.exec(text(
                    "ALTER TABLE medicine_orders ADD COLUMN store_id INTEGER "
                    "REFERENCES pharmacy_stores(id)"
                ))
                session.exec(text(
                    "CREATE INDEX IF NOT EXISTS ix_medicine_orders_store_id "
                    "ON medicine_orders (store_id)"
                ))
                print("✅ Added medicine_orders.store_id")

            if _column_exists(session, "medicine_orders", "store_name"):
                print("✅ medicine_orders.store_name already exists")
            else:
                session.exec(text(
                    "ALTER TABLE medicine_orders ADD COLUMN store_name VARCHAR"
                ))
                print("✅ Added medicine_orders.store_name")

            session.commit()

            # 4. Backfill: park existing medicines/orders on a default store.
            orphan_medicines = _scalar(session.exec(
                text("SELECT COUNT(*) FROM medicines WHERE store_id IS NULL")
            ).one())

            if not orphan_medicines:
                print("✅ No medicines need a store — backfill skipped")
                return

            existing = session.exec(
                text("SELECT id FROM pharmacy_stores WHERE name = :name")
                .bindparams(name=DEFAULT_STORE_NAME)
            ).first()

            if existing:
                store_id = _scalar(existing)
            else:
                inserted = session.exec(text(
                    "INSERT INTO pharmacy_stores "
                    "(name, address, city, image, rating, delivery_time, opening_hours, is_active, created_at, updated_at) "
                    "VALUES (:name, :address, :city, :image, 4.5, '30-45 mins', '8:00 AM - 10:00 PM', TRUE, NOW(), NOW()) "
                    "RETURNING id"
                ).bindparams(
                    name=DEFAULT_STORE_NAME,
                    address="Main Branch",
                    city=None,
                    image="\U0001f3e5",
                )).first()
                store_id = _scalar(inserted)
                print(f"✅ Created default store '{DEFAULT_STORE_NAME}' (id={store_id})")

            session.exec(
                text("UPDATE medicines SET store_id = :sid WHERE store_id IS NULL")
                .bindparams(sid=store_id)
            )
            session.exec(
                text(
                    "UPDATE medicine_orders SET store_id = :sid, store_name = :sname "
                    "WHERE store_id IS NULL"
                ).bindparams(sid=store_id, sname=DEFAULT_STORE_NAME)
            )
            session.commit()
            print(f"✅ Moved {orphan_medicines} medicine(s) and all storeless orders onto '{DEFAULT_STORE_NAME}'")

        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise


if __name__ == "__main__":
    print("🔧 Migrating pharmacy to per-store medicines and orders...")
    migrate()
