from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from decimal import Decimal
import uuid

from app.db.models.commission import StaffCommission, CommissionType
from app.db.models.revenue import DailyRevenue
from app.db.models.customer import Customer

async def calculate_commission(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    staff_id: uuid.UUID,
    service_id: uuid.UUID,
    price: float
) -> float:
    """
    Calculates commission for a booking based on StaffCommission rules.
    Priority:
    1. Specific Service Rule for Staff
    2. General Rule for Staff (service_id is NULL)
    3. Default 0.0
    """
    # 1. Specific Service Rule
    stmt = select(StaffCommission).where(
        StaffCommission.staff_id == staff_id,
        StaffCommission.service_id == service_id,
        StaffCommission.tenant_id == tenant_id
    )
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    
    if not rule:
        # 2. General Rule
        stmt = select(StaffCommission).where(
            StaffCommission.staff_id == staff_id,
            StaffCommission.service_id.is_(None),
            StaffCommission.tenant_id == tenant_id
        )
        result = await db.execute(stmt)
        rule = result.scalar_one_or_none()
    
    if not rule:
        return 0.0

    if rule.type == CommissionType.PERCENTAGE:
        return float(Decimal(str(price)) * (Decimal(str(rule.value)) / 100))
    elif rule.type == CommissionType.FIXED:
        return float(rule.value)
    
    return 0.0

async def update_revenue_analytics(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    amount: float,
    booking_date: date
):
    """
    Updates DailyRevenue cache. Atomic increment simulation.
    """
    # Check if entry exists
    stmt = select(DailyRevenue).where(
        DailyRevenue.tenant_id == tenant_id,
        DailyRevenue.date == booking_date
    )
    result = await db.execute(stmt)
    revenue_entry = result.scalar_one_or_none()

    if not revenue_entry:
        revenue_entry = DailyRevenue(
            tenant_id=tenant_id,
            date=booking_date,
            daily_revenue=0.0,
            booking_count=0
        )
        db.add(revenue_entry)
        # Flush to get ID if needed, but we just need instance for update
    
    revenue_entry.daily_revenue = float(Decimal(str(revenue_entry.daily_revenue)) + Decimal(str(amount)))
    revenue_entry.booking_count += 1
