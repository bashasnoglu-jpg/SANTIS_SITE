"""
SCHEMA SYNC v1.0 — Structured Data Generator
Injects JSON-LD structured data into HTML <head> sections.

Generates:
- Service schema for each service/massage/hammam page
- BreadcrumbList schema for all pages
- LocalBusiness schema for language index pages

Source: site_content.json + available-routes.json + filesystem

Usage:
    python schema_sync.py              # Inject structured data
    python schema_sync.py --dry        # Preview without writing
"""

import os
import re
import json
import shutil
import datetime
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
CONTENT_FILE = BASE_DIR / "data" / "site_content.json"
ROUTES_FILE = BASE_DIR / "assets" / "data" / "available-routes.json"
DOMAIN = "https://santis.club"
ACTIVE_LANGS = ["tr", "en", "de", "fr", "ru"]

# Business info for LocalBusiness schema
BUSINESS = {
    "name": "Santis Club Spa & Wellness",
    "url": DOMAIN,
    "telephone": "+90-555-555-5555",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Çolaklı Mah.",
        "addressLocality": "Manavgat",
        "addressRegion": "Antalya",
        "postalCode": "07600",
        "addressCountry": "TR"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "36.7633",
        "longitude": "31.3864"
    },
    "priceRange": "€€€"
}

# Section display names per language
SECTION_NAMES = {
    "hammam": {"tr": "Hamam", "en": "Hammam", "de": "Hammam", "fr": "Hammam", "ru": "Хаммам"},
    "massages": {"tr": "Masajlar", "en": "Massages", "de": "Massagen", "fr": "Massages", "ru": "Массажи"},
    "skincare": {"tr": "Hizmetler", "en": "Services", "de": "Dienstleistungen", "fr": "Services", "ru": "Услуги"},
}

# Comment marker for our injected schema
SCHEMA_MARKER = "<!-- SCHEMA SYNC -->"
SCHEMA_RE = re.compile(
    r'<!-- SCHEMA SYNC -->.*?<!-- /SCHEMA SYNC -->',
    re.DOTALL
)


# ──────────────────────────────────────────────────────────────
# LOAD DATA
# ──────────────────────────────────────────────────────────────

def load_data():
    """Load content registry and route registry."""
    with open(CONTENT_FILE, "r", encoding="utf-8-sig") as f:
        content = json.load(f)
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        routes = json.load(f)
    return content, routes


# ──────────────────────────────────────────────────────────────
# SCHEMA GENERATORS
# ──────────────────────────────────────────────────────────────

def make_service_schema(item, section, lang, page_url):
    """Generate Service JSON-LD for a service/massage/hammam page."""
    translations = item.get("translations", {})
    tr_data = translations.get(lang, translations.get("tr", {}))
    
    name = tr_data.get("name", item.get("name", item.get("slug", "")))
    description = tr_data.get("description", tr_data.get("shortDescription", ""))
    
    schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": name,
        "description": description[:250] if description else "",
        "provider": {
            "@type": "HealthAndBeautyBusiness",
            "name": BUSINESS["name"],
            "url": BUSINESS["url"]
        },
        "areaServed": {
            "@type": "Place",
            "name": "Antalya, Turkey"
        },
        "url": page_url
    }
    
    # Add price if available
    price = tr_data.get("price") or item.get("price")
    if price:
        schema["offers"] = {
            "@type": "Offer",
            "price": str(price).replace("€", "").strip(),
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
        }
    
    # Duration
    duration = tr_data.get("duration") or item.get("duration")
    if duration:
        schema["additionalProperty"] = {
            "@type": "PropertyValue",
            "name": "Duration",
            "value": str(duration)
        }
    
    return schema


def make_breadcrumb_schema(lang, section, item_name, page_url):
    """Generate BreadcrumbList JSON-LD."""
    home_name = "Ana Sayfa" if lang == "tr" else "Home"
    section_name = SECTION_NAMES.get(section, {}).get(lang, section.title())
    
    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": home_name,
                "item": f"{DOMAIN}/{lang}/index.html"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": section_name,
                "item": f"{DOMAIN}/{lang}/"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": item_name,
                "item": page_url
            }
        ]
    }
    return schema


def make_local_business_schema():
    """Generate LocalBusiness JSON-LD for main pages."""
    return {
        "@context": "https://schema.org",
        "@type": "HealthAndBeautyBusiness",
        "name": BUSINESS["name"],
        "url": BUSINESS["url"],
        "telephone": BUSINESS["telephone"],
        "address": BUSINESS["address"],
        "geo": BUSINESS["geo"],
        "priceRange": BUSINESS["priceRange"],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "09:00",
            "closes": "22:00"
        }
    }


# ──────────────────────────────────────────────────────────────
# HTML INJECTION
# ──────────────────────────────────────────────────────────────

def inject_schema(filepath, schemas, dry_run=False):
    """Inject JSON-LD schema blocks into HTML <head>."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    
    original = content
    
    # Remove any existing schema sync blocks
    content = SCHEMA_RE.sub("", content)
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    # Build schema block
    lines = [SCHEMA_MARKER]
    for schema in schemas:
        json_str = json.dumps(schema, ensure_ascii=False, indent=2)
        lines.append(f'    <script type="application/ld+json">\n{json_str}\n    </script>')
    lines.append("    <!-- /SCHEMA SYNC -->")
    block = "\n".join(lines)
    
    # Insert before </head>
    if "</head>" in content:
        content = content.replace("</head>", f"\n{block}\n</head>")
    elif "</HEAD>" in content:
        content = content.replace("</HEAD>", f"\n{block}\n</HEAD>")
    else:
        return False
    
    if content == original:
        return False
    
    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
    
    return True


# ──────────────────────────────────────────────────────────────
# MAIN SYNC
# ──────────────────────────────────────────────────────────────

def run_schema_sync(dry_run=False):
    """Main schema synchronization."""
    content_data, routes = load_data()
    catalogs = content_data.get("catalogs", {})
    
    print(f"📊 Catalogs: {list(catalogs.keys())}")
    print(f"📊 Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    
    stats = {"injected": 0, "skipped": 0, "errors": 0}
    
    # Build item lookup: slug → item data + section
    item_lookup = {}
    for section, section_data in catalogs.items():
        for item in section_data.get("items", []):
            slug = item.get("slug") or item.get("id")
            if slug:
                item_lookup[slug] = {"item": item, "section": section}
    
    print(f"📊 Items in catalog: {len(item_lookup)}")
    
    # Process each cluster from routes
    for canonical_key, lang_paths in routes.items():
        # Extract slug from canonical key
        parts = canonical_key.replace("/index.html", "").split("/")
        slug = parts[-1] if parts else canonical_key
        
        # Find item data
        item_info = item_lookup.get(slug)
        section = None
        if item_info:
            section = item_info["section"]
        
        for lang, rel_path in lang_paths.items():
            if lang not in ACTIVE_LANGS:
                continue
            
            filepath = BASE_DIR / lang / rel_path
            if not filepath.exists():
                continue
            
            page_url = f"{DOMAIN}/{lang}/{rel_path}"
            schemas = []
            
            # Service schema (if item found in catalog)
            if item_info:
                schemas.append(make_service_schema(
                    item_info["item"], section, lang, page_url
                ))
            
            # Breadcrumb (always)
            item_name = slug.replace("-", " ").title()
            if item_info:
                tr = item_info["item"].get("translations", {})
                lang_tr = tr.get(lang, tr.get("tr", {}))
                item_name = lang_tr.get("name", item_name)
            
            if section:
                schemas.append(make_breadcrumb_schema(
                    lang, section, item_name, page_url
                ))
            
            # LocalBusiness for index pages
            if canonical_key == "index.html" or rel_path.endswith("/index.html"):
                if "/" not in rel_path.rstrip("/index.html"):
                    schemas.append(make_local_business_schema())
            
            if schemas:
                try:
                    if inject_schema(str(filepath), schemas, dry_run=dry_run):
                        stats["injected"] += 1
                    else:
                        stats["skipped"] += 1
                except Exception as e:
                    stats["errors"] += 1
                    print(f"  ❌ Error: {lang}/{rel_path}: {e}")
    
    # Report
    print(f"\n{'='*60}")
    print(f"  SCHEMA SYNC — {'DRY RUN' if dry_run else 'COMPLETE'}")
    print(f"{'='*60}")
    print(f"  Injected: {stats['injected']}")
    print(f"  Skipped:  {stats['skipped']}")
    print(f"  Errors:   {stats['errors']}")
    print(f"{'='*60}")
    
    return stats


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv
    run_schema_sync(dry_run=dry)
