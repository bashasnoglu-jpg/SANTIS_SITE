import codecs
import re

file_path = r"C:\Users\tourg\Desktop\SANTIS_SITE\hq-dashboard\index.html"

try:
    with codecs.open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
except UnicodeDecodeError:
    with codecs.open(file_path, "r", encoding="utf-16") as f:
        content = f.read()

# 1. Translate texts
content = content.replace("Total Live Tenants", "Aktif Operasyon Düğümleri")
content = content.replace("Global Revenue (Today)", "Küresel Konsolide Ciro (24s)")
content = content.replace("Predictive Staffing", "Analitik Personel Projeksiyonu")
content = content.replace("Deploy Mr. Wick", "Elit Protokolü Devreye Al")
content = content.replace("Deploy Node", "Sistem Düğümü Konumlandır")

# 2. Inject CSS string into <head>
css_link = '<link rel="stylesheet" href="/hq-dashboard/css/hq-cyber-luxury.css">\n'
if css_link not in content:
    content = content.replace('</head>', f'    {css_link}</head>')

# 3. Add <script type="module" src="/hq-dashboard/js/main.js"></script> before </body>
mod_script = '<script type="module" src="/hq-dashboard/js/main.js"></script>\n'
if mod_script not in content:
    content = content.replace('</body>', f'{mod_script}</body>')

# 4. Strip old monolithic script blocks from the backend integration.
scripts = re.findall(r'<script.*?>.*?</script>', content, flags=re.DOTALL)
for s in scripts:
    if 'src=' not in s and 'Turf.js' not in s and 'Chart.js' not in s:
        content = content.replace(s, '')

with codecs.open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
