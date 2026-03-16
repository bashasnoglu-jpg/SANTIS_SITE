import os
import json
import re
from bs4 import BeautifulSoup
from datetime import datetime

# =========================
# Configuration
# =========================
PROJECT_ROOT = "admin"
HTML_EXTENSIONS = [".html", ".htm"]
JS_EXTENSIONS = [".js"]
OUTPUT_FILE = "admin/reports/SANTIS_UI_SYSTEM_OPTIMIZATION_VISUAL.html"
ARCHIVE_DIR = "_archive"

# =========================
# Core Audit Logic
# =========================

def scan_html_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
    
    found_panels = []
    # Find all divs that look like panels
    # Looking for explicit panel classes, or ids that might be panels
    for div in soup.find_all("div", class_=re.compile(r'panel|card|widget', re.IGNORECASE)):
        name = div.get("id") or "unnamed-panel"
        
        # skip generic unnamed wrappers if they have no clear structural identity
        if name == "unnamed-panel" and not div.get('class'):
            continue
            
        found_panels.append({
            "name": name,
            "file": file_path,
            "type": "html",
            "linked_js": []
        })
    
    # Also grab main IDs that represent core layouts
    for section in soup.find_all(['main', 'aside', 'section']):
        if section.get('id'):
            found_panels.append({
                "name": section.get('id'),
                "file": file_path,
                "type": "html_layout",
                "linked_js": []
            })
            
    return found_panels

def scan_js_file(file_path):
    found_funcs = []
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        lines = content.split('\n')
        
    for i, line in enumerate(lines):
        # Find function declarations or DOM queries
        func_match = re.search(r'(function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s*)?function|const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>)', line)
        dom_match = re.search(r'getElementById\([\'"]([^\'"]+)[\'"]\)', line)
        
        if func_match:
            # Extract the actual function name based on which group matched
            name = next((g for g in func_match.groups()[1:] if g and not g.startswith('async')), f"anonymous-fn-line-{i}")
            found_funcs.append({
                "name": name,
                "file": file_path,
                "type": "js_logic",
                "linked_ui": []
            })
            
        if dom_match:
            dom_id = dom_match.group(1)
            found_funcs.append({
                "name": f"DOM_BIND:{dom_id}",
                "file": file_path,
                "type": "js_binding",
                "linked_ui": [dom_id]
            })
            
    return found_funcs

def walk_project():
    all_modules = []
    for root, _, files in os.walk(PROJECT_ROOT):
        # Skip archives
        if ARCHIVE_DIR in root:
            continue
            
        for file in files:
            path = os.path.join(root, file)
            path = path.replace('\\', '/')
            ext = os.path.splitext(file)[1].lower()
            
            try:
                if ext in HTML_EXTENSIONS:
                    all_modules.extend(scan_html_file(path))
                elif ext in JS_EXTENSIONS:
                    all_modules.extend(scan_js_file(path))
            except Exception as e:
                print(f"Skipping {path}: {e}")
                
    return all_modules

def analyze_relationships(modules):
    html_nodes = [m for m in modules if m['type'].startswith('html')]
    js_nodes = [m for m in modules if m['type'].startswith('js')]
    
    # Map DOM bindings directly to HTML elements
    for js in js_nodes:
        if js['type'] == 'js_binding':
            target_id = js['linked_ui'][0]
            # Find the html node with this ID
            for html in html_nodes:
                if html['name'] == target_id:
                    html['linked_js'].append(f"{js['file']} (Bind)")
                    
    # Look for duplicate HTML panels (same ID mapped to multiple files)
    seen_html = {}
    duplicates = []
    for h in html_nodes:
        if h['name'] != 'unnamed-panel':
            if h['name'] in seen_html:
                seen_html[h['name']].append(h['file'])
            else:
                seen_html[h['name']] = [h['file']]
                
    for name, files in seen_html.items():
        if len(files) > 1:
            duplicates.append({"name": name, "files": list(set(files))})
            
    # Look for zombie JS logic (functions that are never called inside other JS or referenced in HTML onklicks etc)
    # This is a simplified check: we just see if the function name exists in ANY other file
    # We'll skip this heavy text search for now and just categorize based on bindings
    
    zombies = [j for j in js_nodes if j['type'] == 'js_logic' and not j['linked_ui']]
    
    return html_nodes, js_nodes, duplicates, zombies

# =========================
# HTML Visualizer Generator
# =========================
def generate_html_report(html_nodes, js_nodes, duplicates, zombies):
    
    # Process dupes for table
    dupe_rows = ""
    for d in duplicates:
        files_html = "<br>".join([f"<span class='text-xs text-gray-400 font-mono'>{f}</span>" for f in d['files']])
        dupe_rows += f"""
        <tr class="border-b border-red-900/30 hover:bg-red-900/10 transition">
            <td class="p-4"><span class="px-2 py-1 bg-red-900/40 text-red-400 rounded text-xs font-mono font-bold">{d['name']}</span></td>
            <td class="p-4">{files_html}</td>
            <td class="p-4 text-xs text-red-400">Conflict / Overlap Risk</td>
        </tr>
        """
        
    # Process healthy nodes
    healthy_rows = ""
    # Just show a sample of healthy ones to not crash the dom
    sample_healthy = [h for h in html_nodes if h['linked_js']][:20]
    for h in sample_healthy:
        links = "<br>".join([f"<span class='text-green-500'>←</span> <span class='text-xs text-gray-400 font-mono'>{l}</span>" for l in set(h['linked_js'])])
        healthy_rows += f"""
        <tr class="border-b border-gray-800 hover:bg-gray-800/50 transition">
            <td class="p-4"><span class="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs font-mono">{h['name']}</span></td>
            <td class="p-4 text-gray-300 text-sm">{h['file']}</td>
            <td class="p-4">{links if links else '<span class="text-gray-600 text-xs italic">Static Mode</span>'}</td>
        </tr>
        """
        
    date_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    html = f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Santis Visual Audit | UI & System Optimization</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{ extends: {{ colors: {{ santis: {{ gold: '#D4AF37' }} }} }} }}
        }}
    </script>
    <style>
        body {{ background-color: #050505; color: #e5e7eb; }}
        .hud-glass {{ background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }}
    </style>
</head>
<body class="p-8">

    <header class="mb-10 flex justify-between items-end border-b border-gray-800 pb-6">
        <div>
            <h1 class="text-3xl font-light text-white tracking-widest mb-2">SANTIS <span class="text-santis-gold font-bold">VISUAL AUDIT</span></h1>
            <p class="text-sm text-gray-400 font-mono">UI & System Optimization Radar // {date_str}</p>
        </div>
        <div class="text-right">
            <div class="text-xs text-cyan-500 uppercase tracking-widest animate-pulse">Scanning Complete</div>
            <div class="text-[10px] text-gray-500 mt-1">Sovereign Architecture Tool</div>
        </div>
    </header>

    <div class="grid grid-cols-4 gap-6 mb-10">
        <div class="hud-glass p-6 rounded-xl border-l-4 border-blue-500">
            <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">HTML Nodes Scanned</div>
            <div class="text-4xl text-white font-light">{len(html_nodes)}</div>
        </div>
        <div class="hud-glass p-6 rounded-xl border-l-4 border-purple-500">
            <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">JS Logic / Binds</div>
            <div class="text-4xl text-white font-light">{len(js_nodes)}</div>
        </div>
        <div class="hud-glass p-6 rounded-xl border-l-4 border-red-500">
            <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Duplicate Panels</div>
            <div class="text-4xl text-red-400 font-light">{len(duplicates)}</div>
        </div>
        <div class="hud-glass p-6 rounded-xl border-l-4 border-gray-600">
            <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Unlinked JS Logic</div>
            <div class="text-4xl text-gray-400 font-light">{len(zombies)}</div>
        </div>
    </div>

    <div class="grid grid-cols-2 gap-8 mb-10">
        
        <!-- RED ZONE: DUPLICATES -->
        <section class="hud-glass rounded-xl overflow-hidden border border-red-900/30">
            <div class="bg-red-950/30 p-4 border-b border-red-900/30 flex justify-between items-center">
                <h3 class="text-red-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Duplicate Identity Overlaps (Red Zone)
                </h3>
            </div>
            
            <div class="max-h-96 overflow-y-auto w-full">
                <table class="w-full text-left">
                    <thead class="bg-black/50 text-gray-500 text-xs uppercase font-mono sticky top-0">
                        <tr>
                            <th class="p-3">Panel ID</th>
                            <th class="p-3">Found In Files</th>
                            <th class="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dupe_rows if dupe_rows else '<tr><td colspan="3" class="p-8 text-center text-gray-600 font-mono">No duplications detected. Network is pure.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- GREEN ZONE: HEALTHY BINDS -->
        <section class="hud-glass rounded-xl overflow-hidden border border-green-900/30">
            <div class="bg-green-950/20 p-4 border-b border-green-900/30 flex justify-between items-center">
                <h3 class="text-green-500 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    Healthy UI/JS Bindings (Sample)
                </h3>
            </div>
            <div class="max-h-96 overflow-y-auto w-full">
                <table class="w-full text-left">
                    <thead class="bg-black/50 text-gray-500 text-xs uppercase font-mono sticky top-0">
                        <tr>
                            <th class="p-3">DOM Node</th>
                            <th class="p-3">HTML Source</th>
                            <th class="p-3">JS Observer / Binder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {healthy_rows}
                    </tbody>
                </table>
            </div>
        </section>

    </div>

</body>
</html>
"""
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Generated visual report at: {OUTPUT_FILE}")


if __name__ == "__main__":
    print("Initiating Kuantum Radar...")
    modules = walk_project()
    print(f"Scanned {len(modules)} node primitives.")
    
    html_nodes, js_nodes, duplicates, zombies = analyze_relationships(modules)
    
    generate_html_report(html_nodes, js_nodes, duplicates, zombies)
    print("Radar sequence complete. Sovereign UI is standing by.")
