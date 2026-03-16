import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

def process_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        return
        
    orig_content = content

    # 1. Remove ANY hreflang="en" because they point to /en/ directory which is obsolete
    def link_repl(match):
        full_match = match.group(0)
        # Check if it has hreflang="en"
        if re.search(r"hreflang=['\"]en['\"]", full_match, re.I):
            print(f"[{file_path.name}] Force Removed HREFLANG: en")
            return "" 
        return full_match

    content = re.sub(r'<link[^>]*hreflang=[^>]*>', link_repl, content, flags=re.IGNORECASE)
    
    # 2. Replace any <a href="/en/..."> or <a href="../../en/...">
    def a_repl(match):
        full_match = match.group(0)
        href_match = re.search(r"href=['\"]([^'\"]+)['\"]", full_match, re.I)
        if not href_match: return full_match
        
        href = href_match.group(1)
        
        if "/en/" in href or "../en/" in href:
            print(f"[{file_path.name}] Force Fixed A: {href}")
            
            safe_href = "?lang=en" 
            
            # Map specific zombified components to new standard
            if "navbar" in file_path.name or "footer" in file_path.name:
                if "/en/index.html" in href: safe_href = "/index.html?lang=en"
                elif "/en/massages" in href: safe_href = "/tr/masajlar/index.html?lang=en"
                elif "/en/skincare" in href: safe_href = "/tr/cilt-bakimi/index.html?lang=en"
                elif "/en/rituals" in href: safe_href = "/tr/rituals/index.html?lang=en"
                elif "/en/hammam" in href: safe_href = "/tr/hamam/index.html?lang=en"
                elif "/en/gallery" in href: safe_href = "/tr/galeri/index.html?lang=en"
                elif "/en/about" in href: safe_href = "/tr/hakkimizda/index.html?lang=en"
                elif "/en/products" in href: safe_href = "/tr/urunler/index.html?lang=en"
                else: safe_href = "/tr/index.html?lang=en"
            else:
                # Same fallback logic for non-components
                if "/index.html" in href: safe_href = "/tr/index.html?lang=en"
                else: safe_href = "/tr/index.html?lang=en"
                
            return full_match.replace(href, safe_href)
        return full_match

    content = re.sub(r'<a[^>]*href=[\'\"][^\'\"]+[\'\"][^>]*>', a_repl, content, flags=re.IGNORECASE)
    
    # 3. Handle data-target for Liquid Menu
    def data_repl(match):
        full_match = match.group(0)
        target_match = re.search(r"data-target=['\"]([^'\"]+)['\"]", full_match, re.I)
        if not target_match: return full_match
        
        target = target_match.group(1)
        if "/en/" in target or "../en/" in target:
            safe_target = "/tr/index.html?lang=en"
            if "/en/massages" in target: safe_target = "/tr/masajlar/index.html?lang=en"
            elif "/en/skincare" in target: safe_target = "/tr/cilt-bakimi/index.html?lang=en"
            elif "/en/rituals" in target: safe_target = "/tr/rituals/index.html?lang=en"
            elif "/en/hammam" in target: safe_target = "/tr/hamam/index.html?lang=en"
            return full_match.replace(target, safe_target)
        return full_match
        
    content = re.sub(r'<a[^>]*data-target=[\'\"][^\'\"]+[\'\"][^>]*>', data_repl, content, flags=re.IGNORECASE)

    if content != orig_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

def main():
    skip_dirs = {"_backup", "_dev_archives", "_legacy", "node_modules", "venv", ".git", "_archive"}
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for file in files:
            if file.endswith(".html"):
                process_file(Path(root) / file)

if __name__ == "__main__":
    main()
