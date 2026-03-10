import os
import re
from pathlib import Path

def replace_i18n_links(match):
    attr = match.group(1) # href or src
    lang = match.group(2) # en, fr, de, ru
    rest_of_path = match.group(3) # massages/index.html#bridal
    
    mapping = {
        "massages": "masajlar",
        "hammam": "hamam",
        "products": "urunler",
        "skincare": "cilt-bakimi",
        "about": "hakkimizda",
        "gallery": "galeri",
        "world-rituals": "rituals",
        "services": "hizmetler",
        "code-of-silence.html": "hakkimizda/code-of-silence.html"
    }

    mapped_rest = rest_of_path
    
    # Extract hash
    hash_part = ""
    if "#" in mapped_rest:
        parts = mapped_rest.split("#", 1)
        mapped_rest = parts[0]
        hash_part = "#" + parts[1]
    
    # Extract query
    query_part = ""
    if "?" in mapped_rest:
        parts = mapped_rest.split("?", 1)
        mapped_rest = parts[0]
        query_part = "&" + parts[1]

    path_segments = mapped_rest.split("/")
    new_segments = [mapping.get(seg, seg) for seg in path_segments]
    mapped_path = "/".join(new_segments)
    
    if not mapped_path or mapped_path == "index.html":
        new_url = f"/tr/index.html?lang={lang}{query_part}{hash_part}"
    else:
        new_url = f"/tr/{mapped_path}?lang={lang}{query_part}{hash_part}"
        
    return f'{attr}="{new_url}"'

def fix_tr_hybrid_links(match):
    attr = match.group(1)
    rest = match.group(2)
    
    mapping = {
        "massages": "masajlar",
        "services": "hizmetler",
        "hammam": "hamam",
        "products": "urunler",
        "skincare": "cilt-bakimi"
    }
    
    segments = rest.split("/")
    new_segments = [mapping.get(s, s) for s in segments]
    new_path = "/".join(new_segments)
    
    return f'{attr}="/tr/{new_path}"'

def fix_i18n_links(root_dir):
    ignore_dirs = {
        ".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", "core", "api", "backend", "app", 
        ".vscode", "backup", "backups", "backup_assets", "_archive", "_legacy", "_legacy_archive", 
        "_legacy_content", "_dev_archives", "SantisV5.5_Backup_20260221_122443", 
        "visual_checkpoints", "quarantine_zone", "logs", "test-results", "tests"
    }

    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs and not d.startswith("SantisV") and not d.startswith("_")]
        for f in filenames:
            if f.endswith(".html"):
                html_files.append(Path(dirpath) / f)
                
    fixed_count = 0
    pattern_i18n = re.compile(r'(href|src)=["\']/(en|fr|de|ru)/([^"\']*)["\']')
    pattern_tr_hybrid = re.compile(r'(href|src)=["\']/tr/([^"\']+)["\']')

    for html_file in html_files:
        try:
            original_content = html_file.read_text(encoding="utf-8")
            
            # Pass 1: Replace /en/, /fr/ routes with /tr/...mapped...?lang=x
            content = pattern_i18n.sub(replace_i18n_links, original_content)
            
            # Pass 2: Clean up hybrid paths like /tr/massages/... -> /tr/masajlar/...
            content = pattern_tr_hybrid.sub(fix_tr_hybrid_links, content)
            
            if content != original_content:
                html_file.write_text(content, encoding="utf-8")
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {html_file}: {e}")

    return fixed_count

if __name__ == "__main__":
    count = fix_i18n_links(".")
    print(f"SUCCESS: V10 i18n synchronization completed. Updated routes in {count} HTML files.")
