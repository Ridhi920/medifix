import json
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..core.auth import VENDOR_ROLES, get_current_admin_user, get_password_hash
from ..core.db import get_session
from ..models import Ambulance, Dentist, Doctor, Nurse, Physiotherapist, User
from ..schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

VALID_ROLES = {"user", "admin"} | VENDOR_ROLES

# Maps a vendor role to the entity table that backs its profile. Lab and
# pharmacy vendors have no dedicated entity table (see auth_routes.py).
ENTITY_MODEL_BY_ROLE = {
    "doctor": Doctor,
    "dentist": Dentist,
    "ambulance": Ambulance,
    "nurse": Nurse,
    "physiotherapist": Physiotherapist,
}


def _get_vendor_entity(user: User, session: Session):
    model = ENTITY_MODEL_BY_ROLE.get(user.role)
    if model is None or user.vendor_id is None:
        return None
    return session.get(model, user.vendor_id)


class UserUpdate:
    """Schema for updating user information."""
    full_name: str | None = None
    phone: str | None = None
    role: str | None = None
    is_active: bool | None = None


@router.get("", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> List[UserResponse]:
    """Get all users and admins (admin only). Vendor accounts are managed
    separately via /users/vendors/all and the Vendor Approvals page."""
    statement = (
        select(User)
        .where(User.role.notin_(VENDOR_ROLES))
        .offset(skip)
        .limit(limit)
    )

    if not include_inactive:
        statement = statement.where(User.is_active == True)

    users = session.exec(statement).all()
    return [UserResponse.model_validate(user, from_attributes=True) for user in users]


@router.get("/vendors/all", response_model=List[UserResponse])
async def get_vendors(
    approval_status: str | None = None,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> List[UserResponse]:
    """Get all vendor accounts, optionally filtered by approval status (admin only)."""
    statement = select(User).where(User.role.in_(VENDOR_ROLES))
    if approval_status:
        statement = statement.where(User.approval_status == approval_status)
    vendors = session.exec(statement.order_by(User.created_at.desc())).all()
    return [UserResponse.model_validate(v, from_attributes=True) for v in vendors]


# Entity fields that are stored as JSON-encoded strings and should be
# decoded back into lists for the admin review view.
_JSON_LIST_FIELDS = {
    "available_days",
    "available_slots",
    "features",
    "services",
    "available_shifts",
    "languages",
}


@router.get("/{user_id}/vendor-profile", response_model=dict)
async def get_vendor_profile_admin(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> dict:
    """Get the full profile record for a vendor account (admin only), so the
    admin can review every field before approving or rejecting. Works even
    while the profile is still inactive (pending approval)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role not in VENDOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only vendor accounts have a profile",
        )

    entity = _get_vendor_entity(user, session)
    if entity is None:
        return {
            "account": UserResponse.model_validate(user, from_attributes=True).model_dump(mode="json"),
            "profile": None,
        }

    profile = entity.model_dump(mode="json")
    for field in _JSON_LIST_FIELDS:
        if field in profile and isinstance(profile[field], str):
            try:
                profile[field] = json.loads(profile[field])
            except (TypeError, ValueError):
                pass

    return {
        "account": UserResponse.model_validate(user, from_attributes=True).model_dump(mode="json"),
        "profile": profile,
    }


@router.patch("/{user_id}/approve", response_model=UserResponse)
async def approve_vendor(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> UserResponse:
    """Approve a pending vendor account (admin only). The vendor's profile
    was already created at signup, so this just grants login access and
    makes their profile live for booking."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role not in VENDOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only vendor accounts can be approved",
        )

    user.approval_status = "approved"
    user.updated_at = datetime.now(tz=timezone.utc)
    session.add(user)

    entity = _get_vendor_entity(user, session)
    if entity is not None:
        entity.is_active = True
        entity.updated_at = datetime.now(tz=timezone.utc)
        session.add(entity)

    session.commit()
    session.refresh(user)

    return UserResponse.model_validate(user, from_attributes=True)


@router.patch("/{user_id}/reject", response_model=UserResponse)
async def reject_vendor(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> UserResponse:
    """Reject a vendor account so it cannot log in and its profile is unlisted (admin only)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role not in VENDOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only vendor accounts can be rejected",
        )

    user.approval_status = "rejected"
    user.updated_at = datetime.now(tz=timezone.utc)
    session.add(user)

    entity = _get_vendor_entity(user, session)
    if entity is not None:
        entity.is_active = False
        entity.updated_at = datetime.now(tz=timezone.utc)
        session.add(entity)

    session.commit()
    session.refresh(user)

    return UserResponse.model_validate(user, from_attributes=True)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> UserResponse:
    """Get a specific user by ID (admin only)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.model_validate(user, from_attributes=True)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    full_name: str | None = None,
    phone: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> UserResponse:
    """Update user information (admin only)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields if provided
    if full_name is not None:
        user.full_name = full_name
    if phone is not None:
        user.phone = phone
    if role is not None:
        if role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role must be one of: {', '.join(sorted(VALID_ROLES))}"
            )
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    
    user.updated_at = datetime.now(tz=timezone.utc)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return UserResponse.model_validate(user, from_attributes=True)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
):
    """Delete a user (admin only)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting yourself
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # A vendor's entity record only exists for their account; remove it too
    if user.role in VENDOR_ROLES:
        entity = _get_vendor_entity(user, session)
        if entity is not None:
            session.delete(entity)

    session.delete(user)
    session.commit()

    return {"message": "User deleted successfully"}


@router.patch("/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status(
    user_id: int,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user),
) -> UserResponse:
    """Toggle user active status (admin only)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deactivating yourself
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = not user.is_active
    user.updated_at = datetime.now(tz=timezone.utc)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return UserResponse.model_validate(user, from_attributes=True)
