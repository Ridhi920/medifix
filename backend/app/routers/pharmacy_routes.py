import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from ..core.auth import get_current_user, get_current_admin_user
from ..core.db import get_session
from ..core.logbook import log_activity
from ..core.service_requests import create_service_request
from ..models import Medicine, MedicineOrder, PharmacyStore, PrescriptionSubmission, User
from ..schemas import (
    MedicineCreate,
    MedicineOrderCreate,
    MedicineOrderResponse,
    MedicineOrderStatusUpdate,
    MedicineResponse,
    MedicineUpdate,
    MultiStoreOrderCreate,
    PharmacyStoreCreate,
    PharmacyStoreResponse,
    PharmacyStoreUpdate,
    PrescriptionSubmissionCreate,
    PrescriptionSubmissionResponse,
)

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])


# ========== Serialisation helpers ==========

def _medicine_response(medicine: Medicine, store_name: str | None = None) -> MedicineResponse:
    return MedicineResponse(
        id=medicine.id,
        store_id=medicine.store_id,
        store_name=store_name,
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


def _order_response(order: MedicineOrder, items: list[dict] | None = None) -> MedicineOrderResponse:
    return MedicineOrderResponse(
        id=order.id,
        user_id=order.user_id,
        store_id=order.store_id,
        store_name=order.store_name,
        patient_name=order.patient_name,
        patient_phone=order.patient_phone,
        delivery_address=order.delivery_address,
        items=items if items is not None else json.loads(order.items),
        total_amount=order.total_amount,
        prescription_image=order.prescription_image,
        notes=order.notes,
        status=order.status,
        created_at=order.created_at,
    )


def _store_response(store: PharmacyStore, medicine_count: int = 0) -> PharmacyStoreResponse:
    return PharmacyStoreResponse(
        id=store.id,
        name=store.name,
        address=store.address,
        city=store.city,
        phone=store.phone,
        image=store.image,
        rating=store.rating,
        delivery_time=store.delivery_time,
        opening_hours=store.opening_hours,
        latitude=store.latitude,
        longitude=store.longitude,
        is_active=store.is_active,
        medicine_count=medicine_count,
        created_at=store.created_at,
    )


def _store_names(session: Session, store_ids: set[int]) -> dict[int, str]:
    """Map store id -> name for the given ids (one query, no N+1)."""
    ids = {sid for sid in store_ids if sid is not None}
    if not ids:
        return {}
    stores = session.exec(select(PharmacyStore).where(PharmacyStore.id.in_(ids))).all()
    return {s.id: s.name for s in stores}


# ========== Pharmacy Store Endpoints ==========

@router.get("/stores", response_model=List[PharmacyStoreResponse])
def get_stores(
    search: str | None = Query(None),
    city: str | None = Query(None),
    active_only: bool = Query(True),
    session: Session = Depends(get_session),
) -> List[PharmacyStoreResponse]:
    """List pharmacy stores the user can order from.

    Each row carries `medicine_count` — how many active medicines that store
    currently has on the shelf — so the app can show "N medicines available".
    """
    query = select(PharmacyStore)

    if active_only:
        query = query.where(PharmacyStore.is_active == True)

    if city and city != "All":
        query = query.where(PharmacyStore.city == city)

    if search:
        term = f"%{search}%"
        query = query.where(
            (PharmacyStore.name.ilike(term)) | (PharmacyStore.address.ilike(term))
        )

    stores = session.exec(query.order_by(PharmacyStore.name)).all()

    counts = dict(
        session.exec(
            select(Medicine.store_id, func.count(Medicine.id))
            .where(Medicine.is_active == True)
            .where(Medicine.store_id.is_not(None))
            .group_by(Medicine.store_id)
        ).all()
    )

    return [_store_response(store, counts.get(store.id, 0)) for store in stores]


@router.get("/stores/{store_id}", response_model=PharmacyStoreResponse)
def get_store(
    store_id: int,
    session: Session = Depends(get_session),
) -> PharmacyStoreResponse:
    """Get a single pharmacy store by ID."""
    store = session.get(PharmacyStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Pharmacy store not found")

    count = session.exec(
        select(func.count(Medicine.id))
        .where(Medicine.store_id == store_id)
        .where(Medicine.is_active == True)
    ).one()

    return _store_response(store, count)


@router.post("/stores", response_model=PharmacyStoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    store_data: PharmacyStoreCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> PharmacyStoreResponse:
    """Create a pharmacy store (admin only)."""
    store = PharmacyStore(**store_data.model_dump())
    session.add(store)
    session.commit()
    session.refresh(store)
    return _store_response(store, 0)


@router.put("/stores/{store_id}", response_model=PharmacyStoreResponse)
def update_store(
    store_id: int,
    store_data: PharmacyStoreUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> PharmacyStoreResponse:
    """Update a pharmacy store (admin only)."""
    store = session.get(PharmacyStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Pharmacy store not found")

    for key, value in store_data.model_dump(exclude_unset=True).items():
        setattr(store, key, value)

    session.add(store)
    session.commit()
    session.refresh(store)

    count = session.exec(
        select(func.count(Medicine.id))
        .where(Medicine.store_id == store_id)
        .where(Medicine.is_active == True)
    ).one()

    return _store_response(store, count)


@router.patch("/stores/{store_id}/toggle-status", response_model=dict)
def toggle_store_status(
    store_id: int,
    is_active: bool,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> dict:
    """Open or close a pharmacy store (admin only)."""
    store = session.get(PharmacyStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Pharmacy store not found")

    store.is_active = is_active
    session.add(store)
    session.commit()

    return {"message": f"Store {'opened' if is_active else 'closed'} successfully"}


@router.delete("/stores/{store_id}", response_model=dict)
def delete_store(
    store_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> dict:
    """Delete a pharmacy store (admin only).

    Refused while the store still stocks medicines — deactivate it instead so
    past orders keep pointing at a real store.
    """
    store = session.get(PharmacyStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Pharmacy store not found")

    stocked = session.exec(
        select(func.count(Medicine.id)).where(Medicine.store_id == store_id)
    ).one()
    if stocked:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{store.name} still has {stocked} medicine(s). Move or delete them "
                "first, or close the store instead of deleting it."
            ),
        )

    # Deleting a store a vendor account owns would leave that account pointing
    # at nothing, so it can't log in to a working workspace.
    owner = session.exec(
        select(User).where(User.role == "pharmacy").where(User.vendor_id == store_id)
    ).first()
    if owner:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{store.name} belongs to the vendor account {owner.email}. Delete that "
                "vendor account first, or close the store instead."
            ),
        )

    session.delete(store)
    session.commit()

    return {"message": "Pharmacy store deleted successfully"}


# ========== Medicine Management Endpoints ==========

@router.get("/medicines", response_model=List[MedicineResponse])
def get_medicines(
    category: str | None = Query(None),
    search: str | None = Query(None),
    store_id: int | None = Query(None, description="Only medicines stocked by this store"),
    active_only: bool = Query(True),
    session: Session = Depends(get_session),
) -> List[MedicineResponse]:
    """Get all medicines with optional filtering."""
    query = select(Medicine)

    if active_only:
        query = query.where(Medicine.is_active == True)

    if store_id is not None:
        query = query.where(Medicine.store_id == store_id)

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

    names = _store_names(session, {m.store_id for m in medicines})

    return [_medicine_response(m, names.get(m.store_id)) for m in medicines]


@router.get("/medicines/{medicine_id}", response_model=MedicineResponse)
def get_medicine(
    medicine_id: int,
    session: Session = Depends(get_session),
) -> MedicineResponse:
    """Get a single medicine by ID."""
    medicine = session.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    names = _store_names(session, {medicine.store_id})
    return _medicine_response(medicine, names.get(medicine.store_id))


def _require_store(session: Session, store_id: int | None) -> PharmacyStore | None:
    if store_id is None:
        return None
    store = session.get(PharmacyStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail=f"Pharmacy store with ID {store_id} not found")
    return store


@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    medicine_data: MedicineCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> MedicineResponse:
    """Create a new medicine on a store's shelf (admin only)."""
    store = _require_store(session, medicine_data.store_id)

    medicine = Medicine(
        store_id=medicine_data.store_id,
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

    return _medicine_response(medicine, store.name if store else None)


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
    if "store_id" in update_data:
        _require_store(session, update_data["store_id"])

    for key, value in update_data.items():
        setattr(medicine, key, value)

    session.add(medicine)
    session.commit()
    session.refresh(medicine)

    names = _store_names(session, {medicine.store_id})
    return _medicine_response(medicine, names.get(medicine.store_id))


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

def _build_order(
    session: Session,
    *,
    current_user: User,
    patient_name: str,
    patient_phone: str,
    delivery_address: str,
    items,
    store_id: int | None,
    prescription_image: str | None,
    notes: str | None,
) -> tuple[MedicineOrder, list[dict]]:
    """Validate one store's basket, decrement stock and stage the order.

    Adds the order (and its logbook / service-request rows) to the session
    without committing, so a multi-store checkout either lands whole or not at
    all. Returns the staged order and its decoded item list.
    """
    resolved_store = _require_store(session, store_id)
    total_amount = 0
    items_json: list[dict] = []

    for item in items:
        medicine = session.get(Medicine, item.medicine_id)
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine with ID {item.medicine_id} not found")

        if not medicine.is_active:
            raise HTTPException(status_code=400, detail=f"{medicine.name} is not available")

        # Every item in one order must come from the same store. When the
        # caller did not name a store we adopt the first medicine's store.
        if resolved_store is None and medicine.store_id is not None:
            resolved_store = session.get(PharmacyStore, medicine.store_id)
        elif resolved_store is not None and medicine.store_id != resolved_store.id:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{medicine.name} is not sold by {resolved_store.name}. "
                    "Items from different stores must be ordered separately."
                ),
            )

        if resolved_store is not None and not resolved_store.is_active:
            raise HTTPException(
                status_code=400,
                detail=f"{resolved_store.name} is currently closed and cannot take orders.",
            )

        if medicine.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {medicine.name}. Available: {medicine.stock}",
            )

        medicine.stock -= item.quantity
        session.add(medicine)

        total_amount += medicine.price * item.quantity

        items_json.append({
            "medicine_id": item.medicine_id,
            "medicine_name": medicine.name,
            "quantity": item.quantity,
            "price": medicine.price,
        })

    order = MedicineOrder(
        user_id=current_user.id,
        store_id=resolved_store.id if resolved_store else None,
        store_name=resolved_store.name if resolved_store else None,
        patient_name=patient_name,
        patient_phone=patient_phone,
        delivery_address=delivery_address,
        items=json.dumps(items_json),
        total_amount=total_amount,
        prescription_image=prescription_image,
        notes=notes,
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
        meta={
            "items": len(items_json),
            "total_amount": total_amount,
            "store": order.store_name,
        },
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
        provider_id=order.store_id,
        provider_name=order.store_name,
        notes=f"{len(items_json)} item(s)"
        + (f" from {order.store_name}" if order.store_name else ""),
    )

    return order, items_json


@router.post("/orders", response_model=MedicineOrderResponse, status_code=status.HTTP_201_CREATED)
def create_medicine_order(
    order_data: MedicineOrderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> MedicineOrderResponse:
    """Create a new medicine order from a single store."""
    order, items_json = _build_order(
        session,
        current_user=current_user,
        patient_name=order_data.patient_name,
        patient_phone=order_data.patient_phone,
        delivery_address=order_data.delivery_address,
        items=order_data.items,
        store_id=order_data.store_id,
        prescription_image=order_data.prescription_image,
        notes=order_data.notes,
    )
    session.commit()
    session.refresh(order)

    return _order_response(order, items_json)


@router.post(
    "/orders/multi-store",
    response_model=List[MedicineOrderResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_multi_store_order(
    order_data: MultiStoreOrderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[MedicineOrderResponse]:
    """Check out a cart spanning several pharmacies at once.

    One MedicineOrder is created per store, all sharing the same delivery
    details. The whole checkout is a single transaction: if any store's basket
    fails validation (closed store, out of stock) nothing is placed.
    """
    seen: set[int] = set()
    for cart in order_data.carts:
        if cart.store_id in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Store {cart.store_id} appears more than once in the cart.",
            )
        seen.add(cart.store_id)
        if not cart.items:
            raise HTTPException(
                status_code=400,
                detail=f"Store {cart.store_id} has no items in the cart.",
            )

    staged: list[tuple[MedicineOrder, list[dict]]] = []
    for cart in order_data.carts:
        staged.append(
            _build_order(
                session,
                current_user=current_user,
                patient_name=order_data.patient_name,
                patient_phone=order_data.patient_phone,
                delivery_address=order_data.delivery_address,
                items=cart.items,
                store_id=cart.store_id,
                prescription_image=order_data.prescription_image,
                notes=order_data.notes,
            )
        )

    session.commit()

    responses = []
    for order, items_json in staged:
        session.refresh(order)
        responses.append(_order_response(order, items_json))
    return responses


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

    return [_order_response(order) for order in orders]


@router.get("/orders/all", response_model=List[MedicineOrderResponse])
def get_all_orders(
    store_id: int | None = Query(None, description="Only orders fulfilled by this store"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin_user),
) -> List[MedicineOrderResponse]:
    """Get all medicine orders (admin only)."""
    query = select(MedicineOrder)
    if store_id is not None:
        query = query.where(MedicineOrder.store_id == store_id)
    orders = session.exec(query.order_by(MedicineOrder.created_at.desc())).all()

    return [_order_response(order) for order in orders]


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

    return _order_response(order)


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

    return _order_response(order)


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

    return _order_response(order)


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
