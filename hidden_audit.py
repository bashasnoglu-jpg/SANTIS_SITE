import os
import re
from collections import defaultdict, Counter

ADMIN_DIR = 'admin'
OUT_REPORT = 'admin/reports/SANTIS_HIDDEN_FEATURE_AUDIT.md'

EXCLUDE_LIBS = ['tailwindcss.min.js', 'vue.global.prod.js', 'chart.js', 'echarts.min.js', 'd3.v7.min.js', 'blurhash.js', 'santis-admin-nav.js']

all_js = []
all_html = []

for root, _, files in os.walk(ADMIN_DIR):
    if '_archive' in root: continue
    for f in files:
        path = os.path.join(root, f)
        if f.endswith('.js') and f not in EXCLUDE_LIBS:
            all_js.append(path)
        elif f.endswith('.html'):
            all_html.append(path)

defined_funcs = {}
api_calls = defaultdict(list)
word_counts = Counter()
html_scripts = set()
flags_found = []

# Regex patterns
fn_def_re = re.compile(r'(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(')
window_fn_re = re.compile(r'window\.([a-zA-Z0-9_$]+)\s*=\s*(?:async\s+)?(?:function|\()')
fetch_re = re.compile(r'(?:fetch|\$\.ajax)\([\'\"\`](.*?)[\'\"\`]')
flag_re = re.compile(r'(EXPERIMENTAL|BETA|DEV_ONLY|DEBUG|HIDDEN|TODO)', re.IGNORECASE)

for js in all_js:
    try:
        with open(js, 'r', encoding='utf-8') as f:
            content = f.read()
    except: continue
    
    words = re.findall(r'[a-zA-Z0-9_$]+', content)
    word_counts.update(words)
    
    for fn in fn_def_re.findall(content) + window_fn_re.findall(content):
        defined_funcs[fn] = js
        
    for api in fetch_re.findall(content):
        api_calls[api].append(js)
        
    for i, line in enumerate(content.split('\n')):
        if flag_re.search(line) and 'console.log' not in line:
            clean = line.strip()
            if len(clean) > 80: clean = clean[:77] + '...'
            flags_found.append({
                'file': js,
                'line': i + 1,
                'content': clean
            })

for html in all_html:
    try:
        with open(html, 'r', encoding='utf-8') as f:
            content = f.read()
    except: continue
    
    words = re.findall(r'[a-zA-Z0-9_$]+', content)
    word_counts.update(words)
    
    for s in re.findall(r'<script.*?src=["\'](.*?)["\']', content, re.IGNORECASE):
        bname = os.path.basename(s).split('?')[0]
        html_scripts.add(bname)

features = []

# 1. Unlinked JS Files (Zombie/Hidden Modules)
for js in all_js:
    bname = os.path.basename(js)
    if bname not in html_scripts and not bname.endswith('config.js') and 'module' not in bname.lower() and bname not in ['integrated_hub.js', 'vue-command-center.js', 'dashboard-logic.js', 'dashboard.js']:
        # Try to guess role
        role = "System Backend/Tool"
        if 'audit' in bname: role = "Audit / Forensic Tools"
        elif 'omni' in bname or 'darwin' in bname: role = "Omniverse Matrix (Dormant/Experimental)"
        elif 'city' in bname: role = "City Intelligence Layout"
        
        # Check if imported via ES6 module format
        if bname.replace('.js', '') in ','.join(html_scripts): continue 
        
        features.append({
            'name': f"Module: {bname}",
            'file': js,
            'desc': f'{role} - fully parsed but never injected into UI',
            'api': '-',
            'status': 'Zombie',
            'rec': 'Archive'
        })

# 2. Unused / Debug Functions
for fn, filepath in defined_funcs.items():
    if word_counts[fn] <= 1:
        if fn not in ['DOMContentLoaded', 'init', 'setup']:
            features.append({
                'name': f'Function: {fn}()',
                'file': filepath,
                'desc': 'Capability declared but logically detached (0 references)',
                'api': '-',
                'status': 'Zombie (Function)',
                'rec': 'Strip / Review'
            })
    elif any(k in fn.lower() for k in ['test', 'debug', 'experimental', 'mock', 'hidden']):
        features.append({
            'name': f'Routine: {fn}()',
            'file': filepath,
            'desc': 'Test / Debug trigger left active',
            'api': 'Local Only',
            'status': 'Hidden (Dev Toolkit)',
            'rec': 'Extract to dev tools'
        })

# 3. Features from Tags
for flag in flags_found:
    features.append({
        'name': 'Feature Flag / Trace',
        'file': f"{flag['file']}:{flag['line']}",
        'desc': flag['content'].replace('|', '-'),
        'api': '-',
        'status': 'Experimental Marker',
        'rec': 'Review logic flow'
    })

# Format Markdown
md = []
md.append("# SANTIS MASTER SYSTEM – ULTRA MEGA HIDDEN FEATURE AUDIT\n")
md.append("> **Objective:** Perform a deep cyber-forensic audit of the admin dashboard codebase to detect hidden layers, unlinked endpoints, experimental UX hooks, and zombie function signatures.\n")

md.append("## 1. Actionable Feature & Module Inventory\n")
md.append("| Feature Name | File Path | Function / Capability Description | Linked API | Hidden Status | Recommendation |")
md.append("|--------------|-----------|-----------------------------------|------------|---------------|----------------|")

def prio(status):
    if 'Zombie (Function)' in status: return 2
    if 'Zombie' in status: return 1
    if 'Experimental' in status: return 3
    if 'Dev' in status: return 4
    return 5

features.sort(key=lambda x: prio(x['status']))

for f in features:
    md.append(f"| {f['name']} | `{f['file'].replace(chr(92), '/')}` | {f['desc']} | `{f['api']}` | {f['status']} | {f['rec']} |")

md.append("\n## 2. Unexposed & Live Backend Mappings\n")
md.append("These backend network hooks were harvested from active and dormant modules:\n")
for api, files in sorted(api_calls.items()):
    source_scripts = sorted(list(set([os.path.basename(x) for x in files])))
    md.append(f"- **API:** `{api}` \n  - *Triggered by:* `" + '`, `'.join(source_scripts) + "`")

md.append("\n## 3. Sovereign System Metrics\n")
total_zombie_mods = sum(1 for f in features if f['status'] == 'Zombie')
total_unused_funcs = sum(1 for f in features if 'Zombie (Function)' in f['status'])
md.append(f"- **Total Zombie UI Modules Detached from Core:** {total_zombie_mods}")
md.append(f"- **Total Undocumented / Uncalled Functions:** {total_unused_funcs}")
md.append(f"- **Total Beta/Debug Dev Flags:** {len(flags_found)}")
md.append(f"- **Total Network API Telemetry Nodes:** {len(api_calls)}")

with open(OUT_REPORT, 'w', encoding='utf-8') as f:
    f.write('\\n'.join(md))

print(f"ULTRA MEGA AUDIT COMPLETED: {OUT_REPORT}")
