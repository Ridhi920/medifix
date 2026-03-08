from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from .auth import get_current_admin_user, get_password_hash
from .db import get_session
from .models import User
from .schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


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
    """Get all users (admin only)."""
    statement = select(User).offset(skip).limit(limit)
    
    if not include_inactive:
        statement = statement.where(User.is_active == True)
    
    users = session.exec(statement).all()
    return [UserResponse.model_validate(user, from_attributes=True) for user in users]


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
        if role not in ["user", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'user' or 'admin'"
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
