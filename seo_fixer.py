import os
import json
import re
from pathlib import Path

# Try importing BeautifulSoup
try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    print("⚠️ BeautifulSoup not found. Using Regex mode (Safe fallback).")

BASE_DIR = Path(__file__).resolve().parent

# ----------------------------------------------------------------
# 1. BUILD SLUG MAP FROM JSON
# ----------------------------------------------------------------
def build_slug_map():
    """
    Parses site_content.json to build a comprehensive map of 
    { 'category_id': [ {title, url, slug}, ... ] }
    Used for intelligent internal linking.
    """
    slug_map = {} # Key: Category ID, Value: List of links
    
    try:
        json_path = BASE_DIR / "data" / "site_content.json"
        if not json_path.exists():
            print("⚠️ site_content.json not found.")
            return {}
            
        data = json.load(json_path.open(encoding="utf-8-sig"))
        
        # Helper to add item
        def add_item(lang, section, item):
            slug = item.get("slug")
            cat = item.get("category") or section
            title = item.get("title")
            if not slug or not title: return
            
            # Form URL
            # Url logic matches restore_pages.py
            if "masaj" in section or "massage" in section: folder = "masajlar" if lang == "tr" else "massages"
            elif "hamam" in section or "hammam" in section: folder = "hamam" if lang == "tr" else "hammam"
            elif "skin" in section or "cilt" in section: folder = "cilt-bakimi" if lang == "tr" else "skincare"
            else: folder = "hizmetler"
            
            url = f"/{lang}/{folder}/{slug}.html"
            
            if cat not in slug_map: slug_map[cat] = []
            slug_map[cat].append({
                "title": title,
                "url": url,
                "slug": slug
            })

        # Parse standard catalogs (massages, hammam, etc.)
        # Structure: root -> [section] -> items
        # Parse standard catalogs (massages, hammam, etc.)
        # Structure: root -> catalogs -> [section] -> items
        for section_key in ["massages", "hammam", "skincare"]:
            # Access via catalogs first
            section_data = data.get("catalogs", {}).get(section_key, {})
            items = section_data.get("items", [])
            for item in items:
                # Add for all langs (generating hypothetical URLs for EN/DE based on TR data is tricky 
                # but restore_pages does it. We will assume standard structure.)
                # Actually restore_pages generates for ["tr", "en", "de", "fr", "ru"]
                for lang in ["tr", "en", "de", "fr", "ru"]:
                    # Localize title if possible? For now use defaults or just keys
                    # If global.services exists, use it.
                    # We will stick to TR for internal linking text to be safe, or just use the item title.
                    # For internal links, we want to link to SAME LANG pages.
                    item_clone = item.copy()
                    
                    # Try to find localized title
                    svc_id = item.get("id")
                    loc_data = data.get("global", {}).get("services", {}).get(svc_id, {}).get(lang, {})
                    if loc_data.get("title"):
                        item_clone["title"] = loc_data["title"]
                    
                    add_item(lang, section_key, item_clone)

    except Exception as e:
        print(f"❌ Error building slug map: {e}")
        
    return slug_map

SLUG_MAP = build_slug_map()

# ----------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ----------------------------------------------------------------

def get_page_lang(file_path):
    path_str = str(file_path).lower()
    for l in ["tr", "en", "de", "fr", "ru"]:
        if f"/{l}/" in path_str or str(file_path).startswith(f"{l}\\"):
            return l
    return "tr"

def get_related_links(file_path, lang):
    """
    Finds 3 relevant links for the current page based on content match or random same-category.
    """
    # 1. Identify category from path
    path_str = str(file_path).lower()
    category_keywords = []
    
    if "masaj" in path_str or "massage" in path_str: category_keywords = ["classicMassages", "massages"]
    elif "hamam" in path_str or "hammam" in path_str: category_keywords = ["hammam"]
    elif "cilt" in path_str or "skin" in path_str: category_keywords = ["faceSothys", "skincare"]
    
    candidates = []
    for cat in category_keywords:
        if cat in SLUG_MAP:
            # Filter by lang
            lang_candidates = [x for x in SLUG_MAP[cat] if f"/{lang}/" in x["url"]]
            candidates.extend(lang_candidates)
            
    # Remove self
    current_filename = file_path.name
    candidates = [c for c in candidates if current_filename not in c["url"]]
    
    # Return top 3
    return candidates[:3]

# ----------------------------------------------------------------
# 3. TRANSFORMATION LOGIC
# ----------------------------------------------------------------

def update_page_bs4(file_path):
    text = file_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(text, "html.parser")
    lang = get_page_lang(file_path)
    
    # 1. H1 Check
    if not soup.find("h1"):
        title = file_path.stem.replace("-", " ").title()
        new_h1 = soup.new_tag("h1")
        new_h1.string = title
        if soup.body:
            soup.body.insert(0, new_h1)

    # 2. Meta Description
    if not soup.find("meta", attrs={"name": "description"}):
        title = soup.title.string if soup.title else "Santis Club"
        desc = f"{title} - Professional Spa & Wellness services. {file_path.stem} details."
        new_meta = soup.new_tag("meta", attrs={"name": "description", "content": desc})
        if soup.head:
            soup.head.append(new_meta)

    # 3. Canonical & Hreflang
    head = soup.head
    if head:
        # Canonical
        rel_path = file_path.relative_to(BASE_DIR).as_posix()
        canonical_url = f"https://santis.club/{rel_path}"
        if not head.find("link", attrs={"rel": "canonical"}):
            tag = soup.new_tag("link", attrs={"rel": "canonical", "href": canonical_url})
            head.append(tag)
        
        # Hreflang - Only if missing
        if not head.find("link", attrs={"hreflang": "tr"}):
            # Generate basics
            langs = ["tr", "en", "de", "fr", "ru"]
            base_slug = file_path.stem
            
            # Attempt to map folder
            # Simple heuristic: swap /tr/ with /en/ etc.
            current_rel = rel_path
            for l in langs:
                target_url = current_rel
                if f"/{lang}/" in current_rel:
                    target_url = current_rel.replace(f"/{lang}/", f"/{l}/")
                    # Handle folder name changes (tr/masajlar -> en/massages) if possible
                    # This is complex in post-process. RESTORE_PAGES does it better.
                    # We will skip complex folder mapping here to avoid 404s.
                    # Just standard replacement if strictly following /lang/ structure.
                    
                tag = soup.new_tag("link", attrs={"rel": "alternate", "hreflang": l, "href": f"https://santis.club/{target_url}"})
                head.append(tag)

    # 4. Schema (Service)
    if not soup.find("script", attrs={"type": "application/ld+json"}):
        schema = {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": file_path.stem.replace("-"," ").title(),
            "provider": {"@type": "LocalBusiness", "name": "Santis Club"}
        }
        tag = soup.new_tag("script", attrs={"type": "application/ld+json"})
        tag.string = json.dumps(schema)
        if head:
            head.append(tag)
            
    # 5. Internal Links Injection
    # Logic: Look for "Benzer Hizmetler" or "Related Services" div. If not found, create one at bottom of content.
    # Content usually in <main> or <body>
    
    # Headers mapping
    headers = {
        "tr": "Benzer Hizmetler",
        "en": "Related Services",
        "de": "Ähnliche Dienstleistungen",
        "fr": "Services Similaires",
        "ru": "Похожие услуги"
    }
    
    related = get_related_links(file_path, lang)
    if related:
        # check if already exists
        if not soup.find("div", class_="related-services-auto"):
            container = soup.new_tag("div", attrs={"class": "related-services-auto", "style": "margin-top: 40px; padding-top:20px; border-top:1px solid #eee;"})
            
            h3 = soup.new_tag("h3")
            h3.string = headers.get(lang, "Related Services")
            container.append(h3)
            
            ul = soup.new_tag("ul", attrs={"style": "list-style:none; padding:0;"})
            for link in related:
                li = soup.new_tag("li", attrs={"style": "margin-bottom:10px;"})
                a = soup.new_tag("a", href=link["url"], attrs={"style": "color:#8b7355; text-decoration:none; font-weight:500;"})
                a.string = f"➤ {link['title']}"
                li.append(a)
                ul.append(li)
            
            container.append(ul)
            
            # Append to main or body
            target = soup.find("main") or soup.body
            if target:
                target.append(container)
                print(f"🔗 Linked 3 related items in {file_path.name}")
    
    file_path.write_text(str(soup), encoding="utf-8")
    # print(f"✅ [BS4] Optimized: {file_path.name}")

def main():
    print("🚀 Starting Advanced SEO Fixer...")
    print(f"📊 Sitemap Index Size: {sum(len(v) for v in SLUG_MAP.values())} items")
    
    html_files = list(BASE_DIR.rglob("*.html"))
    count = 0
    
    for f in html_files:
        if "template" in str(f): continue
        if "_legacy" in str(f): continue
        if "index.html" in f.name and len(str(f)) < 30: continue # Skip root index likely
        
        if HAS_BS4:
            try:
                update_page_bs4(f)
                count += 1
            except Exception as e:
                print(f"❌ Error on {f.name}: {e}")
        else:
            print("❌ Parsing requires BeautifulSoup for advanced linking.")
            break
            
    print(f"✨ SEO Fix & Linking completed for {count} files.")

if __name__ == "__main__":
    main()
