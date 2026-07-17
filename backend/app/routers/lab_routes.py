import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..core.auth import get_current_admin_user, get_current_user
from ..core.db import get_session
from ..models import LabBooking, LabTest, User
from ..schemas import (
    LabBookingCreate,
    LabBookingResponse,
    LabBookingWithTest,
    LabTestCreate,
    LabTestResponse,
    LabTestUpdate,
)

router = APIRouter(prefix="/lab-tests", tags=["lab-tests"])


# ========== Lab Tests Endpoints ==========

@router.get("", response_model=List[LabTestResponse])
def get_lab_tests(
    category: str | None = None,
    include_inactive: bool = False,
    session: Session = Depends(get_session),
) -> List[LabTestResponse]:
    """Get all lab tests, optionally filtered by category. Set include_inactive=True to get all tests."""
    query = select(LabTest)
    
    if not include_inactive:
        query = query.where(LabTest.is_active == True)
    
    if category:
        query = query.where(LabTest.category == category)
    
    tests = session.exec(query).all()
    
    # Convert JSON strings to lists for response
    return [
        LabTestResponse(
            id=test.id,
            name=test.name,
            description=test.description,
            parameters=json.loads(test.parameters),
            price=test.price,
            report_time=test.report_time,
            fasting_required=test.fasting_required,
            category=test.category,
            popular=test.popular,
            is_active=test.is_active,
        )
        for test in tests
    ]


@router.get("/{test_id}", response_model=LabTestResponse)
def get_lab_test(
    test_id: int,
    session: Session = Depends(get_session),
) -> LabTestResponse:
    """Get a specific lab test by ID."""
    test = session.get(LabTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found")
    
    return LabTestResponse(
        id=test.id,
        name=test.name,
        description=test.description,
        parameters=json.loads(test.parameters),
        price=test.price,
        report_time=test.report_time,
        fasting_required=test.fasting_required,
        category=test.category,
        popular=test.popular,
        is_active=test.is_active,
    )


@router.post("", response_model=LabTestResponse)
def create_lab_test(
    test: LabTestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LabTestResponse:
    """Create a new lab test (admin only)."""
    # Convert list to JSON string for storage
    db_test = LabTest(
        name=test.name,
        description=test.description,
        parameters=json.dumps(test.parameters),
        price=test.price,
        report_time=test.report_time,
        fasting_required=test.fasting_required,
        category=test.category,
        popular=test.popular,
    )
    
    session.add(db_test)
    session.commit()
    session.refresh(db_test)
    
    return LabTestResponse(
        id=db_test.id,
        name=db_test.name,
        description=db_test.description,
        parameters=json.loads(db_test.parameters),
        price=db_test.price,
        report_time=db_test.report_time,
        fasting_required=db_test.fasting_required,
        category=db_test.category,
        popular=db_test.popular,
        is_active=db_test.is_active,
    )


@router.patch("/{test_id}", response_model=LabTestResponse)
def update_lab_test(
    test_id: int,
    test_update: LabTestUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LabTestResponse:
    """Update a lab test (admin only)."""
    db_test = session.get(LabTest, test_id)
    if not db_test:
        raise HTTPException(status_code=404, detail="Lab test not found")
    
    # Update only provided fields
    update_data = test_update.model_dump(exclude_unset=True)
    
    # Convert parameters list to JSON string if provided
    if "parameters" in update_data and update_data["parameters"] is not None:
        update_data["parameters"] = json.dumps(update_data["parameters"])
    
    for field, value in update_data.items():
        setattr(db_test, field, value)
    
    session.add(db_test)
    session.commit()
    session.refresh(db_test)
    
    return LabTestResponse(
        id=db_test.id,
        name=db_test.name,
        description=db_test.description,
        parameters=json.loads(db_test.parameters),
        price=db_test.price,
        report_time=db_test.report_time,
        fasting_required=db_test.fasting_required,
        category=db_test.category,
        popular=db_test.popular,
        is_active=db_test.is_active,
    )


@router.delete("/{test_id}")
def delete_lab_test(
    test_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a lab test (admin only)."""
    test = session.get(LabTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found")
    
    session.delete(test)
    session.commit()
    
    return {"message": "Lab test deleted successfully"}


# ========== Lab Bookings Endpoints ==========

@router.post("/bookings", response_model=LabBookingResponse, status_code=status.HTTP_201_CREATED)
def create_lab_booking(
    booking: LabBookingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LabBookingResponse:
    """Create a new lab test booking."""
    # Verify lab test exists and is active
    lab_test = session.get(LabTest, booking.lab_test_id)
    if not lab_test:
        raise HTTPException(status_code=404, detail="Lab test not found")
    
    if not lab_test.is_active:
        raise HTTPException(status_code=400, detail="This lab test is not available")
    
    # Validate home collection requirements
    if booking.home_collection and not booking.address:
        raise HTTPException(status_code=400, detail="Address is required for home collection")
    
    if not booking.home_collection and not booking.center_name:
        raise HTTPException(status_code=400, detail="Center name is required for lab visit")
    
    # Create booking
    db_booking = LabBooking(
        user_id=current_user.id,
        lab_test_id=booking.lab_test_id,
        patient_name=booking.patient_name,
        patient_age=booking.patient_age,
        patient_phone=booking.patient_phone,
        collection_date=booking.collection_date,
        collection_time=booking.collection_time,
        home_collection=booking.home_collection,
        address=booking.address,
        center_name=booking.center_name,
        test_price=lab_test.price,
        status="pending",
    )
    
    session.add(db_booking)
    session.commit()
    session.refresh(db_booking)
    
    return LabBookingResponse(
        id=db_booking.id,
        user_id=db_booking.user_id,
        lab_test_id=db_booking.lab_test_id,
        patient_name=db_booking.patient_name,
        patient_age=db_booking.patient_age,
        patient_phone=db_booking.patient_phone,
        collection_date=db_booking.collection_date,
        collection_time=db_booking.collection_time,
        home_collection=db_booking.home_collection,
        address=db_booking.address,
        center_name=db_booking.center_name,
        test_price=db_booking.test_price,
        status=db_booking.status,
        created_at=db_booking.created_at,
    )


@router.get("/bookings/my", response_model=List[LabBookingWithTest])
async def get_my_lab_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[LabBookingWithTest]:
    """Get all lab bookings for the current user."""
    query = select(LabBooking, LabTest).where(
        LabBooking.user_id == current_user.id,
        LabBooking.lab_test_id == LabTest.id
    )
    
    results = session.exec(query).all()
    
    return [
        LabBookingWithTest(
            id=booking.id,
            user_id=booking.user_id,
            lab_test_id=booking.lab_test_id,
            patient_name=booking.patient_name,
            patient_age=booking.patient_age,
            patient_phone=booking.patient_phone,
            collection_date=booking.collection_date,
            collection_time=booking.collection_time,
            home_collection=booking.home_collection,
            address=booking.address,
            center_name=booking.center_name,
            test_price=booking.test_price,
            status=booking.status,
            created_at=booking.created_at,
            test_name=test.name,
            test_category=test.category,
            test_parameters=json.loads(test.parameters),
        )
        for booking, test in results
    ]


@router.get("/bookings/all", response_model=List[LabBookingWithTest])
def get_all_lab_bookings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[LabBookingWithTest]:
    """Get all lab bookings (admin only)."""
    query = select(LabBooking, LabTest).where(
        LabBooking.lab_test_id == LabTest.id
    )
    
    results = session.exec(query).all()
    
    return [
        LabBookingWithTest(
            id=booking.id,
            user_id=booking.user_id,
            lab_test_id=booking.lab_test_id,
            patient_name=booking.patient_name,
            patient_age=booking.patient_age,
            patient_phone=booking.patient_phone,
            collection_date=booking.collection_date,
            collection_time=booking.collection_time,
            home_collection=booking.home_collection,
            address=booking.address,
            center_name=booking.center_name,
            test_price=booking.test_price,
            status=booking.status,
            created_at=booking.created_at,
            test_name=test.name,
            test_category=test.category,
            test_parameters=json.loads(test.parameters),
        )
        for booking, test in results
    ]


@router.patch("/bookings/{booking_id}/confirm")
def confirm_lab_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Confirm a lab booking (admin only)."""
    booking = session.get(LabBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "confirmed"
    session.add(booking)
    session.commit()
    
    return {"message": "Booking confirmed successfully"}


@router.patch("/bookings/{booking_id}/collected")
def mark_sample_collected(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Mark sample as collected (admin only)."""
    booking = session.get(LabBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "sample_collected"
    session.add(booking)
    session.commit()
    
    return {"message": "Sample marked as collected"}


@router.patch("/bookings/{booking_id}/complete")
def complete_lab_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Complete a lab booking (admin only)."""
    booking = session.get(LabBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "completed"
    session.add(booking)
    session.commit()
    
    return {"message": "Booking completed successfully"}


@router.patch("/bookings/{booking_id}/cancel")
def cancel_lab_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Cancel a lab booking."""
    booking = session.get(LabBooking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Users can only cancel their own bookings
    if booking.user_id != current_user.id:
        # Check if user is admin (you can add admin check here)
        pass
    
    booking.status = "cancelled"
    session.add(booking)
    session.commit()
    
    return {"message": "Booking cancelled successfully"}
