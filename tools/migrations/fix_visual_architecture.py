import os
import re
from pathlib import Path

ROOT_DIR = Path(r"C:\Users\tourg\Desktop\SANTIS_SITE")

def process_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return

    orig_content = content

    # 1. Remove empty image sources
    content = re.sub(r'<img[^>]*src=["\']\s*["\'][^>]*>', '', content, flags=re.IGNORECASE)

    # 2. Process all img tags to enforce standards
    def img_repl(match):
        img_tag = match.group(0)
        
        # Change .png to .webp
        if ".png" in img_tag.lower():
            img_tag = re.sub(r'\.png', '.webp', img_tag, flags=re.IGNORECASE)
            
        # Extract src to apply specific dimensions
        src_match = re.search(r'src=["\']([^"\']+)["\']', img_tag, re.I)
        src = src_match.group(1) if src_match else ""

        # Default properties
        w = "1024"
        h = "1024"
        loading = 'loading="lazy"'
        fetchp = ""

        if "santis-pasa.html" in file_path.name:
            if "hero" in img_tag.lower() or "santis_pasa" in src.lower():
                w = "1200"
                h = "600"
                loading = ""
                fetchp = 'fetchpriority="high"'
        
        # For general cards in index.html, tr/index.html
        if "card" in src.lower() and "massage" in src.lower():
            w = "600"
            h = "800" # fallback if not set based on known UI size

        # Ensure width and height exist
        if 'width=' not in img_tag.lower():
            img_tag = img_tag.replace('<img ', f'<img width="{w}" height="{h}" ')
            
        # Ensure decoding="async" exists
        if 'decoding=' not in img_tag.lower():
            img_tag = img_tag.replace('<img ', '<img decoding="async" ')

        # Ensure loading="lazy" or fetchpriority="high" exists
        if fetchp and 'fetchpriority=' not in img_tag.lower() and 'loading=' not in img_tag.lower():
            img_tag = img_tag.replace('<img ', f'<img {fetchp} ')
        elif not fetchp and 'loading=' not in img_tag.lower() and 'fetchpriority=' not in img_tag.lower():
            img_tag = img_tag.replace('<img ', f'<img {loading} ')

        return img_tag

    content = re.sub(r'<img\s+[^>]+>', img_repl, content, flags=re.IGNORECASE)

    if content != orig_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed images in: {file_path.name}")

def main():
    skip_dirs = {"_backup", "_dev_archives", "_legacy", "node_modules", "venv", ".git", "_archive"}
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for file in files:
            if file.endswith(".html"):
                process_file(Path(root) / file)

if __name__ == "__main__":
    main()
