"""
SANTIS OS — Build Pipeline v1.0
Generates service detail pages from site_content.json + Jinja2 templates.

Usage:
    python _build/build.py                         # Build all service pages
    python _build/build.py --lang tr               # Build only Turkish
    python _build/build.py --slug aromaterapi      # Build one service
    python _build/build.py --compare tr/masajlar/aromaterapi.html  # Compare with existing
"""

import json
import os
import json
import os
import sys
import shutil
import argparse
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------
BUILD_DIR   = Path(__file__).parent
PROJECT_DIR = BUILD_DIR.parent
DATA_DIR    = PROJECT_DIR / "data"
TEMPLATE_DIR = BUILD_DIR / "templates"
OUTPUT_DIR  = BUILD_DIR / "output"
CONFIG_DIR  = BUILD_DIR / "page_configs"

SITE_JSON   = DATA_DIR / "site_content.json"

# ---------------------------------------------------------------------------
# Jinja2 — install guard
# ---------------------------------------------------------------------------
try:
    from jinja2 import Environment, FileSystemLoader
except ImportError:
    print("❌  Jinja2 bulunamadı. Yükleniyor...")
    os.system(f"{sys.executable} -m pip install jinja2")
    from jinja2 import Environment, FileSystemLoader

# ---------------------------------------------------------------------------
# LANGUAGE CONFIG
# ---------------------------------------------------------------------------
LANGUAGES = ["tr", "en", "de", "fr", "ru"]
DOMAIN = "https://santis-club.com"

# Section = catalog key → URL directory name per language
SECTION_DIRS = {
    "hammam": {
        "tr": "hamam", "en": "hammam", "de": "hammam", "fr": "hammam", "ru": "hammam"
    },
    "massages": {
        "tr": "masajlar", "en": "massages", "de": "massagen", "fr": "massages", "ru": "massages"
    },
    "skincare": {
        "tr": "cilt-bakimi", "en": "skincare", "de": "hautpflege", "fr": "soins-visage", "ru": "skincare"
    },
    "services": {
        "tr": "hizmetler", "en": "services", "de": "dienstleistungen", "fr": "services", "ru": "services"
    }
}

# UI strings per language (includes category listing labels)
CATEGORY_UI_STRINGS = {
    "tr": {
        "scroll_label": "KEŞFET",
        "spa_menu_label": "SPA MENÜSÜ",
        "all_services_title": "Tüm Hizmetlerimiz",
        "faq_title": "Sıkça Sorulan Sorular",
        "featured_label": "EN ÇOK TERCİH EDİLEN",
        "explore_label": "Keşfet",
    },
    "en": {
        "scroll_label": "DISCOVER",
        "spa_menu_label": "SPA MENU",
        "all_services_title": "All Our Services",
        "faq_title": "Frequently Asked Questions",
        "featured_label": "MOST LOVED",
        "explore_label": "Explore",
    },
    "de": {
        "scroll_label": "ENTDECKEN",
        "spa_menu_label": "SPA-MENÜ",
        "all_services_title": "Alle unsere Leistungen",
        "faq_title": "Häufig gestellte Fragen",
        "featured_label": "AM BELIEBTESTEN",
        "explore_label": "Entdecken",
    },
    "fr": {
        "scroll_label": "DÉCOUVRIR",
        "spa_menu_label": "MENU SPA",
        "all_services_title": "Tous nos soins",
        "faq_title": "Questions fréquentes",
        "featured_label": "LE PLUS DEMANDÉ",
        "explore_label": "Découvrir",
    },
    "ru": {
        "scroll_label": "ОТКРЫТЬ",
        "spa_menu_label": "SPA-МЕНЮ",
        "all_services_title": "Все наши услуги",
        "faq_title": "Часто задаваемые вопросы",
        "featured_label": "САМЫЙ ПОПУЛЯРНЫЙ",
        "explore_label": "Открыть",
    },
}

# UI strings per language
UI_STRINGS = {
    "tr": {
        "benefits_title": "Faydaları",
        "process_title": "Uygulama Süreci",
        "process_intro": "Uzman terapistlerimiz tarafından, kişisel tercihlerinize ve vücudunuzun ihtiyaçlarına göre uygulanır.",
        "duration_title": "Süre & Deneyim",
        "related_title": "İlgili Hizmetler",
        "similar_title": "Benzer Hizmetler",
        "booking_cta": "Rezervasyon Yap",
        "home_label": "ANA SAYFA",
        "noscript_links": [
            {"href": "/tr/hamam/index.html",     "label": "HAMAM"},
            {"href": "/tr/masajlar/index.html",   "label": "MASAJLAR"},
            {"href": "/tr/cilt-bakimi/index.html", "label": "CİLT BAKIMI"},
            {"href": "/tr/galeri/index.html",     "label": "GALERİ"},
        ],
        "breadcrumb_home": "Ana Sayfa",
    },
    "en": {
        "benefits_title": "Benefits",
        "process_title": "Treatment Process",
        "process_intro": "Applied by our expert therapists according to your personal preferences and body's needs.",
        "duration_title": "Duration & Experience",
        "related_title": "Related Services",
        "similar_title": "Similar Services",
        "booking_cta": "Book Now",
        "home_label": "HOME",
        "noscript_links": [
            {"href": "/en/hammam/index.html",    "label": "HAMMAM"},
            {"href": "/en/massages/index.html",  "label": "MASSAGES"},
            {"href": "/en/skincare/index.html",  "label": "SKINCARE"},
            {"href": "/en/gallery/index.html",   "label": "GALLERY"},
        ],
        "breadcrumb_home": "Home",
    },
    "de": {
        "benefits_title": "Vorteile",
        "process_title": "Behandlungsablauf",
        "process_intro": "Von unseren erfahrenen Therapeuten nach Ihren persönlichen Wünschen und den Bedürfnissen Ihres Körpers angewendet.",
        "duration_title": "Dauer & Erlebnis",
        "related_title": "Verwandte Behandlungen",
        "similar_title": "Ähnliche Behandlungen",
        "booking_cta": "Jetzt Buchen",
        "home_label": "STARTSEITE",
        "noscript_links": [
            {"href": "/de/hammam/index.html",    "label": "HAMMAM"},
            {"href": "/de/massagen/index.html",  "label": "MASSAGEN"},
            {"href": "/de/hautpflege/index.html", "label": "HAUTPFLEGE"},
            {"href": "/de/galerie/index.html",   "label": "GALERIE"},
        ],
        "breadcrumb_home": "Startseite",
    },
    "fr": {
        "benefits_title": "Bienfaits",
        "process_title": "Déroulement du soin",
        "process_intro": "Appliqué par nos thérapeutes experts selon vos préférences personnelles et les besoins de votre corps.",
        "duration_title": "Durée & Expérience",
        "related_title": "Soins associés",
        "similar_title": "Soins similaires",
        "booking_cta": "Réserver",
        "home_label": "ACCUEIL",
        "noscript_links": [
            {"href": "/fr/hammam/index.html",      "label": "HAMMAM"},
            {"href": "/fr/massages/index.html",    "label": "MASSAGES"},
            {"href": "/fr/soins-visage/index.html", "label": "SOINS VISAGE"},
            {"href": "/fr/galerie/index.html",     "label": "GALERIE"},
        ],
        "breadcrumb_home": "Accueil",
    },
    "ru": {
        "benefits_title": "Преимущества",
        "process_title": "Процесс процедуры",
        "process_intro": "Выполняется нашими опытными терапевтами с учётом ваших предпочтений и потребностей вашего тела.",
        "duration_title": "Продолжительность",
        "related_title": "Связанные услуги",
        "similar_title": "Похожие услуги",
        "booking_cta": "Забронировать",
        "home_label": "ГЛАВНАЯ",
        "noscript_links": [
            {"href": "/ru/hammam/index.html",    "label": "ХАММАМ"},
            {"href": "/ru/massages/index.html",  "label": "МАССАЖ"},
            {"href": "/ru/skincare/index.html",  "label": "УХОД ЗА КОЖЕЙ"},
            {"href": "/ru/gallery/index.html",   "label": "ГАЛЕРЕЯ"},
        ],
        "breadcrumb_home": "Главная",
    }
}

# Booking URLs per language
BOOKING_URLS = {
    "tr": "/tr/rezervasyon/index.html",
    "en": "/en/booking/index.html",
    "de": "/de/buchung/index.html",
    "fr": "/fr/reservation/index.html",
    "ru": "/ru/booking/index.html",
}

# Section breadcrumb names per language
SECTION_BREADCRUMBS = {
    "massages": {
        "tr": "Masaj Terapileri", "en": "Massage Therapies", "de": "Massagetherapien",
        "fr": "Massothérapie", "ru": "Массажные терапии"
    },
    "hammam": {
        "tr": "Hamam Ritüelleri", "en": "Hammam Rituals", "de": "Hammam-Rituale",
        "fr": "Rituels Hammam", "ru": "Ритуалы хаммама"
    },
    "skincare": {
        "tr": "Cilt Bakımı", "en": "Skincare", "de": "Hautpflege",
        "fr": "Soins Visage", "ru": "Уход за кожей"
    },
}

# ---------------------------------------------------------------------------
# DATA LOADING
# ---------------------------------------------------------------------------
def load_site_data():
    """Load and return site_content.json data."""
    with open(SITE_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def load_page_configs():
    """Load optional page-specific overrides."""
    config_file = CONFIG_DIR / "service_pages.json"
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def get_all_services(site_data):
    """Extract all service items from all catalog sections."""
    services = []
    catalogs = site_data.get("catalogs", {})
    for section_key, section_data in catalogs.items():
        items = section_data.get("items", [])
        # Handle both list-of-dicts and dict-of-dicts formats
        if isinstance(items, dict):
            items = list(items.values())
        for item in items:
            # Skip items without a slug (different data model)
            if "slug" not in item:
                continue
            item["_section"] = section_key  # Tag with section
            services.append(item)
    return services


# ---------------------------------------------------------------------------
# TRANSLATION HELPERS
# ---------------------------------------------------------------------------
def get_translated_title(site_data, service, lang, page_configs=None):
    """Get translated title for a service. Priority: page_configs → site_content → TR fallback."""
    slug = service.get("slug", "")

    # 1) Check page_configs (service_pages.json)
    if page_configs and slug in page_configs:
        pc = page_configs[slug]
        if "title" in pc and lang in pc["title"]:
            return pc["title"][lang]

    if lang == "tr":
        return service.get("title", "")

    # 2) Check site_content.json per-language translations
    lang_data = site_data.get(lang, {})
    services_translations = lang_data.get("services", {})
    sid = service.get("id", "")

    for vid in [sid, sid.replace("-", "_"), f"massage_{sid}", f"hammam_{sid}"]:
        trans = services_translations.get(vid, {})
        if trans and trans.get("name"):
            return trans["name"]

    # 3) Fallback: Turkish title
    return service.get("title", sid)


def get_translated_desc(site_data, service, lang, page_configs=None):
    """Get translated description. Priority: page_configs → site_content → TR fallback."""
    slug = service.get("slug", "")

    # 1) Check page_configs
    if page_configs and slug in page_configs:
        pc = page_configs[slug]
        if "desc" in pc and lang in pc["desc"]:
            return pc["desc"][lang]

    if lang == "tr":
        return service.get("desc", "")

    # 2) Check site_content.json
    lang_data = site_data.get(lang, {})
    services_translations = lang_data.get("services", {})
    sid = service.get("id", "")

    for vid in [sid, sid.replace("-", "_"), f"massage_{sid}"]:
        trans = services_translations.get(vid, {})
        if trans and trans.get("desc"):
            return trans["desc"]

    return service.get("desc", "")


def get_translated_long_desc(site_data, service, lang, page_configs=None):
    """Get translated long description. Priority: page_configs → site_content → TR fallback."""
    slug = service.get("slug", "")

    # 1) Check page_configs for longDesc, then desc
    if page_configs and slug in page_configs:
        pc = page_configs[slug]
        if "longDesc" in pc and lang in pc["longDesc"]:
            return pc["longDesc"][lang]
        if "desc" in pc and lang in pc["desc"]:
            return pc["desc"][lang]

    if lang == "tr":
        return service.get("longDesc", service.get("desc", ""))

    # 2) Check site_content.json
    lang_data = site_data.get(lang, {})
    services_translations = lang_data.get("services", {})
    sid = service.get("id", "")

    for vid in [sid, sid.replace("-", "_"), f"massage_{sid}"]:
        trans = services_translations.get(vid, {})
        if trans and trans.get("longDesc"):
            return trans["longDesc"]
        if trans and trans.get("desc"):
            return trans["desc"]

    return service.get("longDesc", service.get("desc", ""))


def get_translated_benefits(site_data, service, lang, page_configs):
    """Get translated benefits list."""
    # Check page configs first
    sid = service.get("id", "")
    if sid in page_configs:
        pc = page_configs[sid]
        if "benefits" in pc and lang in pc["benefits"]:
            return pc["benefits"][lang]

    if lang == "tr":
        return service.get("benefits", [])

    # Fallback to Turkish benefits
    return service.get("benefits", [])


# ---------------------------------------------------------------------------
# URL / PATH HELPERS
# ---------------------------------------------------------------------------
def get_page_url(lang, section_key, slug, absolute=True):
    """Build page URL for a service."""
    section_dir = SECTION_DIRS.get(section_key, {}).get(lang, section_key)
    path = f"/{lang}/{section_dir}/{slug}.html"
    if absolute:
        return f"{DOMAIN}{path}"
    return path


def get_section_index_url(lang, section_key, absolute=True):
    """Build section index URL."""
    section_dir = SECTION_DIRS.get(section_key, {}).get(lang, section_key)
    path = f"/{lang}/{section_dir}/index.html"
    if absolute:
        return f"{DOMAIN}{path}"
    return path


def build_hreflang_links(section_key, slug):
    """Build hreflang alternate links for all 5 languages + x-default."""
    links = []
    for lang in LANGUAGES:
        links.append({
            "lang": lang,
            "href": get_page_url(lang, section_key, slug)
        })
    links.append({
        "lang": "x-default",
        "href": get_page_url("en", section_key, slug)
    })
    return links


def build_noscript_nav(lang):
    """Build noscript fallback navigation."""
    ui = UI_STRINGS[lang]
    nav = [{"href": "/index.html", "label": ui["home_label"], "cls": "nv-ns-home"}]
    for link in ui["noscript_links"]:
        nav.append({"href": link["href"], "label": link["label"], "cls": ""})
    return nav


def copy_static_assets():
    """Copy static assets and root files to output directory."""
    print("📦 Copying static assets...")
    
    # 1. Copy assets folder
    src_assets = PROJECT_DIR / "assets"
    dst_assets = OUTPUT_DIR / "assets"
    if src_assets.exists():
        if dst_assets.exists():
            shutil.rmtree(dst_assets)
        shutil.copytree(src_assets, dst_assets)
        print(f"  ✅ Copied assets/ ({len(list(src_assets.rglob('*')))} files)")
    
    # 1.1 Copy site_content.json to assets/data/
    src_data = PROJECT_DIR / "data" / "site_content.json"
    dst_data_dir = dst_assets / "data"
    dst_data_dir.mkdir(parents=True, exist_ok=True)
    if src_data.exists():
        shutil.copy2(src_data, dst_data_dir / "site_content.json")
        print(f"  ✅ Copied site_content.json to assets/data/")
    
    # 2. Copy root files
    root_files = ["robots.txt", "favicon.ico", "manifest.json", "sitemap.xml", "_redirects", "_headers", "index.html"]
    for fname in root_files:
        src = PROJECT_DIR / fname
        dst = OUTPUT_DIR / fname
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  ✅ Copied {fname}")
        else:
            print(f"  ⚠️ Missing {fname} in root")

    # 3. Copy Language Static Files (Merge)
    for lang in LANGUAGES:
        src_lang = PROJECT_DIR / lang
        dst_lang = OUTPUT_DIR / lang
        if src_lang.exists():
            shutil.copytree(src_lang, dst_lang, dirs_exist_ok=True)
            print(f"  ✅ Merged static files for /{lang}/")

    # 4. Copy components (CRITICAL for santis-nav.js)
    src_comp = PROJECT_DIR / "components"
    dst_comp = OUTPUT_DIR / "components"
    if src_comp.exists():
        if dst_comp.exists():
            shutil.rmtree(dst_comp)
        shutil.copytree(src_comp, dst_comp)
        print(f"  ✅ Copied components/ ({len(list(src_comp.rglob('*')))} files)")


# ---------------------------------------------------------------------------
# SCHEMA GENERATORS
# ---------------------------------------------------------------------------
def build_schema_service(title, description, price, currency="EUR"):
    """Generate Schema.org Service JSON-LD."""
    schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": title,
        "description": description,
        "provider": {
            "@type": "LocalBusiness",
            "name": "Santis Club Spa & Wellness",
            "image": f"{DOMAIN}/assets/img/logo.png",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Çolaklı Mah.",
                "addressLocality": "Manavgat",
                "addressRegion": "Antalya",
                "postalCode": "07600",
                "addressCountry": "TR"
            },
            "telephone": "+905348350169",
            "priceRange": "€€€"
        },
        "offers": {
            "@type": "Offer",
            "price": str(price),
            "priceCurrency": currency,
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2026-12-31"
        }
    }
    return json.dumps(schema, indent=4, ensure_ascii=False)


def build_schema_breadcrumb(lang, section_key, title, slug):
    """Generate Schema.org BreadcrumbList JSON-LD."""
    ui = UI_STRINGS[lang]
    section_name = SECTION_BREADCRUMBS.get(section_key, {}).get(lang, section_key.title())

    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": ui["breadcrumb_home"],
                "item": f"{DOMAIN}/{lang}/index.html"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": section_name,
                "item": get_section_index_url(lang, section_key)
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": get_page_url(lang, section_key, slug)
            }
        ]
    }
    return json.dumps(schema, indent=4, ensure_ascii=False)


# ---------------------------------------------------------------------------
# RELATED / SIMILAR SERVICES
# ---------------------------------------------------------------------------
def get_related_services(all_services, current_service, section_key, lang, max_count=3, page_configs=None):
    """Get related services from the same category."""
    current_id = current_service.get("id")
    current_cat = current_service.get("category", "")
    related = []

    for s in all_services:
        if s.get("id") == current_id:
            continue
        if s.get("_section") != section_key:
            continue
        if s.get("category") == current_cat:
            section_dir = SECTION_DIRS.get(section_key, {}).get(lang, section_key)
            # Use translated name if available
            rel_name = s.get("title", s.get("id"))
            rel_slug = s.get("slug", "")
            if page_configs and rel_slug in page_configs:
                pc = page_configs[rel_slug]
                if "title" in pc and lang in pc["title"]:
                    rel_name = pc["title"][lang]
            related.append({
                "name": rel_name,
                "href": f"/{lang}/{section_dir}/{s['slug']}.html"
            })
        if len(related) >= max_count:
            break

    return related


# ---------------------------------------------------------------------------
# MAIN BUILD
# ---------------------------------------------------------------------------
def build_service_page(env, site_data, service, section_key, lang, all_services, page_configs):
    """Build a single service detail page and return (output_path, html)."""

    slug = service["slug"]
    title = get_translated_title(site_data, service, lang, page_configs)
    description = get_translated_desc(site_data, service, lang, page_configs)
    long_desc = get_translated_long_desc(site_data, service, lang, page_configs)
    benefits = get_translated_benefits(site_data, service, lang, page_configs)
    price = service.get("price", 0)
    duration = service.get("duration", "")
    ui = UI_STRINGS[lang]

    # URL building
    canonical_url = get_page_url(lang, section_key, slug)
    og_image = f"{DOMAIN}{service.get('img', '/assets/img/cards/massage.webp')}"
    assets_prefix = "/"

    # Schemas
    schema_service = build_schema_service(title, description, price)
    schema_breadcrumb = build_schema_breadcrumb(lang, section_key, title, slug)

    # Navigation
    hreflang_links = build_hreflang_links(section_key, slug)
    noscript_nav = build_noscript_nav(lang)

    # Related services
    related = get_related_services(all_services, service, section_key, lang, page_configs=page_configs)
    similar = get_related_services(all_services, service, section_key, lang, max_count=3, page_configs=page_configs)

    # Process steps from page configs
    process_steps = []
    process_note = ""
    sid = service.get("id", "")
    if sid in page_configs and "process_steps" in page_configs[sid]:
        steps_data = page_configs[sid]["process_steps"]
        if lang in steps_data:
            process_steps = steps_data[lang]

    # Render template
    template = env.get_template("service-detail.html.j2")
    html = template.render(
        lang=lang,
        title=title,
        description=description,
        long_description=long_desc,
        canonical_url=canonical_url,
        og_image=og_image,
        schema_service=schema_service,
        schema_breadcrumb=schema_breadcrumb,
        hreflang_links=hreflang_links,
        noscript_nav=noscript_nav,
        assets_prefix=assets_prefix,
        benefits=benefits,
        process_steps=process_steps,
        process_note=process_note,
        duration=duration,
        intensity=service.get("intensity", ""),
        intensity_label={
            "soft": {"tr": "Yumuşak", "en": "Gentle", "de": "Sanft", "fr": "Doux", "ru": "Мягкий"},
            "medium": {"tr": "Orta", "en": "Medium", "de": "Mittel", "fr": "Moyen", "ru": "Средний"},
            "strong": {"tr": "Güçlü", "en": "Deep", "de": "Intensiv", "fr": "Intense", "ru": "Глубокий"},
        }.get(service.get("intensity", ""), {}).get(lang, ""),
        room_type=service.get("room_type", ""),
        room_type_label={
            "single": {"tr": "Bireysel", "en": "Individual", "de": "Einzeln", "fr": "Individuel", "ru": "Индивидуальный"},
            "couple": {"tr": "Çift", "en": "Couples", "de": "Paar", "fr": "Couple", "ru": "Для пар"},
            "group":  {"tr": "Grup", "en": "Group", "de": "Gruppe", "fr": "Groupe", "ru": "Групповой"},
        }.get(service.get("room_type", ""), {}).get(lang, ""),
        related_services=related,
        similar_services=similar,
        booking_url=BOOKING_URLS.get(lang, "/booking.html"),
        ui=ui,
    )

    # Output path
    section_dir = SECTION_DIRS.get(section_key, {}).get(lang, section_key)
    out_path = OUTPUT_DIR / lang / section_dir / f"{slug}.html"

    return out_path, html


# ---------------------------------------------------------------------------
# CATEGORY LISTING BUILD
# ---------------------------------------------------------------------------
def load_category_configs():
    """Load category listing page configs."""
    config_file = CONFIG_DIR / "category_configs.json"
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def build_faq_schema(faq_items):
    """Generate FAQPage JSON-LD from FAQ items."""
    entities = []
    for item in faq_items:
        entities.append({
            "@type": "Question",
            "name": item["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item["a"]
            }
        })
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entities
    }
    return json.dumps(schema, indent=2, ensure_ascii=False)


def build_itemlist_schema(services_list, section_key, lang):
    """Generate ItemList JSON-LD from service items."""
    items = []
    for i, svc in enumerate(services_list, 1):
        items.append({
            "@type": "ListItem",
            "position": i,
            "name": svc["name"],
            "url": f"{DOMAIN}{svc['href']}"
        })
    schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": items
    }
    return json.dumps(schema, indent=2, ensure_ascii=False)


def build_business_schema():
    """Generate HealthAndBeautyBusiness JSON-LD."""
    schema = {
        "@context": "https://schema.org",
        "@type": "HealthAndBeautyBusiness",
        "name": "Santis Club Spa & Wellness",
        "url": DOMAIN,
        "telephone": "+905348350169",
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
        "priceRange": "€€€",
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            "opens": "09:00",
            "closes": "22:00"
        }
    }
    return json.dumps(schema, indent=2, ensure_ascii=False)


def build_category_breadcrumb(lang, section_key, title):
    """Generate BreadcrumbList for category listing page."""
    ui = UI_STRINGS[lang]
    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": ui["breadcrumb_home"],
                "item": f"{DOMAIN}/{lang}/index.html"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": title,
                "item": get_section_index_url(lang, section_key)
            }
        ]
    }
    return json.dumps(schema, indent=2, ensure_ascii=False)


def build_category_hreflang(section_key):
    """Build hreflang alternate links for category listing pages."""
    links = []
    for lang in LANGUAGES:
        links.append({
            "lang": lang,
            "href": get_section_index_url(lang, section_key)
        })
    links.append({
        "lang": "x-default",
        "href": get_section_index_url("en", section_key)
    })
    return links


def build_category_page(env, site_data, section_key, lang, all_services, page_configs, cat_config):
    """Build a category listing page and return (output_path, html)."""

    # Gather section services
    section_services = [s for s in all_services if s.get("_section") == section_key]
    section_dir = SECTION_DIRS.get(section_key, {}).get(lang, section_key)

    # Build service link list with translations, RANKED by sort_priority/featured_score
    def rank_key(s):
        return (
            s.get("sort_priority", 50),      # Lower = first
            -s.get("featured_score", 0),      # Higher = first
            s.get("title", "")
        )

    svc_links = []
    for s in sorted(section_services, key=rank_key):
        svc_name = s.get("title", s.get("id"))
        svc_slug = s.get("slug", "")
        svc_desc = s.get("desc", "")
        if page_configs and svc_slug in page_configs:
            pc = page_configs[svc_slug]
            if "title" in pc and lang in pc["title"]:
                svc_name = pc["title"][lang]
            if "desc" in pc and lang in pc["desc"]:
                svc_desc = pc["desc"][lang]
        svc_links.append({
            "name": svc_name,
            "href": f"/{lang}/{section_dir}/{svc_slug}.html",
            "desc": svc_desc,
            "duration": s.get("duration", ""),
            "price": s.get("price", ""),
            "featured_score": s.get("featured_score", 0),
        })

    # Featured service = highest featured_score
    featured_service = None
    if section_services:
        top = max(section_services, key=lambda s: s.get("featured_score", 0))
        top_slug = top.get("slug", "")
        top_name = top.get("title", "")
        top_desc = top.get("desc", "")
        if page_configs and top_slug in page_configs:
            pc = page_configs[top_slug]
            if "title" in pc and lang in pc["title"]:
                top_name = pc["title"][lang]
            if "desc" in pc and lang in pc["desc"]:
                top_desc = pc["desc"][lang]
        featured_service = {
            "name": top_name,
            "desc": top_desc,
            "duration": top.get("duration", ""),
            "price": top.get("price", ""),
            "href": f"/{lang}/{section_dir}/{top_slug}.html",
        }

    # Extract config values for this language
    hero = cat_config.get("hero", {})
    brand = cat_config.get("brand_story", {})
    meta = cat_config.get("meta", {})
    meta_title = meta.get("title", {}).get(lang, section_key.title())
    meta_desc = meta.get("description", {}).get(lang, "")

    # Chips
    chips_data = []
    for chip in cat_config.get("chips", []):
        chips_data.append({
            "key": chip["key"],
            "emoji": chip.get("emoji", ""),
            "label": chip.get("label", {}).get(lang, chip["key"])
        })

    # FAQ
    faq_items = cat_config.get("faq", {}).get(lang, [])

    # Schemas
    canonical_url = get_section_index_url(lang, section_key)
    schema_breadcrumb = build_category_breadcrumb(lang, section_key, meta_title)
    schema_faq = build_faq_schema(faq_items) if faq_items else ""
    schema_itemlist = build_itemlist_schema(svc_links, section_key, lang)
    schema_business = build_business_schema()

    # Navigation
    hreflang_links = build_category_hreflang(section_key)
    noscript_nav = build_noscript_nav(lang)

    # Category UI strings
    cat_ui = CATEGORY_UI_STRINGS.get(lang, CATEGORY_UI_STRINGS["en"])

    # Render template
    template = env.get_template("category-listing.html.j2")
    html = template.render(
        lang=lang,
        meta_title=meta_title,
        meta_description=meta_desc,
        canonical_url=canonical_url,
        body_class=cat_config.get("body_class", "editorial-mode"),
        # Hero
        hero_kicker=hero.get("kicker", {}).get(lang, ""),
        hero_title=hero.get("title", {}).get(lang, ""),
        hero_intro=hero.get("intro", {}).get(lang, ""),
        hero_subtitle=hero.get("subtitle", {}).get(lang, ""),
        hero_image=hero.get("hero_image", ""),
        scroll_target=hero.get("scroll_target", ""),
        spa_menu_link=hero.get("spa_menu_link", False),
        # Brand story
        brand_kicker=brand.get("kicker", {}).get(lang, ""),
        brand_title=brand.get("title", {}).get(lang, ""),
        brand_text=brand.get("text", {}).get(lang, ""),
        # Chips
        chips=chips_data,
        # Grid
        data_context=cat_config.get("data_context", section_key),
        grid_id=cat_config.get("grid_id", section_key),
        # Services
        all_services=svc_links,
        featured_service=featured_service,
        # FAQ
        faq_items=faq_items,
        # SEO
        seo_bottom=cat_config.get("seo_bottom", {}).get(lang, ""),
        # Schemas
        schema_breadcrumb=schema_breadcrumb,
        schema_faq=schema_faq,
        schema_itemlist=schema_itemlist,
        schema_business=schema_business,
        # Navigation
        hreflang_links=hreflang_links,
        noscript_nav=noscript_nav,
        # JS files
        page_init_js=cat_config.get("page_init_js", ""),
        chip_filter_js=cat_config.get("chip_filter_js"),
        preloader_js=cat_config.get("preloader_js"),
        # UI strings
        ui=cat_ui,
    )

    # Output path
    out_path = OUTPUT_DIR / lang / section_dir / "index.html"
    return out_path, html


def main():
    parser = argparse.ArgumentParser(description="Santis OS Build Pipeline v1.0")
    parser.add_argument("--lang", help="Build for specific language only", choices=LANGUAGES)
    parser.add_argument("--slug", help="Build for specific service slug only")
    parser.add_argument("--section", help="Build for specific section only",
                        choices=["hammam", "massages", "skincare"])
    parser.add_argument("--type", help="Build type: service (default), category, or all",
                        choices=["service", "category", "all"], default="all")
    parser.add_argument("--compare", help="Compare output with existing file path")
    parser.add_argument("--dry-run", action="store_true", help="Don't write files, just show what would be built")
    args = parser.parse_args()

    print("=" * 60)
    print("  🏗️  SANTIS OS — Build Pipeline v1.0")
    print(f"  📅  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Load data
    print("\n📂 Loading site_content.json...")
    site_data = load_site_data()
    page_configs = load_page_configs()
    category_configs = load_category_configs()
    all_services = get_all_services(site_data)
    print(f"   Found {len(all_services)} services across all catalogs")
    if category_configs:
        print(f"   Found {len(category_configs)} category configs")

    # Setup Jinja2
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    # Filter languages
    target_langs = [args.lang] if args.lang else LANGUAGES

    # Stats
    built = 0
    skipped = 0
    errors = []

    build_type = args.type

    # --- SERVICE DETAIL PAGES ---
    if build_type in ("service", "all"):
        print("\n📄 Building service detail pages...")
        for service in all_services:
            section_key = service.get("_section", "massages")
            slug = service.get("slug", "")

            # Section filter
            if args.section and section_key != args.section:
                continue

            # Slug filter
            if args.slug and slug != args.slug:
                continue

            for lang in target_langs:
                try:
                    out_path, html = build_service_page(
                        env, site_data, service, section_key, lang, all_services, page_configs
                    )

                    if args.dry_run:
                        print(f"  🔍 Would build: {out_path.relative_to(OUTPUT_DIR)}")
                        built += 1
                        continue

                    # Write file
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(html)
                    built += 1

                except Exception as e:
                    errors.append(f"{lang}/{section_key}/{slug}: {e}")
                    print(f"  ❌ Error: {lang}/{section_key}/{slug} — {e}")

    # --- CATEGORY LISTING PAGES ---
    if build_type in ("category", "all") and category_configs:
        print("\n📋 Building category listing pages...")
        for section_key, cat_config in category_configs.items():
            # Section filter
            if args.section and section_key != args.section:
                continue

            for lang in target_langs:
                try:
                    out_path, html = build_category_page(
                        env, site_data, section_key, lang, all_services, page_configs, cat_config
                    )

                    if args.dry_run:
                        print(f"  🔍 Would build: {out_path.relative_to(OUTPUT_DIR)}")
                        built += 1
                        continue

                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(html)
                    built += 1
                    print(f"  📋 {out_path.relative_to(OUTPUT_DIR)}")

                except Exception as e:
                    errors.append(f"category/{lang}/{section_key}: {e}")
                    print(f"  ❌ Error: category/{lang}/{section_key} — {e}")

    # Copy Static Assets
    if build_type == "all" and not args.slug and not args.section:
        copy_static_assets()

    # Summary
    print(f"\n{'=' * 60}")
    print(f"  ✅ Built: {built} pages")
    if skipped:
        print(f"  ⏭️  Skipped: {skipped}")
    if errors:
        print(f"  ❌ Errors: {len(errors)}")
        for err in errors:
            print(f"     • {err}")

    if not args.dry_run:
        print(f"\n  📁 Output: {OUTPUT_DIR}")

    print(f"{'=' * 60}")

    # Compare mode
    if args.compare:
        existing_path = PROJECT_DIR / args.compare
        if not existing_path.exists():
            print(f"\n❌ Comparison file not found: {existing_path}")
            return

        # Determine the corresponding output file
        parts = Path(args.compare).parts
        out_file = OUTPUT_DIR / Path(args.compare)
        if out_file.exists():
            existing_lines = existing_path.read_text(encoding="utf-8").splitlines()
            built_lines = out_file.read_text(encoding="utf-8").splitlines()
            print(f"\n📊 Comparison: {args.compare}")
            print(f"   Existing: {len(existing_lines)} lines")
            print(f"   Built:    {len(built_lines)} lines")
            print(f"   Diff:     {abs(len(existing_lines) - len(built_lines))} lines")
        else:
            print(f"\n⚠️  Built file not found at: {out_file}")
            print(f"   Run without --compare first to generate output.")


if __name__ == "__main__":
    main()
