from __future__ import annotations
import os
import random
import asyncio
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, desc, update

from app.db.session import get_db, AsyncSessionLocal
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
from app.db.models.customer import Customer
from app.db.models.revenue import DailyRevenue
from app.db.models.tenant import Tenant
from pydantic import BaseModel
from typing import Optional

# We import the Intelligence Core for AI features
from app.services.ai_service import ai_core

# Core deps
from app.core.websocket import manager

router = APIRouter()

@router.get("/admin/revenue")
async def get_admin_revenue(period: str = "today", db: AsyncSession = Depends(get_db)):
    today = date.today()
    if period == "today":
        start_date = today
    elif period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    else:
        start_date = today

    # Aggregate Revenue
    gross_res = await db.execute(
        select(func.sum(DailyRevenue.daily_revenue))
        .where(DailyRevenue.date >= start_date)
    )
    gbv = float(gross_res.scalar() or 0.0)
    net_revenue = gbv * 0.20 # Assume 20% platform cut

    # AOV based on Bookings table for the period
    aov_res = await db.execute(
        select(func.avg(Booking.price_snapshot))
        .where(func.date(Booking.created_at) >= start_date)
    )
    raw_aov = float(aov_res.scalar() or 0.0)
    aov = raw_aov if raw_aov else 126.0

    return {
        "status": "success",
        "data": {
            "gbv": f"€{gbv:,.0f}",
            "net": f"€{net_revenue:,.0f}",
            "aov": f"€{aov:,.0f}",
            "top_service": "Deep Tissue Massage <br/><span class='text-sm text-gray-400 font-normal'>Trending</span>"
        }
    }

@router.get("/forecast")
async def get_revenue_forecast(db: AsyncSession = Depends(get_db)):
    """
    Yield Forecast Engine:
    - Gerçek booking verisinden günlük/haftalık/aylık gelir özeti
    - Surge multiplier'dan AI tahmini
    - Basit backtesting accuracy skoru
    """
    now = datetime.utcnow()
    day_start   = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start  = day_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    # — Gerçek Gelir Sorguları —
    async def sum_bookings(since: datetime) -> float:
        res = await db.execute(
            select(func.sum(Booking.price_snapshot))
            .where(Booking.created_at >= since)
            .where(Booking.status == BookingStatus.CONFIRMED)
        )
        return float(res.scalar() or 0)

    today_rev   = await sum_bookings(day_start)
    week_rev    = await sum_bookings(week_start)
    month_rev   = await sum_bookings(month_start)

    # — Booking Count —
    count_res = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= day_start)
    )
    today_count = int(count_res.scalar() or 0)

    # — Surge Factor: Demand Multiplier Ortalaması —
    try:
        surge_res = await db.execute(select(func.avg(Service.demand_multiplier)))
        avg_surge = float(surge_res.scalar() or 1.0)
    except Exception:
        avg_surge = 1.0

    # — Forecast: Gün sonu tahmini (saat bazlı ekstrapolasyon) —
    elapsed_hours = max(1, (now - day_start).seconds // 3600)
    daily_run_rate = today_rev / elapsed_hours if elapsed_hours > 0 else 0
    projected_eod  = daily_run_rate * 24 * avg_surge
    projected_eom  = month_rev + (projected_eod * (30 - now.day))

    # — Backtesting: Dün tahmin vs gerçek —
    yesterday_start = day_start - timedelta(days=1)
    yesterday_rev   = await sum_bookings(yesterday_start)
    # Basit accuracy: bugünkü tahmin / dün gerçek (demo)
    forecast_accuracy = round(min(100, (min(projected_eod, yesterday_rev + 0.01) /
                                        max(yesterday_rev, projected_eod, 1)) * 100), 1) if yesterday_rev > 0 else None

    # — Surge Gain (Surge'siz baz ile fark) —
    base_rev   = today_rev / avg_surge if avg_surge > 0 else today_rev
    surge_gain = round(today_rev - base_rev, 2)

    return {
        "status": "success",
        "snapshot_time": now.isoformat(),
        "avg_surge_factor": round(avg_surge, 3),
        "today": {
            "bookings": today_count,
            "revenue": round(today_rev, 2),
            "surge_gain": surge_gain,
            "projected_eod": round(projected_eod, 2)
        },
        "week":  {"revenue": round(week_rev, 2)},
        "month": {"revenue": round(month_rev, 2), "projected_eom": round(projected_eom, 2)},
        "backtesting": {
            "yesterday_actual": round(yesterday_rev, 2),
            "forecast_accuracy_pct": forecast_accuracy
        }
    }


@router.get("/ltv-churn")
async def get_ltv_churn(db: AsyncSession = Depends(get_db)):
    """
    LTV & Churn Radar:
    - Her müşteri için Lifetime Value ve churn riski
    - 60+ gün gelmeyenler → CHURN ALERT
    """
    now = datetime.utcnow()
    CHURN_THRESHOLD_DAYS = 60
    AVG_VISIT_INTERVAL_DAYS = 30  # beklenen ziyaret aralığı

    cust_res = await db.execute(
        select(Customer)
        .options(selectinload(Customer.bookings))
        .order_by(Customer.total_spent.desc())
        .limit(50)
    )
    customers = cust_res.scalars().all()

    profiles = []
    total_ltv = 0.0
    churn_alerts = []

    for c in customers:
        visits = int(c.visit_count or len(c.bookings or []))
        total  = float(c.total_spent or 0)
        avg_per_visit = (total / visits) if visits > 0 else 0

        # LTV: Basit modelde → toplam_harcama × beklenen_residual_ömür (ziyaret × 12 ay)
        residual_visits = max(0, 24 - visits)  # 2 yıllık ömür varsayımı
        ltv = round(total + avg_per_visit * residual_visits, 2)

        # Churn
        days_since = None
        churn_risk = "LOW"
        if c.last_visit:
            days_since = (now - c.last_visit).days
            if days_since > CHURN_THRESHOLD_DAYS:
                churn_risk = "HIGH"
                churn_alerts.append({
                    "name": c.full_name,
                    "days_absent": days_since,
                    "ltv_at_risk": ltv
                })
            elif days_since > CHURN_THRESHOLD_DAYS // 2:
                churn_risk = "MEDIUM"

        total_ltv += ltv
        profiles.append({
            "id": str(c.id),
            "name": c.full_name,
            "visits": visits,
            "total_spent": total,
            "avg_per_visit": round(avg_per_visit, 2),
            "ltv": ltv,
            "days_since_visit": days_since,
            "churn_risk": churn_risk
        })

    # Revenue at risk from high-churn customers
    rev_at_risk = sum(a["ltv_at_risk"] for a in churn_alerts)

    return {
        "status": "success",
        "total_ltv_portfolio": round(total_ltv, 2),
        "churn_alerts": churn_alerts,
        "revenue_at_risk": round(rev_at_risk, 2),
        "profiles": profiles
    }


@router.post("/ai-boost")
async def get_ai_revenue_boost(db: AsyncSession = Depends(get_db)):
    """
    AI Revenue Boost (Gemini):
    Mevcut kapasiteyi, booking verisini ve surge'ü analiz edip
    aksiyon odaklı gelir artırma önerisi üretir.
    """
    now = datetime.utcnow()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Veri topla
    today_res = await db.execute(
        select(func.sum(Booking.price_snapshot), func.count(Booking.id))
        .where(Booking.created_at >= day_start)
        .where(Booking.status == BookingStatus.CONFIRMED)
    )
    row = today_res.one()
    today_rev   = float(row[0] or 0)
    today_count = int(row[1] or 0)

    # En popüler servis
    top_svc_res = await db.execute(
        select(Service.name, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.service_id == Service.id)
        .where(Booking.created_at >= day_start - timedelta(days=7))
        .group_by(Service.name)
        .order_by(desc("cnt"))
        .limit(3)
    )
    top_services = [r[0] for r in top_svc_res.fetchall()]

    # High-LTV müşteri sayısı
    vip_res = await db.execute(
        select(func.count(Customer.id)).where(Customer.total_spent >= 1000)
    )
    vip_count = int(vip_res.scalar() or 0)

    elapsed_hours = max(1, (now - day_start).seconds // 3600)
    remaining_hours = max(1, 24 - elapsed_hours)
    run_rate = today_rev / elapsed_hours

    # Gemini AI Aksiyon Önerisi via Intelligence Core
    boost_suggestion = await ai_core.get_revenue_boost_advice(
        run_rate=run_rate,
        remaining_hours=remaining_hours,
        top_services=top_services
    )

    projected_extra = round(run_rate * remaining_hours * 0.25, 2)

    return {
        "status": "success",
        "snapshot_time": now.isoformat(),
        "today_revenue": today_rev,
        "today_bookings": today_count,
        "run_rate_per_hour": round(run_rate, 2),
        "remaining_hours": remaining_hours,
        "projected_extra_revenue": projected_extra,
        "top_services": top_services,
        "vip_count": vip_count,
        "ai_boost_suggestion": boost_suggestion
    }

@router.get("/occupancy")
async def get_revenue_occupancy(db: AsyncSession = Depends(get_db)):
    """Mock Occupancy & Surge data for Sovereign Pulse Dashboard"""
    now = datetime.utcnow()
    # Mocking data to feed dashboard
    current_multiplier = round(random.uniform(1.0, 1.5), 2)
    surge_active = current_multiplier > 1.1
    
    return {
        "status": "AUTO_PILOT",
        "current_multiplier": current_multiplier,
        "surge_active": surge_active,
        "local_occupancy_pct": f"{random.randint(40, 95)}%",
        "page_demand_active": "High" if surge_active else "Nominal",
        "timestamp": now.isoformat()
    }

@router.get("/predict")
async def get_revenue_predict(db: AsyncSession = Depends(get_db)):
    """Mock Prediction History & Forecast for Dashboard Chart"""
    # 10 historic data points
    history = [round(random.uniform(0.9, 1.4), 2) for _ in range(10)]
    # 5 forecast data points
    forecast = [round(random.uniform(1.0, 1.6), 2) for _ in range(5)]
    
    return {
        "history": history,
        "forecast": forecast
    }


@router.post("/flash-recovery/simulate")
async def simulate_flash_recovery(db: AsyncSession = Depends(get_db)):
    """Test Phase M without a real cancellation — simulates a 2h-ahead slot."""
    # We import the trigger from server to avoid circular dependency
    from server import flash_recovery_trigger
    
    res = await db.execute(select(Booking).where(Booking.status == BookingStatus.CONFIRMED).limit(1))
    b = res.scalars().first()
    if not b:
        raise HTTPException(status_code=404, detail="No confirmed bookings to simulate.")

    future_start = (datetime.utcnow() + timedelta(hours=2)).isoformat()
    asyncio.create_task(flash_recovery_trigger(
        booking_id=str(b.id),
        service_id=str(b.service_id),
        start_time=future_start,
        hours_left=2.0
    ))
    return {"status": "simulating", "message": "Flash Recovery triggered — watch HQ WebSocket for FLASH_RECOVERY_OFFER event."}


class PowerMovePayload(BaseModel):
    action: str
    target_category: str = "all"
    multiplier: float = 1.0

@router.post("/admin/execute-power-move")
async def execute_power_move(payload: PowerMovePayload, db: AsyncSession = Depends(get_db)):
    """
    Santis V22 'The Oracle Pulse' endpoint.
    Executes a strategic move recommended by the Executive Report.
    """
    try:
        # Update demand_multiplier in database
        # For simplicity, if target is 'all', apply to all services
        if payload.target_category == "all" or not payload.target_category:
            await db.execute(
                update(Service).values(demand_multiplier=payload.multiplier)
            )
        else:
            await db.execute(
                update(Service).where(Service.name.ilike(f"%{payload.target_category}%")).values(demand_multiplier=payload.multiplier)
            )
        
        await db.commit()
        
        from datetime import timezone
        # Broadcast the surge status to HQ Dashboard and open clients
        surge_event = {
            "type": "SURGE_UPDATED",
            "category": payload.target_category,
            "multiplier": payload.multiplier,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await manager.broadcast_global(surge_event)
        
        return JSONResponse(content={"status": "success", "message": f"Power Move Executed: {payload.action}", "multiplier": payload.multiplier})
        
    except Exception as e:
        await db.rollback()
        return JSONResponse(status_code=500, content={"error": str(e)})

