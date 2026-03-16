import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

def check_link_exists(href, current_file):
    # Ignore absolute URLs (http/https), mailto, tel, hash, etc.
    if href.startswith(("http", "mailto:", "tel:", "javascript:", "#")):
        return True
    
    # Also ignore angular or other template tags if any
    if "{{" in href:
        return True
    
    # Remove query string or hash
    path_part = href.split("?")[0].split("#")[0]
    
    if path_part.endswith("/"):
        path_part += "index.html"
    
    if path_part.startswith("/"):
        # Relies on root
        target = ROOT_DIR / path_part.lstrip("/")
    else:
        # Relative to current file
        target = current_file.parent / path_part
        
    return target.resolve().exists()

def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all <link ... hreflang=... href="...">
    # Regex to find <link ...> that have hreflang and href
    # We will just find <link ... href="..."> and check
    def link_repl(match):
        full_match = match.group(0)
        href = match.group(1)
        if not check_link_exists(href, file_path):
            print(f"[{file_path.name}] Zombie HREFLANG Removed: {href}")
            return "" # remove line entirely
        return full_match

    content = re.sub(r'<link[^>]*hreflang=[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>\s*', link_repl, content, flags=re.IGNORECASE)
    
    # Sometimes it's href first then hreflang
    content = re.sub(r'<link[^>]*href=[\'"]([^\'"]+)[\'"][^>]*hreflang=[^>]*>\s*', link_repl, content, flags=re.IGNORECASE)

    # Now find <a href="...">
    def a_repl(match):
        full_match = match.group(0)
        href = match.group(1)
        if not check_link_exists(href, file_path):
            print(f"[{file_path.name}] Zombie A Href Fixed: {href}")
            # Replace with a safe fallback instead of 404. Let's redirect to /tr/index.html?lang=en
            lang = "en" if "/en/" in href or "../en/" in href else "tr"
            safe_href = f"/tr/index.html?lang={lang}"
            return full_match.replace(href, safe_href)
        return full_match

    content = re.sub(r'<a[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>', a_repl, content, flags=re.IGNORECASE)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    skip_dirs = {"_backup", "_dev_archives", "_legacy", "node_modules", "venv", ".git"}
    
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for file in files:
            if file.endswith(".html"):
                process_file(Path(root) / file)

if __name__ == "__main__":
    main()
