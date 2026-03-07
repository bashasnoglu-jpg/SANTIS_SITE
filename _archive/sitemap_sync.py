"""
SITEMAP SYNC v1.0 — Enterprise Sitemap Generator
Single Source of Truth: available-routes.json + filesystem verification

Generates:
- sitemap.xml with full hreflang xhtml:link alternates
- Proper <priority>, <lastmod> (from file mtime), <changefreq>
- x-default for each URL group
- Only includes pages that actually EXIST on disk

Usage:
    python sitemap_sync.py              # Generate sitemap.xml
    python sitemap_sync.py --dry        # Preview without writing
"""

import os
import json
import datetime
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
ROUTES_FILE = BASE_DIR / "assets" / "data" / "available-routes.json"
OUTPUT_FILE = BASE_DIR / "sitemap.xml"
DOMAIN = "https://santis-club.com"
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]
DEFAULT_LANG = "en"  # x-default target

# XML Namespaces
NS_SITEMAP = "http://www.sitemaps.org/schemas/sitemap/0.9"
NS_XHTML = "http://www.w3.org/1999/xhtml"

# Priority by section
PRIORITIES = {
    "index.html": ("daily", "1.0"),
    "masajlar": ("weekly", "0.8"),
    "hamam": ("weekly", "0.8"),
    "hizmetler": ("weekly", "0.7"),
    "urunler": ("monthly", "0.6"),
}
DEFAULT_FREQ = "monthly"
DEFAULT_PRIORITY = "0.5"


def get_priority(canonical_key):
    """Determine changefreq and priority from canonical path."""
    if canonical_key == "index.html":
        return PRIORITIES["index.html"]
    for prefix, vals in PRIORITIES.items():
        if canonical_key.startswith(prefix):
            return vals
    return (DEFAULT_FREQ, DEFAULT_PRIORITY)


def get_lastmod(filepath):
    """Get file modification time as ISO date."""
    try:
        mtime = os.path.getmtime(filepath)
        return datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")
    except:
        return datetime.datetime.utcnow().strftime("%Y-%m-%d")


def generate_sitemap(dry_run=False):
    """Main sitemap generation."""

    # Load cluster registry
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        routes = json.load(f)

    print(f"📊 Loaded {len(routes)} clusters from available-routes.json")

    # Build URL entries
    urlset = Element("urlset")
    urlset.set("xmlns", NS_SITEMAP)
    urlset.set("xmlns:xhtml", NS_XHTML)

    url_count = 0
    skipped = 0

    # ── STATIC TOP-LEVEL PAGES ──
    # Homepage (root)
    root_url = SubElement(urlset, "url")
    SubElement(root_url, "loc").text = f"{DOMAIN}/"
    SubElement(root_url, "lastmod").text = get_lastmod(str(BASE_DIR / "index.html"))
    SubElement(root_url, "changefreq").text = "daily"
    SubElement(root_url, "priority").text = "1.0"
    url_count += 1

    # ── CLUSTER PAGES ──
    for canonical_key, lang_paths in sorted(routes.items()):
        # Verify which languages actually have the file on disk
        verified_langs = {}
        for lang, rel_path in lang_paths.items():
            if lang not in ACTIVE_LANGS:
                continue
            full_path = BASE_DIR / lang / rel_path
            if full_path.exists():
                verified_langs[lang] = {
                    "url": f"{DOMAIN}/{lang}/{rel_path}",
                    "path": str(full_path),
                    "lang": lang
                }

        if not verified_langs:
            skipped += 1
            continue

        changefreq, priority = get_priority(canonical_key)

        # Create one <url> entry per language version
        for lang, info in sorted(verified_langs.items()):
            url_elem = SubElement(urlset, "url")

            # <loc>
            SubElement(url_elem, "loc").text = info["url"]

            # <lastmod>
            SubElement(url_elem, "lastmod").text = get_lastmod(info["path"])

            # <changefreq> + <priority>
            SubElement(url_elem, "changefreq").text = changefreq
            SubElement(url_elem, "priority").text = priority

            # Hreflang alternates (all languages in this cluster)
            for alt_lang, alt_info in sorted(verified_langs.items()):
                link = SubElement(url_elem, f"{{{NS_XHTML}}}link")
                link.set("rel", "alternate")
                link.set("hreflang", alt_lang)
                link.set("href", alt_info["url"])

            # x-default → EN (or first available)
            xdefault_url = (verified_langs.get(DEFAULT_LANG) or
                           verified_langs.get("tr") or
                           list(verified_langs.values())[0])["url"]
            xdefault = SubElement(url_elem, f"{{{NS_XHTML}}}link")
            xdefault.set("rel", "alternate")
            xdefault.set("hreflang", "x-default")
            xdefault.set("href", xdefault_url)

            url_count += 1

    # ── ORPHAN PAGES (not in routes.json but exist on disk) ──
    orphan_count = 0
    for lang in ACTIVE_LANGS:
        lang_dir = BASE_DIR / lang
        if not lang_dir.exists():
            continue
        for html_file in lang_dir.rglob("*.html"):
            rel = html_file.relative_to(BASE_DIR).as_posix()
            # Check if already covered by routes
            is_covered = False
            for ck, lp in routes.items():
                for l, p in lp.items():
                    if f"{l}/{p}" == rel:
                        is_covered = True
                        break
                if is_covered:
                    break

            if not is_covered:
                url_elem = SubElement(urlset, "url")
                SubElement(url_elem, "loc").text = f"{DOMAIN}/{rel}"
                SubElement(url_elem, "lastmod").text = get_lastmod(str(html_file))
                SubElement(url_elem, "changefreq").text = DEFAULT_FREQ
                SubElement(url_elem, "priority").text = "0.4"
                orphan_count += 1
                url_count += 1

    # Pretty print
    indent(urlset, space="  ")

    # Write
    if not dry_run:
        tree = ElementTree(urlset)
        tree.write(str(OUTPUT_FILE), encoding="unicode", xml_declaration=True)
        print(f"✅ Sitemap written to {OUTPUT_FILE}")
    else:
        print("🔍 DRY RUN — no file written")

    print(f"📊 Total URLs: {url_count}")
    print(f"📊 Cluster pages: {url_count - 1 - orphan_count}")
    print(f"📊 Orphan pages: {orphan_count}")
    print(f"📊 Skipped clusters (no files): {skipped}")

    return {
        "status": "success",
        "url_count": url_count,
        "orphan_count": orphan_count,
        "skipped": skipped,
        "output": str(OUTPUT_FILE)
    }


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv
    generate_sitemap(dry_run=dry)
