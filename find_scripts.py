import os
import re
import json

HTML_DIRS = [
    r"C:\Users\tourg\Desktop\SANTIS_SITE\admin",
    r"C:\Users\tourg\Desktop\SANTIS_SITE\admin\omniverse"
]

# We don't want to touch files in _archive
def get_html_files():
    html_files = []
    for d in HTML_DIRS:
        for root, _, files in os.walk(d):
            if "_archive" in root or "_deploy_stage" in root or "reports" in root:
                continue
            for f in files:
                if f.endswith(".html"):
                    html_files.append(os.path.join(root, f))
    return html_files

def extract_scripts():
    html_files = get_html_files()
    all_scripts = set()
    usage = {}
    
    script_pattern = re.compile(r'<script\s+[^>]*src=["\']([^"\']+)["\'][^>]*></script>')
    
    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        scripts = script_pattern.findall(content)
        for s in scripts:
            # ignore absolute http urls like cdn
            if s.startswith("http://") or s.startswith("https://"):
                continue
            all_scripts.add(s)
            if s not in usage:
                usage[s] = []
            usage[s].append(os.path.basename(html_file))
            
    print("ALL LOCAL SCRIPTS FOUND IN HTML FILES:")
    for s in sorted(all_scripts):
        print(f" - {s} (used in {len(usage[s])} files)")
        
extract_scripts()
