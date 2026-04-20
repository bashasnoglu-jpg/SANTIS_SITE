import os
import sys
import time
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
from pathlib import Path

# Fix the import path for DeepAudit Engine logic if we were importing, 
# but it's easier to just do a clean fast local crawler here to read files from disk 
# and parse their hrefs instead of starting an HTTP server or relying on deep_audit.py which uses requests.

def is_internal(url, base_url):
    return url.startswith(base_url) or url.startswith("/") or not url.startswith("http")

def crawl_and_generate_sitemap(root_dir=".", base_url="https://santisclub.com"):
    # Target files to start crawler
    start_urls = ['index.html']
    visited = set()
    queue = deque(start_urls)
    
    html_files_in_sitemap = []
    
    print(f"Lokal crawler başlatılıyor: {root_dir}")
    
    while queue:
        current = queue.popleft()
        
        # Normalize paths
        current = current.split("#")[0] # remove fragments
        current = current.split("?")[0] # remove query strings
        
        if not current.endswith(".html"):
            if current.endswith("/"):
                current += "index.html"
            elif not "." in current.split("/")[-1]:
                current += "/index.html"
                
        if current in visited:
            continue
            
        visited.add(current)
        
        # Local file path
        local_path = os.path.join(root_dir, current)
        
        # Security/sanity check
        if not os.path.exists(local_path) or not os.path.isfile(local_path):
            continue
            
        html_files_in_sitemap.append(current)
            
        try:
            with open(local_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            soup = BeautifulSoup(content, "html.parser")
            
            for a in soup.find_all("a", href=True):
                href = a["href"]
                
                # Check if it's a valid internal link
                if is_internal(href, base_url) and not href.startswith("tel:") and not href.startswith("mailto:"):
                    # Resolve relative to current directory
                    # Example: current is "en/services/index.html", href is "detail.html" -> "en/services/detail.html"
                    
                    parsed_href = urlparse(href).path.lstrip("/")
                    
                    if href.startswith("/"):
                        resolved_path = parsed_href
                    else:
                        # Join relatively
                        current_dir = os.path.dirname(current)
                        if current_dir:
                            resolved_path = os.path.normpath(os.path.join(current_dir, parsed_href)).replace("\\", "/")
                        else:
                            resolved_path = parsed_href
                            
                    if resolved_path not in visited:
                        queue.append(resolved_path)
                        
        except Exception as e:
            print(f"Hata okunurken {local_path}: {e}")

    # Generate XML
    print(f"Taranan geçerli HTML bağlantı ağı: {len(html_files_in_sitemap)}")
    
    today = time.strftime("%Y-%m-%d")
    sitemap_path = os.path.join(root_dir, "sitemap.xml")
    
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        
        # Ensure we always have root domain 
        f.write('  <url>\n')
        f.write(f'    <loc>{base_url}/</loc>\n')
        f.write(f'    <lastmod>{today}</lastmod>\n')
        f.write('    <changefreq>daily</changefreq>\n')
        f.write('    <priority>1.0</priority>\n')
        f.write('  </url>\n')

        for item in html_files_in_sitemap:
            if item == "index.html":
                continue # Already added
                
            url_path = item
            page_url = f"{base_url}/{url_path}"
            
            # Simple priority logic
            priority = "0.8"
            changefreq = "weekly"
            
            if "blog" in item.split("/"):
                priority = "0.6"
                changefreq = "monthly"
            elif any(kw in item for kw in ["hamam", "massages", "masajlar", "cilt-bakimi", "services", "hizmetler"]):
                priority = "0.9"
                
            f.write('  <url>\n')
            f.write(f'    <loc>{page_url}</loc>\n')
            f.write(f'    <lastmod>{today}</lastmod>\n')
            f.write(f'    <changefreq>{changefreq}</changefreq>\n')
            f.write(f'    <priority>{priority}</priority>\n')
            f.write('  </url>\n')
            
        f.write('</urlset>')
        
    print(f"Sitemap başarıyla oluşturuldu: {sitemap_path}")

if __name__ == "__main__":
    import os
    # Default to current dir or first arg
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    crawl_and_generate_sitemap(root_dir=root)
