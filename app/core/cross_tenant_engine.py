"""
app/core/cross_tenant_engine.py
Phase 23: Cross-Tenant Intelligence — Collective Consciousness Layer
----------------------------------------------------------------------
H1: collect_global_trends()        — 7-day cross-tenant trend aggregation
H1: generate_wisdom_whisper()      — Gemini "Strategic Whisper" for a target tenant
H2: detect_global_anomaly()        — Global vs Local intent drop detection
H3: benchmark_tenant()             — Anonymous percentile ranking vs global avg
"""
from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger("CrossTenantIntelligence")

# ── Constants ────────────────────────────────────────────────────
TREND_WINDOW_DAYS   = 7
ANOMALY_WINDOW_HRS  = 2
ANOMALY_THRESHOLD   = 0.60   # 60%+ tenants must drop → GLOBAL
MIN_SESSIONS        = 5      # Min sessions per tenant to include in stats


# ═══════════════════════════════════════════════════════════════
# H1: COLLECTIVE WISDOM ENGINE
# ═══════════════════════════════════════════════════════════════

def collect_global_trends(db_path: str | Path) -> dict:
    """
    Aggregate cross-tenant service trends for the last TREND_WINDOW_DAYS.
    Returns summary of top performing services per tenant + global leaders.
    """
    db_path = str(db_path)
    cutoff  = (datetime.now(timezone.utc) - timedelta(days=TREND_WINDOW_DAYS)).isoformat()

    try:
        con = sqlite3.connect(db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row

        # ── Tenant count ─────────────────────────────────────────────
        tenant_rows = con.execute(
            "SELECT id, name, country FROM tenants WHERE is_active=1 AND is_deleted=0"
        ).fetchall()
        tenant_map = {str(r["id"]): {"name": r["name"], "country": r["country"]} for r in tenant_rows}

        if len(tenant_map) < 1:
            con.close()
            return {"status": "no_tenants", "trends": [], "global_leaders": []}

        # ── Per-tenant service aggregation ───────────────────────────
        rows = con.execute("""
            SELECT
                tenant_id,
                service_interest,
                COUNT(*)                         AS session_count,
                AVG(composite_score)             AS avg_score,
                SUM(CASE WHEN conversion_status='converted' THEN 1 ELSE 0 END) AS conversions,
                SUM(CASE WHEN is_whale=1 THEN 1 ELSE 0 END)                    AS whale_count,
                MAX(scored_at)                   AS last_seen
            FROM revenue_scores
            WHERE scored_at >= ?
              AND service_interest IS NOT NULL
              AND service_interest != ''
            GROUP BY tenant_id, service_interest
            HAVING session_count >= ?
            ORDER BY avg_score DESC
        """, (cutoff, MIN_SESSIONS)).fetchall()

        con.close()

    except Exception as e:
        logger.error(f"[CrossTenant] collect_global_trends failed: {e}")
        return {"status": "error", "error": str(e), "trends": [], "global_leaders": []}

    # ── Build structured output ───────────────────────────────────
    trends: list[dict] = []
    global_service_stats: dict[str, dict] = {}

    for r in rows:
        tid      = str(r["tenant_id"] or "")
        svc      = r["service_interest"] or ""
        sessions = int(r["session_count"])
        conv     = int(r["conversions"])
        conv_rate = round(conv / sessions * 100, 1) if sessions else 0.0
        avg_score = round(float(r["avg_score"] or 0), 3)

        tenant_info = tenant_map.get(tid, {"name": "Unknown", "country": "?"})

        trend_entry = {
            "tenant_id":       tid,
            "tenant_name":     tenant_info["name"],
            "tenant_country":  tenant_info["country"],
            "service":         svc,
            "session_count":   sessions,
            "avg_score":       avg_score,
            "conversion_rate": conv_rate,
            "whale_count":     int(r["whale_count"] or 0),
            "last_seen":       r["last_seen"] or "",
        }
        trends.append(trend_entry)

        # Aggregate globally per service
        if svc not in global_service_stats:
            global_service_stats[svc] = {
                "service": svc, "total_sessions": 0, "total_conversions": 0,
                "total_whales": 0, "tenant_count": 0, "avg_scores": []
            }
        gs = global_service_stats[svc]
        gs["total_sessions"]    += sessions
        gs["total_conversions"] += conv
        gs["total_whales"]      += int(r["whale_count"] or 0)
        gs["tenant_count"]      += 1
        gs["avg_scores"].append(avg_score)

    # ── Global leaders: top 5 services across all tenants ────────
    global_leaders = []
    for svc, gs in global_service_stats.items():
        n = gs["total_sessions"]
        global_leaders.append({
            "service":         svc,
            "global_sessions": n,
            "global_conv_pct": round(gs["total_conversions"] / n * 100, 1) if n else 0,
            "global_avg_score": round(sum(gs["avg_scores"]) / len(gs["avg_scores"]), 3),
            "whale_count":     gs["total_whales"],
            "tenant_count":    gs["tenant_count"],
        })
    global_leaders.sort(key=lambda x: x["global_conv_pct"], reverse=True)

    logger.info(
        f"[CrossTenant] collect_global_trends: {len(trends)} rows "
        f"| {len(global_leaders)} unique services | {len(tenant_map)} tenants"
    )
    return {
        "status":        "success",
        "window_days":   TREND_WINDOW_DAYS,
        "tenant_count":  len(tenant_map),
        "trends":        trends[:50],
        "global_leaders": global_leaders[:10],
    }


async def generate_wisdom_whisper(
    global_leaders: list[dict],
    target_tenant_name: str = "Santis",
    wa_number: str = "905348350169",
) -> dict:
    """
    H1: Gemini generates a "Strategic Whisper" for the target tenant
    based on global top-performing services.
    """
    import urllib.parse

    if not global_leaders:
        return {
            "status":  "no_data",
            "whisper": "Veri yetersiz — şubeler arası trend analizi için daha fazla oturum gerekli.",
            "source":  "fallback",
        }

    # Build top-3 insight string
    top3 = global_leaders[:3]
    insight_lines = []
    for i, g in enumerate(top3, 1):
        insight_lines.append(
            f"{i}. '{g['service']}' — Global dönüşüm: %{g['global_conv_pct']} "
            f"| Ortalama niyet skoru: {g['global_avg_score']} "
            f"| Balina yoğunluğu: {g['whale_count']} VIP"
        )
    insight_str = "\n".join(insight_lines)

    prompt = f"""Sen Santis Global Intelligence Network'ün Sovereign Stratejistisin.
Aşağıdaki küresel trendlere dayanarak {target_tenant_name} şubesine
'Quiet Luxury' tarzında, özgüvenli ve zarif bir stratejik öneride bulun.

Küresel Lider Hizmetler (Son {TREND_WINDOW_DAYS} gün):
{insight_str}

GÖREV: 3-4 Türkçe cümle. Rakam kullan ama "indirim" deme.
'Küresel trend', 'global performans', 'stratejik fırsat' ifadeleri kullanabilirsin.
Asla özür dileme, asla klişe spa dili kullanma. Özgüvenli bir stratejist gibi konuş.

Sadece öneriyi yaz, başlık veya etiket ekleme."""

    try:
        from app.core.gemini_engine import _call_gemini
        raw     = await _call_gemini(prompt)
        whisper = raw.strip()[:800]
        source  = "gemini_live"
    except Exception as e:
        logger.error(f"[CrossTenant] Gemini wisdom whisper failed: {e}")
        top_svc = top3[0]["service"] if top3 else "Hammam Ritueli"
        whisper = (
            f"Küresel analiz, '{top_svc}' hizmetinin şu an tüm şubelerde "
            f"%{top3[0]['global_conv_pct']} dönüşüm oranıyla zirvede olduğunu gösteriyor. "
            f"{target_tenant_name} concierge stratejinizi bu doğrultuda yeniden kalibre etmenizi öneririm."
        )
        source = "fallback"

    logger.info(f"[CrossTenant] Wisdom whisper generated for '{target_tenant_name}' | src={source}")
    return {
        "status":      "success",
        "tenant":      target_tenant_name,
        "whisper":     whisper,
        "based_on":    [g["service"] for g in top3],
        "source":      source,
    }


# ═══════════════════════════════════════════════════════════════
# H2: GLOBAL ANOMALY DETECTOR
# ═══════════════════════════════════════════════════════════════

def detect_global_anomaly(db_path: str | Path) -> dict:
    """
    H2: Compare recent vs older intent scores per tenant.
    If 60%+ of tenants show simultaneous drop → GLOBAL_TREND.
    Single-tenant drop → LOCAL_ISSUE.
    """
    db_path = str(db_path)
    now    = datetime.now(timezone.utc)
    recent = (now - timedelta(hours=ANOMALY_WINDOW_HRS)).isoformat()
    older  = (now - timedelta(hours=ANOMALY_WINDOW_HRS * 4)).isoformat()

    try:
        con = sqlite3.connect(db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row

        # Recent avg score per tenant
        recent_rows = con.execute("""
            SELECT tenant_id, AVG(composite_score) AS avg_score, COUNT(*) AS cnt
            FROM revenue_scores
            WHERE scored_at >= ?
            GROUP BY tenant_id
            HAVING cnt >= 3
        """, (recent,)).fetchall()

        # Older baseline avg per tenant
        older_rows = con.execute("""
            SELECT tenant_id, AVG(composite_score) AS avg_score
            FROM revenue_scores
            WHERE scored_at >= ? AND scored_at < ?
            GROUP BY tenant_id
        """, (older, recent)).fetchall()

        con.close()

    except Exception as e:
        logger.error(f"[CrossTenant] detect_global_anomaly failed: {e}")
        return {"status": "error", "error": str(e), "anomaly_type": "UNKNOWN"}

    if not recent_rows:
        return {
            "status":       "insufficient_data",
            "anomaly_type": "NONE",
            "message":      f"Son {ANOMALY_WINDOW_HRS} saatte yeterli oturum yok.",
        }

    older_map = {str(r["tenant_id"]): float(r["avg_score"] or 0) for r in older_rows}

    dropping_tenants  = []
    stable_tenants    = []
    tenant_analysis   = []

    for r in recent_rows:
        tid          = str(r["tenant_id"])
        recent_score = float(r["avg_score"] or 0)
        base_score   = older_map.get(tid, recent_score)
        drop_pct     = round((base_score - recent_score) / base_score * 100, 1) if base_score > 0 else 0

        entry = {
            "tenant_id":    tid,
            "recent_score": round(recent_score, 3),
            "base_score":   round(base_score, 3),
            "drop_pct":     drop_pct,
            "is_dropping":  drop_pct > 10,
        }
        tenant_analysis.append(entry)

        if drop_pct > 10:
            dropping_tenants.append(tid)
        else:
            stable_tenants.append(tid)

    total          = len(recent_rows)
    drop_ratio     = len(dropping_tenants) / total if total else 0
    global_avg_drop = round(sum(e["drop_pct"] for e in tenant_analysis) / total, 1) if total else 0

    if drop_ratio >= ANOMALY_THRESHOLD and len(dropping_tenants) >= 2:
        anomaly_type  = "GLOBAL_TREND"
        likely_cause  = "Küresel piyasa durgunluğu veya mevsimsel etki. Panik yapmayın — tüm şubeler etkilenmiş."
        severity      = "INFO"
    elif drop_ratio > 0 and len(dropping_tenants) == 1:
        anomaly_type  = "LOCAL_ISSUE"
        likely_cause  = "Tek şubede sorun tespit edildi. Teknik hata, içerik sorunu veya lokal etken."
        severity      = "WARNING"
    elif len(dropping_tenants) > 1:
        anomaly_type  = "PARTIAL_ANOMALY"
        likely_cause  = "Bazı şubelerde düşüş var — regional etken veya kampanya sonu olabilir."
        severity      = "CAUTION"
    else:
        anomaly_type  = "NONE"
        likely_cause  = "Tüm şubeler stabil. İyi gidiyoruz."
        severity      = "OK"

    logger.info(
        f"[CrossTenant] Anomaly: {anomaly_type} | drop_ratio={drop_ratio:.0%} "
        f"| global_avg_drop={global_avg_drop}%"
    )
    return {
        "status":           "success",
        "anomaly_type":     anomaly_type,
        "severity":         severity,
        "likely_cause":     likely_cause,
        "total_tenants":    total,
        "dropping_tenants": len(dropping_tenants),
        "drop_ratio_pct":   round(drop_ratio * 100, 1),
        "global_avg_drop":  global_avg_drop,
        "tenant_analysis":  tenant_analysis,
        "window_hours":     ANOMALY_WINDOW_HRS,
    }


# ═══════════════════════════════════════════════════════════════
# H3: BENCHMARK ENGINE
# ═══════════════════════════════════════════════════════════════

def benchmark_tenant(tenant_id: str, db_path: str | Path) -> dict:
    """
    H3: Anonymous percentile ranking vs global average.
    Returns strengths, weaknesses, and rank for the target tenant.
    """
    db_path = str(db_path)
    cutoff  = (datetime.now(timezone.utc) - timedelta(days=TREND_WINDOW_DAYS)).isoformat()

    try:
        con = sqlite3.connect(db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row

        # All tenants stats (anonymized)
        all_stats = con.execute("""
            SELECT
                tenant_id,
                AVG(composite_score)                                                   AS avg_score,
                COUNT(*)                                                               AS total_sessions,
                SUM(CASE WHEN conversion_status='converted' THEN 1.0 ELSE 0 END)
                    / NULLIF(COUNT(*), 0) * 100                                       AS conv_rate,
                SUM(CASE WHEN is_whale=1 THEN 1.0 ELSE 0 END)
                    / NULLIF(COUNT(*), 0) * 100                                       AS whale_density
            FROM revenue_scores
            WHERE scored_at >= ?
            GROUP BY tenant_id
            HAVING total_sessions >= ?
        """, (cutoff, MIN_SESSIONS)).fetchall()

        con.close()

    except Exception as e:
        logger.error(f"[CrossTenant] benchmark_tenant failed: {e}")
        return {"status": "error", "error": str(e)}

    if not all_stats:
        return {
            "status":  "insufficient_data",
            "message": f"Son {TREND_WINDOW_DAYS} günde yeterli oturum yok.",
        }

    # Build comparable list
    stat_list = []
    target    = None
    for r in all_stats:
        entry = {
            "tenant_id":    str(r["tenant_id"]),
            "avg_score":    round(float(r["avg_score"] or 0), 3),
            "total_sessions": int(r["total_sessions"]),
            "conv_rate":    round(float(r["conv_rate"] or 0), 1),
            "whale_density": round(float(r["whale_density"] or 0), 1),
        }
        stat_list.append(entry)
        if str(r["tenant_id"]) == str(tenant_id):
            target = entry

    if not target:
        return {
            "status":  "tenant_not_found",
            "message": f"Tenant {tenant_id[:8]}… için yeterli veri yok.",
        }

    if len(stat_list) < 2:
        return {
            "status":         "single_tenant",
            "message":        "Benchmark için 2+ tenant gerekli. Şu an yalnız zirvede olduğunuz için karşılaştırma yapılamaz.",
            "tenant_stats":   target,
            "percentile":     100,
            "rank":           1,
        }

    # Percentile calculation
    def _percentile(key: str) -> float:
        vals  = sorted([s[key] for s in stat_list])
        t_val = target[key]
        below = sum(1 for v in vals if v < t_val)
        return round(below / (len(vals) - 1) * 100, 1) if len(vals) > 1 else 100.0

    score_pct = _percentile("avg_score")
    conv_pct  = _percentile("conv_rate")
    whale_pct = _percentile("whale_density")
    overall   = round((score_pct + conv_pct + whale_pct) / 3, 1)

    # Rank
    sorted_by_score = sorted(stat_list, key=lambda x: x["avg_score"], reverse=True)
    rank = next((i + 1 for i, s in enumerate(sorted_by_score) if s["tenant_id"] == tenant_id), len(stat_list))

    # Global averages
    n = len(stat_list)
    global_avg_score = round(sum(s["avg_score"] for s in stat_list) / n, 3)
    global_avg_conv  = round(sum(s["conv_rate"] for s in stat_list) / n, 1)

    # Strengths / weaknesses
    strengths  = []
    weaknesses = []
    if score_pct >= 70:  strengths.append(f"Niyet skoru global %{score_pct}'lik dilimde")
    else:                weaknesses.append("Niyet skoru ortalamanın altında")
    if conv_pct >= 70:   strengths.append(f"Dönüşüm oranı global %{conv_pct}'lik dilimde")
    else:                weaknesses.append("Dönüşüm oranı geliştirilebilir")
    if whale_pct >= 70:  strengths.append(f"VIP balina yoğunluğu global %{whale_pct}'lik dilimde")
    else:                weaknesses.append("VIP segment geliştirme fırsatı var")

    logger.info(
        f"[CrossTenant] Benchmark: tenant={tenant_id[:8]}… rank={rank}/{n} "
        f"overall_pct={overall}%"
    )
    return {
        "status":          "success",
        "tenant_id":       tenant_id,
        "rank":            rank,
        "total_tenants":   n,
        "percentile":      overall,
        "score_percentile": score_pct,
        "conv_percentile": conv_pct,
        "whale_percentile": whale_pct,
        "tenant_stats":    target,
        "global_avg_score": global_avg_score,
        "global_avg_conv":  global_avg_conv,
        "strengths":       strengths,
        "weaknesses":      weaknesses,
        "vs_global_score": round(target["avg_score"] - global_avg_score, 3),
        "vs_global_conv":  round(target["conv_rate"] - global_avg_conv, 1),
    }
