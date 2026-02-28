from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class ServiceModel(SQLModel, table=True):
    __tablename__ = "services"

    id: str = Field(primary_key=True)
    name: str
    category: str
    description: str
    delivery_mode: str


class BookingModel(SQLModel, table=True):
    __tablename__ = "bookings"

    id: str = Field(primary_key=True)
    status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    patient_name: str
    contact_phone: str
    service_id: str = Field(foreign_key="services.id")
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None
