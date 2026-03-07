from __future__ import annotations
import os
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, desc, update

from app.db.session import get_db, AsyncSessionLocal
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
from app.db.models.customer import Customer

# Intelligence Core
from app.services.ai_service import ai_core

# Core dependencies
try:
    from server import neural_thought
except ImportError:
    async def neural_thought(msg: str, level: str = "info"):
        pass

from pydantic import BaseModel

router = APIRouter()

# ═══════════════════════════════════════════════════════════════
# 📌 VIP RADAR & PROFILING
# ═══════════════════════════════════════════════════════════════

@router.get("/admin/vip-roster")
async def get_vip_roster(db: AsyncSession = Depends(get_db)):
    """VIP müşteri listesi — bookings tablosundan derlenir."""
    try:
        stmt = (
            select(Customer.full_name.label("customer_name"), func.count(Booking.id).label("visits"),
                   func.sum(Booking.price_snapshot).label("total_spend"))
            .join(Booking, Booking.customer_id == Customer.id)
            .where(Customer.full_name.isnot(None))
            .group_by(Customer.full_name)
            .order_by(desc("total_spend"))
            .limit(10)
        )
        res = await db.execute(stmt)
        rows = res.fetchall()
        roster = [
            {"name": r.customer_name, "visits": r.visits,
             "total_spend": float(r.total_spend or 0), "tier": "VIP" if float(r.total_spend or 0) > 500 else "Regular"}
            for r in rows
        ]
    except Exception:
        # Fallback: boş tablo ya da model yoksa mock döndür
        roster = [
            {"name": "—", "visits": 0, "total_spend": 0.0, "tier": "—"}
        ]
    return {"status": "success", "roster": roster, "total": len(roster)}


class ProfileRequest(BaseModel):
    customer_id: str

@router.post("/guest/generate-profile")
async def generate_vip_profile(payload: ProfileRequest, db: AsyncSession = Depends(get_db)):
    """Phase G - Gemini-powered VIP Profiler"""
    import json as _json, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(payload.customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")
        
    booking_res = await db.execute(
        select(Service.name, Booking.status)
        .join(Booking, Booking.service_id == Service.id)
        .where(Booking.customer_id == cust.id)
        .order_by(Booking.created_at.desc())
        .limit(10)
    )
    history = [{"service": r[0], "status": r[1].name} for r in booking_res.fetchall()]

    prefs = {}
    if cust.preferences_json:
        try:
            prefs = _json.loads(cust.preferences_json)
        except Exception:
            pass

    ai_persona = await ai_core.generate_vip_persona(
        full_name=cust.full_name,
        total_spend=float(cust.total_spent or 0),
        history=history,
        prefs=prefs
    )

    cust.ai_persona_summary = ai_persona
    await db.commit()

    return {
        "status": "success", 
        "guest_name": cust.full_name, 
        "new_persona_summary": ai_persona
    }


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE P – CONCIERGE MEMORY ENGINE
# ═══════════════════════════════════════════════════════════════

@router.get("/guests/{customer_id}/memory")
async def get_guest_memory(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Phase P – Read Concierge Memory for a guest."""
    import json as _json, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")

    prefs = {}
    if cust.preferences_json:
        try:
            prefs = _json.loads(cust.preferences_json)
        except Exception:
            prefs = {}

    return {
        "status":      "success",
        "guest_id":    str(cust.id),
        "guest_name":  cust.full_name,
        "preferences": prefs,
        "ai_notes":    cust.ai_notes    or "",
        "vibe_check":  cust.vibe_check  or "unknown",
        "medical_notes": "[ENCRYPTED — omitted]" if cust.medical_notes else None,
        "persona":     cust.ai_persona_summary or ""
    }


@router.patch("/guests/{customer_id}/memory")
async def update_guest_memory(customer_id: str, payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Phase P – Update Concierge Memory."""
    import json as _json, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")

    if "preferences" in payload:
        cust.preferences_json = _json.dumps(payload["preferences"], ensure_ascii=False)
    if "ai_notes" in payload:
        cust.ai_notes = payload["ai_notes"]
    if "vibe_check" in payload:
        cust.vibe_check = payload["vibe_check"]
    if "medical_notes" in payload:
        cust.medical_notes = payload["medical_notes"]

    await db.commit()

    # Phase N: neural whisper
    from server import neural_thought
    await neural_thought(
        f"Memory Updated → {cust.full_name} | vibe: {cust.vibe_check or '–'} | prefs saved",
        level="info"
    )

    return {"status": "success", "guest_name": cust.full_name, "updated": list(payload.keys())}


@router.post("/guests/{customer_id}/memory/ai-observe")
async def ai_observe_guest(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Phase P – Gemini generates a real-time psychological observation from booking history."""
    import json as _json, uuid as _uuid
    cust = await db.get(Customer, _uuid.UUID(customer_id))
    if not cust:
        raise HTTPException(status_code=404, detail="Guest not found")

    # Booking history context
    booking_res = await db.execute(
        select(Service.name, Booking.created_at)
        .join(Booking, Booking.service_id == Service.id)
        .where(Booking.customer_id == cust.id)
        .order_by(Booking.created_at.desc())
        .limit(10)
    )
    history = [{"service": r[0], "date": r[1].strftime("%b %d")} for r in booking_res.fetchall()]

    prefs = {}
    if cust.preferences_json:
        try:
            prefs = _json.loads(cust.preferences_json)
        except Exception:
            pass

    ai_note = await ai_core.get_guest_observation(
        guest_name=cust.full_name,
        history=history,
        prefs=prefs,
        ai_persona_summary=cust.ai_persona_summary
    )

    # Save to DB
    cust.ai_notes = ai_note
    await db.commit()

    # Flashback to Neural Stream
    from server import neural_thought
    await neural_thought(
        f"Memory ∷ {cust.full_name} — {ai_note}",
        level="info"
    )

    return {"status": "success", "guest_name": cust.full_name, "ai_observation": ai_note}


async def flashback_trigger(customer_id: str, service_name: str, db: AsyncSession):
    """
    Phase P – Flashback: rezervasyon anında misafirin hafızasını Neural Stream'e yansıt.
    Called from create_booking hook.
    """
    import json as _json
    try:
        from app.db.models.customer import Customer
        from server import neural_thought
        import uuid as _uuid
        cust = await db.get(Customer, _uuid.UUID(customer_id))
        if not cust:
            return

        prefs = {}
        if cust.preferences_json:
            try:
                prefs = _json.loads(cust.preferences_json)
            except Exception:
                pass

        lines = []
        if prefs.get("allergy"):
            lines.append(f"⚠ Allergy: {prefs['allergy']}")
        if prefs.get("temp"):
            lines.append(f"🌡 Preferred temp: {prefs['temp']}°C")
        if prefs.get("pressure"):
            lines.append(f"💆 Pressure: {prefs['pressure']}")
        if cust.vibe_check and cust.vibe_check != "unknown":
            lines.append(f"Vibe: {cust.vibe_check}")
        if cust.ai_notes:
            lines.append(cust.ai_notes[:100])

        if lines:
            msg = f"Santis Memory ∷ {cust.full_name} → {service_name} | " + " | ".join(lines)
            await neural_thought(msg, level="alert" if prefs.get("allergy") else "info")
    except Exception as e:
        print(f"[Phase P] Flashback error: {e}")


# ═══════════════════════════════════════════════════════════════
# 📌 PHASE K – GUEST DNA CLUSTERING ENGINE
# ═══════════════════════════════════════════════════════════════

DNA_CATEGORY_KEYWORDS = {
    "THERMAL":   ["hamam", "sauna", "steam", "termal", "thermal", "royal", "bath", "kese"],
    "AESTHETIC": ["facial", "sothys", "cilt", "skin", "diamond", "youth", "care", "glow"],
    "RECOVERY":  ["massage", "masaj", "thai", "deep", "tissue", "shiatsu", "bali", "aromaterapi"],
    "WELLNESS":  ["ritual", "journey", "ayurveda", "detox", "relax", "harmony", "balance", "continental"],
}

DNA_PERSONAS = {
    "THERMAL":   {"label": "🔥 THERMAL DEVOTEE",   "tagline": "Fire & Steam — Purification as ritual."},
    "AESTHETIC": {"label": "💎 AESTHETIC ELITE",    "tagline": "Precision beauty. Zero compromise."},
    "RECOVERY":  {"label": "⚡ RECOVERY ATHLETE",  "tagline": "High-intensity life demands high-intensity recovery."},
    "WELLNESS":  {"label": "🌿 WELLNESS RITUALIST", "tagline": "Slow living. Deep presence. Balanced energy."},
    "UNDEFINED": {"label": "◈ UNCLASSIFIED",        "tagline": "Exploring the full Santis spectrum."},
}

def classify_dna(service_names: list) -> tuple:
    scores = {k: 0 for k in DNA_CATEGORY_KEYWORDS}
    for name in service_names:
        name_lower = name.lower()
        for cat, keywords in DNA_CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in name_lower:
                    scores[cat] += 1
    total = sum(scores.values()) or 1
    pct   = {k: round(v / total * 100, 1) for k, v in scores.items()}
    top   = max(scores, key=scores.get)
    if scores[top] == 0:
        top = "UNDEFINED"
    return top, pct


@router.get("/guests/clusters")
@router.get("/api/v1/guests/clusters")  # Compatibility for any internal hardcoded fetches passing prefix
async def get_guest_dna_clusters(generate_ai: bool = False, db: AsyncSession = Depends(get_db)):
    """Phase K – Guest DNA Clustering Engine."""
    cust_res = await db.execute(
        select(Customer)
        # .where(Customer.is_active == True)
        .order_by(Customer.total_spent.desc())
        .limit(30)
    )
    customers = cust_res.scalars().all()

    profiles = []
    cluster_counts = {"THERMAL": 0, "AESTHETIC": 0, "RECOVERY": 0, "WELLNESS": 0, "UNDEFINED": 0}

    for c in customers:
        bookings_res = await db.execute(
            select(Service.name)
            .join(Booking, Booking.service_id == Service.id)
            .where(Booking.customer_id == c.id)
        )
        svc_names = [r[0] for r in bookings_res.fetchall()]

        dna_type, pct = classify_dna(svc_names)
        persona = DNA_PERSONAS.get(dna_type, DNA_PERSONAS["UNDEFINED"])
        cluster_counts[dna_type] = cluster_counts.get(dna_type, 0) + 1

        ai_tagline = persona["tagline"]
        if generate_ai and svc_names:
            ai_tagline = await ai_core.get_dna_persona(
                guest_name=c.full_name,
                dna_type=dna_type,
                svc_names=svc_names,
                total_spent=float(c.total_spent or 0),
                default_tagline=persona["tagline"]
            )

        profiles.append({
            "id":          str(c.id),
            "name":        c.full_name,
            "dna_type":    dna_type,
            "label":       persona["label"],
            "tagline":     ai_tagline,
            "scores_pct":  pct,
            "services":    svc_names[:4],
            "visit_count": int(c.visit_count or 0),
            "total_spent": float(c.total_spent or 0),
        })

    return {
        "status":          "success",
        "total_analyzed":  len(profiles),
        "cluster_summary": cluster_counts,
        "profiles":        profiles
    }
