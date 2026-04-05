import os
import json
from bs4 import BeautifulSoup
from collections import defaultdict

PROJECT_ROOT = r"c:\Users\tourg\Desktop\SANTIS_SITE\admin"
OUTPUT_HTML = r"c:\Users\tourg\Desktop\SANTIS_SITE\admin\reports\admin_panel_visual_report.html"

HTML_EXTENSIONS = [".html", ".htm"]
JS_EXTENSIONS = [".js"]

def scan_html_file(file_path):
    found_panels = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")
        
        # Look for div/section with id/data-panel or class containing 'panel'
        for el in soup.find_all(True):
            is_panel = False
            classes = el.get("class", [])
            if "panel" in " ".join(classes).lower():
                is_panel = True
            if el.name in ["section", "main", "aside"] and el.get("id"):
                is_panel = True
                
            if is_panel:
                name = el.get("id") or el.get("data-panel") or ("unnamed-panel-" + el.name)
                rel_path = os.path.relpath(file_path, PROJECT_ROOT).replace("\\", "/")
                found_panels.append({
                    "name": name,
                    "file": rel_path,
                    "type": "html"
                })
    except Exception as e:
        pass
    return found_panels

def scan_js_file(file_path):
    found_panels = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if "class=" in line_lower and "panel" in line_lower:
                # Extract class if possible or just log it
                name = f"js-injected-panel-line{i+1}"
                rel_path = os.path.relpath(file_path, PROJECT_ROOT).replace("\\", "/")
                found_panels.append({
                    "name": name,
                    "file": rel_path,
                    "type": "js"
                })
    except:
        pass
    return found_panels

def walk_project(root):
    all_panels = []
    for dirpath, dirnames, filenames in os.walk(root):
        if "node_modules" in dirpath or "dist" in dirpath:
            continue
            
        for file in filenames:
            path = os.path.join(dirpath, file)
            ext = os.path.splitext(file)[1].lower()
            if ext in HTML_EXTENSIONS:
                all_panels.extend(scan_html_file(path))
            elif ext in JS_EXTENSIONS:
                all_panels.extend(scan_js_file(path))
    return all_panels

def generate_html(groups, total_panels):
    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>SANTIS MASTER OS - Panel Visual Audit</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        body {{ font-family: 'Inter', sans-serif; background-color: #050505; color: #e5e5e5; }}
        .header-glow {{ text-shadow: 0 0 20px rgba(212, 175, 55, 0.4); }}
        .row-duplicate {{ border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05); }}
        .row-zombie {{ border-left: 4px solid #6b7280; background: rgba(107, 114, 128, 0.05); opacity: 0.7; }}
        .row-healthy {{ border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.05); }}
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold mb-2 text-[#D4AF37] header-glow">SANTIS MASTER SYSTEM</h1>
                <h2 class="text-xl text-gray-400 m-0">Admin Panel Visual Audit Report</h2>
            </div>
            <div class="flex gap-3">
                <button onclick="window.history.back()" class="px-5 py-2.5 bg-gray-900 border border-gray-700 hover:bg-gray-800 hover:border-[#D4AF37] text-gray-300 rounded-lg text-sm font-semibold transition-all shadow-lg hover:text-[#D4AF37]">← Geri Dön</button>
                <button onclick="window.history.forward()" class="px-5 py-2.5 bg-gray-900 border border-gray-700 hover:bg-gray-800 hover:border-[#D4AF37] text-gray-300 rounded-lg text-sm font-semibold transition-all shadow-lg hover:text-[#D4AF37]">İleri Git →</button>
            </div>
        </div>
        
        <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="bg-gray-900 border border-gray-800 p-6 rounded-lg text-center">
                <div class="text-4xl font-black text-gray-200">{total_panels}</div>
                <div class="text-sm tracking-widest text-gray-500 mt-2 uppercase">Total Panels Discovered</div>
            </div>
            <div class="bg-gray-900 border border-gray-800 p-6 rounded-lg text-center">
                <div class="text-4xl font-black text-red-500">{sum(1 for g in groups.values() if len(g) > 1)}</div>
                <div class="text-sm tracking-widest text-gray-500 mt-2 uppercase">Duplicate Entities</div>
            </div>
            <div class="bg-gray-900 border border-gray-800 p-6 rounded-lg text-center">
                <div class="text-4xl font-black text-emerald-500">{sum(1 for g in groups.values() if len(g) == 1 and "unnamed" not in g[0]['name'].lower())}</div>
                <div class="text-sm tracking-widest text-gray-500 mt-2 uppercase">Healthy Unique Panels</div>
            </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm">
                <thead class="bg-black/50 border-b border-gray-800 text-gray-400 uppercase tracking-wider text-xs">
                    <tr>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Panel Identifier</th>
                        <th class="px-6 py-4">Instances</th>
                        <th class="px-6 py-4">Locations (Files)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/50">
"""
    
    for name, files in sorted(groups.items(), key=lambda x: len(x[1]), reverse=True):
        instances = len(files)
        # Determine status
        is_zombie = "unnamed" in name.lower() or "zombie" in name.lower()
        if is_zombie:
            row_class = "row-zombie"
            status = '<span class="px-2 py-1 text-[10px] font-bold uppercase rounded bg-gray-800 text-gray-400">Zombie</span>'
        elif instances > 1:
            row_class = "row-duplicate"
            status = '<span class="px-2 py-1 text-[10px] font-bold uppercase rounded bg-red-900/50 text-red-400">Duplicate</span>'
        else:
            row_class = "row-healthy"
            status = '<span class="px-2 py-1 text-[10px] font-bold uppercase rounded bg-emerald-900/50 text-emerald-400">Healthy</span>'

        file_list = "<br>".join([f'<span class="text-gray-500">{f["type"].upper()}:</span> <a href="/{f["file"]}" target="_blank" class="hover:text-santis-gold underline hover:underline-offset-2 transition-colors">{f["file"]}</a>' for f in files])
        
        html += f"""
                    <tr class="{row_class} hover:bg-gray-800/20 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap">{status}</td>
                        <td class="px-6 py-4 font-mono text-gray-300">{name}</td>
                        <td class="px-6 py-4"><span class="font-bold text-gray-200">{instances}</span></td>
                        <td class="px-6 py-4 font-mono text-xs">{file_list}</td>
                    </tr>
"""
    
    html += """
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Sovereign Admin Navigation (Back + Breadcrumb + Quick Jump) -->
    <script src="/admin/assets/js/admin-nav.js" defer></script>
</body>
</html>
"""
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    panels = walk_project(PROJECT_ROOT)
    
    grouped = defaultdict(list)
    for p in panels:
        grouped[p["name"]].append(p)
        
    generate_html(grouped, len(panels))
    print(f"Generated visual report at: {OUTPUT_HTML}")
