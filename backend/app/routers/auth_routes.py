import json
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from ..core.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    VENDOR_ROLES,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    verify_password,
)
from ..core.db import get_session
from ..models import Ambulance, Dentist, Doctor, Nurse, Physiotherapist, User
from ..schemas import (
    PasswordUpdate,
    Token,
    UserLogin,
    UserResponse,
    UserSignup,
    UserUpdate,
    VendorSignup,
)

router = APIRouter(prefix="/auth", tags=["authentication"])

# Default profile fields that aren't collected at signup. The vendor's own
# entity page (once they're approved) or the admin can refine these later.
_DEFAULT_AVAILABLE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
_DEFAULT_AVAILABLE_SLOTS = ["10:00 AM", "11:00 AM", "12:00 PM", "04:00 PM", "05:00 PM"]
_DEFAULT_NURSE_SHIFTS = ["Day", "Night"]
_DEFAULT_PHYSIO_SHIFTS = ["Morning", "Afternoon", "Evening"]
_DEFAULT_LANGUAGES = ["English", "Hindi"]
_ROLE_IMAGE = {
    "doctor": "🩺",
    "dentist": "🦷",
    "ambulance": "🚑",
    "nurse": "👩‍⚕️",
    "physiotherapist": "🧑‍⚕️",
}


def _require_fields(role: str, vendor_data: VendorSignup, *fields: str) -> None:
    missing = [f for f in fields if getattr(vendor_data, f) in (None, "")]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required profile fields for {role} signup: {', '.join(missing)}",
        )


def _build_vendor_entity(vendor_data: VendorSignup):
    """Build the entity row (Doctor/Dentist/Ambulance/Nurse/Physiotherapist)
    backing a vendor account, from the profile fields collected at signup.
    Returns None for roles without a dedicated entity table (lab, pharmacy),
    which operate the whole service rather than a single listed profile.
    The entity starts inactive; approving the vendor account activates it.
    """
    role = vendor_data.role

    if role in ("doctor", "dentist"):
        _require_fields(role, vendor_data, "specialty", "qualification", "experience", "consultation_fee", "address")
        model = Doctor if role == "doctor" else Dentist
        return model(
            name=vendor_data.full_name,
            specialty=vendor_data.specialty,
            qualification=vendor_data.qualification,
            experience=vendor_data.experience,
            rating=0.0,
            consultation_fee=vendor_data.consultation_fee,
            available_days=json.dumps(_DEFAULT_AVAILABLE_DAYS),
            available_slots=json.dumps(_DEFAULT_AVAILABLE_SLOTS),
            image=_ROLE_IMAGE[role],
            address=vendor_data.address,
            is_active=False,
        )

    if role == "ambulance":
        _require_fields(role, vendor_data, "ambulance_type", "base_price", "estimated_time", "description")
        return Ambulance(
            name=vendor_data.full_name,
            description=vendor_data.description,
            features=json.dumps(["Trained paramedic", "First aid kit"]),
            estimated_time=vendor_data.estimated_time,
            base_price=vendor_data.base_price,
            image=_ROLE_IMAGE[role],
            ambulance_type=vendor_data.ambulance_type,
            is_active=False,
        )

    if role in ("nurse", "physiotherapist"):
        _require_fields(role, vendor_data, "qualification", "specialization", "experience", "hourly_rate", "daily_rate", "gender")
        model = Nurse if role == "nurse" else Physiotherapist
        shifts = _DEFAULT_NURSE_SHIFTS if role == "nurse" else _DEFAULT_PHYSIO_SHIFTS
        return model(
            name=vendor_data.full_name,
            qualification=vendor_data.qualification,
            specialization=vendor_data.specialization,
            experience=vendor_data.experience,
            rating=0.0,
            services=json.dumps(["General care"]),
            hourly_rate=vendor_data.hourly_rate,
            daily_rate=vendor_data.daily_rate,
            available_shifts=json.dumps(shifts),
            languages=json.dumps(_DEFAULT_LANGUAGES),
            image=_ROLE_IMAGE[role],
            gender=vendor_data.gender,
            is_active=False,
        )

    # lab, pharmacy: no per-vendor entity; they see all bookings for the service
    return None


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, session: Session = Depends(get_session)) -> UserResponse:
    """Register a new user."""
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Public signup always creates a normal user account. Vendors must
    # register through /auth/vendor/signup (and be approved by an admin);
    # admins are promoted by an existing admin.
    if user_data.role in VENDOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor accounts must register through the vendor signup on the web portal",
        )

    # Create new user
    try:
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            phone=user_data.phone,
            hashed_password=hashed_password,
            role="user",
            approval_status="approved",
        )

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        return UserResponse.model_validate(new_user, from_attributes=True)
    except Exception as e:
        session.rollback()
        # Handle unique constraint violation
        if "unique constraint" in str(e).lower() or "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )


@router.post("/vendor/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def vendor_signup(vendor_data: VendorSignup, session: Session = Depends(get_session)) -> UserResponse:
    """Register a new vendor account and its profile. Stays pending (and the
    profile stays unlisted) until an admin approves it."""
    if vendor_data.role not in VENDOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid vendor role. Must be one of: {', '.join(sorted(VENDOR_ROLES))}",
        )

    statement = select(User).where(User.email == vendor_data.email)
    if session.exec(statement).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    entity = _build_vendor_entity(vendor_data)

    new_user = User(
        email=vendor_data.email,
        full_name=vendor_data.full_name,
        phone=vendor_data.phone,
        hashed_password=get_password_hash(vendor_data.password),
        role=vendor_data.role,
        approval_status="pending",
    )

    if entity is not None:
        session.add(entity)
        session.flush()  # assign entity.id without committing yet
        new_user.vendor_id = entity.id

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return UserResponse.model_validate(new_user, from_attributes=True)


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, session: Session = Depends(get_session)) -> Token:
    """Mobile app login. Only users and admins can log in here; vendors are web-only."""
    user = authenticate_user(session, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role in VENDOR_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor accounts can only log in on the web portal",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user, from_attributes=True)
    }


@router.post("/admin/login", response_model=Token)
def admin_login(user_data: UserLogin, session: Session = Depends(get_session)) -> Token:
    """Web portal login - allows admins and approved vendors. Normal users are app-only."""
    user = authenticate_user(session, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role == "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User accounts can only log in through the mobile app",
        )

    if user.role in VENDOR_ROLES:
        if user.approval_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your vendor account is awaiting admin approval",
            )
        if user.approval_status != "approved":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your vendor account has been rejected. Please contact support.",
            )
    elif user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user, from_attributes=True)
    }


@router.post("/login/form", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
) -> Token:
    """Login user with OAuth2 form (for compatibility with OAuth2PasswordBearer)."""
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get current user information."""
    return UserResponse.model_validate(current_user, from_attributes=True)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Update current user profile."""
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        statement = select(User).where(User.email == user_update.email)
        existing_user = session.exec(statement).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        current_user.email = user_update.email
    
    # Update other fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    
    from datetime import datetime, timezone
    current_user.updated_at = datetime.now(tz=timezone.utc)
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return UserResponse.model_validate(current_user, from_attributes=True)


@router.put("/me/password")
async def update_password(
    password_update: PasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> dict:
    """Update current user password."""
    # Verify current password
    if not verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_update.new_password)
    
    from datetime import datetime, timezone
    current_user.updated_at = datetime.now(tz=timezone.utc)
    
    session.add(current_user)
    session.commit()
    
    return {"message": "Password updated successfully"}


@router.post("/logout")
async def logout() -> dict:
    """Logout endpoint (client should delete token)."""
    return {"message": "Successfully logged out"}
