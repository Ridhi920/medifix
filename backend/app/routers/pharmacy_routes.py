import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..core.auth import get_current_user, get_current_admin_user
from ..core.db import get_session
from ..core.logbook import log_activity
from ..core.service_requests import create_service_request
from ..models import Medicine, MedicineOrder, PrescriptionSubmission, User
from ..schemas import (
    MedicineCreate,
    MedicineOrderCreate,
    MedicineOrderResponse,
    MedicineOrderStatusUpdate,
    MedicineResponse,
    MedicineUpdate,
    PrescriptionSubmissionCreate,
    PrescriptionSubmissionResponse,
)

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])


# ========== Medicine Management Endpoints ==========

@router.get("/medicines", response_model=List[MedicineResponse])
def get_medicines(
    category: str | None = Query(None),
    search: str | None = Query(None),
    active_only: bool = Query(True),
    session: Session = Depends(get_session),
) -> List[MedicineResponse]:
    """Get all medicines with optional filtering."""
    query = select(Medicine)
    
    if active_only:
        query = query.where(Medicine.is_active == True)
    
    if category and category != "All":
        query = query.where(Medicine.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Medicine.name.ilike(search_term)) |
            (Medicine.generic_name.ilike(search_term))
        )
    
    query = query.order_by(Medicine.name)
    medicines = session.exec(query).all()
    
    return [
        MedicineResponse(
            id=medicine.id,
            name=medicine.name,
            generic_name=medicine.generic_name,
            manufacturer=medicine.manufacturer,
            category=medicine.category,
            price=medicine.price,
            stock=medicine.stock,
            requires_prescription=medicine.requires_prescription,
            description=medicine.description,
            dosage_form=medicine.dosage_form,
            strength=medicine.strength,
            image=medicine.image,
            is_active=medicine.is_active,
            created_at=medicine.created_at,
        )
        for medicine in medicines
    ]


@router.get("/medicines/{medicine_id}", response_model=MedicineResponse)
def get_medicine(
    medicine_id: int,
    session: Session = Depends(get_session),
) -> MedicineResponse:
    """Get a single medicine by ID."""
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    return MedicineResponse(
        id=medicine.id,
        name=medicine.name,
        generic_name=medicine.generic_name,
        manufacturer=medicine.manufacturer,
        category=medicine.category,
        price=medicine.price,
        stock=medicine.stock,
        requires_prescription=medicine.requires_prescription,
        description=medicine.description,
        dosage_form=medicine.dosage_form,
        strength=medicine.strength,
        image=medicine.image,
        is_active=medicine.is_active,
        created_at=medicine.created_at,
    )


@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    medicine_data: MedicineCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> MedicineResponse:
    """Create a new medicine (admin only)."""
    medicine = Medicine(
        name=medicine_data.name,
        generic_name=medicine_data.generic_name,
        manufacturer=medicine_data.manufacturer,
        category=medicine_data.category,
        price=medicine_data.price,
        stock=medicine_data.stock,
        requires_prescription=medicine_data.requires_prescription,
        description=medicine_data.description,
        dosage_form=medicine_data.dosage_form,
        strength=medicine_data.strength,
        image=medicine_data.image,
    )
    
    session.add(medicine)
    session.commit()
    session.refresh(medicine)
    
    return MedicineResponse(
        id=medicine.id,
        name=medicine.name,
        generic_name=medicine.generic_name,
        manufacturer=medicine.manufacturer,
        category=medicine.category,
        price=medicine.price,
        stock=medicine.stock,
        requires_prescription=medicine.requires_prescription,
        description=medicine.description,
        dosage_form=medicine.dosage_form,
        strength=medicine.strength,
        image=medicine.image,
        is_active=medicine.is_active,
        created_at=medicine.created_at,
    )


@router.put("/medicines/{medicine_id}", response_model=MedicineResponse)
def update_medicine(
    medicine_id: int,
    medicine_data: MedicineUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> MedicineResponse:
    """Update a medicine (admin only)."""
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    update_data = medicine_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(medicine, key, value)
    
    session.add(medicine)
    session.commit()
    session.refresh(medicine)
    
    return MedicineResponse(
        id=medicine.id,
        name=medicine.name,
        generic_name=medicine.generic_name,
        manufacturer=medicine.manufacturer,
        category=medicine.category,
        price=medicine.price,
        stock=medicine.stock,
        requires_prescription=medicine.requires_prescription,
        description=medicine.description,
        dosage_form=medicine.dosage_form,
        strength=medicine.strength,
        image=medicine.image,
        is_active=medicine.is_active,
        created_at=medicine.created_at,
    )


@router.patch("/medicines/{medicine_id}/toggle-status", response_model=dict)
def toggle_medicine_status(
    medicine_id: int,
    is_active: bool,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> dict:
    """Toggle medicine active status (admin only)."""
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    medicine.is_active = is_active
    session.add(medicine)
    session.commit()
    
    return {"message": f"Medicine {'activated' if is_active else 'deactivated'} successfully"}


@router.delete("/medicines/{medicine_id}", response_model=dict)
def delete_medicine(
    medicine_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> dict:
    """Delete a medicine (admin only)."""
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    session.delete(medicine)
    session.commit()
    
    return {"message": "Medicine deleted successfully"}


# ========== Medicine Order Endpoints ==========

@router.post("/orders", response_model=MedicineOrderResponse, status_code=status.HTTP_201_CREATED)
def create_medicine_order(
    order_data: MedicineOrderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MedicineOrderResponse:
    """Create a new medicine order."""
    # Validate medicines and calculate total
    total_amount = 0
    items_json = []
    
    for item in order_data.items:
        medicine = session.get(Medicine, item.medicine_id)
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine with ID {item.medicine_id} not found")
        
        if not medicine.is_active:
            raise HTTPException(status_code=400, detail=f"{medicine.name} is not available")
        
        if medicine.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {medicine.name}. Available: {medicine.stock}"
            )
        
        # Update stock
        medicine.stock -= item.quantity
        session.add(medicine)
        
        # Calculate total
        item_total = medicine.price * item.quantity
        total_amount += item_total
        
        items_json.append({
            "medicine_id": item.medicine_id,
            "medicine_name": medicine.name,
            "quantity": item.quantity,
            "price": medicine.price,
        })
    
    # Create order
    order = MedicineOrder(
        user_id=current_user.id,
        patient_name=order_data.patient_name,
        patient_phone=order_data.patient_phone,
        delivery_address=order_data.delivery_address,
        items=json.dumps(items_json),
        total_amount=total_amount,
        prescription_image=order_data.prescription_image,
        notes=order_data.notes,
    )

    session.add(order)
    session.flush()  # assign order.id before logging
    log_activity(
        session,
        action="Medicine Order Placed",
        module="Pharmacy",
        actor=current_user.full_name,
        actor_user_id=current_user.id,
        entity_type="MedicineOrder",
        entity_id=order.id,
        patient_id=current_user.id,
        meta={"items": len(items_json), "total_amount": total_amount},
    )
    create_service_request(
        session,
        patient_name=order.patient_name,
        patient_id=current_user.id,
        service="pharmacy",
        request_type="Medicine",
        amount=total_amount,
        source_type="medicine_order",
        source_id=order.id,
        notes=f"{len(items_json)} item(s)",
    )
    session.commit()
    session.refresh(order)
    
    return MedicineOrderResponse(
        id=order.id,
        user_id=order.user_id,
        patient_name=order.patient_name,
        patient_phone=order.patient_phone,
        delivery_address=order.delivery_address,
        items=[
            {
                "medicine_id": item["medicine_id"],
                "medicine_name": item["medicine_name"],
                "quantity": item["quantity"],
                "price": item["price"],
            }
            for item in items_json
        ],
        total_amount=order.total_amount,
        prescription_image=order.prescription_image,
        notes=order.notes,
        status=order.status,
        created_at=order.created_at,
    )


@router.get("/orders/my", response_model=List[MedicineOrderResponse])
def get_my_orders(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[MedicineOrderResponse]:
    """Get all medicine orders for the current user."""
    query = select(MedicineOrder).where(
        MedicineOrder.user_id == current_user.id
    ).order_by(MedicineOrder.created_at.desc())
    
    orders = session.exec(query).all()
    
    return [
        MedicineOrderResponse(
            id=order.id,
            user_id=order.user_id,
            patient_name=order.patient_name,
            patient_phone=order.patient_phone,
            delivery_address=order.delivery_address,
            items=json.loads(order.items),
            total_amount=order.total_amount,
            prescription_image=order.prescription_image,
            notes=order.notes,
            status=order.status,
            created_at=order.created_at,
        )
        for order in orders
    ]


@router.get("/orders/all", response_model=List[MedicineOrderResponse])
def get_all_orders(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[MedicineOrderResponse]:
    """Get all medicine orders (admin only)."""
    query = select(MedicineOrder).order_by(MedicineOrder.created_at.desc())
    orders = session.exec(query).all()
    
    return [
        MedicineOrderResponse(
            id=order.id,
            user_id=order.user_id,
            patient_name=order.patient_name,
            patient_phone=order.patient_phone,
            delivery_address=order.delivery_address,
            items=json.loads(order.items),
            total_amount=order.total_amount,
            prescription_image=order.prescription_image,
            notes=order.notes,
            status=order.status,
            created_at=order.created_at,
        )
        for order in orders
    ]


@router.get("/orders/{order_id}", response_model=MedicineOrderResponse)
def get_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MedicineOrderResponse:
    """Get a specific medicine order by ID."""
    order = session.get(MedicineOrder, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Users can only view their own orders, admins can view all
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    
    return MedicineOrderResponse(
        id=order.id,
        user_id=order.user_id,
        patient_name=order.patient_name,
        patient_phone=order.patient_phone,
        delivery_address=order.delivery_address,
        items=json.loads(order.items),
        total_amount=order.total_amount,
        prescription_image=order.prescription_image,
        notes=order.notes,
        status=order.status,
        created_at=order.created_at,
    )


@router.patch("/orders/{order_id}/cancel", response_model=MedicineOrderResponse)
def cancel_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MedicineOrderResponse:
    """Cancel a medicine order."""
    order = session.get(MedicineOrder, order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Users can only cancel their own orders
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    if order.status in ["delivered", "cancelled"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot cancel order with status: {order.status}"
        )
    
    # Restore stock for cancelled orders
    items = json.loads(order.items)
    for item in items:
        medicine = session.get(Medicine, item["medicine_id"])
        if medicine:
            medicine.stock += item["quantity"]
            session.add(medicine)
    
    order.status = "cancelled"
    session.add(order)
    session.commit()
    session.refresh(order)
    
    return MedicineOrderResponse(
        id=order.id,
        user_id=order.user_id,
        patient_name=order.patient_name,
        patient_phone=order.patient_phone,
        delivery_address=order.delivery_address,
        items=json.loads(order.items),
        total_amount=order.total_amount,
        prescription_image=order.prescription_image,
        notes=order.notes,
        status=order.status,
        created_at=order.created_at,
    )


@router.patch("/orders/{order_id}/status", response_model=MedicineOrderResponse)
def update_order_status(
    order_id: int,
    status_update: MedicineOrderStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> MedicineOrderResponse:
    """Update medicine order status (admin only)."""
    order = session.get(MedicineOrder, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_update.status
    session.add(order)
    session.commit()
    session.refresh(order)

    return MedicineOrderResponse(
        id=order.id,
        user_id=order.user_id,
        patient_name=order.patient_name,
        patient_phone=order.patient_phone,
        delivery_address=order.delivery_address,
        items=json.loads(order.items),
        total_amount=order.total_amount,
        prescription_image=order.prescription_image,
        notes=order.notes,
        status=order.status,
        created_at=order.created_at,
    )


# ========== Prescription Submission Endpoints ==========

@router.post("/prescriptions", response_model=PrescriptionSubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_prescription(
    data: PrescriptionSubmissionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PrescriptionSubmissionResponse:
    """Submit a prescription image for review."""
    submission = PrescriptionSubmission(
        user_id=current_user.id,
        image_data=data.image_data,
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)

    return PrescriptionSubmissionResponse(
        id=submission.id,
        user_id=submission.user_id,
        image_data=submission.image_data,
        status=submission.status,
        admin_notes=submission.admin_notes,
        created_at=submission.created_at,
    )


@router.get("/prescriptions/my", response_model=List[PrescriptionSubmissionResponse])
def get_my_prescriptions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[PrescriptionSubmissionResponse]:
    """Get current user's prescription submissions."""
    submissions = session.exec(
        select(PrescriptionSubmission)
        .where(PrescriptionSubmission.user_id == current_user.id)
        .order_by(PrescriptionSubmission.created_at.desc())
    ).all()
    return [
        PrescriptionSubmissionResponse(
            id=s.id,
            user_id=s.user_id,
            image_data=s.image_data,
            status=s.status,
            admin_notes=s.admin_notes,
            created_at=s.created_at,
        )
        for s in submissions
    ]


@router.get("/prescriptions/all", response_model=List[PrescriptionSubmissionResponse])
def get_all_prescriptions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[PrescriptionSubmissionResponse]:
    """Get all prescription submissions (admin only)."""
    submissions = session.exec(
        select(PrescriptionSubmission).order_by(PrescriptionSubmission.created_at.desc())
    ).all()

    return [
        PrescriptionSubmissionResponse(
            id=s.id,
            user_id=s.user_id,
            image_data=s.image_data,
            status=s.status,
            admin_notes=s.admin_notes,
            created_at=s.created_at,
        )
        for s in submissions
    ]


@router.patch("/prescriptions/{submission_id}/status", response_model=PrescriptionSubmissionResponse)
def update_prescription_status(
    submission_id: int,
    status_update: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> PrescriptionSubmissionResponse:
    """Update prescription submission status (admin only).

    When a prescription is moved to ``reviewed`` it is converted into a
    medicine order (visible in the Orders tab) so the pharmacy can fulfil it.
    """
    submission = session.get(PrescriptionSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Prescription not found")

    new_status = status_update.get("status")
    was_reviewed = submission.status == "reviewed"

    if "admin_notes" in status_update:
        submission.admin_notes = status_update["admin_notes"]

    # Convert to an order the first time it is reviewed.
    if new_status == "reviewed" and not was_reviewed:
        if submission.user_id is None:
            raise HTTPException(
                status_code=400,
                detail="Cannot create an order for an anonymous prescription.",
            )

        customer = session.get(User, submission.user_id)
        note = f"Created from prescription #{submission.id}"
        if submission.admin_notes:
            note = f"{note}. {submission.admin_notes}"

        order = MedicineOrder(
            user_id=submission.user_id,
            patient_name=customer.full_name if customer else "Prescription Customer",
            patient_phone=(customer.phone if customer and customer.phone else ""),
            delivery_address="To be confirmed with customer",
            items=json.dumps([]),
            total_amount=0,
            prescription_image=submission.image_data,
            notes=note,
            status="confirmed",
        )
        session.add(order)

    if new_status is not None:
        submission.status = new_status

    session.add(submission)
    session.commit()
    session.refresh(submission)

    return PrescriptionSubmissionResponse(
        id=submission.id,
        user_id=submission.user_id,
        image_data=submission.image_data,
        status=submission.status,
        admin_notes=submission.admin_notes,
        created_at=submission.created_at,
    )
