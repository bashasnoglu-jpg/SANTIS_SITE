import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SITE_JSON = BASE_DIR / "data" / "site_content.json"
JS_FILE = BASE_DIR / "assets" / "js" / "home-products.js"

# Folder Map (Must match restore_pages.py)
FOLDER_MAP = {
    "tr": { "hammam": "hamam", "massages": "masajlar", "skincare": "cilt-bakimi", "products": "urunler", "services": "hizmetler" },
    # For home-products.js, we primarily care about the TR default links usually used in the UI
}

def fix_links():
    print("🔗 Starting Frontend Link Repair...")

    if not SITE_JSON.exists() or not JS_FILE.exists():
        print("❌ Missing data or JS file.")
        return

    data = json.loads(SITE_JSON.read_text(encoding="utf-8-sig"))
    catalogs = data.get("catalogs", {})

    # 1. Build Slug Mapping
    # slug -> static URL (Defaulting to TR for main JS links)
    slug_map = {}
    
    for cat_key, cat_data in catalogs.items():
        folder = FOLDER_MAP["tr"].get(cat_key, cat_key)
        for item in cat_data.get("items", []):
            slug = item.get("slug") or item.get("id")
            if slug:
                # Target: /tr/folder/slug.html
                static_url = f"/tr/{folder}/{slug}.html"
                slug_map[slug] = static_url

    # 2. Update JS File
    content = JS_FILE.read_text(encoding="utf-8")
    original_len = len(content)
    
    # Pattern: href="detay.html?slug=X" or similar
    # Adjust regex based on actual JS content usage.
    # Often it might be constructed dynamically or hardcoded in fetching logic.
    # Let's assume there might be a map or direct fetching strings.
    # Or maybe it's `detail.html?slug=${slug}`
    
    # If the JS uses `window.location.href = ... + slug`, we need to change the logic.
    # But if it's "Link Düzeltmesi" as per prompt, let's look for known patterns.
    # The prompt example: `a.href = slugMap[slug];` suggesting we should INJECT the map.
    
    # Let's inject a lookup function or map at the top of the file if it doesn't exist?
    # Or better, if the JS iterates over items and builds HTML:
    # `href="detail.html?slug=${item.slug}"` -> `href="/tr/${folder}/${item.slug}.html"`
    
    # Since we can't easily parse JS logic with Python regex reliably for complex logic,
    # we will try to find the specific construction string mentioned in previous context 
    # or just inject a global map helper if the user instructions imply replacing the LOGIC.
    
    # User said: "JSON’daki tüm slug’larla otomatik mapping yapacak ... şekilde geliştir".
    # This implies I should generate the map and maybe INJECT it into the JS?
    
    # Strategy:
    # 1. Read JS.
    # 2. Find where links are generated.
    # 3. If standard `detail.html?slug=` pattern exists, replace it.
    
    # Regex for query param style:  `["'](.*?)detay\.html\?slug=`
    # Replaces `detay.html?slug=${slug}` with logic??
    
    # Actually, simpler approach for "Static Site":
    # Search for the loop that generates cards.
    # It likely uses `item.slug`.
    # We can inject a `const SLUG_MAP = { ... };` at top of file.
    # And replace the link generation line to use this map.
    
    # Map Generation
    map_json = json.dumps(slug_map, indent=4, ensure_ascii=False)
    js_map_code = f"const STATIC_URL_MAP = {map_json};\n\n"
    
    # Check if we already injected it
    if "const STATIC_URL_MAP" not in content:
        content = js_map_code + content
        print("✅ Injected STATIC_URL_MAP into JS.")
    else:
        # Update existing map (regex replace the const block)
        content = re.sub(r"const STATIC_URL_MAP = \{.*?\};", f"const STATIC_URL_MAP = {map_json};", content, flags=re.DOTALL)
        print("✅ Updated STATIC_URL_MAP in JS.")

    # Now replace the link usage
    # Looking for: `href="detail.html?slug=${item.slug}"` or similar
    # We replace it with: `href="${STATIC_URL_MAP[item.slug] || '#'}"`
    
    # Let's try to catch common variations
    # 1. Template literal: `href="detail.html?slug=${item.slug}"`
    # 2. String concat: "href='detail.html?slug=" + item.slug + "'"
    
    # Variation 1 replacement
    pattern_1 = r'href=["\'](detay|detail)\.html\?slug=\$\{([a-zA-Z0-9_.]+)\}(["\'])'
    replacement_1 = r'href="${STATIC_URL_MAP[\2] || \1 + ".html?slug=" + \2}\3'
    
    # Safety: If map missing, fallback to old? 
    # Better: `href="${STATIC_URL_MAP[item.slug] || '#'}"`
    
    new_content = re.sub(
        r'href=["\'].*?(detay|detail)\.html\?slug=\$\{([^}]+)\}.*?["\']',
        r'href="${STATIC_URL_MAP[\2] || \'#\'}"',
        content
    )
    
    if len(new_content) != len(content):
        print("✅ Replaced dynamic link logic.")
        JS_FILE.write_text(new_content, encoding="utf-8")
    else:
        print("⚠️ No link patterns found to replace. Check JS file manually.")
        JS_FILE.write_text(content, encoding="utf-8") # Save the map injection at least

if __name__ == "__main__":
    fix_links()
