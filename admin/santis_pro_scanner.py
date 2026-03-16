import os
import re
import json
import datetime
from collections import deque
from bs4 import BeautifulSoup

ROOT_DIR = r"c:\Users\tourg\Desktop\SANTIS_SITE"
EXCLUDE_DIRS = {'.git', 'node_modules', '_dev_archives', '_deploy_stage', '_legacy_archive', '_legacy_content', 'gravity-ux-engine', '.gemini', 'temp', 'tmp', '_backup', '_archive', 'venv', 'components'}

all_pages = []
all_links = set()
navbar_links = set()
page_details = {}

print("1. Scanning directory...")
for root, dirs, files in os.walk(ROOT_DIR):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith('.html') or file.endswith('.htm'):
            full_path = os.path.join(root, file)
            rel_path = '/' + os.path.relpath(full_path, ROOT_DIR).replace('\\', '/')
            all_pages.append(rel_path)

graph_edges = []
nodes_data = []

def normalize_link(href, current_page):
    href = href.split('#')[0].split('?')[0]
    if not href or href.startswith('http') or href.startswith('mailto:') or href.startswith('tel:'):
        return None
    
    if not href.startswith('/'):
        if current_page != '/':
            href = os.path.dirname(current_page).replace('\\', '/') + '/' + href
        else:
            href = '/' + href
            
    parts = []
    for p in href.split('/'):
        if p == '..':
            if parts: parts.pop()
        elif p != '.' and p != '':
            parts.append(p)
    href = '/' + '/'.join(parts)
    
    if href.endswith('/'):
        href += 'index.html'
    elif not href.endswith('.html') and not href.endswith('.htm'):
        href += '/index.html'
    return href

print("2. Parsing HTML files for PRO analysis...")
for page in all_pages:
    full_path = os.path.join(ROOT_DIR, page.lstrip('/'))
    title = "Unknown"
    desc = ""
    h1 = False
    outgoing_links = set()
    
    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f, "html.parser")
            
            t_tag = soup.find('title')
            if t_tag and t_tag.string: title = t_tag.string.strip()
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc: desc = meta_desc.get('content', '')
            
            h1 = soup.find('h1') is not None
            
            for a in soup.find_all("a"):
                href = a.get("href")
                if href:
                    normalized = normalize_link(href, page)
                    if normalized:
                        all_links.add(normalized)
                        outgoing_links.add(normalized)
                        graph_edges.append({"source": page, "target": normalized})
                        
    except Exception as e:
        pass
        
    seo_score = 40
    if title and title != "Unknown": seo_score += 20
    if desc: seo_score += 20
    if h1: seo_score += 20
    
    group = page.split('/')[1] if len(page.split('/')) > 2 else 'root'
    
    nodes_data.append({
        "id": page,
        "title": f"{title} (SEO: {seo_score})",
        "label": page.split('/')[-1] or page,
        "group": group,
        "seo_score": seo_score
    })
    
    page_details[page] = {
        "title": title,
        "outgoing": list(outgoing_links)
    }

print("3. Calculating Link Depths and SEO Orphans...")
depth_map = {p: -1 for p in all_pages}
queue = deque()
starts = ['/tr/index.html', '/en/index.html', '/index.html', '/de/index.html', '/fr/index.html', '/ar/index.html']

for s in starts:
    if s in page_details:
        depth_map[s] = 0
        queue.append(s)

while queue:
    current = queue.popleft()
    current_depth = depth_map[current]
    
    for neighbor in page_details.get(current, {}).get("outgoing", []):
        if neighbor in depth_map and depth_map[neighbor] == -1:
            depth_map[neighbor] = current_depth + 1
            queue.append(neighbor)

seo_orphans = [p for p, d in depth_map.items() if d == -1 and not p.startswith('/admin') and 'components' not in p]
broken_links = [link for link in all_links if link not in page_details and not link.startswith('http') and not link.startswith('//')]

print("4. Generating sitemap.xml...")
sitemap_path = os.path.join(ROOT_DIR, "sitemap.xml")
with open(sitemap_path, "w", encoding="utf-8") as sm:
    sm.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    sm.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for page, depth in depth_map.items():
        if depth != -1 and not page.startswith('/admin') and 'components' not in page:
            priority = max(0.1, 1.0 - (depth * 0.1))
            loc_url = f"https://santis.club{page.replace('index.html','')}"
            sm.write(f'  <url>\n    <loc>{loc_url}</loc>\n')
            sm.write(f'    <lastmod>{datetime.datetime.now().strftime("%Y-%m-%d")}</lastmod>\n')
            sm.write(f'    <priority>{priority:.1f}</priority>\n  </url>\n')
    sm.write('</urlset>')

print("5. Building Visual Architecture Graph...")
graph_html_path = os.path.join(ROOT_DIR, "admin", "reports", "SANTIS_SITE_GRAPH_VISUAL.html")

nodes_json = json.dumps([{"id": n["id"], "label": n["label"], "title": n["title"], "group": n["group"]} for n in nodes_data])
edges_json = json.dumps([{"from": e["source"], "to": e["target"], "color": {"opacity": 0.3}} for e in graph_edges if e["target"] in page_details])

html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Santis Master OS - PRO Architecture Graph</title>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        body {{ margin: 0; background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif; overflow: hidden; }}
        #mynetwork {{ width: 100vw; height: 100vh; }}
        #panel {{ position: absolute; top: 20px; left: 20px; background: rgba(15,23,42,0.9); padding: 25px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); z-index: 10; font-size: 14px; pointer-events: none; }}
        h1 {{ margin: 0 0 15px 0; font-size: 18px; color: #38bdf8; letter-spacing: 0.5px; text-transform: uppercase; }}
        .stat {{ display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #1e293b; padding-bottom: 4px; width: 200px; }}
        .stat span.val {{ font-weight: bold; color: #e2e8f0; }}
        .brand {{ margin-top: 20px; font-size: 10px; color: #64748b; text-align: center; text-transform: uppercase; letter-spacing: 1px; }}
    </style>
</head>
<body>
    <div id="panel">
        <h1>Sovereign Hub</h1>
        <div class="stat"><span>Nodes</span><span class="val">{len(nodes_data)}</span></div>
        <div class="stat"><span>Edges</span><span class="val">{len(graph_edges)}</span></div>
        <div class="stat"><span>SEO Orphans</span><span class="val">{len(seo_orphans)}</span></div>
        <div class="brand">Santis Master OS</div>
    </div>
    <div id="mynetwork"></div>
    <script>
        var nodes = new vis.DataSet({nodes_json});
        var edges = new vis.DataSet({edges_json});
        var container = document.getElementById('mynetwork');
        var data = {{ nodes: nodes, edges: edges }};
        var options = {{
            nodes: {{ shape: 'dot', size: 8, font: {{ color: '#cbd5e1', size: 10, face: 'Inter' }}, borderWidth: 1, borderColor: '#334155' }},
            edges: {{ arrows: {{ to: {{ enabled: true, scaleFactor: 0.3 }} }}, smooth: {{ type: 'continuous' }} }},
            physics: {{ forceAtlas2Based: {{ gravitationalConstant: -35, centralGravity: 0.005, springLength: 200, springConstant: 0.05 }}, maxVelocity: 50, solver: 'forceAtlas2Based', timestep: 0.35, stabilization: {{ iterations: 200 }} }},
            groups: {{
                'admin': {{ color: {{ background: '#ef4444', border: '#b91c1c' }} }},
                'tr': {{ color: {{ background: '#3b82f6', border: '#1d4ed8' }} }},
                'en': {{ color: {{ background: '#10b981', border: '#047857' }} }},
                'root': {{ color: {{ background: '#f59e0b', border: '#b45309' }}, size: 15 }}
            }}
        }};
        var network = new vis.Network(container, data, options);
    </script>
</body>
</html>
"""

with open(graph_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("6. Writing final markdown report...")
report_path = os.path.join(ROOT_DIR, "admin", "reports", "SANTIS_PRO_AUDIT.md")
with open(report_path, "w", encoding="utf-8") as f:
    f.write("# 🦅 SANTIS OMNIVERSE PRO CRAWLER AUDIT\n\n")
    f.write(f"- **Total Nodes Mapped (Pages):** {len(nodes_data)}\n")
    f.write(f"- **Total Edges (Links):** {len(graph_edges)}\n")
    f.write(f"- **SEO Orphan Pages (No inbound link from root BFS):** {len(seo_orphans)}\n")
    f.write(f"- **Broken Links (Excluding external):** {len(broken_links)}\n\n")
    
    f.write("## 🕸️ Visual Architecure Graph\n")
    f.write("A fully interactive 3D physics node graph has been generated at:\n")
    f.write("`[SANTIS_SITE_GRAPH_VISUAL.html](file:///c:/Users/tourg/Desktop/SANTIS_SITE/admin/reports/SANTIS_SITE_GRAPH_VISUAL.html)` (CTRL+Click in VS Code to open)\n\n")
    
    f.write("## 🗺️ Sitemap.xml Generated\n")
    f.write("A production-ready `sitemap.xml` has been created in the root directory. Link priority is calculated dynamically based on BFS link depth distance from the index files.\n\n")
    
    f.write("## ⚠️ SEO Orphans Sample\n")
    for o in seo_orphans[:30]:
        f.write(f"- `{o}`\n")
        
    f.write("\n## ❌ Broken Links Sample\n")
    for b in broken_links[:30]:
        f.write(f"- `{b}`\n")

print("PRO SCANNER COMPLETE. Reports and Graph constructed.")
