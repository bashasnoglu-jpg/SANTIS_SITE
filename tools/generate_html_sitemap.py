import os
from pathlib import Path
import xml.etree.ElementTree as ET

def generate_html_sitemap_full():
    root_dir = Path(".")
    
    # 1. Gather ALL HTML files matching criteria 
    exclude_dirs = {".git", "node_modules", "tools", "_tools", "logs", "reports", "core", "test", "tests", "_deploy_stage", "_build", "_backup", "assets", "data", "admin"}
    exclude_files = {"404.html", "google123.html", "booking.html"} 
    
    html_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Modify dirnames in-place
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.')]
        
        for filename in filenames:
            if filename.endswith(".html") and filename not in exclude_files:
                full_path = Path(dirpath) / filename
                rel_parts = full_path.relative_to(root_dir).parts
                
                if any(p.startswith('.') for p in rel_parts): continue
                if "_old" in filename.lower() or "bak" in filename.lower(): continue
                
                # Convert path
                url_path = "/".join(rel_parts)
                html_files.append(url_path)
                
    print(f"Toplam geçerli HTML dosyası (Disk Taraması): {len(html_files)}")
            
    # Group URLs by language and category
    groups = {}
    for path in html_files:
        parts = path.split("/")
        lang = parts[0] if parts[0] in ["tr", "en", "de", "ru", "fr"] else "tr"
        
        category = "Genel Sayfalar"
        if len(parts) > 1:
            if "mas" in parts[1] or "mass" in parts[1]: category = "Masajlar"
            elif "hamm" in parts[1] or "hamam" in parts[1]: category = "Hamam Ritüelleri"
            elif "cilt" in parts[1] or "skin" in parts[1] or "soins" in parts[1] or "haut" in parts[1]: category = "Cilt Bakımı"
            elif "hizm" in parts[1] or "serv" in parts[1]: category = "Özel Hizmetler"
            elif "blog" in parts[1] or "bilgelik" in parts[1]: category = "Medya & Bilgelik"
        
        if path == "index.html" or len(parts) == 2 and parts[1] == "index.html":
            category = "Ana Merkez"
            
        if lang not in groups:
            groups[lang] = {}
        if category not in groups[lang]:
            groups[lang][category] = []
            
        groups[lang][category].append(path)
        
    # Generate HTML content
    html_content = """<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Haritası | Santis Club</title>
    <meta name="description" content="Santis Club tüm sayfalar, hizmetler ve masaj ritüelleri dizini. Ulaşılabilir Orphan Pages.">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/editorial.css?v=8.1">
    <style>
        .sitemap-container { max-width: 1200px; margin: 120px auto; padding: 20px; color: #fff; }
        .sitemap-title { font-size: 2rem; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
        .sitemap-desc { color: #888; margin-bottom: 40px; font-size: 0.9rem; }
        .lang-section { margin-bottom: 50px; }
        .lang-title { color: #d4af37; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
        .category-card { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .category-title { font-size: 1.2rem; margin-bottom: 15px; color: #aaa; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px; }
        .link-list { list-style: none; padding: 0; margin: 0; }
        .link-list li { margin-bottom: 8px; }
        .link-list a { color: #fff; text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
        .link-list a:hover { color: #d4af37; }
    </style>
</head>
<body class="editorial-mode bg-dark">
    <!-- NAVBAR -->
    <div id="navbar-container" style="position:fixed; width:100%; top:0; z-index:99;"></div>
    
    <main class="sitemap-container">
        <h1 class="sitemap-title">Tüm Hizmetlerimiz (Site Dizinimiz)</h1>
        <p class="sitemap-desc">Santis Club'ın sunduğu tüm lüks deneyimlerin ve diller arası geçişlerin tam listesi.</p>
"""
    
    for lang, categories in sorted(groups.items()):
        html_content += f'\n        <section class="lang-section">\n'
        html_content += f'            <h2 class="lang-title">{lang.upper()} SAYFALARI</h2>\n'
        html_content += f'            <div class="category-grid">\n'
        
        for category, paths in sorted(categories.items()):
            html_content += f'                <div class="category-card">\n'
            html_content += f'                    <h3 class="category-title">{category} ({len(paths)})</h3>\n'
            html_content += f'                    <ul class="link-list">\n'
            
            for path in sorted(paths):
                # Format name nicely
                name = path.split("/")[-1].replace(".html", "").replace("-", " ").title()
                if name == "Index": name = "Kategori Ana Sayfası"
                
                html_content += f'                        <li><a href="/{path}">{name}</a></li>\n'
                
            html_content += f'                    </ul>\n'
            html_content += f'                </div>\n'
            
        html_content += f'            </div>\n'
        html_content += f'        </section>\n'

    html_content += """
    </main>
    
    <!-- FOOTER -->
    <div id="footer-container" style="position:relative; z-index:10; background:#0b0d11;"></div>

    <script src="/assets/js/fallback_data.js"></script>
    <script src="/assets/js/loaders/data-bridge.js?v=8.1"></script>
    <script src="/assets/js/santis-nav.js" defer></script>
    <script src="/assets/js/loader.js" defer></script>
</body>
</html>
"""
    
    # Write to target
    target_path = root_dir / "site-haritasi.html"
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"✅ Bütünsel HTML Site Haritası oluşturuldu: {target_path}")
    print(f"Böylece {len(html_files)} sayfa ('Orphan'lar dahil) Footer üzerinden indexlenebilir ve gezilebilir hale geldi.")
    
    # Ayrıca xml sitemap oluşturmak için diske kaydet
    
    ET.register_namespace('', "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset = ET.Element("{http://www.sitemaps.org/schemas/sitemap/0.9}urlset")
    
    import time
    today = time.strftime("%Y-%m-%d")
    base_url = "https://santisclub.com"
    
    for file_path in html_files:
        url_elem = ET.SubElement(urlset, "url")
        loc = ET.SubElement(url_elem, "loc")
        loc.text = f"{base_url}/{file_path}"
        lastmod = ET.SubElement(url_elem, "lastmod")
        lastmod.text = today
        cf = ET.SubElement(url_elem, "changefreq")
        cf.text = "weekly"
        pri = ET.SubElement(url_elem, "priority")
        pri.text = "0.8"
        
    xml_str = ET.tostring(urlset, encoding='utf-8', xml_declaration=True)
    xml_path = root_dir / "sitemap.xml"
    with open(xml_path, "wb") as f:
        f.write(xml_str)
        
    print(f"✅ Bütünsel XML Sitemap (347+ URL) başarıyla sitemap.xml içerisine yazıldı.")

if __name__ == "__main__":
    generate_html_sitemap_full()
