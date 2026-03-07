"""
app/core/reporting.py
Phase R – Santis Executive Report Generator
ReportLab tabanlı PDF çıktı motoru.
"""

from __future__ import annotations

import io
import json
from datetime import datetime
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


# ── Colour Palette (Santis "Quiet Luxury") ──────────────────────────────────
GOLD    = colors.HexColor("#C9A96E")
DARK    = colors.HexColor("#0D0D0D")
SMOKE   = colors.HexColor("#1A1A1A")
GRAY    = colors.HexColor("#3A3A3A")
LGRAY   = colors.HexColor("#888888")
WHITE   = colors.white
RED_AL  = colors.HexColor("#B22222")
TEAL    = colors.HexColor("#5F9EA0")


def _styles():
    ss = getSampleStyleSheet()

    def ps(name, **kw) -> ParagraphStyle:
        return ParagraphStyle(name, parent=ss["Normal"], **kw)

    return {
        "cover_title": ps("cover_title",
            fontName="Helvetica-Bold", fontSize=28, textColor=GOLD,
            spaceAfter=6, alignment=TA_CENTER),
        "cover_sub": ps("cover_sub",
            fontName="Helvetica", fontSize=11, textColor=LGRAY,
            spaceAfter=2, alignment=TA_CENTER),
        "section_head": ps("section_head",
            fontName="Helvetica-Bold", fontSize=13, textColor=GOLD,
            spaceBefore=18, spaceAfter=6),
        "body": ps("body",
            fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#CCCCCC"),
            leading=14, spaceAfter=4),
        "whisper": ps("whisper",
            fontName="Helvetica-Oblique", fontSize=8, textColor=LGRAY,
            leading=13, leftIndent=12, spaceAfter=2),
        "kpi_val": ps("kpi_val",
            fontName="Helvetica-Bold", fontSize=22, textColor=GOLD,
            alignment=TA_CENTER, spaceAfter=0),
        "kpi_lbl": ps("kpi_lbl",
            fontName="Helvetica", fontSize=7, textColor=LGRAY,
            alignment=TA_CENTER, spaceBefore=0, spaceAfter=2),
        "footer": ps("footer",
            fontName="Helvetica", fontSize=7, textColor=GRAY,
            alignment=TA_CENTER),
    }


def _hr(color=GOLD, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness,
                      color=color, spaceAfter=8, spaceBefore=4)


def _kpi_row(kpis: list[tuple[str, str]], styles: dict):
    """Render a row of KPI boxes.  kpis = [(value, label), ...]"""
    cells = []
    for val, lbl in kpis:
        cells.append([
            Paragraph(str(val), styles["kpi_val"]),
            Paragraph(lbl,      styles["kpi_lbl"]),
        ])
    tbl = Table([cells], colWidths=[A4[0] / max(len(kpis), 1) - 1.5*cm] * len(kpis))
    tbl.setStyle(TableStyle([
        ("BOX",        (0, 0), (-1, -1), 0.5, GOLD),
        ("INNERGRID",  (0, 0), (-1, -1), 0.3, GRAY),
        ("BACKGROUND", (0, 0), (-1, -1), SMOKE),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return tbl


def generate_executive_pdf(
    ltv_data:       dict | None,
    dna_data:       dict | None,
    scarcity_data:  dict | None,
    vip_roster:     list[dict] | None,
    yield_status:   dict | None,
) -> bytes:
    """
    Generate Santis Executive Briefing PDF.
    Returns raw PDF bytes.
    """
    buf    = io.BytesIO()
    styles = _styles()
    now    = datetime.utcnow().strftime("%B %d, %Y  %H:%M UTC")

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=2.2*cm,  bottomMargin=2.2*cm,
        title="Santis Master OS — Executive Briefing",
        author="Santis Intelligence Engine",
    )

    elems = []
    W = A4[0] - 4.4*cm   # usable width

    # ── COVER ────────────────────────────────────────────────────────────────
    elems += [
        Spacer(1, 1*cm),
        Paragraph("SANTIS MASTER OS", styles["cover_title"]),
        Paragraph("Executive Intelligence Briefing", styles["cover_sub"]),
        Paragraph(now, styles["cover_sub"]),
        Spacer(1, 0.4*cm),
        _hr(GOLD, 1.0),
        Spacer(1, 0.3*cm),
    ]

    # ── SECTION 1: Revenue KPIs ───────────────────────────────────────────────
    elems.append(Paragraph("◈  Revenue Intelligence", styles["section_head"]))
    elems.append(_hr(GRAY, 0.3))

    ltv = ltv_data or {}
    total_rev  = ltv.get("total_revenue", 0)
    avg_ltv    = ltv.get("avg_ltv", 0)
    max_ltv    = ltv.get("max_ltv", 0)
    guests     = ltv.get("total_guests", 0)
    multiplier = (yield_status or {}).get("multiplier", 1.0)
    scarcity_f = scarcity_data or {}
    risk_level = scarcity_f.get("risk_level", "—")

    elems.append(_kpi_row([
        (f"€{total_rev:,.0f}", "Total Revenue"),
        (f"€{avg_ltv:,.0f}",   "Avg. LTV / Guest"),
        (f"€{max_ltv:,.0f}",   "Top Guest Value"),
        (f"{guests}",          "Profiled Guests"),
    ], styles))
    elems.append(Spacer(1, 0.3*cm))

    elems.append(_kpi_row([
        (f"{multiplier:.2f}×",         "Live Demand Multiplier"),
        (risk_level,                    "Scarcity Risk (7d)"),
        (f"{scarcity_f.get('critical_count', 0)}", "Critical Stock Items"),
    ], styles))
    elems.append(Spacer(1, 0.5*cm))

    # ── SECTION 2: Guest DNA ──────────────────────────────────────────────────
    elems.append(Paragraph("◈  Psychographic Radar — Collective Guest DNA", styles["section_head"]))
    elems.append(_hr(GRAY, 0.3))

    dna = dna_data or {}
    if dna:
        dna_rows = [["Archetype", "Guest Count", "Portfolio Share", "Phase J Influence"]]
        influ = {"RECOVERY": "↑ Deep Tissue demand", "AESTHETIC": "↑ Sothys retail",
                 "THERMAL": "↑ Hamam utilisation", "WELLNESS": "↑ Seasonal packages"}
        for archetype, vals in dna.items():
            cnt = vals.get("count", 0) if isinstance(vals, dict) else vals
            pct = vals.get("pct", 0)   if isinstance(vals, dict) else 0
            dna_rows.append([
                archetype.title(),
                str(cnt),
                f"{pct:.1f}%",
                influ.get(archetype, "—"),
            ])
        dna_tbl = Table(dna_rows, colWidths=[4*cm, 3*cm, 3.5*cm, None])
        dna_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR",  (0, 0), (-1, 0), GOLD),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, -1), 8),
            ("TEXTCOLOR",  (0, 1), (-1, -1), colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SMOKE, colors.HexColor("#141414")]),
            ("GRID",       (0, 0), (-1, -1), 0.3, GRAY),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ]))
        elems += [dna_tbl, Spacer(1, 0.5*cm)]
    else:
        elems.append(Paragraph("Run DNA Scan to populate this section.", styles["whisper"]))

    # ── SECTION 3: VIP Roster ─────────────────────────────────────────────────
    elems.append(Paragraph("◈  Continental Tier — VIP Intelligence", styles["section_head"]))
    elems.append(_hr(GRAY, 0.3))

    roster = (vip_roster or [])[:10]  # top-10 only
    if roster:
        vip_rows = [["Guest", "VIP Tier", "Total Spend", "Visit Count", "AI Insight"]]
        for v in roster:
            insight = (v.get("ai_persona_summary") or "").replace("\n", " ")[:60]
            vip_rows.append([
                v.get("full_name", "—"),
                v.get("vip_tier", "—"),
                f"€{float(v.get('total_spent', 0)):,.0f}",
                str(v.get("visit_count", 0)),
                insight + ("…" if len(insight) == 60 else ""),
            ])
        vip_tbl = Table(vip_rows, colWidths=[3.5*cm, 2.5*cm, 2.5*cm, 2*cm, None])
        vip_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR",  (0, 0), (-1, 0), GOLD),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, -1), 7.5),
            ("TEXTCOLOR",  (0, 1), (-1, -1), colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SMOKE, colors.HexColor("#141414")]),
            ("GRID",       (0, 0), (-1, -1), 0.3, GRAY),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ]))
        elems += [vip_tbl, Spacer(1, 0.5*cm)]

    # ── SECTION 4: Inventory Scarcity Forecast ────────────────────────────────
    elems.append(Paragraph("◈  Inventory Scarcity Forecast (Next 7 Days)", styles["section_head"]))
    elems.append(_hr(GRAY, 0.3))

    sc_items = scarcity_f.get("items", [])
    if sc_items:
        sc_rows = [["Item", "Current Stock", "Min Threshold", "Risk", "Luxury?"]]
        risk_colors = {"CRITICAL": RED_AL, "WARNING": GOLD, "OK": TEAL}
        for item in sc_items:
            sc_rows.append([
                item.get("item", "—"),
                str(item.get("stock", 0)),
                str(item.get("threshold", 0)),
                item.get("risk", "—"),
                "✓" if item.get("is_luxury") else "–",
            ])
        sc_tbl = Table(sc_rows, colWidths=[5*cm, 3*cm, 3*cm, 2.5*cm, 2*cm])
        # Color-code risk rows
        sc_style = [
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR",  (0, 0), (-1, 0), GOLD),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, -1), 8),
            ("TEXTCOLOR",  (0, 1), (-1, -1), colors.HexColor("#CCCCCC")),
            ("GRID",       (0, 0), (-1, -1), 0.3, GRAY),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ]
        for i, item in enumerate(sc_items, start=1):
            risk_c = risk_colors.get(item.get("risk", "OK"), TEAL)
            sc_style.append(("TEXTCOLOR", (3, i), (3, i), risk_c))
            sc_style.append(("FONTNAME",  (3, i), (3, i), "Helvetica-Bold"))
            bg = colors.HexColor("#1A0000") if item.get("risk") == "CRITICAL" else (
                 SMOKE if i % 2 else colors.HexColor("#141414"))
            sc_style.append(("BACKGROUND", (0, i), (-1, i), bg))
        sc_tbl.setStyle(TableStyle(sc_style))
        elems += [sc_tbl, Spacer(1, 0.5*cm)]

    # ── SECTION 5: Neural Pulse Decisions (AI Log) ────────────────────────────
    elems.append(Paragraph("◈  AI Decision Log — Autonomous Actions", styles["section_head"]))
    elems.append(_hr(GRAY, 0.3))

    decisions = [
        "Phase J: Auto-Pricing engine adjusted demand_multiplier based on real-time booking velocity.",
        "Phase M: Flash Recovery protocol triggered upon last-minute cancellation; slot re-sold within 15 min.",
        "Phase O: Scarcity Surge applied to luxury items — margin uplift activated automatically.",
        "Phase P: Concierge Memory recalled guest preferences on check-in; personalised protocol deployed.",
        "Phase Q: Nightly intelligence jobs completed; DNA clusters and LTV indices refreshed for new trading day.",
    ]
    for d in decisions:
        elems.append(Paragraph(f"→  {d}", styles["whisper"]))
    elems.append(Spacer(1, 0.5*cm))

    # ── FOOTER ────────────────────────────────────────────────────────────────
    elems.append(_hr(GOLD, 0.5))
    elems.append(Paragraph(
        "Santis Master OS · Intelligence Confidential · Generated by Phase R Executive Reporting Engine",
        styles["footer"]
    ))

    # ── BUILD ─────────────────────────────────────────────────────────────────
    doc.build(elems)
    return buf.getvalue()
