"""
Hreflang-aware sitemap generator for Santis.
Reads data/site_content.json and writes static/sitemap.xml with hreflang alternates.
"""

import json
import os
from pathlib import Path
from datetime import datetime
import xml.etree.ElementTree as ET

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON_PATH = BASE_DIR / "data" / "site_content.json"
SITEMAP_PATH = BASE_DIR / "sitemap.xml"

BASE_URL = os.getenv("SANTIS_BASE_URL", "http://localhost:8000").rstrip("/")

NSMAP = {
    "xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "xmlns:xhtml": "http://www.w3.org/1999/xhtml"
}
ET.register_namespace('', NSMAP["xmlns"])
ET.register_namespace('xhtml', NSMAP["xmlns:xhtml"])

# Section-specific SEO hints
CHANGEFREQ_PRIORITY = {
    "massages": ("monthly", "0.8"),
    "hammam": ("monthly", "0.8"),
    "skincare": ("weekly", "0.7"),
    "products": ("weekly", "0.7"),
}
DEFAULT_CHANGEFREQ = "monthly"
DEFAULT_PRIORITY = "0.5"


def generate_sitemap():
    if not SITE_JSON_PATH.exists():
        print("❌ Site JSON not found.")
        return {"status": "error", "msg": "Site JSON not found"}

    try:
        with SITE_JSON_PATH.open("r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return {"status": "error", "msg": str(e)}

    catalogs = data.get("catalogs", {})
    if not catalogs:
        print("❌ No catalogs found in JSON.")
        return {"status": "error", "msg": "No catalogs found"}

    # Folder mappings (Must match restore_pages.py)
    FOLDER_MAP = {
        "tr": { "hammam": "hamam", "massages": "masajlar", "skincare": "cilt-bakimi", "products": "urunler", "services": "hizmetler" },
        "en": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "products", "services": "services" },
        "de": { "hammam": "hammam", "massages": "massagen", "skincare": "services", "products": "produkte", "services": "services" },
        "fr": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "produits", "services": "services" },
        "ru": { "hammam": "hammam", "massages": "massages", "skincare": "services", "products": "products", "services": "services" }
    }
    
    LANGUAGES = ["tr", "en", "de", "fr", "ru"]
    today = datetime.utcnow().date().isoformat()
    
    urlset = ET.Element("urlset", NSMAP)

    # 1. Homepage
    home_url = ET.SubElement(urlset, "url")
    ET.SubElement(home_url, "loc").text = f"{BASE_URL}/"
    ET.SubElement(home_url, "lastmod").text = today
    ET.SubElement(home_url, "changefreq").text = "daily"
    ET.SubElement(home_url, "priority").text = "1.0"

    # 2. Iterate Catalogs
    # Valid sections in catalogs: hammam, massages, skincare, etc.
    for section_key, section_data in catalogs.items():
        items = section_data.get("items", [])
        
        for item in items:
            slug = item.get("slug") or item.get("id")
            if not slug:
                continue

            # We need to generate a URL entry for EACH language for this item
            # And for each URL, we need to list ALL languages as alternates (hreflang)
            
            # Prepare alternates map first
            alternates = []
            for lang in LANGUAGES:
                folder_map = FOLDER_MAP.get(lang, {})
                folder_name = folder_map.get(section_key, section_key)
                
                # Construct URL: base/lang/folder/slug.html
                href = f"{BASE_URL}/{lang}/{folder_name}/{slug}.html"
                alternates.append({"lang": lang, "href": href})

            # Create <url> entries for each language variant
            for entry in alternates:
                url_elem = ET.SubElement(urlset, "url")
                ET.SubElement(url_elem, "loc").text = entry["href"]
                ET.SubElement(url_elem, "lastmod").text = today
                
                # Priority/Changefreq
                changefreq, priority = CHANGEFREQ_PRIORITY.get(section_key, (DEFAULT_CHANGEFREQ, DEFAULT_PRIORITY))
                ET.SubElement(url_elem, "changefreq").text = changefreq
                ET.SubElement(url_elem, "priority").text = priority

                # Add Hreflang links
                for alt in alternates:
                    # x-default usually points to English or Default (using TR here as it's the source usually, or EN?)
                    # Let's add x-default pointing to the 'tr' version or same as current if preferred. 
                    # Standard practice: List all variants including self.
                    
                    ET.SubElement(
                        url_elem,
                        "{http://www.w3.org/1999/xhtml}link",
                        rel="alternate",
                        hreflang=alt["lang"],
                        href=alt["href"]
                    )
                
                # Add x-default (pointing to EN or TR)
                # Let's pick 'en' as x-default, or 'tr' since it's a TR hotel.
                # User prompted: <link rel="alternate" hreflang="x-default" href="https://site.com/tr/masajlar/{{slug}}.html">
                # So user implies TR is default.
                tr_href = next((x["href"] for x in alternates if x["lang"] == "tr"), None)
                if tr_href:
                     ET.SubElement(
                        url_elem,
                        "{http://www.w3.org/1999/xhtml}link",
                        rel="alternate",
                        hreflang="x-default",
                        href=tr_href
                    )

    tree = ET.ElementTree(urlset)
    SITEMAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    tree.write(SITEMAP_PATH, encoding="utf-8", xml_declaration=True)
    print(f"✅ Sitemap generated at {SITEMAP_PATH} with {len(catalogs)} catalog sections.")
    return {
        "status": "success",
        "path": str(SITEMAP_PATH),
        "url_count": len(urlset.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url")),
        "catalogs": list(catalogs.keys())
    }


if __name__ == "__main__":
    generate_sitemap()
