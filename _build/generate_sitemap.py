"""
Sprint 4 Phase 4B — Sitemap.xml Generator
Scans the build output and generates sitemap.xml with priority hierarchy and hreflang.
"""
import json
from pathlib import Path
from datetime import datetime, timezone

DOMAIN = "https://santis.club"
PROJECT_DIR = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")
OUTPUT_DIR = PROJECT_DIR / "_build" / "output"
SITEMAP_PATH = PROJECT_DIR / "sitemap.xml"

LANGUAGES = ["tr", "en", "de", "fr", "ru"]

# Section directories per language (must match build.py)
SECTION_DIRS = {
    "hammam": {"tr": "hamam", "en": "hammam", "de": "hammam", "fr": "hammam", "ru": "hammam"},
    "massages": {"tr": "masajlar", "en": "massages", "de": "massagen", "fr": "massages", "ru": "massages"},
    "skincare": {"tr": "cilt-bakimi", "en": "skincare", "de": "hautpflege", "fr": "soins-visage", "ru": "skincare"},
}

# Reverse map: dir_name → (section_key, lang)
DIR_TO_SECTION = {}
for sec_key, dirs in SECTION_DIRS.items():
    for lang_code, dir_name in dirs.items():
        DIR_TO_SECTION[(lang_code, dir_name)] = sec_key


def get_priority(rel_path: str) -> str:
    """Determine priority based on page type."""
    parts = rel_path.replace("\\", "/").split("/")
    if len(parts) == 2 and parts[1] == "index.html":
        return "0.9"  # Language homepage
    if parts[-1] == "index.html":
        return "0.8"  # Category listing
    return "0.7"  # Service detail


def get_changefreq(rel_path: str) -> str:
    parts = rel_path.replace("\\", "/").split("/")
    if parts[-1] == "index.html" and len(parts) <= 3:
        return "weekly"
    return "monthly"


def find_hreflang_alternates(lang: str, section_dir: str, slug: str) -> list:
    """Find hreflang alternate URLs for a service page."""
    alternates = []
    # Find which section this belongs to
    sec_key = None
    for sk, dirs in SECTION_DIRS.items():
        if dirs.get(lang) == section_dir:
            sec_key = sk
            break
    if not sec_key:
        return alternates

    for alt_lang in LANGUAGES:
        alt_dir = SECTION_DIRS[sec_key][alt_lang]
        alt_url = f"{DOMAIN}/{alt_lang}/{alt_dir}/{slug}"
        alternates.append((alt_lang, alt_url))

    # x-default = EN
    en_dir = SECTION_DIRS[sec_key]["en"]
    alternates.append(("x-default", f"{DOMAIN}/en/{en_dir}/{slug}"))
    return alternates


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = []

    # 1) Homepage
    urls.append({
        "loc": f"{DOMAIN}/",
        "lastmod": now,
        "changefreq": "weekly",
        "priority": "1.0",
        "alternates": [(l, f"{DOMAIN}/{l}/index.html") for l in LANGUAGES] + [("x-default", f"{DOMAIN}/en/index.html")],
    })

    # 2) Scan output directory for generated pages
    for html_file in sorted(OUTPUT_DIR.rglob("*.html")):
        rel = html_file.relative_to(OUTPUT_DIR)
        parts = str(rel).replace("\\", "/").split("/")

        if len(parts) < 2:
            continue

        lang = parts[0]
        if lang not in LANGUAGES:
            continue

        rel_path = str(rel).replace("\\", "/")
        loc = f"{DOMAIN}/{rel_path}"

        # Determine alternates
        alternates = []
        if len(parts) == 3:  # e.g., tr/masajlar/aromaterapi.html
            section_dir = parts[1]
            slug = parts[2]
            alternates = find_hreflang_alternates(lang, section_dir, slug)
        elif len(parts) == 3 and parts[2] == "index.html":  # listing page
            section_dir = parts[1]
            for sk, dirs in SECTION_DIRS.items():
                if dirs.get(lang) == section_dir:
                    for al in LANGUAGES:
                        ad = dirs.get(al, section_dir)
                        alternates.append((al, f"{DOMAIN}/{al}/{SECTION_DIRS[sk][al]}/index.html"))
                    alternates.append(("x-default", f"{DOMAIN}/en/{SECTION_DIRS[sk]['en']}/index.html"))
                    break

        urls.append({
            "loc": loc,
            "lastmod": now,
            "changefreq": get_changefreq(rel_path),
            "priority": get_priority(rel_path),
            "alternates": alternates,
        })

    # 3) Generate XML
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]

    for url_data in urls:
        xml_parts.append("  <url>")
        xml_parts.append(f"    <loc>{url_data['loc']}</loc>")
        xml_parts.append(f"    <lastmod>{url_data['lastmod']}</lastmod>")
        xml_parts.append(f"    <changefreq>{url_data['changefreq']}</changefreq>")
        xml_parts.append(f"    <priority>{url_data['priority']}</priority>")
        for hreflang, href in url_data.get("alternates", []):
            xml_parts.append(f'    <xhtml:link rel="alternate" hreflang="{hreflang}" href="{href}" />')
        xml_parts.append("  </url>")

    xml_parts.append("</urlset>")

    sitemap_xml = "\n".join(xml_parts)
    SITEMAP_PATH.write_text(sitemap_xml, encoding="utf-8")
    print(f"✅ sitemap.xml generated: {len(urls)} URLs")
    print(f"   Path: {SITEMAP_PATH}")


if __name__ == "__main__":
    main()
