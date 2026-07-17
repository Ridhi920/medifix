from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user
from ..core.db import get_session
from ..models import HomeFeature, Testimonial, User

router = APIRouter(prefix="/content", tags=["content"])


# ---- Default seed data (mirrors the original hardcoded mobile content) ----

_DEFAULT_TESTIMONIALS = [
    {"name": "Rahul Sharma", "role": "Mumbai", "avatar": "👨",
     "quote": "Excellent service, got connected to a doctor within minutes! The whole process was seamless.",
     "accent": "#2563eb", "bg": "#dbeafe"},
    {"name": "Priya Patel", "role": "Ahmedabad", "avatar": "👩",
     "quote": "Ordered medicines at midnight and they arrived in 27 minutes. An absolute lifesaver!",
     "accent": "#16a34a", "bg": "#dcfce7"},
    {"name": "Amit Kumar", "role": "Delhi", "avatar": "🧑",
     "quote": "Booked a home nurse for my father. Professional, punctual and genuinely caring staff.",
     "accent": "#FF6B35", "bg": "#ffedd5"},
    {"name": "Sneha Reddy", "role": "Hyderabad", "avatar": "👩‍🦰",
     "quote": "The ambulance arrived incredibly fast during an emergency. I can't recommend them enough.",
     "accent": "#7c3aed", "bg": "#ede9fe"},
]

_DEFAULT_FEATURES = [
    {"icon": "✅", "title": "Verified Doctors", "subtitle": "Certified & trusted experts", "bg": "#ecfdf5", "icon_bg": "#bbf7d0"},
    {"icon": "⚡", "title": "27-Min Response", "subtitle": "Care when you need it most", "bg": "#fff7ed", "icon_bg": "#fed7aa"},
    {"icon": "💰", "title": "Affordable Pricing", "subtitle": "Transparent, no hidden fees", "bg": "#eff6ff", "icon_bg": "#bfdbfe"},
    {"icon": "🔒", "title": "Safe & Private", "subtitle": "Your data stays protected", "bg": "#f5f3ff", "icon_bg": "#ddd6fe"},
    {"icon": "🏠", "title": "Care at Home", "subtitle": "Services at your doorstep", "bg": "#fef2f2", "icon_bg": "#fecaca"},
]


def _seed_testimonials(session: Session) -> None:
    for i, t in enumerate(_DEFAULT_TESTIMONIALS):
        session.add(Testimonial(display_order=i, **t))
    session.commit()


def _seed_features(session: Session) -> None:
    for i, f in enumerate(_DEFAULT_FEATURES):
        session.add(HomeFeature(display_order=i, **f))
    session.commit()


# ===================== Testimonials (Reviews) =====================

class TestimonialCreate(BaseModel):
    name: str
    role: str
    avatar: str = "👤"
    quote: str
    accent: str = "#FF6B35"
    bg: str = "#ffedd5"
    display_order: int = 0
    is_active: bool = True


class TestimonialUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    avatar: str | None = None
    quote: str | None = None
    accent: str | None = None
    bg: str | None = None
    display_order: int | None = None
    is_active: bool | None = None


@router.get("/testimonials")
def list_testimonials(session: Session = Depends(get_session)):
    rows = session.exec(select(Testimonial)).all()
    if not rows:
        _seed_testimonials(session)
        rows = session.exec(select(Testimonial)).all()
    rows.sort(key=lambda r: (r.display_order, r.id))
    # Public consumers (mobile app) only want active ones; admin filters client-side.
    return rows


@router.post("/testimonials", status_code=201)
def create_testimonial(
    data: TestimonialCreate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = Testimonial(**data.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.put("/testimonials/{testimonial_id}")
def update_testimonial(
    testimonial_id: int,
    data: TestimonialUpdate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = session.get(Testimonial, testimonial_id)
    if not row:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    row.updated_at = datetime.now(tz=timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/testimonials/{testimonial_id}")
def delete_testimonial(
    testimonial_id: int,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = session.get(Testimonial, testimonial_id)
    if not row:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    session.delete(row)
    session.commit()
    return {"message": "Testimonial deleted"}


# ===================== Home Features (Why Choose MedEfix) =====================

class FeatureCreate(BaseModel):
    icon: str = "✅"
    title: str
    subtitle: str
    bg: str = "#ecfdf5"
    icon_bg: str = "#bbf7d0"
    display_order: int = 0
    is_active: bool = True


class FeatureUpdate(BaseModel):
    icon: str | None = None
    title: str | None = None
    subtitle: str | None = None
    bg: str | None = None
    icon_bg: str | None = None
    display_order: int | None = None
    is_active: bool | None = None


@router.get("/features")
def list_features(session: Session = Depends(get_session)):
    rows = session.exec(select(HomeFeature)).all()
    if not rows:
        _seed_features(session)
        rows = session.exec(select(HomeFeature)).all()
    rows.sort(key=lambda r: (r.display_order, r.id))
    return rows


@router.post("/features", status_code=201)
def create_feature(
    data: FeatureCreate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = HomeFeature(**data.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.put("/features/{feature_id}")
def update_feature(
    feature_id: int,
    data: FeatureUpdate,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = session.get(HomeFeature, feature_id)
    if not row:
        raise HTTPException(status_code=404, detail="Feature not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    row.updated_at = datetime.now(tz=timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@router.delete("/features/{feature_id}")
def delete_feature(
    feature_id: int,
    session: Session = Depends(get_session),
    _admin: User = Depends(get_current_admin_user),
):
    row = session.get(HomeFeature, feature_id)
    if not row:
        raise HTTPException(status_code=404, detail="Feature not found")
    session.delete(row)
    session.commit()
    return {"message": "Feature deleted"}
