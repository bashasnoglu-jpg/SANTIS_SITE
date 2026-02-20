import os
from pathlib import Path
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import time

def generate_sitemap(base_url="https://santisclub.com", root_dir="."):
    root_path = Path(root_dir).resolve()
    html_files = []

    # Exclude directories
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests"}
    exclude_files = {"404.html", "google123.html", "booking.html"} # Add known non-indexable files here

    print(f"Bölge taranıyor: {root_path}")

    # Explicitly find HTML files
    for root, dirs, files in os.walk(root_path):
        # Modify dirs in-place to exclude unwanted directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]

        for filename in files:
            if filename.endswith(".html") and filename not in exclude_files:
                full_path = Path(root) / filename
                rel_parts = full_path.relative_to(root_path).parts
                
                # Exclude if it's in a hidden directory just in case
                if any(p.startswith('.') for p in rel_parts):
                    continue
                    
                # Exclude backup or old files
                if "_old" in filename.lower() or "bak" in filename.lower():
                    continue
                    
                html_files.append(full_path)

    print(f"Toplam {len(html_files)} HTML dosyası bulundu.")

    # Create root element with namespace
    ET.register_namespace('', "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset = ET.Element("{http://www.sitemaps.org/schemas/sitemap/0.9}urlset")

    today = time.strftime("%Y-%m-%d")

    for file_path in html_files:
        try:
            rel_path = file_path.relative_to(root_path)
            
            # Convert Windows path to URL path format (forward slashes)
            url_path = "/".join(rel_path.parts)
            
            # Basic URL construction
            if url_path == "index.html":
                page_url = base_url + "/"
                priority = "1.0"
                changefreq = "daily"
            else:
                page_url = f"{base_url}/{url_path}"
                priority = "0.8"
                changefreq = "weekly"
                
                # Adjust priority and changefreq based on directory logic
                parts = rel_path.parts
                if "blog" in parts:
                    changefreq = "monthly"
                    priority = "0.6"
                elif set(parts) & {"massages", "masajlar", "hammam", "hamam", "services", "hizmetler", "cilt-bakimi"}:
                    priority = "0.9"

            # Build XML elements
            url_elem = ET.SubElement(urlset, "url")
            
            loc = ET.SubElement(url_elem, "loc")
            loc.text = page_url
            
            lastmod = ET.SubElement(url_elem, "lastmod")
            lastmod.text = today
            
            cf = ET.SubElement(url_elem, "changefreq")
            cf.text = changefreq
            
            pri = ET.SubElement(url_elem, "priority")
            pri.text = priority

        except ValueError as e:
            print(f"Yol hesaplama hatası ({file_path}): {e}")

    # Generate pretty XML string using minidom
    xml_str = ET.tostring(urlset, encoding='utf-8')
    parsed_xml = minidom.parseString(xml_str)
    pretty_xml = parsed_xml.toprettyxml(indent="  ")
    
    # minidom adds an extra XML declaration if we aren't careful, but toprettyxml handles it.
    # However we might want to ensure the exact format.
    # It usually outputs <?xml version="1.0" ?> - let's replace it with the standard one
    if pretty_xml.startswith('<?xml version="1.0" ?>'):
        pretty_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + pretty_xml[len('<?xml version="1.0" ?>'):].lstrip()

    # Write to sitemap.xml
    sitemap_path = root_path / "sitemap.xml"
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(pretty_xml)
        
    print(f"Sitemap başarıyla oluşturuldu: {sitemap_path} ({len(html_files)} URL)")

if __name__ == "__main__":
    generate_sitemap()
