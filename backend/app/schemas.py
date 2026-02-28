from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ServiceCategory(str, Enum):
    medicine = "medicine"
    clinic = "clinic"
    lab = "lab"
    dental = "dental"
    ambulance = "ambulance"
    physiotherapy = "physiotherapy"
    nursing = "nursing"
    equipment = "equipment"


class Service(BaseModel):
    id: str
    name: str
    category: ServiceCategory
    description: str
    delivery_mode: str


class BookingStatus(str, Enum):
    requested = "requested"
    confirmed = "confirmed"
    completed = "completed"


class BookingCreate(BaseModel):
    patient_name: str = Field(..., min_length=2)
    contact_phone: str
    service_id: str
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class Booking(BaseModel):
    id: str
    status: BookingStatus
    created_at: datetime
    patient_name: str
    contact_phone: str
    service_id: str
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None
