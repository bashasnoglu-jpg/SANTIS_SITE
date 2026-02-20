"""
SANTIS SEO QUALITY AUDIT
- Basit SEO kalite kontrolleri: title/description/H1/alt/canonical/hreflang/schema/kelime sayısı/link sayısı
- Varsayılan hedef: http://localhost:8000 (AUDIT_BASE_URL ile değiştirilebilir)
- Çıktı: reports/seo_quality.json
"""

import json
import datetime
import os
from pathlib import Path
from urllib.parse import urljoin, urlparse

import bs4
import requests

BASE = (
    os.getenv("AUDIT_BASE_URL")
    or os.getenv("SANTIS_BASE_URL")
    or "http://localhost:8000"
).rstrip("/")

REPORT_DIR = Path("reports")
OUT = REPORT_DIR / "seo_quality.json"


def is_internal(href: str) -> bool:
    netloc = urlparse(href).netloc
    return netloc in ("", urlparse(BASE).netloc)


def analyze(url: str):
    try:
        r = requests.get(url, timeout=8)
        soup = bs4.BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        return {"url": url, "error": True, "note": str(e)}

    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag["content"].strip() if desc_tag and desc_tag.get("content") else ""

    h1s = soup.find_all("h1")
    imgs = soup.find_all("img")
    missing_alt = sum(1 for i in imgs if not i.get("alt"))

    canonical = bool(soup.find("link", rel="canonical"))
    hreflang = bool(soup.find("link", rel="alternate", hreflang=True))
    schema = "application/ld+json" in (r.text.lower())

    text_len = len(soup.get_text(" ", strip=True).split())
    links = len([a for a in soup.find_all("a", href=True) if is_internal(a["href"])])

    return {
        "url": url,
        "title_len": len(title),
        "desc_len": len(desc),
        "h1_count": len(h1s),
        "missing_alt": missing_alt,
        "canonical": canonical,
        "hreflang": hreflang,
        "schema": schema,
        "word_count": text_len,
        "internal_links": links,
    }


def main():
    # Şimdilik ana sayfa + sitemap kökünden çekilen linklerin ilk 10'u
    # Şimdilik ana sayfa + sitemap kökünden çekilen linklerin ilk 50'si
    urls = {f"{BASE}/"}
    sm = Path("sitemap.xml")
    if sm.exists():
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(sm)
            for loc in tree.getroot().iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
                text = loc.text.strip() if loc.text else ""
                if not text:
                    continue
                
                # Rewrite live domain to local
                if "santis.club" in text:
                    text = text.replace("https://santis.club", BASE).replace("http://santis.club", BASE)
                
                # Only add if it starts with current BASE (localhost)
                if text.startswith(BASE):
                    urls.add(text)
                    
                if len(urls) >= 50:
                    break
        except Exception:
            pass

    data = [analyze(u) for u in urls]

    REPORT_DIR.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({
        "ts": datetime.datetime.utcnow().isoformat()+"Z",
        "pages": data
    }, indent=2), encoding="utf-8")

    print("SEO kalite raporu oluşturuldu →", OUT)


if __name__ == "__main__":
    main()
