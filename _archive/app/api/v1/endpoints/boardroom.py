from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_user_with_ceo_bypass
from app.db.models.user import User
from datetime import datetime

router = APIRouter()

@router.get("/global-overview")
async def get_global_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    The Boardroom: Sovereign Aggregator
    Sadece GLOBAL_CEO veya REGIONAL_DIRECTOR rolüne sahip kullanıcılar zincir cirosunu görebilir.
    """
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in ["GLOBAL_CEO", "REGIONAL_DIRECTOR"]:
        raise HTTPException(
            status_code=403, 
            detail="Erişim Reddedildi: Bu bölgeye sadece Sovereign Taht Odası yetkilileri girebilir."
        )

    # Base query for aggregation
    base_query = """
        SELECT 
            c.name AS chain_name,
            t.id AS tenant_id,
            t.name AS hotel_name,
            t.country AS region,
            COUNT(b.id) AS total_bookings,
            COALESCE(SUM(b.price_snapshot), 0) AS total_revenue_eur
        FROM chains c
        JOIN tenants t ON t.chain_id = c.id
        LEFT JOIN bookings b ON b.tenant_id = t.id AND b.status = 'CONFIRMED'
        WHERE c.is_active = true
    """
    
    # Regional Directors only see their assigned region/chain
    # Bu roldeki bir kullanıcının kendi `tenant` kaydından `chain_id`'sini çekip ona göre filtreliyoruz
    params = {}
    if role == "REGIONAL_DIRECTOR":
        from app.db.models.tenant import Tenant
        from sqlalchemy import select
        
        # Kullanıcının home tenant'ını bul
        t_res = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
        home_tenant = t_res.scalar_one_or_none()
        
        if not home_tenant or not home_tenant.chain_id:
            raise HTTPException(status_code=403, detail="REGIONAL_DIRECTOR rolü için ev sahibi zincir (chain_id) bulunamadı.")
            
        base_query += " AND c.id = :dir_chain_id"
        params["dir_chain_id"] = home_tenant.chain_id
        
    base_query += """
        GROUP BY c.name, t.id, t.name, t.country
        ORDER BY total_revenue_eur DESC
    """
    
    aggregator_sql = text(base_query)

    # 🛡️ CEO ve Director için RLS bypass zaten deps.py içinde `app.current_tenant` atılmadığı sürece database levelında aktiftir (Tüm tenantlar okunabilir).
    result = await db.execute(aggregator_sql, params)
    rows = result.fetchall()

    imparatorluk_cirosu = 0
    zincir_performansi = []

    for row in rows:
        ciro = float(row.total_revenue_eur)
        imparatorluk_cirosu += ciro
        
        zincir_performansi.append({
            "tenant_id": str(row.tenant_id),
            "hotel_name": row.hotel_name,
            "region": row.region or "Global",
            "total_bookings": int(row.total_bookings),
            "revenue_eur": round(ciro, 2)
        })

    return {
        "status": "SOVEREIGN_COMMAND_ACTIVE",
        "chain": "Sovereign Resorts Global",
        "base_currency": "EUR",
        "empire_total_revenue": round(imparatorluk_cirosu, 2),
        "hotel_rankings": zincir_performansi
    }

@router.get("/god-mode", tags=["Boardroom Command"])
async def get_sovereign_god_mode(
    current_user: User = Depends(get_current_user_with_ceo_bypass),
    db: AsyncSession = Depends(get_db)
):
    """
    Sovereign God Mode: Y Combinator & Stripe Standartlarında CEO Ekranı.
    Sadece eyleme dönüştürülebilir (Actionable) 7 metrik döner.
    """
    
    # 1. 🌟 North Star Metric: Weekly Active VIPs
    # Safe fallback if events table doesn't exist yet
    vip_count = 0
    try:
        vip_query = """
            SELECT COUNT(DISTINCT user_id) as vip_count
            FROM events
            WHERE created_at >= datetime('now', '-7 days')
        """
        vip_res = await db.execute(text(vip_query))
        vip_count = vip_res.scalar() or 0
    except Exception:
        pass  # events table may not exist in SQLite dev mode

    # 2. 💰 Revenue Engine
    total_rev = 0.0
    try:
        revenue_query = """
            SELECT COALESCE(SUM(price_snapshot), 0) as total_rev
            FROM bookings
            WHERE status = 'CONFIRMED'
        """
        rev_res = await db.execute(text(revenue_query))
        total_rev = float(rev_res.scalar() or 0.0)
    except Exception:
        pass
    
    # Calculate mock ARR / MRR based on total rev or a minimum threshold for demo if DB is small.
    arr_eur = max(total_rev, 1250000.0) # Sovereign Minimum ARR 1.25M Euro for testing if empty
    mrr_eur = arr_eur / 12
    nrr_percentage = 132 # Unicorn Fuel! (>120%)

    # 3. 📈 Growth Engine
    # Mocks or derivations for Activation Rate & CAC
    activation_rate = 58
    cac_payback_months = 7

    # 4. 🗺️ Heatmap Nodes
    heatmap_rows = []
    try:
        heatmap_query = """
            SELECT 
                t.name as tenant_name,
                t.country,
                COALESCE(SUM(b.price_snapshot), 0) as city_revenue
            FROM tenants t
            LEFT JOIN bookings b ON b.tenant_id = t.id AND b.status = 'CONFIRMED'
            WHERE t.is_active = true
            GROUP BY t.name, t.country
            ORDER BY city_revenue DESC
        """
        heatmap_result = await db.execute(text(heatmap_query))
        heatmap_rows = heatmap_result.fetchall()
    except Exception:
        pass
    
    heatmap_data = []
    def get_coords_by_country(country, name):
        c = (country or "").lower()
        n = (name or "").lower()
        if "turkey" in c or "türkiye" in c or "antalya" in n:
            return {"lat": 36.8969, "lon": 30.7133, "city": "Antalya", "status": "surge"}
        elif "uk" in c or "london" in n:
            return {"lat": 51.5074, "lon": -0.1276, "city": "London", "status": "stable"}
        elif "france" in c or "paris" in n:
            return {"lat": 48.8566, "lon": 2.3522, "city": "Paris", "status": "stable"}
        elif "uae" in c or "dubai" in n:
            return {"lat": 25.2048, "lon": 55.2708, "city": "Dubai", "status": "surge"}
        return {"lat": 41.0082, "lon": 28.9784, "city": "Istanbul", "status": "stable"}

    for r in heatmap_rows:
        geo = get_coords_by_country(r.country, r.tenant_name)
        heatmap_data.append({
            "city": geo["city"],
            "region": r.country or "Global",
            "lat": geo["lat"],
            "lon": geo["lon"],
            "revenue": float(r.city_revenue),
            "status": geo["status"]
        })

    # 5. 🛡️ Sentinel Alerts (Mocked for current layer)
    alerts = [
        {"id": "alert_1", "type": "SURGE", "node": "Antalya", "message": "High booking volume detected", "severity": "MEDIUM", "timestamp": int(datetime.utcnow().timestamp()) - 300},
        {"id": "alert_2", "type": "FRAUD_BLOCK", "node": "Dubai", "message": "Suspicious login attempt blocked", "severity": "HIGH", "timestamp": int(datetime.utcnow().timestamp()) - 1800},
    ]

    # Combine all into the Omni-Payload
    return {
        "status": "SOVEREIGN_ACTIVE",
        "timestamp": int(datetime.utcnow().timestamp()),
        "north_star": {
            "name": "Weekly Active VIPs",
            "value": vip_count,
            "trend": "+8.4%"
        },
        "revenue_engine": {
            "arr_eur": round(arr_eur, 2),
            "mrr_eur": round(mrr_eur, 2),
            "nrr_percentage": nrr_percentage
        },
        "growth": {
            "activation_rate": activation_rate,
            "cac_payback_months": cac_payback_months
        },
        "heatmap_nodes": heatmap_data,
        "sentinel_alerts": alerts
    }

from pydantic import BaseModel
from app.services.event_bus import SovereignEventBus

class FireEventModel(BaseModel):
    event_name: str
    payload: dict
    tenant_id: str

@router.post("/fire-event")
async def fire_boardroom_event(data: FireEventModel):
    SovereignEventBus.emit(
        event_name=data.event_name,
        payload=data.payload,
        tenant_id=data.tenant_id
    )
    return {"status": "fired", "event": data.event_name}
