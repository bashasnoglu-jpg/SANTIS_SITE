"""
Content sync layer (V3, language-aware) for Santis.
Keeps data/site_content.json aligned with admin operations and triggers sitemap generation.
"""

import json
import os
from pathlib import Path
from datetime import datetime
import re
import unicodedata
from sitemap_generator import generate_sitemap

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON_PATH = BASE_DIR / "data" / "site_content.json"
REDIRECTS_PATH = BASE_DIR / "data" / "redirects.json"


# --------------------------------------------------
# CORE IO
# --------------------------------------------------

def load_site_content():
    if not SITE_JSON_PATH.exists():
        return {"languages": {}, "meta": {}}
    try:
        with SITE_JSON_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"languages": {}, "meta": {}}


def save_site_content(data):
    data.setdefault("meta", {})
    data["meta"]["last_updated"] = datetime.utcnow().isoformat()
    SITE_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with SITE_JSON_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    # After every content change, refresh sitemap
    try:
        generate_sitemap()
    except Exception:
        # Sitemap failure should not block save
        pass


# --------------------------------------------------
# REDIRECTS IO
# --------------------------------------------------

def load_redirects():
    if not REDIRECTS_PATH.exists():
        return {"redirects": []}
    try:
        with REDIRECTS_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"redirects": []}


def save_redirects(data):
    REDIRECTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REDIRECTS_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def register_redirect(old_slug: str, new_slug: str, lang="tr", category="products"):
    if not old_slug or not new_slug or old_slug == new_slug:
        return
    redirects_data = load_redirects()
    redirects = redirects_data["redirects"]

    old_path = f"/{lang}/{category}/{old_slug}"
    new_path = f"/{lang}/{category}/{new_slug}"

    def resolve_final_target(path, redirects_list):
        visited = set()
        while True:
            if path in visited:
                break
            visited.add(path)
            match = next((r for r in redirects_list if r.get("from") == path), None)
            if not match:
                break
            path = match.get("to")
        return path

    final_target = resolve_final_target(new_path, redirects)

    # Update existing redirects pointing to old_path -> final_target
    for r in redirects:
        if r.get("to") == old_path:
            r["to"] = final_target

    # Add new rule if not already present
    if not any(r.get("from") == old_path for r in redirects):
        redirects.append({
            "from": old_path,
            "to": final_target,
            "type": 301
        })

    save_redirects(redirects_data)


# --------------------------------------------------
# NORMALIZATION
# --------------------------------------------------

def normalize_product(product: dict) -> dict:
    return {
        "id": product.get("slug") or str(product.get("id") or ""),
        "title": product.get("title") or product.get("name") or "",
        "description": product.get("description", product.get("desc", "")),
        "image": product.get("image", product.get("img", "/assets/img/default.jpg")),
        "category": product.get("category", "general"),
        "price": product.get("price", ""),
        "lang": product.get("lang", "tr"),
        "active": product.get("active", True),
        "lastmod": product.get("lastmod"),
        "group_id": product.get("group_id") or product.get("group") or product.get("slug") or product.get("id"),
    }


# --------------------------------------------------
# SECTION ROUTING
# --------------------------------------------------

CATEGORY_SECTION_MAP = {
    "masaj": "massages",
    "massage": "massages",
    "massages": "massages",
    "hamam": "hammam",
    "hammam": "hammam",
    "cilt": "skincare",
    "skin": "skincare",
    "skincare": "skincare",
    "urun": "products",
    "product": "products",
    "products": "products",
}


def get_section_name(category: str) -> str:
    return CATEGORY_SECTION_MAP.get(category.lower(), "products")


def ensure_language(site_data, lang):
    site_data.setdefault("languages", {})
    site_data["languages"].setdefault(lang, {})
    site_data["languages"][lang].setdefault("sections", {})


def ensure_section(site_data, lang, section_name):
    ensure_language(site_data, lang)
    sections = site_data["languages"][lang]["sections"]
    sections.setdefault(section_name, {})
    sections[section_name].setdefault("items", [])


# --------------------------------------------------
# SLUG HELPERS
# --------------------------------------------------

def slugify(text: str, fallback: str = "item") -> str:
    if not text:
        text = fallback or "item"
    text = text.lower().strip()
    replacements = {"ı": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c"}
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")
    return text or (fallback.lower() if fallback else "item")


def generate_unique_slug(title: str, site_data: dict) -> str:
    base_slug = slugify(title, fallback="item")
    slug = base_slug
    counter = 1
    existing = set()
    for lang_data in site_data.get("languages", {}).values():
        for section in lang_data.get("sections", {}).values():
            for item in section.get("items", []):
                if item.get("id"):
                    existing.add(str(item["id"]).lower())
    while slug in existing:
        counter += 1
        slug = f"{base_slug}-{counter}"
    return slug




# --------------------------------------------------
# UPSERT / DELETE HOOKS
# --------------------------------------------------

def sync_product_to_site_json(product: dict):
    site_data = load_site_content()
    # Auto slug if missing; ensure uniqueness
    if not product.get("slug"):
        product["slug"] = generate_unique_slug(product.get("title") or product.get("name") or "item", site_data)
    # Stamp lastmod
    product["lastmod"] = datetime.utcnow().date().isoformat()
    # Ensure group_id (used for hreflang mapping)
    if not product.get("group_id"):
        product["group_id"] = product["slug"]
    normalized = normalize_product(product)

    lang = normalized.get("lang", "tr") or "tr"
    section_name = get_section_name(normalized.get("category", "products"))
    ensure_section(site_data, lang, section_name)

    items = site_data["languages"][lang]["sections"][section_name]["items"]
    existing_index = next((i for i, p in enumerate(items) if p.get("id") == normalized["id"]), None)

    if normalized.get("active") is False:
        items[:] = [p for p in items if p.get("id") != normalized["id"]]
    else:
        if existing_index is not None:
            old_slug = items[existing_index].get("id")
            if old_slug and old_slug != normalized["id"]:
                register_redirect(old_slug, normalized["id"], lang, section_name)
            # Preserve existing data, update fields and lastmod
            items[existing_index].update(normalized)
            items[existing_index]["lastmod"] = product["lastmod"]
        else:
            items.append(normalized)

    save_site_content(site_data)


def remove_product_from_site_json(slug: str):
    site_data = load_site_content()
    for lang_data in site_data.get("languages", {}).values():
        for section in lang_data.get("sections", {}).values():
            section["items"] = [p for p in section.get("items", []) if p.get("id") != slug]
    save_site_content(site_data)


# --------------------------------------------------
# QUERY HELPERS
# --------------------------------------------------

def slug_exists(slug: str) -> bool:
    if not slug:
        return False
    slug_l = slug.lower()
    site_data = load_site_content()
    for lang_data in site_data.get("languages", {}).values():
        for section in lang_data.get("sections", {}).values():
            for item in section.get("items", []):
                if str(item.get("id", "")).lower() == slug_l:
                    return True
    return False
