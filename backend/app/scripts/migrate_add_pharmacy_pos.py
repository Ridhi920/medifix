"""
Migration script for the pharmacy point-of-sale workspace.

Creates the pharmacy_customers / pharmacy_purchases / pharmacy_stock_batches /
pharmacy_sales tables and adds ``medicines.barcode`` and ``medicines.min_stock``.
Idempotent: safe to run more than once.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlmodel import Session, SQLModel, text
from app.core.db import engine
from app import models  # noqa: F401 - registers the tables


def _column_exists(session: Session, table: str, column: str) -> bool:
    result = session.exec(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name=:table AND column_name=:column"
        ).bindparams(table=table, column=column)
    ).first()
    return result is not None


def migrate() -> None:
    SQLModel.metadata.create_all(engine)
    print("✅ pharmacy POS tables ready")

    with Session(engine) as session:
        try:
            if _column_exists(session, "medicines", "barcode"):
                print("✅ medicines.barcode already exists")
            else:
                session.exec(text("ALTER TABLE medicines ADD COLUMN barcode VARCHAR"))
                session.exec(text("CREATE INDEX IF NOT EXISTS ix_medicines_barcode ON medicines (barcode)"))
                print("✅ Added medicines.barcode")

            if _column_exists(session, "medicines", "min_stock"):
                print("✅ medicines.min_stock already exists")
            else:
                session.exec(text("ALTER TABLE medicines ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 10"))
                print("✅ Added medicines.min_stock")

            session.commit()
        except Exception as e:
            session.rollback()
            print(f"❌ Migration failed: {e}")
            raise


if __name__ == "__main__":
    migrate()
