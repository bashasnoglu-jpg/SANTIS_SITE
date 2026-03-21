"""
gemini_engine.py — Santis OS Neural Core
Phase 14: Real Gemini Integration

SDK: google-genai v1.61.0 (google.genai)
Model: gemini-2.0-flash
"""

import os
import logging
import asyncio
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ── Lazy Singleton ──────────────────────────────────────────────
_gemini_client = None

def _read_env_key() -> str:
    """Read GEMINI_API_KEY — tries multiple path strategies."""
    import pathlib

    # Strategy 1: os.environ (may already be set)
    key = os.environ.get("GEMINI_API_KEY", "")
    if key:
        return key

    # Strategy 2: Relative to this file (app/core/gemini_engine.py → ../../.env)
    candidates = [
        pathlib.Path(__file__).resolve().parent.parent.parent / ".env",
        pathlib.Path(__file__).resolve().parent.parent / ".env",
        # Strategy 3: Absolute project root (hardcoded fallback for venv context)
        pathlib.Path(r"c:\Users\tourg\Desktop\SANTIS_SITE\.env"),
        pathlib.Path(".env"),
    ]

    for env_path in candidates:
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        found = line.split("=", 1)[1].strip()
                        if found:
                            os.environ["GEMINI_API_KEY"] = found  # cache for next call
                            return found
    return ""


def get_gemini_client():
    """Return a configured google.genai Client (singleton). Re-tries on failure."""
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    try:
        from google import genai
        api_key = _read_env_key()
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env or environment")
        _gemini_client = genai.Client(api_key=api_key)
        logger.info(f"[GeminiEngine] google.genai client ready (model={MODEL})")
    except Exception as e:
        logger.error(f"[GeminiEngine] Init failed: {e}")
        # Do NOT cache None — allow retry on next call
    return _gemini_client



MODEL = "gemini-2.0-flash"


async def _call_gemini(prompt: str) -> str:
    """Async wrapper for google.genai generate_content."""
    client = get_gemini_client()
    if client is None:
        raise RuntimeError("Gemini client not available")
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(model=MODEL, contents=prompt)
    )
    return response.text.strip()


# ── Context Builder ──────────────────────────────────────────────
async def build_spa_context(db, tenant_id: str) -> str:
    """Build a rich business context string from live DB for Gemini."""
    from sqlalchemy import text
    now = datetime.now()

    try:
        r1 = await db.execute(text("""
            SELECT COUNT(*), COALESCE(SUM(price_snapshot), 0)
            FROM bookings WHERE is_deleted=0 AND start_time >= :since
        """), {"since": (now - timedelta(days=7)).isoformat()})
        row1 = r1.fetchone()
        recent_count = row1[0] or 0
        recent_revenue = round(float(row1[1] or 0), 2)

        r2 = await db.execute(text("""
            SELECT COUNT(*) FROM bookings
            WHERE is_deleted=0 AND DATE(start_time) = DATE(:today)
        """), {"today": now.isoformat()})
        today_count = (r2.fetchone() or [0])[0]

        r3 = await db.execute(text("""
            SELECT s.name, COUNT(*) as c, COALESCE(SUM(b.price_snapshot),0) as rev
            FROM bookings b JOIN services s ON b.service_id=s.id
            WHERE b.is_deleted=0
            GROUP BY s.name ORDER BY c DESC LIMIT 5
        """))
        top_services = r3.fetchall()

        r5 = await db.execute(text("""
            SELECT COUNT(*), AVG(CAST(json_extract(payload,'$.intent_delta') AS REAL))
            FROM outbox_events WHERE created_at >= :since
        """), {"since": (now - timedelta(hours=24)).isoformat()})
        ghost_row = r5.fetchone()
        ghost_events = ghost_row[0] or 0
        avg_intent = round(float(ghost_row[1] or 0), 1)

        svc_lines = "\n".join(
            [f"  - {s[0]}: {s[1]} bookings, EUR {round(float(s[2]),2)}"
             for s in top_services]
        ) or "  - No service data available"

        return f"""SANTIS LUXURY SPA — Business Intelligence
Timestamp: {now.strftime('%Y-%m-%d %H:%M')} (Istanbul)

BOOKINGS (Last 7 Days): {recent_count} | Revenue: EUR {recent_revenue}
TODAY: {today_count} bookings | Occupancy: ~{min(100, today_count*10)}%
GHOST INTENT (24h): {ghost_events} events | Avg score: {avg_intent}/100

TOP SERVICES BY DEMAND:
{svc_lines}"""

    except Exception as e:
        logger.warning(f"[GeminiEngine] Context build error: {e}")
        return "SANTIS SPA: Premium Turkish luxury spa, 8 treatment rooms."


# ── Strategy Engine ──────────────────────────────────────────────
async def generate_strategy(db, tenant_id: str, occupancy_pct: float = 0.65) -> dict:
    """Ask Gemini for a real-time pricing strategy."""
    import json, re
    context = await build_spa_context(db, tenant_id)
    prompt = f"""{context}

REAL-TIME OCCUPANCY: {round(occupancy_pct * 100)}%

You are the Revenue Intelligence AI for this luxury Turkish spa.
Recommend ONE strategic action. Respond ONLY in this JSON format (no markdown):
{{"action": "SURGE" or "FLASH_OFFER" or "HOLD", "confidence": 0.0-1.0, "price_suggestion": "e.g. +15% or -10% or unchanged", "reasoning": "one sentence, luxury business tone"}}

Rules: SURGE if occupancy>70%, FLASH_OFFER if occupancy<40%, HOLD otherwise."""
    try:
        raw = await _call_gemini(prompt)
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            result = json.loads(m.group())
            result["source"] = "gemini_live"
            logger.info(f"[Gemini] {result.get('action')} conf={result.get('confidence')} | {result.get('reasoning','')[:60]}")
            return result
        return {"action": "HOLD", "confidence": 0.5, "reasoning": raw[:120], "source": "gemini_raw"}
    except Exception as e:
        logger.error(f"[GeminiEngine] Strategy error: {e}")
        return {"action": "HOLD", "confidence": 0.0, "reasoning": str(e)[:100], "source": "error"}


# ── 48h Forecast ─────────────────────────────────────────────────
async def generate_forecast(db, tenant_id: str) -> dict:
    """Ask Gemini for a 48-hour revenue and occupancy forecast."""
    import json, re
    context = await build_spa_context(db, tenant_id)
    prompt = f"""{context}

Generate a 48-hour business forecast for this premium spa.
Respond ONLY in this JSON (no markdown):
{{"forecast_text": "2-3 sentences, luxury tone", "peak_window": "e.g. Saturday 14:00-18:00", "recommended_action": "SURGE or FLASH_OFFER or HOLD", "expected_revenue_lift_eur": 0-500}}"""
    try:
        raw = await _call_gemini(prompt)
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            result = json.loads(m.group())
            result["source"] = "gemini_live"
            return result
        return {"forecast_text": raw[:200], "peak_window": "N/A", "recommended_action": "HOLD", "source": "gemini_raw"}
    except Exception as e:
        logger.error(f"[GeminiEngine] Forecast error: {e}")
        return {"forecast_text": f"Unavailable: {e}", "peak_window": "N/A", "recommended_action": "HOLD", "source": "error"}


# ── Concierge Sentiment ──────────────────────────────────────────
async def generate_concierge_response(guest_name: str, intent_score: int, service_interest: str = "") -> str:
    """Generate a personalized luxury Turkish concierge message."""
    tone = "warm and exclusive" if intent_score > 65 else "gentle and inviting"
    svc = f"They are interested in: {service_interest}." if service_interest else ""
    prompt = f"""You are the luxury concierge AI for Santis Spa, Turkey.
Guest: {guest_name} | Intent Score: {intent_score}/100 | Tone: {tone}
{svc}
Write ONE short, elegant Turkish welcome (2-3 sentences max). Personal, premium, subtly encourage booking. No prices, no generic phrases."""
    try:
        return await _call_gemini(prompt)
    except Exception as e:
        return f"Merhaba {guest_name}, Santis'e hoş geldiniz. Size özel deneyimlerimizi keşfetmek için buradayız."


# ── Phase 18: Sovereign Invite (Autopilot) ───────────────────────
async def generate_sovereign_invite(oracle: dict, guest_history: dict | None = None) -> dict:
    """
    Phase 18: AI Autopilot — Generate a personalized VIP invitation for a Whale.
    Phase 18.5: Enriched with guest history context for returning whales.

    Args:
        oracle: dict returned by compute_oracle_score()
        guest_history: optional dict from fetch_guest_history()

    Returns:
        {"message": str, "whatsapp_cta": bool, "promo_code": str|None, "source": str}
    """
    from datetime import datetime
    import random, string

    guest  = oracle.get("guest_name") or "Değerli Misafirimiz"
    score  = oracle.get("composite_score", 0.75)
    svc    = oracle.get("service_interest") or ""
    tier   = oracle.get("tier", "whale")

    # ── Time-aware tone ────────────────────────────────────────────
    hour = datetime.now().hour
    if hour < 11:
        time_tone = "sabahın ferahlığını hissettiren, enerjik"
    elif hour < 17:
        time_tone = "öğleden sonranın sakin dinginliğini taşıyan"
    else:
        time_tone = "akşamın loş huzurunu yansıtan"

    svc_line = f"Özellikle '{svc}' deneyimiyle ilgilendiğini hissediyorum." if svc else ""

    # ── Phase 18.5: Returning Whale Context ───────────────────────
    history_line = ""
    is_returning = False
    if guest_history and guest_history.get("visits", 0) >= 2:
        is_returning   = True
        visits         = guest_history["visits"]
        spent          = guest_history.get("total_spent_eur", 0)
        fav_svc        = guest_history.get("fav_service") or svc or "spa ritüeli"
        last_visit     = guest_history.get("last_visit_date", "")
        last_visit_str = f" (son ziyaret: {last_visit})" if last_visit else ""
        history_line   = (
            f"ÖNEMLİ — Bu misafir sadık bir VIP: {visits} kez geldi{last_visit_str}, "
            f"toplam €{spent:.0f} harcadı ve en çok '{fav_svc}' sevdi. "
            f"'Yeniden hoş geldiniz' zarafetiyle, eski bir dostu karşılar gibi yaklaş. "
            f"İsmini doğal bir şekilde ve sıcakca kullan."
        )

    # ── Auto-generate promo token ──────────────────────────────────
    promo_prefix = "WELCOME-BACK" if is_returning else "VIP"
    promo_code   = promo_prefix + "-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))

    prompt = f"""Sen Santis Luxury Spa'nın yapay zeka destekli VIP Kuratörüsün.
Görevin: Bir misafiri kişisel ve zarif bir dil kullanarak rezervasyona yönlendirmek.

Misafir: {guest}
Davranışsal Skor: %{round(score * 100)} (Tier: {tier.upper()})
{svc_line}
{history_line}
Ton: {time_tone} bir üslupla, samimi ama lüks
Gizli Promo Kodu (mesajın doğal akışına entegre et): {promo_code}

KURALLAR:
- Tam olarak 2-3 cümle yaz
- İsmi doğal kullan (Sayın/Değerli gibi resmi hitaplardan kaçın)
- Fiyat, indirim yüzdesi gibi rakamlar yazma — sadece promo kodunu doğal bir şekilde sun
- "Rezervasyon", "WhatsApp" veya harici link yazma — bunu sistemimiz halleder
- Türkçe yaz, premium ve zarif

Sadece davet metnini döndür, başka açıklama ekleme."""

    try:
        raw = await _call_gemini(prompt)
        message = raw.strip()[:600]
        logger.info(
            f"[AutopilotInvite] Invite for '{guest}' | returning={is_returning} "
            f"| score={score} | promo={promo_code}"
        )
        return {
            "message":      message,
            "whatsapp_cta": True,
            "promo_code":   promo_code,
            "is_returning": is_returning,
            "source":       "gemini_live",
        }
    except Exception as e:
        logger.error(f"[AutopilotInvite] Gemini error: {e}")
        svc_hint = f" {svc} deneyiminizle ilgili" if svc else ""
        welcome  = "Tekrar hoş geldiniz" if is_returning else "Hoş geldiniz"
        return {
            "message": (
                f"{guest}, {welcome}! Sizi{svc_hint} özel olarak ağırlamak istiyoruz. "
                f"Rezervasyonunuza özel: {promo_code} kodunu kullanın."
            ),
            "whatsapp_cta": True,
            "promo_code":   promo_code,
            "is_returning": is_returning,
            "source":       "fallback",
        }


# ── Phase 18.5: Guest Profile Engine ─────────────────────────────
async def fetch_guest_history(db, guest_name: str, tenant_id: str) -> dict | None:
    """
    Phase 18.5: Conversion Memory — Fetch a guest's historical profile.
    Joins revenue_scores and bookings to build a Sovereign Guest History.

    Returns None if no prior history exists.
    Returns dict: {visits, total_spent_eur, fav_service, avg_score, last_visit_date}
    """
    if not guest_name or not guest_name.strip():
        return None

    from sqlalchemy import text

    try:
        # ── Oracle history (revenue_scores) ───────────────────────
        rs_res = await db.execute(text("""
            SELECT
                COUNT(*)                          AS visits,
                AVG(composite_score)              AS avg_score,
                service_interest,
                COUNT(service_interest)           AS svc_count,
                MAX(scored_at)                    AS last_seen
            FROM revenue_scores
            WHERE LOWER(guest_name) = LOWER(:gname)
              AND (:tid IS NULL OR tenant_id = :tid)
            GROUP BY service_interest
            ORDER BY svc_count DESC
            LIMIT 1
        """), {"gname": guest_name.strip(), "tid": tenant_id or None})
        rs_row = rs_res.fetchone()

        if not rs_row or rs_row[0] == 0:
            return None   # No prior history

        visits      = int(rs_row[0])
        avg_score   = round(float(rs_row[1] or 0), 3)
        fav_service = rs_row[2] or ""
        last_seen   = str(rs_row[4] or "")[:10]  # ISO date only

        # ── Booking history (bookings table) ─────────────────────
        bk_res = await db.execute(text("""
            SELECT
                COALESCE(SUM(CAST(b.price_snapshot AS REAL)), 0) AS total_spent
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            WHERE LOWER(c.full_name) = LOWER(:gname)
              AND (:tid IS NULL OR CAST(b.tenant_id AS TEXT) = :tid)
              AND b.is_deleted = 0
        """), {"gname": guest_name.strip(), "tid": str(tenant_id) if tenant_id else None})
        bk_row = bk_res.fetchone()
        total_spent = round(float(bk_row[0] or 0), 2) if bk_row else 0.0

        result = {
            "visits":          visits,
            "avg_score":       avg_score,
            "fav_service":     fav_service,
            "total_spent_eur": total_spent,
            "last_visit_date": last_seen,
        }
        logger.info(
            f"[GuestHistory] '{guest_name}' | visits={visits} "
            f"| spent=EUR{total_spent} | fav={fav_service}"
        )
        return result

    except Exception as e:
        logger.warning(f"[GuestHistory] Query failed for '{guest_name}': {e}")
        return None  # Graceful: don't break the autopilot flow on DB error


# ── Phase 20: AI Concierge Sales Closer ──────────────────────────
async def generate_sales_closer_prompt(
    message: str,
    history: list,
    context: dict | None = None,
) -> dict:
    """
    Phase 20: Generates a context-aware Sales Closer response.

    Context dict keys (all optional, graceful fallback):
        intent_score    int 0-100   Ghost behavioral score
        page_depth      int         Pages viewed this session
        time_on_site    int         Seconds on site
        last_pages      list[str]   Recently visited page slugs
        service_interest str        Detected service of interest
        is_whale        bool        Oracle whale flag
        is_returning    bool        Phase 18.5 conversion memory
        guest_name      str         Known guest name (or "")
        promo_code      str         Pre-generated promo code (or "")
        wa_number       str         WhatsApp number override

    Returns:
        {reply: str, whatsapp_deeplink: str|None, scenario: str, source: str}
    """
    import random, string

    ctx            = context or {}
    intent_score   = int(ctx.get("intent_score", 0))
    page_depth     = int(ctx.get("page_depth", 1))
    time_on_site   = int(ctx.get("time_on_site", 0))
    last_pages     = ctx.get("last_pages", []) or []
    svc            = ctx.get("service_interest", "") or ""
    is_whale       = bool(ctx.get("is_whale", False))
    is_returning   = bool(ctx.get("is_returning", False))
    guest_name     = (ctx.get("guest_name") or "").strip()
    promo_code     = (ctx.get("promo_code") or "").strip()
    wa_number      = (ctx.get("wa_number") or "905348350169").strip()

    # ── Auto-promo if not provided ─────────────────────────────────
    if not promo_code:
        prefix     = "WELCOME-BACK" if is_returning else "VIP"
        promo_code = prefix + "-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))

    # ── Scenario Selection ─────────────────────────────────────────
    if is_whale and is_returning:
        scenario     = "C_WHALE_RETURN"
        scenario_tag = "Sovereign Butler"
    elif intent_score >= 80 or page_depth >= 3:
        scenario     = "B_SOVEREIGN_NUDGE"
        scenario_tag = "Sovereign Nudge"
    else:
        scenario     = "A_WELCOME_RITUAL"
        scenario_tag = "Welcome Ritual"

    # ── Dynamic context lines ──────────────────────────────────────
    name_ref  = guest_name if guest_name else "Değerli Misafirimiz"
    svc_line  = f"Özellikle '{svc}' ritüeliyle ilgilendiğini hissediyorum." if svc else ""

    time_line = ""
    if time_on_site >= 60:
        mins = time_on_site // 60
        time_line = f"Misafir {mins} dakikadır sitede — ciddi bir niyet sinyali."

    pages_line = ""
    if last_pages:
        pages_line = f"Son gezdiği sayfalar: {', '.join(last_pages[:3])}."

    history_line = ""
    if is_returning:
        history_line = (
            "ÖNEMLİ: Bu sadık bir VIP misafir — daha önce geldi ve Santis'i sevdi. "
            "'Yeniden hoş geldiniz' sıcaklığıyla, eski bir dostu karşılar gibi yaklaş."
        )

    # ── Scenario-specific instructions ────────────────────────────
    if scenario == "C_WHALE_RETURN":
        closer_instruction = (
            f"Misafiri ismiyle ('{name_ref}') sıcakça karşıla. "
            f"Geçmiş deneyimine ince bir referans ver. "
            f"Promo kodunu ({promo_code}) doğal ama belirgin şekilde sun. "
            f"Sonunda tek cümlelik nazik bir rezervasyon daveti yap — baskıcı değil, zarif."
        )
    elif scenario == "B_SOVEREIGN_NUDGE":
        closer_instruction = (
            f"Misafirin siteyi derinlemesine incelediğini fark ettiğini ima et. "
            f"'Son slotlardan biri' veya 'bu gün için özel hazırlık' gibi sınırlı bulunabilirlik duygusu yarat — ama abartma. "
            f"Promo kodunu ({promo_code}) özgün ve zarif şekilde sun. "
            f"Tek bir ince rezervasyon çağrısıyla bitir."
        )
    else:  # A_WELCOME_RITUAL
        closer_instruction = (
            f"Zarif bir rehber gibi Santis'i tanıt. "
            f"Bir veya iki ritüel öner. "
            f"Sona doğru merak uyandıran bir soru sor — rezervasyona yönlendirme yapma, önce ilgi kur."
        )

    # ── Build conversation history for Gemini ─────────────────────
    history_text = ""
    if history:
        pairs = []
        for h in history[-6:]:  # son 3 çift = 6 mesaj
            role = "Misafir" if h.get("role") == "user" else "Concierge"
            pairs.append(f"{role}: {h.get('content', '')}")
        history_text = "\n".join(pairs)

    prompt = f"""Sen Santis Luxury Spa'nın Sovereign Concierge asistanısın.
Persona: Quiet Luxury — sessiz, zarif, kendinden emin. Asla "indirim", "kampanya", "ucuz" deme.
Satış için baskı değil, arzu yaratırsın. Her cümlen bir davetiyedir.

--- Misafir İstihbarat Dosyası ---
İsim: {name_ref}
Senaryo: {scenario_tag}
{svc_line}
{time_line}
{pages_line}
{history_line}
Niyet Skoru: {intent_score}/100
---

Önceki Konuşma:
{history_text if history_text else "(Bu ilk mesaj)"}

Misafirin şu anki mesajı: "{message}"

Görevin:
{closer_instruction}

KURALLAR:
- Sadece Türkçe yaz (misafir İngilizce yazarsa cevabını da İngilizce ver)
- 2-4 cümle yaz. Sıkıştırma, nefes al.
- "Rezervasyon", "WhatsApp", harici link YAZMA — bunları sistem halleder
- Promo kodu varsa mesajın içine doğal entegre et
- Asla "Sayın" değil — ismi doğrudan ve sıcakça kullan

Sadece concierge yanıtını yaz, başka açıklama ekleme."""

    # ── Call Gemini ────────────────────────────────────────────────
    try:
        raw   = await _call_gemini(prompt)
        reply = raw.strip()[:800]
        src   = "gemini_live"
    except Exception as e:
        logger.error(f"[SalesCloser] Gemini error: {e}")
        # Fallback per scenario
        if scenario == "C_WHALE_RETURN":
            reply = (
                f"{name_ref}, yeniden hoş geldiniz! "
                f"{'Sevdiğiniz ' + svc + ' ritüeli için' if svc else 'Size özel'} "
                f"hazırlığınız yapılıyor. {promo_code} kodunuz ayrıcalığınız."
            )
        elif scenario == "B_SOVEREIGN_NUDGE":
            reply = (
                f"Santis'in özenle seçtiği ritüelleri keşfettiğinizi görüyorum. "
                f"{'Özellikle ' + svc + ' için' if svc else 'Size özel'} "
                f"bugün son bir yuvamız var — {promo_code} kodunuzla özel hazırlık yapalım mı?"
            )
        else:
            reply = (
                f"Santis'e hoş geldiniz. Zihninizi ve bedeninizi derinleştiren ritüellerimizi "
                f"keşfetmenize yardımcı olmaktan mutluluk duyarım. "
                f"{'Hangi hissiniz sizi bugün buraya getirdi?' if not svc else svc + ' ritüelimiz hakkında ne merak ediyorsunuz?'}"
            )
        src = "fallback"

    # ── Build pre-filled WhatsApp deep-link ───────────────────────
    wa_text_parts = ["Merhaba Santis!"]
    if svc:
        wa_text_parts.append(f"{svc} rezervasyonu yapmak istiyorum.")
    else:
        wa_text_parts.append("Rezervasyon bilgisi almak istiyorum.")
    if guest_name:
        wa_text_parts.append(f"Ad: {guest_name}.")
    wa_text_parts.append(f"Kod: {promo_code}")

    import urllib.parse
    wa_message   = " ".join(wa_text_parts)
    wa_deeplink  = f"https://wa.me/{wa_number}?text={urllib.parse.quote(wa_message)}"

    logger.info(
        f"[SalesCloser] scenario={scenario} | guest={name_ref} "
        f"| intent={intent_score} | src={src} | promo={promo_code}"
    )

    return {
        "reply":            reply,
        "whatsapp_deeplink": wa_deeplink,
        "promo_code":       promo_code,
        "scenario":         scenario,
        "source":           src,
    }


# ── Phase 22: Intelligent Promo Optimizer ────────────────────────

def calculate_offer_profitability(
    base_price_eur: float,
    discount_pct: float,
    variable_cost_pct: float = 0.35,
    min_margin_pct: float = 0.20,
) -> dict:
    """
    Phase 22 H4 — Profit Guard.
    Validates that a proposed discount still maintains min_margin_pct.

    Args:
        base_price_eur   :  Catalogue price (e.g. 280.0)
        discount_pct     :  Proposed discount 0-1 (0.15 = %15)
        variable_cost_pct:  Estimated variable cost as fraction of base (default 35%)
        min_margin_pct   :  Minimum acceptable gross margin (default 20%)

    Returns:
        {
            approved: bool,
            offer_price: float,
            gross_margin_eur: float,
            gross_margin_pct: float,
            reason: str
        }
    """
    offer_price      = round(base_price_eur * (1 - discount_pct), 2)
    variable_cost    = base_price_eur * variable_cost_pct
    gross_margin_eur = round(offer_price - variable_cost, 2)
    gross_margin_pct = round(gross_margin_eur / offer_price * 100, 1) if offer_price > 0 else 0

    approved = gross_margin_pct >= (min_margin_pct * 100)
    reason   = (
        f"Margin {gross_margin_pct}% ≥ {min_margin_pct*100}% — APPROVED"
        if approved else
        f"Margin {gross_margin_pct}% < {min_margin_pct*100}% — REJECTED (too deep)"
    )

    logger.info(
        f"[ProfitGuard] base=€{base_price_eur} disc={discount_pct*100:.0f}% "
        f"offer=€{offer_price} margin={gross_margin_pct}% → {'✓' if approved else '✗'}"
    )
    return {
        "approved":         approved,
        "offer_price":      offer_price,
        "gross_margin_eur": gross_margin_eur,
        "gross_margin_pct": gross_margin_pct,
        "reason":           reason,
    }


async def generate_recovery_offer(
    churn_reason: str,
    guest_name: str = "",
    service_interest: str = "",
    composite_score: float = 0.0,
    base_price_eur: float = 0.0,
    wa_number: str = "905348350169",
) -> dict:
    """
    Phase 22 H1 — Recovery Offer Generator.

    Churn reason → recovery strategy:
      PRICE_SENSITIVITY  → Last Chance %15 discount + Profit Guard check
      FRICTION_BARRIER   → Concierge proactive assist (no price drop needed)
      COMPETITOR_RISK    → Unique value differentiation
      SHALLOW_BROWSE     → Discovery nudge (re-engage)
      INDECISION         → Social proof + urgency

    Returns:
        {
            recovery_type: str,
            message: str,
            discount_pct: float,
            promo_code: str,
            whatsapp_deeplink: str,
            profit_guard: dict | None,
            approved: bool,
            source: str
        }
    """
    import random, string, urllib.parse

    name = guest_name.strip() if guest_name else "Değerli Misafirimiz"
    svc  = service_interest.strip() if service_interest else "Santis Ritüeli"

    def _rand_code(prefix: str) -> str:
        return prefix + "-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=5))

    # ── Strategy selection ─────────────────────────────────────────
    if churn_reason == "PRICE_SENSITIVITY":
        discount_pct  = 0.15
        promo_code    = _rand_code("LAST-CHANCE")
        recovery_type = "LAST_CHANCE_OFFER"
        prompt_brief  = (
            f"Misafir fiyat hassasiyeti nedeniyle ayrılmayı düşünüyor. "
            f"Sana özel **%15 indirimli son şans teklifimiz** var: {promo_code}. "
            f"Bunu 'old-money' tarzında, baskıcı olmadan, zarifçe sun."
        )
    elif churn_reason == "FRICTION_BARRIER":
        discount_pct  = 0.0
        promo_code    = _rand_code("VIP-ASSIST")
        recovery_type = "PROACTIVE_ASSIST"
        prompt_brief  = (
            f"Misafir süreçte bir engelle karşılaşmış olabilir. "
            f"'Size özel bir hazırlık yapалım mı? Tek bir mesajla halledelim.' "
            f"tonuyla, samimi ve proaktif bir destek teklif et."
        )
    elif churn_reason == "COMPETITOR_RISK":
        discount_pct  = 0.0
        promo_code    = _rand_code("SOVEREIGN")
        recovery_type = "VALUE_DIFFERENTIATION"
        prompt_brief  = (
            f"Misafir rakip alternatifler araştırıyor olabilir. "
            f"Santis'in benzersiz değerini (el yapımı ritüeller, uzman terapistler, "
            f"kişisel kuratorluk) zarif ve özgüvenli şekilde hatırlat. "
            f"Rakipleri asla anma."
        )
    elif churn_reason == "SHALLOW_BROWSE":
        discount_pct  = 0.0
        promo_code    = _rand_code("EXPLORE")
        recovery_type = "DISCOVERY_NUDGE"
        prompt_brief  = (
            f"Misafir henüz derinlemesine keşfetmemiş. "
            f"Merak uyandıran bir soru sor ve doğru ritüeli bulmana yardımcı olmayı teklif et."
        )
    else:  # INDECISION
        discount_pct  = 0.05
        promo_code    = _rand_code("FIRST-STEP")
        recovery_type = "SOCIAL_PROOF_NUDGE"
        prompt_brief  = (
            f"Misafir kararsız. Kısa ve güçlü bir sosyal kanıt ver "
            f"(örn. 'Geçen ay 340 misafir bu ritüeli seçti'). "
            f"Hafif bir aciliyet hissi yarat — baskıcı değil, nazik."
        )

    # ── Profit Guard for discount offers ──────────────────────────
    profit_guard = None
    if discount_pct > 0 and base_price_eur > 0:
        profit_guard = calculate_offer_profitability(
            base_price_eur=base_price_eur,
            discount_pct=discount_pct,
        )
        if not profit_guard["approved"]:
            # Scale back discount to preserve margin
            discount_pct = max(0.05, discount_pct - 0.05)
            promo_code   = _rand_code("LAST-CHANCE")
            logger.warning(
                f"[ProfitGuard] Discount too deep for €{base_price_eur} — "
                f"reduced to {discount_pct*100:.0f}%"
            )

    # ── Build Gemini recovery prompt ───────────────────────────────
    full_prompt = f"""Sen Santis Luxury Spa'nın Sovereign Recovery Concierge'isín.
Persona: Quiet Luxury — sakin, özgüvenli, zarif. Asla "indirim", "fırsat", "kampanya" deme.
Bunun yerine "özel hazırlık", "size ayrılmış alan", "ayrıcalıklı davet" gibi ifadeler kullan.

Misafir: {name}
İlgilendiği hizmet: {svc}
Niyet skoru: {composite_score*100:.0f}/100
Churn stratejisi: {prompt_brief}

GÖREV: 2-3 zarif Türkçe cümle yaz.
- Promo kodu {promo_code} varsa mesaja doğal entegre et (ama "indirim" deme)
- "WhatsApp" veya URL YAZMA — sistem halleder
- Asla "Sayın" değil — ismi doğrudan kullan

Sadece concierge yanıtını yaz."""

    try:
        raw     = await _call_gemini(full_prompt)
        message = raw.strip()[:600]
        src     = "gemini_live"
    except Exception as e:
        logger.error(f"[RecoveryOffer] Gemini error: {e}")
        if recovery_type == "LAST_CHANCE_OFFER":
            message = (
                f"{name}, {svc} için size özel bir alan ayırdık. "
                f"{promo_code} koduyla bu hafta sonu için ayrıcalıklı bir hazırlık başlatalım mı?"
            )
        elif recovery_type == "PROACTIVE_ASSIST":
            message = (
                f"{name}, rezervasyon sürecinde size yardımcı olmamı ister misiniz? "
                f"Tek bir mesajla {svc} deneyiminizi birlikte planlayabiliriz."
            )
        else:
            message = (
                f"{name}, Santis'teki her ritüel sizin için özenle hazırlanıyor. "
                f"{svc} konusunda aklınızdaki soruları paylaşır mısınız?"
            )
        src = "fallback"

    # ── WhatsApp deep-link ─────────────────────────────────────────
    wa_parts = [f"Merhaba! {svc} hakkında bilgi almak istiyorum."]
    if guest_name:
        wa_parts.append(f"Ad: {name}.")
    if promo_code and discount_pct > 0:
        wa_parts.append(f"Kod: {promo_code}")
    wa_link = f"https://wa.me/{wa_number}?text={urllib.parse.quote(' '.join(wa_parts))}"

    logger.info(
        f"[RecoveryOffer] type={recovery_type} | guest={name} "
        f"| disc={discount_pct*100:.0f}% | promo={promo_code} | src={src}"
    )

    return {
        "recovery_type":     recovery_type,
        "message":           message,
        "discount_pct":      discount_pct,
        "promo_code":        promo_code,
        "whatsapp_deeplink": wa_link,
        "profit_guard":      profit_guard,
        "approved":          True,
        "source":            src,
    }
