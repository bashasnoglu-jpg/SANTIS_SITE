"""
app/core/revenue_oracle.py
Phase 17: Revenue Oracle — Predictive Scoring Engine
------------------------------------------------------
Weighted guest intent scoring:
  • 0.35 — Gemini intent_score (behavioral AI signal)
  • 0.25 — Recency (time on site / page depth)
  • 0.20 — AOV affinity (high-ticket service interest)
  • 0.20 — Behavioral tags (promo_holder, returning, urgency)

Whale Threshold: composite_score >= 0.75
"""

from __future__ import annotations
import logging
import random
from datetime import datetime
from typing import Optional

logger = logging.getLogger("RevenueOracle")

# ── Weights (must sum to 1.0) ──────────────────────────────────────
W_INTENT   = 0.35
W_RECENCY  = 0.25
W_AOV      = 0.20
W_BEHAVIOR = 0.20

WHALE_THRESHOLD = 0.75   # composite score that triggers Whale Alert
HIGH_VALUE_SERVICES = {
    "vip özel protokol": 1.0,
    "çift ritüel": 0.9,
    "hammam ritüeli": 0.85,
    "sothys yüz bakımı": 0.80,
    "taş terapisi": 0.75,
    "derin doku masajı": 0.70,
    "aromaterapik masaj": 0.60,
}


def _normalize(value: float, min_v: float = 0.0, max_v: float = 100.0) -> float:
    """Clamp and normalize a value to [0, 1]."""
    return max(0.0, min(1.0, (value - min_v) / (max_v - min_v)))


def score_intent(intent_score: int) -> float:
    """Convert raw 0-100 intent score to 0-1 normalized."""
    return _normalize(float(intent_score), 0, 100)


def score_recency(
    session_duration_sec: int = 0,
    page_depth: int = 1,
) -> float:
    """
    Guests who've spent more time or viewed more pages are closer to booking.
    Duration: 0-300s → 0-1  |  page_depth: 1-10
    """
    dur_score  = _normalize(float(session_duration_sec), 0, 300)
    depth_score = _normalize(float(page_depth), 1, 10)
    return (dur_score * 0.6) + (depth_score * 0.4)


def score_aov(service_interest: str = "") -> float:
    """Map service interest to a ticket-size proxy score."""
    svc = service_interest.lower().strip()
    for key, val in HIGH_VALUE_SERVICES.items():
        if key in svc or svc in key:
            return val
    return 0.3  # unknown / generic interest


def score_behavioral(tags: list[str]) -> float:
    """
    Tags add cumulative value.
    promo_holder → 0.3  |  returning → 0.25  |  high_intent → 0.25  |  urgency → 0.2
    """
    tag_weights = {
        "high_intent":   0.30,
        "promo_holder":  0.25,
        "returning_guest": 0.25,
        "warm_lead":     0.20,
        "urgency_prone": 0.15,
    }
    score = sum(tag_weights.get(t, 0.05) for t in tags)
    return min(score, 1.0)


# ── Main Compositor ────────────────────────────────────────────────
def compute_oracle_score(
    intent_score: int = 50,
    session_duration_sec: int = 60,
    page_depth: int = 2,
    service_interest: str = "",
    behavioral_tags: list[str] | None = None,
    guest_name: str = "",
    session_id: str = "",
) -> dict:
    """
    Returns the full Oracle scoring payload.
    """
    tags = behavioral_tags or []

    s_intent   = score_intent(intent_score)
    s_recency  = score_recency(session_duration_sec, page_depth)
    s_aov      = score_aov(service_interest)
    s_behavior = score_behavioral(tags)

    composite = (
        s_intent   * W_INTENT +
        s_recency  * W_RECENCY +
        s_aov      * W_AOV +
        s_behavior * W_BEHAVIOR
    )

    is_whale = composite >= WHALE_THRESHOLD

    tier = "explorer"
    if composite >= 0.85:
        tier = "whale"
    elif composite >= 0.70:
        tier = "hot_lead"
    elif composite >= 0.50:
        tier = "warm_lead"
    elif composite >= 0.30:
        tier = "curious"

    nudge = _build_nudge(tier, service_interest, guest_name, tags)

    logger.info(
        f"[Oracle] {guest_name or session_id[:8]} | "
        f"composite={composite:.3f} tier={tier} whale={is_whale}"
    )

    return {
        "session_id":   session_id,
        "guest_name":   guest_name,
        "composite_score": round(composite, 4),
        "tier":          tier,
        "is_whale":      is_whale,
        "components": {
            "intent":   round(s_intent, 3),
            "recency":  round(s_recency, 3),
            "aov":      round(s_aov, 3),
            "behavior": round(s_behavior, 3),
        },
        "nudge":         nudge,
        "service_interest": service_interest,
        "behavioral_tags":  tags,
        "scored_at":     datetime.utcnow().isoformat(),
    }


# ── Dynamic Nudge Builder ──────────────────────────────────────────
def _build_nudge(
    tier: str,
    service_interest: str,
    guest_name: str,
    tags: list[str],
) -> dict:
    """Generate a personalized nudge payload for the frontend."""
    name = guest_name or "Değerli Misafirimiz"
    svc  = service_interest or "Santis Ritüeli"

    if tier == "whale":
        return {
            "type":    "whale_alert",
            "title":   f"🐋 VIP Misafir Tespit Edildi",
            "message": (
                f"{name}, {svc} için yüksek niyet sinyali. "
                f"Özel Private Ritual paketi sunulması önerilir."
            ),
            "cta":     "Private Ritual Teklif Et",
            "priority": "critical",
            "color":    "#d4af37",
        }
    elif tier == "hot_lead":
        return {
            "type":    "hot_lead_nudge",
            "title":   "🔥 Sıcak Potansiyel",
            "message": f"{name} rezervasyona çok yakın. Kısa dokunuş yeterli.",
            "cta":     "WhatsApp Nudge Gönder",
            "priority": "high",
            "color":    "#f97316",
        }
    elif tier == "warm_lead":
        promo = "promo_holder" in tags
        return {
            "type":    "warm_nudge",
            "title":   "💛 İlgili Ziyaretçi",
            "message": (
                f"{name} inceleme aşamasında"
                + (". Promo kodu hatırlatması yapılabilir." if promo else ".")
            ),
            "cta":     "Promo Hatırlatması" if promo else "İçerik Göster",
            "priority": "medium",
            "color":    "#eab308",
        }
    else:
        return {
            "type":    "discovery_nudge",
            "title":   "👀 Keşif Modu",
            "message": "Ziyaretçi ritüelleri inceliyor. Organik deneyim bırakılsın.",
            "cta":     None,
            "priority": "low",
            "color":    "#64748b",
        }


# ── Phase 21: Behavioral Oracle ───────────────────────────────────
import json as _json
import sqlite3 as _sqlite3
from datetime import timedelta as _td


def _open_sqlite(db_path: str) -> _sqlite3.Connection:
    """Open SQLite with row_factory, raise if not found."""
    con = _sqlite3.connect(db_path, check_same_thread=False)
    con.row_factory = _sqlite3.Row
    return con


def _ensure_conversion_columns(db_path: str) -> None:
    """
    Phase 21 migration: Add conversion tracking columns to revenue_scores.
    Safe to call multiple times — uses ADD COLUMN IF NOT EXISTS pattern.
    """
    if not str(db_path).endswith('.db') and not str(db_path).endswith('.sqlite'):
        return
        
    new_cols = [
        ("conversion_status",    "TEXT",  "'pending'"),
        ("attributed_revenue",   "REAL",  "0.0"),
        ("converted_booking_id", "TEXT",  "NULL"),
        ("churn_reason",         "TEXT",  "NULL"),
        ("last_pages_json",      "TEXT",  "NULL"),
    ]
    try:
        with _open_sqlite(db_path) as con:
            existing = {row[1] for row in con.execute("PRAGMA table_info(revenue_scores)")}
            for col, ctype, default in new_cols:
                if col not in existing:
                    con.execute(
                        f"ALTER TABLE revenue_scores ADD COLUMN {col} {ctype} DEFAULT {default}"
                    )
            con.commit()
        logger.info("[Phase21] revenue_scores migration OK")
    except Exception as e:
        logger.warning(f"[Phase21] Migration skipped: {e}")


def match_conversions(db_path: str, window_hours: int = 24) -> dict:
    """
    Phase 21 H1 — Conversion Matcher.
    Joins revenue_scores × bookings on session_id.
    Updates conversion_status: 'converted' | 'lost' | 'pending'.
    Returns Oracle accuracy report.
    """
    _ensure_conversion_columns(db_path)

    try:
        with _open_sqlite(db_path) as con:
            cutoff = (datetime.utcnow() - _td(hours=window_hours)).isoformat()

            # Mark sessions converted (booking exists with same session_id)
            con.execute("""
                UPDATE revenue_scores
                SET conversion_status    = 'converted',
                    attributed_revenue   = COALESCE(
                        (SELECT COALESCE(b.price_snapshot, 0)
                         FROM bookings b
                         WHERE CAST(b.customer_id AS TEXT) = revenue_scores.session_id
                            OR b.notes LIKE '%' || revenue_scores.session_id || '%'
                         LIMIT 1), 0),
                    converted_booking_id = (
                        SELECT CAST(b.id AS TEXT)
                        FROM bookings b
                        WHERE CAST(b.customer_id AS TEXT) = revenue_scores.session_id
                           OR b.notes LIKE '%' || revenue_scores.session_id || '%'
                        LIMIT 1
                    )
                WHERE conversion_status = 'pending'
                  AND EXISTS (
                      SELECT 1 FROM bookings b
                      WHERE CAST(b.customer_id AS TEXT) = revenue_scores.session_id
                         OR b.notes LIKE '%' || revenue_scores.session_id || '%'
                  )
            """)

            # Mark sessions lost (older than window, no booking)
            con.execute("""
                UPDATE revenue_scores
                SET conversion_status = 'lost'
                WHERE conversion_status = 'pending'
                  AND scored_at < :cutoff
            """, {"cutoff": cutoff})

            con.commit()

            # Aggregate stats
            row = con.execute("""
                SELECT
                    COUNT(*)                                               AS total,
                    SUM(conversion_status = 'converted')                  AS converted,
                    SUM(conversion_status = 'lost')                       AS lost,
                    SUM(conversion_status = 'pending')                    AS pending,
                    COALESCE(SUM(attributed_revenue), 0)                  AS revenue_lift,
                    AVG(CASE WHEN is_whale = 1 THEN composite_score END)  AS avg_whale_score
                FROM revenue_scores
            """).fetchone()

            total      = int(row["total"] or 0)
            converted  = int(row["converted"] or 0)
            lost       = int(row["lost"] or 0)
            pending    = int(row["pending"] or 0)
            rev_lift   = round(float(row["revenue_lift"] or 0), 2)
            accuracy   = round(converted / max(converted + lost, 1) * 100, 1)

            result = {
                "total":            total,
                "converted":        converted,
                "lost":             lost,
                "pending":          pending,
                "accuracy_score":   accuracy,          # %
                "revenue_lift_eur": rev_lift,
                "avg_whale_score":  round(float(row["avg_whale_score"] or 0), 3),
            }
            logger.info(
                f"[Phase21] Conversion match complete: "
                f"accuracy={accuracy}% | converted={converted} | lost={lost} | lift=€{rev_lift}"
            )
            return result

    except Exception as e:
        logger.error(f"[Phase21] match_conversions failed: {e}")
        return {
            "total": 0, "converted": 0, "lost": 0, "pending": 0,
            "accuracy_score": 0.0, "revenue_lift_eur": 0.0, "avg_whale_score": 0.0,
            "error": str(e),
        }


def analyze_leakage(db_path: str) -> list:
    """
    Phase 21 H2 — Leakage Finder.
    For 'lost' whale/hot_lead sessions, infers churn reason:
      PRICE_SENSITIVITY  → last page contained price/fiyat/paket
      SHALLOW_BROWSE     → page_depth < 2
      FRICTION_BARRIER   → whale score ≥ 0.75 but no conversion
      COMPETITOR_RISK    → high intent + quick exit
    Updates churn_reason column. Returns top leakage records.
    """
    _ensure_conversion_columns(db_path)

    PRICE_SIGNALS = {"fiyat", "price", "paket", "paketi", "ucret", "ücret", "indir", "teklif"}

    try:
        with _open_sqlite(db_path) as con:
            rows = con.execute("""
                SELECT session_id, guest_name, composite_score, tier, is_whale,
                       service_interest, last_pages_json, churn_reason
                FROM revenue_scores
                WHERE conversion_status = 'lost'
                  AND tier IN ('whale','hot_lead','warm_lead')
                ORDER BY composite_score DESC
                LIMIT 50
            """).fetchall()

            leakage = []
            for r in rows:
                sid       = r["session_id"]
                score     = float(r["composite_score"] or 0)
                is_whale  = bool(r["is_whale"])
                last_pages = []
                try:
                    lp = r["last_pages_json"]
                    if lp:
                        last_pages = _json.loads(lp)
                except Exception:
                    pass

                last_page_str = " ".join(last_pages).lower()

                # Churn reason classifier
                if any(sig in last_page_str for sig in PRICE_SIGNALS):
                    reason = "PRICE_SENSITIVITY"
                elif len(last_pages) < 2:
                    reason = "SHALLOW_BROWSE"
                elif score >= WHALE_THRESHOLD and is_whale:
                    reason = "FRICTION_BARRIER"
                elif score >= 0.60:
                    reason = "COMPETITOR_RISK"
                else:
                    reason = "INDECISION"

                # Persist churn_reason
                if not r["churn_reason"]:
                    con.execute(
                        "UPDATE revenue_scores SET churn_reason = ? WHERE session_id = ?",
                        (reason, sid)
                    )

                leakage.append({
                    "session_id":     sid,
                    "guest_name":     r["guest_name"] or "Anonim",
                    "score":          round(score, 3),
                    "tier":           r["tier"],
                    "is_whale":       is_whale,
                    "service":        r["service_interest"] or "",
                    "last_pages":     last_pages,
                    "churn_reason":   reason,
                })

            con.commit()
            logger.info(f"[Phase21] Leakage analysis: {len(leakage)} lost sessions classified")
            return leakage

    except Exception as e:
        logger.error(f"[Phase21] analyze_leakage failed: {e}")
        return []
