import os
import re
from collections import defaultdict

ADMIN_DIR = 'admin'
ARCHIVE_DIR = os.path.join(ADMIN_DIR, '_archive')

# Data structures
html_files = []
js_files = []
scripts_used = set()

for root, _, files in os.walk(ADMIN_DIR):
    if '_archive' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))
        elif f.endswith('.js'):
            js_files.append(os.path.join(root, f))

# Analyze HTML
panels = []
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract scripts
    scripts = re.findall(r'<script\s+.*?src=["\'](.*?)["\']', content, re.IGNORECASE)
    for s in scripts:
        basename = os.path.basename(s)
        scripts_used.add(basename)
        
    # Guess title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    title = title_match.group(1).replace('Santis Master OS -', '').strip() if title_match else os.path.basename(file)
    
    # Guess role based on filename/content
    role = "Operations"
    lower_file = file.lower()
    if 'index' in lower_file or 'dashboard' in lower_file or 'command-center' in lower_file or 'boardroom' in lower_file or 'black-room' in lower_file or 'audit' in lower_file:
        role = "Analytics"
    elif 'gods-eye' in lower_file or 'pulse' in lower_file:
        role = "System Monitoring"
    elif 'booking' in lower_file:
        role = "Booking Management"
    elif 'revenue' in lower_file:
        role = "Revenue Tracking"
    elif 'crm' in lower_file:
        role = "Customer Interaction"
        
    status = "Healthy"
    recommendation = "Keep"
    overlap = "None"
    
    # Check if zombie (no scripts and almost empty body)
    if '<body>' in content and '</body>' in content:
        body = content.split('<body>')[1].split('</body>')[0].strip()
        if len(body) < 100:
            status = "Zombie"
            recommendation = "Delete / Archive"
            
    panels.append({
        'name': title,
        'file': file.replace('\\', '/'),
        'role': role,
        'overlap': overlap,
        'rec': recommendation,
        'fetches': len(re.findall(r'fetch\(', content)),
        'intervals': len(re.findall(r'setInterval\(', content))
    })

# Analyze JS
js_stats = []
for file in js_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    basename = os.path.basename(file)
    fetch_count = len(re.findall(r'fetch\(', content)) + len(re.findall(r'\$\.ajax', content))
    interval_count = len(re.findall(r'setInterval\(', content))
    # Check if neutralized
    interval_count -= len(re.findall(r'//\s*\[Sovereign Purge\].*?setInterval', content))
    
    status = "Active"
    if basename not in scripts_used and not basename.endswith('config.js'):
        status = "Unused (Zombie Script)"
        
    js_stats.append({
        'name': basename,
        'file': file.replace('\\', '/'),
        'fetches': fetch_count,
        'intervals': max(0, interval_count),
        'status': status
    })

# Overlap detection logic (simplified for post-purge state)
analytics_panels = [p for p in panels if p['role'] == 'Analytics']
if len(analytics_panels) > 2:
    for p in analytics_panels:
        if 'index.html' in p['file'] or 'command-center' in p['file']:
            p['overlap'] = "Dashboards Group"
            p['rec'] = "Merge to Boardroom"

# Generate Markdown
md = []
md.append("# SANTIS MASTER SYSTEM – POST-PURGE ADMIN STRUCTURE AUDIT\n")
md.append("## 1. Panels Overview\n")

# Group by Role
grouped = defaultdict(list)
for p in panels:
    grouped[p['role']].append(p)

for role, items in grouped.items():
    md.append(f"\n### {role}")
    md.append(f"**Panels Found:** {len(items)}\n")
    for i, p in enumerate(items, 1):
        md.append(f"{i}. **{p['name']}** (`{p['file']}`)")
        if p['overlap'] != "None":
            md.append(f"   - *Status:* overlapping functionality detected ({p['overlap']}).")
        if p['rec'] != "Keep":
            md.append(f"   - *Recommendation:* {p['rec']}")
            
md.append("\n## 2. Telemetry & JS Modules\n")
md.append("| Script | API Calls | Active Polling Loops | Status |\n|---|---|---|---|")
for j in sorted(js_stats, key=lambda x: x['intervals'], reverse=True):
    if j['name'] in ['tailwindcss.min.js', 'chart.js', 'vue.global.prod.js', 'echarts.min.js', 'd3.v7.min.js']: continue
    md.append(f"| {j['name']} | {j['fetches']} | {j['intervals']} | {j['status']} |")

md.append("\n## 3. Final Summary\n")
md.append(f"- **Total Panels:** {len(panels)}")
md.append("- **Functional Distribution:**")
for role, items in grouped.items():
    md.append(f"  - {role}: {len(items)}")

with open('admin/reports/SANTIS_DEEP_SCAN_REPORT.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(md))

print("Audit report generated at admin/reports/SANTIS_DEEP_SCAN_REPORT.md")
