"""
app/core/self_heal_engine.py
Phase 25: Self-Healing Frontend Engine
------------------------------------------
When anomalies or low-performance signals are detected,
the system autonomously generates UI healing directives.

H1: analyze_and_heal()     — reads signals, picks strategy
H1: get_heal_directive()   — returns frontend-ready JSON action
H2: _build_directive()     — maps anomaly → actionable directive
"""
from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger("SelfHealEngine")

# ── Healing strategies by anomaly type ──────────────────────────
HEAL_STRATEGIES = {
    "LOCAL_ISSUE": {
        "action":          "PROMOTE_TOP_SERVICE",
        "urgency":         "HIGH",
        "ui_badge":        "Öne Çıkan",
        "badge_en":        "Featured",
        "concierge_hint":  (
            "Bugün misafirlerimiz için özel bir gün — en sevilen ritüelimizi "
            "seninle keşfetmek istiyorum."
        ),
        "concierge_hint_en": (
            "Today is a special day for our guests — I'd love to help you "
            "discover our most beloved ritual."
        ),
    },
    "GLOBAL_TREND": {
        "action":          "SOCIAL_PROOF_BOOST",
        "urgency":         "MEDIUM",
        "ui_badge":        "Çok Tercih Edilen",
        "badge_en":        "Most Popular",
        "concierge_hint":  (
            "Bu hafta misafirlerimizin en çok tercih ettiği deneyimi "
            "seninle paylaşmak istiyorum."
        ),
        "concierge_hint_en": (
            "This week's favourite experience among our guests is something "
            "I'd love to share with you."
        ),
    },
    "PARTIAL_ANOMALY": {
        "action":          "HIGHLIGHT_AVAILABILITY",
        "urgency":         "LOW",
        "ui_badge":        "Sınırlı Slot",
        "badge_en":        "Limited Slots",
        "concierge_hint":  (
            "Bugün için birkaç özel saatimiz mevcut — kaçırmamak ister misin?"
        ),
        "concierge_hint_en": (
            "We have a few special slots available today — shall I reserve one for you?"
        ),
    },
    "NONE": {
        "action":          "STATUS_QUO",
        "urgency":         "NONE",
        "ui_badge":        None,
        "badge_en":        None,
        "concierge_hint":  None,
        "concierge_hint_en": None,
    },
}


def _get_top_service(db_path: str, tenant_id: Optional[str] = None) -> dict:
    """Return the highest-converting service in the last 7 days."""
    try:
        con = sqlite3.connect(db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row
        q = """
            SELECT service_interest,
                   COUNT(*) AS sessions,
                   SUM(CASE WHEN conversion_status='converted' THEN 1 ELSE 0 END) AS conversions,
                   AVG(composite_score) AS avg_score
            FROM revenue_scores
            WHERE service_interest IS NOT NULL AND service_interest != ''
            GROUP BY service_interest
            ORDER BY conversions DESC, avg_score DESC
            LIMIT 1
        """
        row = con.execute(q).fetchone()
        con.close()
        if row:
            return {
                "name":       row["service_interest"],
                "sessions":   int(row["sessions"]),
                "conv_count": int(row["conversions"]),
                "avg_score":  round(float(row["avg_score"] or 0), 3),
            }
    except Exception as e:
        logger.warning(f"[SelfHeal] _get_top_service failed: {e}")
    return {"name": "Hammam Ritueli", "sessions": 0, "conv_count": 0, "avg_score": 0}


def _build_directive(anomaly: dict, top_service: dict, strategy: dict) -> dict:
    """Compose the frontend-ready healing directive."""
    return {
        "action":             strategy["action"],
        "urgency":            strategy["urgency"],
        "target_service":     top_service["name"],
        "ui_badge":           strategy["ui_badge"],
        "ui_badge_en":        strategy["badge_en"],
        "concierge_hint":     strategy["concierge_hint"],
        "concierge_hint_en":  strategy["concierge_hint_en"],
        "anomaly_type":       anomaly.get("anomaly_type", "NONE"),
        "anomaly_severity":   anomaly.get("severity", "OK"),
        "likely_cause":       anomaly.get("likely_cause", ""),
        "generated_at":       datetime.now(timezone.utc).isoformat(),
    }


def analyze_and_heal(db_path: str | Path) -> dict:
    """
    H1: Main entry point.
    Reads anomaly signals and returns a healing directive.
    """
    db_path = str(db_path)

    # ── Step 1: Detect anomaly ───────────────────────────────────
    try:
        from app.core.cross_tenant_engine import detect_global_anomaly
        anomaly = detect_global_anomaly(db_path)
    except Exception as e:
        logger.error(f"[SelfHeal] anomaly detection failed: {e}")
        anomaly = {"anomaly_type": "UNKNOWN", "severity": "UNKNOWN"}

    atype    = anomaly.get("anomaly_type", "NONE")
    strategy = HEAL_STRATEGIES.get(atype, HEAL_STRATEGIES["NONE"])

    # ── Step 2: Get top performing service ───────────────────────
    top_service = _get_top_service(db_path)

    # ── Step 3: Build directive ──────────────────────────────────
    directive = _build_directive(anomaly, top_service, strategy)

    # ── Step 4: Optional Gemini narrative for concierge hint ─────
    if strategy["action"] != "STATUS_QUO" and strategy["concierge_hint"]:
        try:
            from app.core.cross_tenant_engine import collect_global_trends
            trends        = collect_global_trends(db_path)
            global_leaders = trends.get("global_leaders", [])

            if global_leaders:
                # Enrich concierge hint with real top service
                best = global_leaders[0]["service"]
                directive["concierge_hint"] = (
                    f"Şu an tüm misafirlerimiz arasında en beğenilen deneyim "
                    f"'{best}' — bu fırsatı kaçırmamanlı."
                )
                directive["concierge_hint_en"] = (
                    f"Our most loved experience right now is '{best}' — "
                    f"I'd love to reserve it for you."
                )
                directive["target_service"] = best
        except Exception as e:
            logger.debug(f"[SelfHeal] Gemini enrich skipped: {e}")

    logger.info(
        f"[SelfHeal] Directive: action={directive['action']} "
        f"urgency={directive['urgency']} service='{directive['target_service']}'"
    )
    return {"status": "success", "directive": directive}


def get_heal_directive(db_path: str | Path) -> dict:
    """Alias — returns just the directive dict for API response."""
    result = analyze_and_heal(db_path)
    return result
