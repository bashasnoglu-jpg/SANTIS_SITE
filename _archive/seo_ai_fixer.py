"""
SANTIS AI CONTENT IMPROVER (rules-based suggestions)
- Kullanım: python seo_ai_fixer.py
- Girdi : reports/seo_quality.json (seo_quality_audit.py çıktısı)
- Çıktı: reports/seo_ai_suggestions.json
"""

import json
import datetime
from pathlib import Path

REPORT_DIR = Path("reports")
SEO_PATH = REPORT_DIR / "seo_quality.json"
OUT_PATH = REPORT_DIR / "seo_ai_suggestions.json"


def suggest_for_page(p: dict) -> list[str]:
    suggestions = []

    if p.get("title_len", 0) < 10:
        suggestions.append("Title çok kısa. Hizmet + lokasyon içeren 40–60 karakterlik bir başlık yaz.")
    elif p.get("title_len", 0) > 60:
        suggestions.append("Title çok uzun. 60 karakter altına kısalt.")

    if p.get("desc_len", 0) < 50:
        suggestions.append("Meta description eksik/zayıf. 120–155 karakterlik açıklama ekle.")
    elif p.get("desc_len", 0) > 160:
        suggestions.append("Meta description çok uzun. 155 karakter altına indir.")

    h1_count = p.get("h1_count", 0)
    if h1_count == 0:
        suggestions.append("H1 başlık yok. Ana hizmeti anlatan 1 adet H1 ekle.")
    elif h1_count > 1:
        suggestions.append("Birden fazla H1 var. Sadece 1 adet bırak.")

    missing_alt = p.get("missing_alt", 0)
    if missing_alt > 0:
        suggestions.append(f"{missing_alt} görselde alt text eksik. Kısa açıklamalar ekle.")

    if not p.get("canonical"):
        suggestions.append("Canonical etiketi ekle.")

    if not p.get("hreflang"):
        suggestions.append("Hreflang alternate linkleri ekle (TR/EN/DE).")

    if not p.get("schema"):
        suggestions.append("Schema.org JSON-LD ekle (Service/LocalBusiness).")

    if p.get("word_count", 0) < 250:
        suggestions.append("İçerik kısa. Hizmet detayları, faydalar ve süreç anlatımı ekle.")

    if p.get("internal_links", 0) < 3:
        suggestions.append("Dahili link az. İlgili hizmet/sayfalara en az 3 link ver.")

    return suggestions


def main():
    if not SEO_PATH.exists():
        print("Önce seo_quality_audit.py çalıştırılmalı.")
        return

    data = json.load(SEO_PATH.open(encoding="utf-8"))
    results = []
    for p in data.get("pages", []):
        sugg = suggest_for_page(p)
        if sugg:
            results.append({"url": p.get("url"), "issues": sugg})

    REPORT_DIR.mkdir(exist_ok=True)
    OUT_PATH.write_text(json.dumps({
        "ts": datetime.datetime.utcnow().isoformat() + "Z",
        "suggestions": results
    }, indent=2), encoding="utf-8")

    print(f"AI içerik önerileri oluşturuldu -> {OUT_PATH}")


if __name__ == "__main__":
    main()
