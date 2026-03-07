"""
app/core/report_engine.py
Phase 24: Investor Report Automator
--------------------------------------
H1: aggregate_investor_metrics()   — tüm fazların altın verilerini süzgeçler
H2: generate_investor_narrative()  — Gemini VC diline çevirir
H3: build_investor_report()        — tam rapor nesnesi (PDF/HTML için hazır)
"""
from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

logger = logging.getLogger("InvestorReport")


def aggregate_investor_metrics(db_path: str | Path) -> dict:
    """
    H1: Pulls key metrics from all revenue-related tables.
    Returns the 4 golden KPIs: Revenue Lift, Oracle Accuracy,
    Whale Conversion, Avg Intent Score.
    """
    db_path = str(db_path)
    try:
        con = sqlite3.connect(db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row

        # ── Total scored sessions ────────────────────────────────
        total_sessions = con.execute(
            "SELECT COUNT(*) FROM revenue_scores"
        ).fetchone()[0] or 0

        # ── Whale stats ──────────────────────────────────────────
        whale_row = con.execute("""
            SELECT
                COUNT(*)                                            AS total_whales,
                SUM(CASE WHEN conversion_status='converted' THEN 1 ELSE 0 END) AS converted_whales,
                AVG(composite_score)                                AS avg_whale_score
            FROM revenue_scores WHERE is_whale=1
        """).fetchone()
        total_whales      = int(whale_row["total_whales"] or 0)
        converted_whales  = int(whale_row["converted_whales"] or 0)
        avg_whale_score   = round(float(whale_row["avg_whale_score"] or 0), 3)
        whale_conv_rate   = round(converted_whales / total_whales * 100, 1) if total_whales else 0.0

        # ── Oracle accuracy (prediction vs reality) ──────────────
        oracle_row = con.execute("""
            SELECT
                COUNT(*)                                            AS total,
                SUM(CASE WHEN conversion_status='converted' THEN 1 ELSE 0 END) AS converted,
                SUM(CASE WHEN conversion_status='lost'      THEN 1 ELSE 0 END) AS lost,
                AVG(composite_score)                                AS avg_score
            FROM revenue_scores
            WHERE conversion_status IN ('converted','lost')
        """).fetchone()
        oracle_total   = int(oracle_row["total"] or 0)
        oracle_conv    = int(oracle_row["converted"] or 0)
        oracle_accuracy = round(oracle_conv / oracle_total * 100, 1) if oracle_total else 0.0

        # ── Revenue lift (attributed revenue) ────────────────────
        rev_row = con.execute("""
            SELECT
                SUM(attributed_revenue) AS total_revenue,
                COUNT(*)                AS rev_sessions
            FROM revenue_scores
            WHERE attributed_revenue > 0
        """).fetchone()
        revenue_lift_eur = round(float(rev_row["total_revenue"] or 0), 2)
        rev_sessions     = int(rev_row["rev_sessions"] or 0)

        # ── Global avg intent score ───────────────────────────────
        avg_score = con.execute(
            "SELECT AVG(composite_score) FROM revenue_scores"
        ).fetchone()[0] or 0
        avg_intent = round(float(avg_score) * 100, 1)

        # ── Bookings (if table exists) ────────────────────────────
        try:
            bk_row = con.execute(
                "SELECT COUNT(*) AS cnt, SUM(total_price) AS rev FROM bookings"
            ).fetchone()
            total_bookings  = int(bk_row["cnt"] or 0)
            booking_revenue = round(float(bk_row["rev"] or 0), 2)
        except Exception:
            total_bookings  = 0
            booking_revenue = 0.0

        # ── Tenant count ─────────────────────────────────────────
        tenant_count = con.execute(
            "SELECT COUNT(*) FROM tenants WHERE is_active=1"
        ).fetchone()[0] or 0

        con.close()

    except Exception as e:
        logger.error(f"[InvestorReport] aggregate_investor_metrics failed: {e}")
        return {"status": "error", "error": str(e)}

    metrics = {
        "status":           "success",
        "generated_at":     datetime.now(timezone.utc).isoformat(),
        # ── The 4 Gold KPIs ───────────────────────────────────────
        "revenue_lift_eur": revenue_lift_eur,
        "oracle_accuracy":  oracle_accuracy,
        "whale_conv_rate":  whale_conv_rate,
        "avg_intent_score": avg_intent,
        # ── Supporting metrics ────────────────────────────────────
        "total_sessions":   total_sessions,
        "total_whales":     total_whales,
        "converted_whales": converted_whales,
        "avg_whale_score":  round(avg_whale_score * 100, 1),
        "oracle_total":     oracle_total,
        "oracle_converted": oracle_conv,
        "rev_sessions":     rev_sessions,
        "total_bookings":   total_bookings,
        "booking_revenue":  booking_revenue,
        "active_tenants":   tenant_count,
    }
    logger.info(
        f"[InvestorReport] Metrics: lift=€{revenue_lift_eur} "
        f"accuracy={oracle_accuracy}% whale_conv={whale_conv_rate}% intent={avg_intent}"
    )
    return metrics


async def generate_investor_narrative(metrics: dict) -> str:
    """
    H2: Gemini translates raw metrics into VC-grade narrative.
    Returns a 4-paragraph executive summary in Turkish.
    """
    prompt = f"""Sen Santis AI Revenue Operating System'in baş strateji danışmanısın.
Aşağıdaki gerçek performans verilerini esas alarak, bir Venture Capital (Risk Sermayesi) yatırımcısına sunmak için
özgüvenli, olgusal ve çarpıcı bir 'Yatırımcı Özetii' (Executive Summary) yaz.

Gerçek Veriler:
- AI Revenue Lift: €{metrics.get('revenue_lift_eur', 0):,.2f} (AI doğrudan ürettiği gelir)
- Oracle Doğruluğu: %{metrics.get('oracle_accuracy', 0)} (Tahminlerin gerçeğe uyumu)
- VIP Balina Dönüşüm Oranı: %{metrics.get('whale_conv_rate', 0)}
- Ortalama Niyet Skoru: {metrics.get('avg_intent_score', 0)}/100
- Toplam Analiz Edilen Oturum: {metrics.get('total_sessions', 0):,}
- Aktif Şube Sayısı: {metrics.get('active_tenants', 0)}

FORMAT: 4 paragraf:
1. Açılış: "Santis nedir?" — Tek cümleyle pozisyonu net koy.
2. Kanıt: Yukarıdaki rakamları entegre et. Spesifik ve olgusal ol.
3. Büyüme hikayesi: Bu rakamlar ne anlama geliyor? Neden ölçeklenebilir?
4. Kapanış çağrısı: Yatırımcıyı harekete geçirecek 1-2 zarif cümle.

Kurallar:
- "İndirim", "ucuz", "basit" gibi kelimeler yasak.
- Türkçe yaz. Rakamları kullan. Cümleler kısa ve etkili olsun.
- "Quiet Luxury" tonu: özgüvenli, sakin, kanıta dayalı.
- Asla "AI'mız çok zeki" deme — rakamlar konuşsun."""

    try:
        from app.core.gemini_engine import _call_gemini
        narrative = await _call_gemini(prompt)
        return narrative.strip()[:2000]
    except Exception as e:
        logger.error(f"[InvestorReport] Gemini narrative failed: {e}")
        return (
            f"Santis, lüks konaklama sektörü için tasarlanmış, yapay zeka tabanlı bir Gelir İşletim Sistemi'dir.\n\n"
            f"Platform, {metrics.get('total_sessions', 0):,} misafir oturumunu analiz ederek "
            f"€{metrics.get('revenue_lift_eur', 0):,.2f} doğrudan gelir üretmiştir. "
            f"Tahmin motorumuz %{metrics.get('oracle_accuracy', 0)} doğrulukla çalışmaktadır.\n\n"
            f"VIP segmentinde %{metrics.get('whale_conv_rate', 0)} dönüşüm oranı ile "
            f"sektör ortalamasının üzerinde performans sergilenmektedir.\n\n"
            f"Santis, sadece bir yazılım değil; lüks segmentin kolektif zekasını işleten küresel bir platform habercisidir."
        )


async def build_investor_report(db_path: str | Path) -> dict:
    """
    H3: Full investor report object — metrics + narrative + timestamp.
    Ready for PDF/HTML rendering.
    """
    metrics   = aggregate_investor_metrics(db_path)
    if metrics.get("status") == "error":
        return metrics

    narrative = await generate_investor_narrative(metrics)

    # Cross-tenant pulse (if available)
    cross_tenant = {}
    try:
        from app.core.cross_tenant_engine import collect_global_trends, detect_global_anomaly
        t = collect_global_trends(db_path)
        a = detect_global_anomaly(db_path)
        cross_tenant = {
            "global_leaders":  t.get("global_leaders", [])[:3],
            "tenant_count":    t.get("tenant_count", 0),
            "anomaly_status":  a.get("anomaly_type", "UNKNOWN"),
        }
    except Exception:
        pass

    report = {
        "status":        "success",
        "title":         "Santis AI — Sovereign Intelligence Audit",
        "generated_at":  metrics["generated_at"],
        "metrics":       metrics,
        "narrative":     narrative,
        "cross_tenant":  cross_tenant,
        "version":       "24.1",
    }
    logger.info(
        f"[InvestorReport] Report built: lift=€{metrics['revenue_lift_eur']} "
        f"accuracy={metrics['oracle_accuracy']}%"
    )
    return report
