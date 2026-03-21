import os
import re
import json
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent # SANTIS_SITE

def crawl_assets():
    print(f"[{'Sovereign Crawler'}] Başlatılıyor. Hedef: {BASE_DIR}")
    html_files = []
    
    # Sadece aktif front-end klasörlerini tara (yedekleri ve devasa klasörleri atla)
    active_dirs = ['tr', 'en', 'ru', 'fr', 'de', 'admin', 'hq-dashboard', 'templates', 'admin-panel', 'components']
    
    for relative_dir in active_dirs:
        target_dir = BASE_DIR / relative_dir
        if not target_dir.exists():
            continue
        for root, _, files in os.walk(target_dir):
            for f in files:
                if f.endswith('.html'):
                    html_files.append(Path(root) / f)
                
    assets = []
    # HTML src and srcset extraction regex
    img_pattern = re.compile(r'<img\s+[^>]*src=["\']([^"\']+)["\'][^>]*>', re.IGNORECASE)
    alt_pattern = re.compile(r'alt=["\']([^"\']+)["\']', re.IGNORECASE)
    
    def guess_category(text):
        text = text.lower()
        if 'hamam' in text or 'hammam' in text: return 'Hammam'
        if 'masaj' in text or 'massage' in text: return 'Massage'
        if 'cilt' in text or 'skin' in text or 'facial' in text: return 'Skincare'
        if 'vip' in text or 'lounge' in text: return 'VIP Lounge'
        if 'detox' in text: return 'Detox'
        if 'revenue' in text or 'admin' in text or 'dashboard' in text: return 'Revenue'
        return 'General'

    for html_file in html_files:
        route = "/" + str(html_file.relative_to(BASE_DIR)).replace("\\", "/")
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            matches = img_pattern.finditer(content)
            for idx, match in enumerate(matches):
                img_tag = match.group(0)
                src = match.group(1)
                
                alt_match = alt_pattern.search(img_tag)
                alt = alt_match.group(1) if alt_match else ""
                
                # generate deterministic asset id
                raw_id = f"{route}_{src}_{idx}"
                asset_id = "s-asset-" + hashlib.md5(raw_id.encode('utf-8')).hexdigest()[:8]
                
                filename = src.split('/')[-1] if '/' in src else src
                
                # Guess slot name from filename or route
                page_name = html_file.stem.capitalize()
                slot_name_base = filename.split('.')[0].capitalize().replace('-', ' ')
                slot_name = f"{page_name} - {slot_name_base} Slot"
                
                category = guess_category(route + " " + src + " " + alt)
                
                assets.append({
                    "asset_id": asset_id,
                    "filename": filename,
                    "url": src,
                    "category": category,
                    "target_slot": slot_name,
                    "page_route": route,
                    "tenant_id": "santis_hq", # Default tenant
                    "metadata": {
                        "alt": alt,
                        "tags": [category.lower(), "auto-discovered"]
                    }
                })
        except Exception as e:
            print(f"Error reading {html_file}: {e}")
            
    # Save to JSON vault (Next to server.py)
    vault_path = BASE_DIR / "omni_asset_vault.json"
    with open(vault_path, 'w', encoding='utf-8') as f:
        json.dump(assets, f, indent=2, ensure_ascii=False)
        
    print(f"[{'Sovereign Crawler'}] Tamamlandı.")
    print(f"-> HTML Şablon Sayısı: {len(html_files)}")
    print(f"-> Eşleştirilen (Mapped) Asset Sayısı: {len(assets)}")
    print(f"-> Vault Mühürlendi: {vault_path}")
    os._exit(0)  # Force exit to kill any background cron threads if triggered

if __name__ == "__main__":
    crawl_assets()

