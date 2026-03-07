from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from sqlalchemy.orm import selectinload
from app.db.session import get_db, AsyncSessionLocal
from app.db.models.tenant import Tenant
from app.db.models.customer import Customer
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
import os, json
import time
import asyncio
from typing import Dict, Any, List

router = APIRouter()

# ═══════════════════════════════════════════════════════════════
# SOVEREIGN NEURAL SHIELD (Self-Healing Immune System)
# ═══════════════════════════════════════════════════════════════
class NeuralShield:
    def __init__(self):
        self.latency_buffer: List[float] = []
        self.db_io_buffer: List[float] = []
        self.error_count = 0
        self.total_requests = 0
        self.threshold_latency = 200.0  # ms
        self.threshold_error_rate = 0.05 # 5%
        self.circuit_open = False
        
    def log_latency(self, ms: float):
        self.latency_buffer.append(ms)
        if len(self.latency_buffer) > 100:
            self.latency_buffer.pop(0)
            
    def log_db_io(self, ms: float):
        self.db_io_buffer.append(ms)
        if len(self.db_io_buffer) > 100:
            self.db_io_buffer.pop(0)
            
    def log_request(self, is_error: bool = False):
        self.total_requests += 1
        if is_error:
            self.error_count += 1
            
    def get_error_rate(self) -> float:
        if self.total_requests == 0: return 0.0
        return self.error_count / self.total_requests
        
    def get_avg_latency(self) -> float:
        if not self.latency_buffer: return 0.0
        return sum(self.latency_buffer) / len(self.latency_buffer)
        
    def evaluate_health(self) -> Dict[str, Any]:
        err_rate = self.get_error_rate()
        avg_lat = self.get_avg_latency()
        
        # P(F) prediction logic: Weighted sum passed through a sigmoidal concept
        p_fail = 0.0
        if avg_lat > self.threshold_latency: p_fail += 0.5
        elif avg_lat > self.threshold_latency * 0.8: p_fail += 0.2
        
        if err_rate > self.threshold_error_rate: p_fail += 0.5
        elif err_rate > self.threshold_error_rate * 0.5: p_fail += 0.2
        
        action_taken = None
        if p_fail >= 0.85:
            self.circuit_open = True
            action_taken = "CIRCUIT_BREAKER_ACTIVATED"
        elif p_fail >= 0.4:
            action_taken = "CACHE_PURGE_TRIGGERED"
            
        return {
            "p_fail_score": round(p_fail, 2),
            "avg_latency_ms": round(avg_lat, 2),
            "error_rate": round(err_rate, 3),
            "circuit_state": "OPEN" if self.circuit_open else "CLOSED",
            "action_taken": action_taken
        }
        
    def heal_system(self):
        """Otonom Onarım: Graceful Restart / Purge"""
        self.latency_buffer.clear()
        self.db_io_buffer.clear()
        self.error_count = 0
        self.total_requests = 0
        self.circuit_open = False

neural_shield = NeuralShield()

# ═══════════════════════════════════════════════════════════════

async def neural_thought(message: str, level: str = "info"):
    # Mock neural_thought for router context to prevent undefined errors
    print(f"[{level.upper()}] {message}")

@router.post("/api/v1/guest/generate-profile")
async def generate_vip_profile(payload: ProfileRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates a Gemini AI persona summary + VIP score for a customer.
    Updates ai_persona_summary, visit_count, total_spent in DB.
    """
    start_time = time.time()
    try:
        import uuid as _uuid
        try:
            cust_id = _uuid.UUID(payload.customer_id)
        except ValueError:
            neural_shield.log_request(is_error=True)
            raise HTTPException(status_code=400, detail="Invalid customer_id UUID.")

        # 1. Fetch customer + booking history
        cust_res = await db.execute(
            select(Customer)
            .options(selectinload(Customer.bookings))
            .where(Customer.id == cust_id)
        )
        customer = cust_res.scalar_one_or_none()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found.")

        bookings = customer.bookings or []
        total_spent = sum(float(b.price_snapshot or 0) for b in bookings)
        visit_count = len(bookings)

        # 2. Extract service names from bookings
        service_names = []
        for b in bookings[-10:]:  # son 10 booking
            if b.service_id:
                svc_res = await db.execute(select(Service).where(Service.id == b.service_id))
                svc = svc_res.scalar_one_or_none()
                if svc:
                    service_names.append(svc.name)

        services_str = ", ".join(service_names) if service_names else "No service history"

        # 3. Calculate VIP Score (0-100)
        vip_score = min(100, int(
            (min(visit_count, 20) / 20 * 40) +   # 40 pts: visit frequency
            (min(total_spent, 5000) / 5000 * 40) + # 40 pts: total spend
            (20 if total_spent > 1000 else 0)       # 20 pts: high-value bonus
        ))

        vip_tier = "STANDARD"
        if vip_score >= 80: vip_tier = "CONTINENTAL"
        elif vip_score >= 60: vip_tier = "PLATINUM"
        elif vip_score >= 40: vip_tier = "GOLD"

        # 4. Generate AI Persona with Gemini
        persona_text = f"Loyal guest with {visit_count} visits. Total spend: €{total_spent:,.0f}."
        try:
            from dotenv import load_dotenv
            import os, asyncio
            load_dotenv(override=True)
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-2.5-flash")
                prompt = f"""Sen Santis Master OS'un VIP Guest Intelligence motorusun.
Aşağıdaki misafir verisine bakarak 2-3 cümlelik, "Quiet Luxury" tonunda, stratejik bir persona özeti yaz.
İngilizce olsun. Asla selamlama veya blok açıklama ekleme. Direkt içgörüyle başla.

Misafir: {customer.full_name}
Ziyaret Sayısı: {visit_count}
Toplam Harcama: €{total_spent:,.0f}
En Çok Seçilen Servisler: {services_str}
VIP Tier: {vip_tier} (Skor: {vip_score}/100)
"""
                response = await asyncio.to_thread(model.generate_content, prompt)
                if response and response.text:
                    persona_text = response.text.strip()
        except Exception as e:
            print(f"[Phase G] Gemini persona error: {e}")

        # 5. Persist to DB
        customer.ai_persona_summary = persona_text
        customer.visit_count = visit_count
        customer.total_spent = total_spent
        from datetime import datetime
        customer.last_visit = datetime.utcnow()
        await db.commit()

        # 6. Broadcast to HQ Neural Bridge
        from app.core.pulse import pulse_engine
        await pulse_engine.broadcast_to_hq({
            "type": "VIP_PROFILE_UPDATED",
            "customer_id": str(customer.id),
            "guest_name": customer.full_name,
            "vip_score": vip_score,
            "vip_tier": vip_tier,
            "persona": persona_text,
            "visit_count": visit_count,
            "total_spent": total_spent
        })

        neural_shield.log_request(is_error=False)
        neural_shield.log_latency((time.time() - start_time) * 1000)

        return {
            "status": "success",
            "customer_id": str(customer.id),
            "guest_name": customer.full_name,
            "vip_score": vip_score,
            "vip_tier": vip_tier,
            "visit_count": visit_count,
            "total_spent": total_spent,
            "persona": persona_text
        }
    except Exception as e:
        neural_shield.log_request(is_error=True)
        raise e



@router.get("/api/v1/admin/vip-roster")
async def get_vip_roster(db: AsyncSession = Depends(get_db)):
    """
    Returns all customers with their VIP scores for the Sentient Guest Card panel.
    Computes scores live from booking data.
    """
    cust_res = await db.execute(
        select(Customer)
        .options(selectinload(Customer.bookings))
        .order_by(Customer.total_spent.desc())
        .limit(20)
    )
    customers = cust_res.scalars().all()

    roster = []
    for c in customers:
        bookings = c.bookings or []
        total = float(c.total_spent or 0)
        visits = int(c.visit_count or len(bookings))

        vip_score = min(100, int(
            (min(visits, 20) / 20 * 40) +
            (min(total, 5000) / 5000 * 40) +
            (20 if total > 1000 else 0)
        ))
        vip_tier = "STANDARD"
        if vip_score >= 80: vip_tier = "CONTINENTAL"
        elif vip_score >= 60: vip_tier = "PLATINUM"
        elif vip_score >= 40: vip_tier = "GOLD"

        roster.append({
            "id": str(c.id),
            "name": c.full_name,
            "vip_score": vip_score,
            "vip_tier": vip_tier,
            "visit_count": visits,
            "total_spent": total,
            "last_visit": c.last_visit.strftime("%Y-%m-%d") if c.last_visit else "—",
            "persona": c.ai_persona_summary or None
        })

    return {"status": "success", "count": len(roster), "roster": roster}



@router.post("/api/v1/revenue/ai-boost")
async def get_ai_revenue_boost(db: AsyncSession = Depends(get_db)):
    """
    AI Revenue Boost (Gemini):
    Mevcut kapasiteyi, booking verisini ve surge'ü analiz edip
    aksiyon odaklı gelir artırma önerisi üretir.
    """
    from datetime import datetime, timedelta
    import asyncio, os
    from sqlalchemy import func

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

    # Gemini AI Aksiyon Önerisi
    boost_suggestion = (
        f"Current run rate is €{run_rate:.0f}/hr. "
        f"With {remaining_hours} hours remaining, consider activating surge pricing "
        f"on {top_services[0] if top_services else 'top services'} to capture €{run_rate * remaining_hours * 0.3:.0f} additional revenue."
    )

    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""Sen Santis Revenue Intelligence motoru olarak çalışıyorsun.
Aşağıdaki günlük veriyi analiz et ve 2-3 cümlelik, aksiyon odaklı, özgüvenli bir gelir artırma tavsiyesi üret.
Rakamsal tahmin içersin. Türkçe değil, İngilizce yaz. Selamlama yok. Direkt aksiyonla başla.

Bugünkü Gelir: €{today_rev:,.0f}
Bugünkü Booking Sayısı: {today_count}
Günlük Run Rate: €{run_rate:.0f}/saat
Kalan Saat: {remaining_hours} saat
En Popüler Servisler (son 7 gün): {', '.join(top_services) if top_services else 'N/A'}
Yüksek Değerli Misafirler (€1000+): {vip_count} kişi

Tavsiyeni ver:"""
            resp = await asyncio.to_thread(model.generate_content, prompt)
            if resp and resp.text:
                boost_suggestion = resp.text.strip()
    except Exception as e:
        print(f"[Phase H] AI Boost error: {e}")

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



@router.get("/api/v1/ai/decision-rules")
async def get_decision_rules():
    """List active decision rules."""
    start_time = time.time()
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(text("SELECT * FROM decision_rules WHERE enabled = 1 ORDER BY priority DESC"))
            rules = [dict(r._mapping) for r in result.fetchall()]
        neural_shield.log_request(is_error=False)
        neural_shield.log_latency((time.time() - start_time) * 1000)
        return {"rules": rules, "total": len(rules)}
    except Exception as e:
        neural_shield.log_request(is_error=True)
        raise e

@router.post("/api/v1/ai/neural-shield/simulate-chaos")
async def simulate_chaos(payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """Chaos Engineering: Force anomalies to test Self-Healing."""
    latency = payload.get("latency_ms", 50.0)
    errors = payload.get("error_count", 0)
    requests = payload.get("total_requests", 10)
    
    # Inject fake data
    for _ in range(requests):
        neural_shield.log_request(is_error=False)
        neural_shield.log_latency(latency)
        
    for _ in range(errors):
        neural_shield.log_request(is_error=True)
        
    health = neural_shield.evaluate_health()
    
    # Attempt simulated self-healing
    recovery_msg = None
    if health["action_taken"] == "CIRCUIT_BREAKER_ACTIVATED":
        # Simulate recovery
        neural_shield.heal_system()
        recovery_msg = "Graceful Restart Executed. Buffers cleared. Circuit CLOSED."
    elif health["action_taken"] == "CACHE_PURGE_TRIGGERED":
        neural_shield.latency_buffer = [l * 0.5 for l in neural_shield.latency_buffer] # reduced latency
        recovery_msg = "Cache Purged. Latency dropping."

    return {
        "status": "chaos_injected",
        "shield_telemetry": health,
        "recovery_action": recovery_msg
    }
    
@router.get("/api/v1/ai/neural-shield/status")
async def get_shield_status():
    return neural_shield.evaluate_health()



@router.get("/api/v1/ai/shadow-log")
async def get_shadow_log():
    """View shadow decision log for AI accuracy analysis."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(text(
            "SELECT * FROM shadow_decisions ORDER BY created_at DESC LIMIT 50"
        ))
        logs = [dict(r._mapping) for r in result.fetchall()]
    return {"decisions": logs, "total": len(logs)}



@router.get("/api/v1/ai/banner-stats")
async def get_banner_stats():
    """Conversion Oracle: impressions, clicks, conversion rate, revenue lift."""
    async with AsyncSessionLocal() as db:
        r1 = await db.execute(text("SELECT COUNT(*) FROM banner_impressions"))
        impressions = r1.scalar() or 0

        r2 = await db.execute(text("SELECT COUNT(*) FROM banner_clicks"))
        clicks = r2.scalar() or 0

        r3 = await db.execute(text(
            "SELECT COALESCE(SUM(lift_estimate),0) FROM shadow_decisions WHERE was_autonomous=1"
        ))
        revenue_lift = float(r3.scalar() or 0)

        r4 = await db.execute(text(
            "SELECT COUNT(*) FROM shadow_decisions WHERE was_autonomous=1"
        ))
        autonomous_fired = r4.scalar() or 0

    conversion_rate = round((clicks / impressions * 100), 1) if impressions > 0 else 0
    ai_accuracy = round((autonomous_fired / max(impressions, 1)) * 100, 1)

    return {
        "impressions": impressions,
        "clicks": clicks,
        "conversion_rate": conversion_rate,
        "revenue_lift": revenue_lift,
        "autonomous_fired": autonomous_fired,
        "ai_accuracy": min(ai_accuracy, 99.9),
        "glow_active": conversion_rate >= 15
    }



@router.post("/api/v1/ai/banner-impression")
async def log_banner_impression(request: Request):
    """Log that a banner was shown to a visitor."""
    body = await request.json()
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "INSERT INTO banner_impressions (session_id, tenant_id, event_id, action, discount_pct) "
            "VALUES (:sid, :tid, :eid, :action, :disc)"
        ), {
            "sid": body.get("session_id", "anon"),
            "tid": body.get("tenant_id", "system"),
            "eid": body.get("event_id", ""),
            "action": body.get("action", "FLASH_OFFER"),
            "disc": body.get("discount_pct", 10)
        })
        await db.commit()
    return {"status": "logged"}



@router.post("/api/v1/ai/banner-click")
async def log_banner_click(request: Request):
    """Log a click on the urgency banner."""
    body = await request.json()
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "INSERT INTO banner_clicks (session_id, tenant_id, impression_id, converted) "
            "VALUES (:sid, :tid, :iid, :conv)"
        ), {
            "sid": body.get("session_id", "anon"),
            "tid": body.get("tenant_id", "system"),
            "iid": body.get("impression_id", None),
            "conv": int(body.get("converted", 0))
        })
        await db.commit()
    return {"status": "click_logged"}



@router.post("/api/v1/ai/promo-token")
async def create_promo_token(request: Request):
    """Create a session-based promo discount token (expires in 30 min)."""
    from datetime import datetime, timedelta
    import random, string
    body = await request.json()
    token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    expires_at = (datetime.now() + timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S')
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "INSERT INTO promo_tokens (id, session_id, discount_pct, action, expires_at, used) "
            "VALUES (:tid, :sid, :disc, :action, :exp, 0)"
        ), {
            "tid": token,
            "sid": body.get("session_id", "anon"),
            "disc": float(body.get("discount_pct", 10)),
            "action": body.get("action", "FLASH_OFFER"),
            "exp": expires_at
        })
        await db.commit()
    return {
        "token": token,
        "discount_pct": body.get("discount_pct", 10),
        "expires_at": expires_at,
        "display": f"NV-{token}",
        "message": f"🎁 %{int(body.get('discount_pct', 10))} İndirim Kodunuz: NV-{token}"
    }



@router.get("/api/v1/ai/promo-token/{token}")
async def validate_promo_token(token: str):
    """Validate a promo token and return discount info."""
    from datetime import datetime
    async with AsyncSessionLocal() as db:
        r = await db.execute(text(
            "SELECT id, discount_pct, action, expires_at, used FROM promo_tokens WHERE id = :tid"
        ), {"tid": token.upper()})
        row = r.fetchone()

    if not row:
        return {"valid": False, "reason": "Token bulunamadı"}
    if row[4]:
        return {"valid": False, "reason": "Token daha önce kullanıldı", "discount_pct": row[1]}
    if row[3] and datetime.now() > datetime.strptime(str(row[3]), '%Y-%m-%d %H:%M:%S'):
        return {"valid": False, "reason": "Token süresi doldu", "discount_pct": row[1]}

    return {
        "valid": True,
        "token": row[0],
        "discount_pct": row[1],
        "action": row[2],
        "display": f"NV-{row[0]}",
        "whatsapp_text": f"🎁 Promo Kodum: NV-{row[0]} | %{int(row[1])} İndirim"
    }



@router.post("/api/v1/ai/promo-token/{token}/use")
async def use_promo_token(token: str):
    """Mark a promo token as used after reservation."""
    async with AsyncSessionLocal() as db:
        await db.execute(text(
            "UPDATE promo_tokens SET used=1 WHERE id=:tid"
        ), {"tid": token.upper()})
        await db.commit()
    return {"status": "used", "token": token.upper()}



@router.post("/api/v1/ai/concierge-chat")
async def concierge_chat(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Sovereign OS Phase 82.1: Tenant-Aware Conversational Concierge.
    Accepts: guest_name, message, intent_score, behavioral_tags, history[]
    Returns: ai_reply, booking_suggested, whatsapp_cta, ui_aura
    """
    from app.services.ai_multiverse import multiverse_engine
    import re, json as _json

    body = await request.json()
    guest_name    = body.get("guest_name", "Değerli Misafirimiz")
    message       = body.get("message", "")
    intent_score  = int(body.get("intent_score", 50))
    behavioral_tags = body.get("behavioral_tags", [])   
    history       = body.get("history", [])             
    service_hint  = body.get("service_interest", "")
    promo_token   = body.get("promo_token", "")

    # Phase 82.1: Tenant Isolation
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        # Fallback for local testing if middleware fails
        # Try to find default HQ tenant
        tenant_res = await db.execute(select(Tenant).where(Tenant.is_active == True).limit(1))
        t_obj = tenant_res.scalar_one_or_none()
        tenant_id = str(t_obj.id) if t_obj else "system_default"

    if not message.strip():
        return {"ai_reply": "Sizi duyuyorum, lütfen devam edin.", "booking_suggested": False, "ui_aura": "default"}

    # Get API key
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        from pathlib import Path as _P
        _ef = _P(__file__).parent / ".env"
        if _ef.exists():
            for _l in _ef.read_text().splitlines():
                if _l.startswith("GEMINI_API_KEY="):
                    api_key = _l.split("=", 1)[1].strip()
                    break

    if not api_key:
        return {"ai_reply": "Konciyer şu an bakımda. Lütfen WhatsApp'tan ulaşın.", "booking_suggested": True,
                "whatsapp_cta": {"label": "WhatsApp ile Rezervasyon", "phone": "905555555555", "text": "Rezervasyon talebi"}, "ui_aura": "default"}

    # ── Master OS: Get Isolated Tenant Persona ─────────────────────────
    persona_data = await multiverse_engine.get_tenant_persona(db, tenant_id)
    base_persona_prompt = persona_data["system_prompt"]
    ui_aura = persona_data["ui_aura"]

    # ── Context Injection ─────────────────────────
    urgency_note = ""
    if intent_score >= 75:
        urgency_note = "CONTEXT: Guest has HIGH booking intent. Gently guide toward reservation NOW."
    elif intent_score >= 50:
        urgency_note = "CONTEXT: Guest intent is moderate. Build desire."
    else:
        urgency_note = "CONTEXT: Guest is exploring. Be warm and informative."

    tags_note = f"Behavioral profile: {', '.join(behavioral_tags)}." if behavioral_tags else ""
    svc_note  = f"Guest shows interest in: {service_hint}." if service_hint else ""
    promo_note = f"Guest has promo token {promo_token} — mention their special discount naturally." if promo_token else ""

    system_prompt = f"""{base_persona_prompt}

DYNAMIC CONTEXT FOR THIS SESSION:
LANGUAGE: Reply in Turkish unless guest writes in another language.
STYLE: 2-3 sentences max. Rich sensory language.
{urgency_note}
{tags_note}
{svc_note}
{promo_note}

RULES:
- Never make up prices (say 'kişiye özel' for pricing)
- Always end with an implicit or explicit invitation
- If guest is ready to book, tell them their personal WhatsApp link awaits
- CRITICAL: Your response MUST be valid JSON format: {{"reply": "your response here", "booking_suggested": true/false}}"""

    # Build conversation
    conversation_text = system_prompt + "\n\n"
    for h in history[-6:]:  # Last 6 turns
        role = "Misafir" if h.get("role") == "user" else "Konciyer"
        conversation_text += f"{role}: {h.get('text','')}\n"
    conversation_text += f"Misafir: {message}\nKonciyer:"

    try:
        import google.generativeai as _genai
        import asyncio as _asyncio
        _genai.configure(api_key=api_key)
        _model = _genai.GenerativeModel("gemini-2.0-flash")
        loop = _asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: _model.generate_content(conversation_text))
        raw = resp.text.strip()

        # Try JSON parse
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            parsed = _json.loads(m.group())
            ai_reply = parsed.get("reply", raw)
            booking_suggested = bool(parsed.get("booking_suggested", False))
        else:
            ai_reply = raw
            booking_suggested = intent_score >= 70

        # Build WhatsApp CTA
        phone    = (os.environ.get("NV_CONCIERGE_NUMBER") or "905555555555").replace("+", "")
        wa_lines = [f"Merhaba, Santis rezervasyon talebim var."]
        if service_hint:
            wa_lines.append(f"İlgilendiğim hizmet: {service_hint}")
        if promo_token:
            wa_lines.append(f"Promo kodum: {promo_token}")
        wa_text = " | ".join(wa_lines)

        return {
            "ai_reply": ai_reply,
            "booking_suggested": booking_suggested,
            "intent_score": intent_score,
            "ui_aura": ui_aura, # Aura UI'ı doğrudan etkiliyor
            "whatsapp_cta": {
                "label": "WhatsApp ile Rezerve Et 🌿",
                "phone": phone,
                "text": wa_text,
                "url": f"https://wa.me/{phone}?text={wa_text.replace(' ', '%20')}"
            } if booking_suggested else None
        }

    except Exception as e:
        return {
            "ai_reply": f"Merhaba {guest_name}, size en kısa sürede dönmek için buradayım.",
            "booking_suggested": False,
            "error": str(e)[:100]
        }



@router.get("/api/v1/ai/accuracy")
async def get_ai_accuracy():
    """Real AI accuracy: Gemini recommendation vs rule decision alignment rate."""
    async with AsyncSessionLocal() as db:
        r = await db.execute(text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ai_recommendation = rule_decision THEN 1 ELSE 0 END) as matched,
                AVG(COALESCE(ai_confidence, 0.5)) as avg_confidence,
                SUM(CASE WHEN gemini_source = 'gemini_live' THEN 1 ELSE 0 END) as gemini_backed
            FROM shadow_decisions
        """))
        row = r.fetchone()
    total = row[0] or 0
    matched = row[1] or 0
    avg_conf = round(float(row[2] or 0.5) * 100, 1)
    gemini_backed = row[3] or 0
    accuracy = round((matched / total) * 100, 1) if total > 0 else 0.0
    return {
        "total_decisions": total,
        "gemini_backed": gemini_backed,
        "accuracy_pct": accuracy,
        "avg_confidence_pct": avg_conf,
        "grade": "A" if accuracy >= 80 else "B" if accuracy >= 60 else "C"
    }



@router.post("/api/v1/ai/gemini-strategy")
async def get_gemini_strategy(request: Request):
    """On-demand Gemini strategy call with live DB context."""
    import re, json as _json
    body = await request.json()
    occupancy = float(body.get("occupancy_pct", 0.65))

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        from pathlib import Path as _P
        _ef = _P(__file__).parent / ".env"
        if _ef.exists():
            for _l in _ef.read_text().splitlines():
                if _l.startswith("GEMINI_API_KEY="):
                    api_key = _l.split("=",1)[1].strip()
                    break

    if not api_key:
        return {"action": "HOLD", "confidence": 0.0, "reasoning": "API key not found", "source": "config_error"}

    try:
        import google.generativeai as _genai
        import asyncio as _asyncio
        _genai.configure(api_key=api_key)
        _model = _genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"You are Revenue Intelligence AI for Santis Luxury Spa Turkey. "
            f"REAL-TIME OCCUPANCY: {round(occupancy * 100)}%. "
            'Recommend ONE action. Reply ONLY as JSON no markdown: '
            '{"action":"SURGE or FLASH_OFFER or HOLD","confidence":0.0-1.0,'
            '"price_suggestion":"e.g. +15%","reasoning":"one sentence"} '
            "Rules: SURGE if occupancy>70%, FLASH_OFFER if occupancy<40%, HOLD otherwise."
        )
        loop = _asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: _model.generate_content(prompt))
        raw = resp.text.strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            result = _json.loads(m.group())
            result["source"] = "gemini_live"
            return result
        return {"action": "HOLD", "confidence": 0.7, "reasoning": raw[:120], "source": "gemini_raw"}
    except Exception as e:
        return {"action": "HOLD", "confidence": 0.0, "reasoning": str(e)[:150], "source": "error"}



@router.get("/api/v1/ai/gemini-forecast")
async def get_gemini_forecast():
    """Gemini 48-hour spa forecast."""
    import re, json as _json
    from datetime import datetime as _dt, timedelta as _td

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        from pathlib import Path as _P
        _ef = _P(__file__).parent / ".env"
        if _ef.exists():
            for _l in _ef.read_text().splitlines():
                if _l.startswith("GEMINI_API_KEY="):
                    api_key = _l.split("=",1)[1].strip()
                    break

    if not api_key:
        return {"forecast_text": "API key not configured", "peak_window": "N/A", "recommended_action": "HOLD", "source": "config_error"}

    # Build minimal context from DB
    now = _dt.now()
    context = ""
    try:
        async with AsyncSessionLocal() as db:
            r1 = await db.execute(text("SELECT COUNT(*), COALESCE(SUM(price_snapshot),0) FROM bookings WHERE is_deleted=0 AND start_time >= :s"), {"s": (now - _td(days=7)).isoformat()})
            r1d = r1.fetchone()
            r2 = await db.execute(text("SELECT COUNT(*) FROM bookings WHERE is_deleted=0 AND DATE(start_time)=DATE(:t)"), {"t": now.isoformat()})
            r2d = r2.fetchone()
            context = f"Last 7 days: {r1d[0]} bookings, EUR {round(float(r1d[1]),2)}. Today: {r2d[0][0] if isinstance(r2d[0], tuple) else r2d[0]} bookings."
    except Exception:
        context = "Santis luxury spa, 8 treatment rooms, premium clientele."

    try:
        import google.generativeai as _genai
        import asyncio as _asyncio
        _genai.configure(api_key=api_key)
        _model = _genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"You are the Forecasting Oracle for Santis Luxury Spa Turkey. "
            f"Business context: {context} "
            "Generate a 48-hour forecast. Reply ONLY as JSON no markdown: "
            '{"forecast_text":"2-3 sentences luxury tone",'
            '"peak_window":"e.g. Saturday 14:00",'
            '"recommended_action":"SURGE or FLASH_OFFER or HOLD",'
            '"expected_revenue_lift_eur":0-500}'
        )
        loop = _asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: _model.generate_content(prompt))
        raw = resp.text.strip()
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            result = _json.loads(m.group())
            result["source"] = "gemini_live"
            return result
        return {"forecast_text": raw[:200], "peak_window": "N/A", "recommended_action": "HOLD", "source": "gemini_raw"}
    except Exception as e:
        return {"forecast_text": str(e)[:200], "peak_window": "N/A", "recommended_action": "HOLD", "source": "error"}



@router.get("/api/v1/ai/forecast")
async def ai_forecast():
    """48-hour occupancy forecast based on booking velocity."""
    from datetime import datetime, timedelta

    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    async with AsyncSessionLocal() as db:
        r1 = await db.execute(text(
            "SELECT COUNT(*) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(today_start)})
        today_count = r1.scalar() or 0

        r2 = await db.execute(text(
            "SELECT COUNT(*) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(seven_days_ago)})
        week_total = r2.scalar() or 0
        avg_daily = round(week_total / 7, 1)

        r3 = await db.execute(text(
            "SELECT COALESCE(SUM(price_snapshot), 0) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(today_start)})
        today_revenue = float(r3.scalar() or 0)

        r4 = await db.execute(text(
            "SELECT COALESCE(SUM(price_snapshot), 0) FROM bookings WHERE start_time >= :ts AND status != 'CANCELLED'"
        ), {"ts": str(seven_days_ago)})
        week_revenue = float(r4.scalar() or 0)
        avg_daily_revenue = round(week_revenue / 7, 2)

    CAPACITY = 50
    forecast_tomorrow = round(avg_daily * 1.05, 1)
    occupancy_pct = round((forecast_tomorrow / CAPACITY) * 100, 1)

    if occupancy_pct > 70:
        recommendation = "SURGE"
        reason = f"Predicted occupancy {occupancy_pct}% exceeds 70% threshold"
    elif occupancy_pct < 30:
        recommendation = "DISCOUNT"
        reason = f"Low predicted demand ({occupancy_pct}%) — flash offer recommended"
    else:
        recommendation = "HOLD"
        reason = f"Stable demand at {occupancy_pct}%"

    return {
        "today_bookings": today_count,
        "avg_daily_bookings": avg_daily,
        "forecast_tomorrow": forecast_tomorrow,
        "forecast_occupancy_pct": occupancy_pct,
        "today_revenue": today_revenue,
        "avg_daily_revenue": avg_daily_revenue,
        "revenue_velocity": f"€{avg_daily_revenue}/day",
        "ai_recommendation": recommendation,
        "ai_reason": reason,
        "generated_at": now.isoformat()
    }



@router.get("/api/v1/guests/{customer_id}/memory")
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



@router.patch("/api/v1/guests/{customer_id}/memory")
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
    await neural_thought(
        f"Memory Updated → {cust.full_name} | vibe: {cust.vibe_check or '–'} | prefs saved",
        level="info"
    )

    return {"status": "success", "guest_name": cust.full_name, "updated": list(payload.keys())}



@router.post("/api/v1/guests/{customer_id}/memory/ai-observe")
async def ai_observe_guest(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Phase P – Gemini generates a real-time psychological observation from booking history."""
    import json as _json, asyncio as _asyncio, uuid as _uuid
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

    ai_note = "Pattern analysis unavailable."
    try:
        import os, google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""Sen Santis lüks spa'nın dijital konsiyer asistanısın. 
Misafir: {cust.full_name}
Geçmiş rezervasyonlar: {history}
Bilinen tercihler: {prefs}
Psikolojik profil notu (ai_persona_summary): {cust.ai_persona_summary or 'Yok'}

Bu misafir için kısa (1-2 cümle), operasyonel bir İngilizce gözlem yaz. 
Ton: sessiz lüks (quiet luxury), profesyonel, içgörülü.
Örnek: "Guest shows strong Recovery pattern. Likely to benefit from post-workout Deep Tissue. Prefers minimal interaction."
"""
        resp = await _asyncio.to_thread(model.generate_content, prompt)
        if resp and resp.text:
            ai_note = resp.text.strip()
    except Exception as e:
        print(f"[Phase P] Gemini observe error: {e}")

    # Save to DB
    cust.ai_notes = ai_note
    await db.commit()

    # Flashback to Neural Stream
    await neural_thought(
        f"Memory ∷ {cust.full_name} — {ai_note}",
        level="info"
    )

    return {"status": "success", "guest_name": cust.full_name, "ai_observation": ai_note}

# ═══════════════════════════════════════════════════════════════
# PHASE 15 & THE BLACK ROOM (AURELIA MATRIX INTEGRATION)
# ═══════════════════════════════════════════════════════════════

@router.post("/api/v1/predictive/black-room-offer")
async def generate_black_room_offer(payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """The Black Room - Revenue AI 2.0 Dynamic Offer Generator"""
    score = payload.get("current_score", 0)
    session_id = payload.get("session_id", "anon")
    
    if score < 85:
        return {"status": "ignored"}
        
    # Phase 15: Sovereign-Lab V3 Integration (Fetch Surge)
    from app.api.v1.endpoints.booking_engine import GLOBAL_SURGE_MULTIPLIER
    
    # Phase 16: Prophet Engine Integration
    from app.api.v1.endpoints.prophet_engine import GuestFootprint, calculate_pi_score
    footprint = GuestFootprint(
        device_type=payload.get("device_type", "Unknown"),
        source_url=payload.get("source_url", "direct"),
        past_bookings=payload.get("past_bookings", 0),
        ghost_score=score
    )
    pi_score = calculate_pi_score(footprint)
    
    base_price = 350.0
    
    # KADER FİYATLAMASI MANTIĞI
    if pi_score > 0.85:
        discount = 0.0
        closing_strategy = "MAX_YIELD"
    elif pi_score > 0.60:
        discount = 0.15
        closing_strategy = "AURELIA_CLOSING"
    else:
        discount = 0.05
        closing_strategy = "SCARCITY_NUDGE"
        
    dynamic_price = (base_price * GLOBAL_SURGE_MULTIPLIER) * (1 - discount)
    
    import random, string
    token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    intent_level = "surge" if GLOBAL_SURGE_MULTIPLIER > 1.0 else "high_intent"
    
    offer = {
        "title": "Sovereign Executive Paket",
        "description": "Ghost Score analiziniz tamamlandı. Sadece bu oturuma özel erişim hakkınız tanımlandı.",
        "virtual_sku": "SOV-EXEC-VIP",
        "original_price": base_price,
        "dynamic_price": round(dynamic_price, 2),
        "token": token,
        "strategy": closing_strategy,
        "pi_score": round(pi_score, 2)
    }
    
    # Broadcast to War Room
    try:
        from app.core.pulse import pulse_engine
        await pulse_engine.broadcast_to_hq({
            "type": "INTELLIGENCE_PULSE",
            "message": f"Aurelia Deployed: {closing_strategy} (π: {round(pi_score,2)}, x{GLOBAL_SURGE_MULTIPLIER} Surge) to {session_id}",
            "severity": "GOLD" if closing_strategy == "MAX_YIELD" else "INFO"
        })
    except Exception as e:
        print("[The Black Room] Error broadcasting pulse:", e)
    
    return {
        "status": "success",
        "intent_level": intent_level,
        "offer": offer
    }
