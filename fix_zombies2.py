import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

def check_link_exists(href, current_file):
    # Strip santis-club.com to test locally
    href = href.replace("https://santis-club.com", "").replace("https://santisclub.com", "")
    
    if href.startswith(("http", "mailto:", "tel:", "javascript:", "#")):
        return True
    
    if "{{" in href or "{ " in href or "} " in href:
        return True
        
    path_part = href.split("?")[0].split("#")[0]
    
    # Handle implicit index.html
    if path_part == "" or path_part.endswith("/"):
        path_part += "index.html"
        
    if path_part.startswith("/"):
        target = ROOT_DIR / path_part.lstrip("/")
    else:
        target = (current_file.parent / path_part).resolve()
        
    try:
        return target.exists()
    except:
        return True # If it errors resolving, just assume it exists

def process_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        return
        
    orig_content = content

    def link_repl(match):
        full_match = match.group(0)
        
        # Regex is a bit tricky, let's just find href="..." manually
        href_match = re.search(r"href=['\"]([^'\"]+)['\"]", full_match, re.I)
        if not href_match: return full_match
        
        href = href_match.group(1)
        
        if not check_link_exists(href, file_path):
            print(f"[{file_path.name}] Removed dead HREFLANG: {href}")
            return "" # remove line entirely
        return full_match

    content = re.sub(r'<link[^>]*hreflang=[^>]*>', link_repl, content, flags=re.IGNORECASE)
    
    def a_repl(match):
        full_match = match.group(0)
        href_match = re.search(r"href=['\"]([^'\"]+)['\"]", full_match, re.I)
        if not href_match: return full_match
        
        href = href_match.group(1)
        
        if not check_link_exists(href, file_path):
            print(f"[{file_path.name}] Fixed dead A: {href}")
            lang = "en" if "/en/" in href or "../en/" in href else "tr"
            
            # Map specific zombified components to new standard
            safe_href = f"?lang={lang}" # default fallback
            
            # For header and footer:
            if "navbar" in file_path.name or "footer" in file_path.name:
                if "/en/index.html" in href: safe_href = "/index.html?lang=en"
                elif "/en/massages" in href: safe_href = "/tr/masajlar/index.html?lang=en"
                elif "/en/skincare" in href: safe_href = "/tr/cilt-bakimi/index.html?lang=en"
                elif "/en/rituals" in href: safe_href = "/tr/rituals/index.html?lang=en"
                elif "/en/hammam" in href: safe_href = "/tr/hamam/index.html?lang=en"
                else: safe_href = "/tr/index.html?lang=en"
            else:
                safe_href = f"/tr/index.html?lang={lang}"
                
            return full_match.replace(href, safe_href)
        return full_match

    content = re.sub(r'<a[^>]*href=[\'\"][^\'\"]+[\'\"][^>]*>', a_repl, content, flags=re.IGNORECASE)
    
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
