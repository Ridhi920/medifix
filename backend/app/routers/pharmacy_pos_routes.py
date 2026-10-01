"""Point-of-sale workspace for pharmacy vendors.

Everything here is scoped to the logged-in vendor's own store (users.vendor_id
-> pharmacy_stores.id): walk-in customers, supplier purchases (which create
stock batches), counter sales (which draw batches down earliest-expiry first),
and the numbers behind the dashboard and reports.

`Medicine.stock` stays the single source of truth for "how many can be sold"
because the mobile app reads it for online orders; purchases add to it and
sales subtract from it. Batches track the expiry/lot detail underneath.
"""

from __future__ import annotations

import json
from datetime import date, datetime, time, timedelta, timezone, tzinfo
from functools import lru_cache
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, func, select, text

from ..core.auth import get_current_vendor_user
from ..core.db import engine, get_session
from ..core.logbook import log_activity
from ..models import (
    Medicine,
    MedicineOrder,
    PharmacyCustomer,
    PharmacyPurchase,
    PharmacySale,
    PharmacyStore,
    StockBatch,
    User,
)
from .vendor_routes import _require_own_store

router = APIRouter(prefix="/vendor/pharmacy", tags=["pharmacy-pos"])

EXPIRY_WARNING_DAYS = 90


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _day_start(d: date, tz: int = 0) -> datetime:
    """Midnight of `d` in the caller's timezone, as UTC. `tz` is the browser's
    getTimezoneOffset() in minutes (IST is -330)."""
    return datetime.combine(d, time.min, tzinfo=timezone.utc) + timedelta(minutes=tz)


def _local_today(tz: int) -> date:
    return (_now() - timedelta(minutes=tz)).date()


# Browser timezone offset for date filters, so "today" means the user's today.
TZ_QUERY = Query(default=0, ge=-840, le=840)


def _date_range(stmt, column, start: date | None, end: date | None, tz: int = 0):
    if start:
        stmt = stmt.where(column >= _day_start(start, tz))
    if end:
        stmt = stmt.where(column < _day_start(end + timedelta(days=1), tz))
    return stmt


@lru_cache(maxsize=1)
def _db_timezone() -> tzinfo:
    """Postgres stores our aware datetimes in `timestamp without time zone`
    columns converted to the session TimeZone, so naive values read back are
    wall-clock times in that zone (not UTC)."""
    try:
        with engine.connect() as conn:
            return ZoneInfo(conn.execute(text("SHOW TimeZone")).scalar() or "UTC")
    except Exception:
        return timezone.utc


def _aware(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=_db_timezone())
    return dt


# ── Customers ─────────────────────────────────────────────────────────────

class CustomerIn(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str | None = None
    email: str | None = None
    address: str | None = None


def _own_customer(store: PharmacyStore, customer_id: int, session: Session) -> PharmacyCustomer:
    customer = session.get(PharmacyCustomer, customer_id)
    if customer is None or customer.store_id != store.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


def _customer_out(c: PharmacyCustomer, stats: dict[int, tuple[int, float, float]]) -> dict:
    count, spent, due = stats.get(c.id, (0, 0.0, 0.0))
    return {
        **c.model_dump(),
        "total_purchases": count,
        "total_spent": round(spent, 2),
        "balance_due": round(due, 2),
    }


def _customer_stats(store_id: int, session: Session) -> dict[int, tuple[int, float, float]]:
    rows = session.exec(
        select(
            PharmacySale.customer_id,
            func.count(PharmacySale.id),
            func.coalesce(func.sum(PharmacySale.total), 0),
            func.coalesce(func.sum(PharmacySale.total - PharmacySale.paid_amount), 0),
        )
        .where(PharmacySale.store_id == store_id, PharmacySale.customer_id.is_not(None))
        .group_by(PharmacySale.customer_id)
    ).all()
    return {cid: (n, float(spent), float(due)) for cid, n, spent, due in rows}


@router.get("/customers")
def list_customers(
    search: str | None = None,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    store = _require_own_store(vendor, session)
    stmt = select(PharmacyCustomer).where(PharmacyCustomer.store_id == store.id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            PharmacyCustomer.name.ilike(like) | PharmacyCustomer.phone.ilike(like) | PharmacyCustomer.email.ilike(like)
        )
    customers = session.exec(stmt.order_by(PharmacyCustomer.name)).all()
    stats = _customer_stats(store.id, session)
    return [_customer_out(c, stats) for c in customers]


@router.post("/customers", status_code=status.HTTP_201_CREATED)
def create_customer(
    body: CustomerIn,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    store = _require_own_store(vendor, session)
    customer = PharmacyCustomer(store_id=store.id, **body.model_dump())
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return _customer_out(customer, {})


@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    body: CustomerIn,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    store = _require_own_store(vendor, session)
    customer = _own_customer(store, customer_id, session)
    for field, value in body.model_dump().items():
        setattr(customer, field, value)
    customer.updated_at = _now()
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return _customer_out(customer, _customer_stats(store.id, session))


@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    store = _require_own_store(vendor, session)
    customer = _own_customer(store, customer_id, session)
    # Keep past receipts readable: they already carry the customer's name.
    for sale in session.exec(select(PharmacySale).where(PharmacySale.customer_id == customer.id)).all():
        sale.customer_id = None
        session.add(sale)
    session.delete(customer)
    session.commit()
    return {"message": "Customer deleted"}


# ── Batches / stock ───────────────────────────────────────────────────────

def _batch_out(b: StockBatch, medicine: Medicine | None) -> dict:
    expiry = _aware(b.expiry_date)
    today = _now().astimezone(_db_timezone()).date()
    days_left = (expiry.astimezone(_db_timezone()).date() - today).days if expiry else None
    return {
        **b.model_dump(),
        "medicine_name": medicine.name if medicine else "—",
        "generic_name": medicine.generic_name if medicine else None,
        "unit": medicine.dosage_form if medicine else None,
        "days_to_expiry": days_left,
        "expiry_status": (
            None if days_left is None
            else "expired" if days_left < 0
            else "expiring" if days_left <= EXPIRY_WARNING_DAYS
            else "ok"
        ),
    }


@router.get("/batches")
def list_batches(
    medicine_id: int | None = None,
    include_empty: bool = False,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    store = _require_own_store(vendor, session)
    stmt = select(StockBatch).where(StockBatch.store_id == store.id)
    if medicine_id is not None:
        stmt = stmt.where(StockBatch.medicine_id == medicine_id)
    if not include_empty:
        stmt = stmt.where(StockBatch.quantity > 0)
    batches = session.exec(stmt.order_by(StockBatch.expiry_date)).all()
    meds = {m.id: m for m in session.exec(select(Medicine).where(Medicine.store_id == store.id)).all()}
    return [_batch_out(b, meds.get(b.medicine_id)) for b in batches]


@router.delete("/batches/{batch_id}")
def write_off_batch(
    batch_id: int,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Write off a batch (e.g. expired stock); its units leave sellable stock."""
    store = _require_own_store(vendor, session)
    batch = session.get(StockBatch, batch_id)
    if batch is None or batch.store_id != store.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    medicine = session.get(Medicine, batch.medicine_id)
    if medicine:
        medicine.stock = max(0, medicine.stock - batch.quantity)
        medicine.updated_at = _now()
        session.add(medicine)
    log_activity(
        session, action="Batch Written Off", module="Pharmacy", actor=vendor.full_name,
        actor_user_id=vendor.id, entity_type="StockBatch", entity_id=batch.id, provider_id=store.id,
        meta={"batch_no": batch.batch_no, "quantity": batch.quantity},
    )
    session.delete(batch)
    session.commit()
    return {"message": "Batch written off"}


# ── Purchases ─────────────────────────────────────────────────────────────

class PurchaseItemIn(BaseModel):
    medicine_id: int
    batch_no: str = Field(..., min_length=1)
    expiry_date: date | None = None
    quantity: int = Field(..., gt=0)
    purchase_price: float = Field(..., ge=0)
    sale_price: float | None = Field(default=None, ge=0)


class PurchaseIn(BaseModel):
    tz: int = Field(default=0, ge=-840, le=840)
    supplier_name: str = Field(..., min_length=1)
    invoice_no: str | None = None
    purchase_date: date | None = None
    notes: str | None = None
    items: list[PurchaseItemIn] = Field(..., min_length=1)


def _purchase_out(p: PharmacyPurchase) -> dict:
    items = json.loads(p.items or "[]")
    return {**p.model_dump(exclude={"items"}), "items": items, "item_count": len(items)}


@router.get("/purchases")
def list_purchases(
    start: date | None = None,
    end: date | None = None,
    tz: int = TZ_QUERY,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    store = _require_own_store(vendor, session)
    stmt = _date_range(select(PharmacyPurchase).where(PharmacyPurchase.store_id == store.id),
                       PharmacyPurchase.purchase_date, start, end, tz)
    rows = session.exec(stmt.order_by(PharmacyPurchase.purchase_date.desc(), PharmacyPurchase.id.desc())).all()
    return [_purchase_out(p) for p in rows]


@router.post("/purchases", status_code=status.HTTP_201_CREATED)
def create_purchase(
    body: PurchaseIn,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Record a supplier purchase: one stock batch per line, stock goes up."""
    store = _require_own_store(vendor, session)
    # A back-dated invoice lands at local noon so it stays on that day in any report.
    purchase_date = (
        _day_start(body.purchase_date, body.tz) + timedelta(hours=12)
        if body.purchase_date and body.purchase_date != _local_today(body.tz)
        else _now()
    )
    purchase = PharmacyPurchase(
        store_id=store.id, supplier_name=body.supplier_name.strip(), invoice_no=body.invoice_no,
        purchase_date=purchase_date, notes=body.notes,
    )
    session.add(purchase)
    session.flush()

    lines, total = [], 0.0
    for item in body.items:
        medicine = session.get(Medicine, item.medicine_id)
        if medicine is None or medicine.store_id != store.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Medicine {item.medicine_id} is not in your store")
        sale_price = item.sale_price if item.sale_price is not None else float(medicine.price)
        session.add(StockBatch(
            store_id=store.id, medicine_id=medicine.id, purchase_id=purchase.id, batch_no=item.batch_no.strip(),
            expiry_date=_day_start(item.expiry_date) if item.expiry_date else None, quantity=item.quantity,
            purchase_price=item.purchase_price, sale_price=sale_price,
        ))
        medicine.stock += item.quantity
        medicine.updated_at = _now()
        session.add(medicine)
        amount = round(item.quantity * item.purchase_price, 2)
        total += amount
        lines.append({
            "medicine_id": medicine.id, "medicine_name": medicine.name, "batch_no": item.batch_no.strip(),
            "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None, "quantity": item.quantity,
            "purchase_price": item.purchase_price, "sale_price": sale_price, "amount": amount,
        })

    purchase.items = json.dumps(lines)
    purchase.total_amount = round(total, 2)
    session.add(purchase)
    log_activity(
        session, action="Stock Purchased", module="Pharmacy", actor=vendor.full_name, actor_user_id=vendor.id,
        entity_type="PharmacyPurchase", entity_id=purchase.id, provider_id=store.id,
        meta={"supplier": purchase.supplier_name, "items": len(lines), "total": purchase.total_amount},
    )
    session.commit()
    session.refresh(purchase)
    return _purchase_out(purchase)


# ── Sales (POS) ───────────────────────────────────────────────────────────

class SaleItemIn(BaseModel):
    medicine_id: int
    quantity: int = Field(..., gt=0)
    price: float | None = Field(default=None, ge=0)  # defaults to the medicine's MRP


class SaleIn(BaseModel):
    tz: int = Field(default=0, ge=-840, le=840)
    customer_id: int | None = None
    sale_type: str = Field(default="cash", pattern="^(cash|credit)$")
    discount: float = Field(default=0, ge=0)
    paid_amount: float | None = Field(default=None, ge=0)
    items: list[SaleItemIn] = Field(..., min_length=1)


def _sale_out(s: PharmacySale) -> dict:
    items = json.loads(s.items or "[]")
    return {**s.model_dump(exclude={"items"}), "items": items, "item_count": len(items),
            "balance_due": round(s.total - s.paid_amount, 2)}


def _next_receipt_no(store_id: int, session: Session, tz: int = 0) -> str:
    today = _local_today(tz)
    prefix = f"INV-{today:%Y%m%d}-"
    count = session.exec(
        select(func.count(PharmacySale.id)).where(
            PharmacySale.store_id == store_id, PharmacySale.receipt_no.startswith(prefix)
        )
    ).one()
    return f"{prefix}{count + 1:04d}"


@router.get("/sales")
def list_sales(
    start: date | None = None,
    end: date | None = None,
    customer_id: int | None = None,
    tz: int = TZ_QUERY,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    store = _require_own_store(vendor, session)
    stmt = _date_range(select(PharmacySale).where(PharmacySale.store_id == store.id), PharmacySale.created_at, start, end, tz)
    if customer_id is not None:
        stmt = stmt.where(PharmacySale.customer_id == customer_id)
    return [_sale_out(s) for s in session.exec(stmt.order_by(PharmacySale.created_at.desc())).all()]


@router.post("/sales", status_code=status.HTTP_201_CREATED)
def create_sale(
    body: SaleIn,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Ring up a counter sale. Stock leaves earliest-expiring batches first;
    units not covered by any batch (stock entered without a purchase) simply
    come off the medicine's stock count."""
    store = _require_own_store(vendor, session)
    customer = _own_customer(store, body.customer_id, session) if body.customer_id else None
    if body.sale_type == "credit" and customer is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A credit sale needs a customer")

    lines, subtotal = [], 0.0
    for item in body.items:
        medicine = session.get(Medicine, item.medicine_id)
        if medicine is None or medicine.store_id != store.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Medicine {item.medicine_id} is not in your store")
        if medicine.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {medicine.stock} unit(s) of {medicine.name} in stock",
            )
        remaining = item.quantity
        batches = session.exec(
            select(StockBatch)
            .where(StockBatch.medicine_id == medicine.id, StockBatch.quantity > 0)
            .order_by(StockBatch.expiry_date.is_(None), StockBatch.expiry_date)
        ).all()
        used = []
        for batch in batches:
            if remaining == 0:
                break
            take = min(batch.quantity, remaining)
            batch.quantity -= take
            remaining -= take
            used.append(batch.batch_no)
            session.add(batch)
        medicine.stock -= item.quantity
        medicine.updated_at = _now()
        session.add(medicine)

        price = item.price if item.price is not None else float(medicine.price)
        amount = round(price * item.quantity, 2)
        subtotal += amount
        lines.append({
            "medicine_id": medicine.id, "medicine_name": medicine.name, "unit": medicine.dosage_form,
            "quantity": item.quantity, "price": price, "amount": amount, "batches": used,
        })

    subtotal = round(subtotal, 2)
    discount = min(round(body.discount, 2), subtotal)
    total = round(subtotal - discount, 2)
    if body.paid_amount is not None:
        paid = min(round(body.paid_amount, 2), total)
    else:
        paid = 0.0 if body.sale_type == "credit" else total

    sale = PharmacySale(
        store_id=store.id, receipt_no=_next_receipt_no(store.id, session, body.tz),
        customer_id=customer.id if customer else None, customer_name=customer.name if customer else "Walk-in",
        sale_type=body.sale_type, items=json.dumps(lines), subtotal=subtotal, discount=discount,
        total=total, paid_amount=paid,
    )
    session.add(sale)
    session.flush()
    log_activity(
        session, action="Counter Sale", module="Pharmacy", actor=vendor.full_name, actor_user_id=vendor.id,
        entity_type="PharmacySale", entity_id=sale.id, provider_id=store.id,
        meta={"receipt_no": sale.receipt_no, "total": total, "type": body.sale_type},
    )
    session.commit()
    session.refresh(sale)
    return _sale_out(sale)


@router.post("/sales/{sale_id}/payment")
def record_payment(
    sale_id: int,
    amount: float = Query(..., gt=0),
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    """Collect money against an outstanding credit sale."""
    store = _require_own_store(vendor, session)
    sale = session.get(PharmacySale, sale_id)
    if sale is None or sale.store_id != store.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
    sale.paid_amount = round(min(sale.total, sale.paid_amount + amount), 2)
    session.add(sale)
    session.commit()
    session.refresh(sale)
    return _sale_out(sale)


# ── Dashboard ─────────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard(
    tz: int = TZ_QUERY,
    vendor: User = Depends(get_current_vendor_user),
    session: Session = Depends(get_session),
) -> dict:
    store = _require_own_store(vendor, session)
    now = _now()
    local_today = _local_today(tz)
    today = _day_start(local_today, tz)
    month_start = _day_start(local_today.replace(day=1), tz)
    week_start = today - timedelta(days=6)

    sales = session.exec(
        select(PharmacySale).where(PharmacySale.store_id == store.id, PharmacySale.created_at >= min(week_start, month_start))
    ).all()
    today_sales = [s for s in sales if _aware(s.created_at) >= today]
    month_sales = [s for s in sales if _aware(s.created_at) >= month_start]

    daily = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        nxt = day + timedelta(days=1)
        day_sales = [s for s in sales if day <= _aware(s.created_at) < nxt]
        daily.append({"date": (local_today - timedelta(days=6 - i)).isoformat(), "revenue": round(sum(s.total for s in day_sales), 2), "orders": len(day_sales)})

    medicines = session.exec(select(Medicine).where(Medicine.store_id == store.id)).all()
    low_stock = sorted([m for m in medicines if m.is_active and m.stock <= m.min_stock], key=lambda m: m.stock)
    batches = session.exec(
        select(StockBatch).where(StockBatch.store_id == store.id, StockBatch.quantity > 0, StockBatch.expiry_date.is_not(None))
    ).all()
    expiring = [b for b in batches if now <= _aware(b.expiry_date) <= now + timedelta(days=EXPIRY_WARNING_DAYS)]
    expired = [b for b in batches if _aware(b.expiry_date) < now]
    meds_by_id = {m.id: m for m in medicines}

    credit_due = session.exec(
        select(func.coalesce(func.sum(PharmacySale.total - PharmacySale.paid_amount), 0)).where(PharmacySale.store_id == store.id)
    ).one()
    pending_orders = session.exec(
        select(func.count(MedicineOrder.id)).where(
            MedicineOrder.store_id == store.id, MedicineOrder.status.in_(["pending", "confirmed", "preparing"])
        )
    ).one()
    recent = session.exec(
        select(PharmacySale).where(PharmacySale.store_id == store.id).order_by(PharmacySale.created_at.desc()).limit(6)
    ).all()

    return {
        "store_name": store.name,
        "today_revenue": round(sum(s.total for s in today_sales), 2),
        "today_orders": len(today_sales),
        "month_revenue": round(sum(s.total for s in month_sales), 2),
        "month_orders": len(month_sales),
        "total_medicines": len(medicines),
        "stock_value": round(sum(m.stock * m.price for m in medicines), 2),
        "low_stock_count": len(low_stock),
        "expiring_count": len(expiring),
        "expired_count": len(expired),
        "credit_due": round(float(credit_due), 2),
        "pending_online_orders": pending_orders,
        "daily_sales": daily,
        "recent_sales": [_sale_out(s) for s in recent],
        "low_stock": [
            {"id": m.id, "name": m.name, "stock": m.stock, "min_stock": m.min_stock, "unit": m.dosage_form}
            for m in low_stock[:6]
        ],
        "expiring_soon": [_batch_out(b, meds_by_id.get(b.medicine_id)) for b in sorted(expiring, key=lambda b: b.expiry_date)[:6]],
    }
