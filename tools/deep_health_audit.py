"""
SANTIS DEEP HEALTH AUDIT v2.0
Comprehensive scan: HTML pages, JS/CSS refs, JSON data, server endpoints, broken links
"""
import os, re, json, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")
REPORT = {"html_issues": [], "js_issues": [], "json_issues": [], "missing_files": [], "endpoint_issues": [], "summary": {}}

# ═══════════════════════════════════════════════════════════════
# 1. SCAN ALL HTML FILES FOR BROKEN SCRIPT/LINK/IMG REFERENCES
# ═══════════════════════════════════════════════════════════════
def scan_html_refs():
    html_files = list(ROOT.rglob("*.html"))
    # Exclude node_modules, reports, .git, tools
    html_files = [f for f in html_files if not any(x in str(f) for x in ['node_modules', '.git', 'reports', 'tools', '_legacy', 'quarantine'])]
    
    ref_pattern = re.compile(r'(?:src|href)=["\']([^"\'#]+?)["\']', re.IGNORECASE)
    missing_refs = []
    
    for html_file in html_files:
        try:
            content = html_file.read_text(encoding='utf-8', errors='ignore')
        except:
            continue
        
        rel_path = html_file.relative_to(ROOT)
        refs = ref_pattern.findall(content)
        
        for ref in refs:
            # Skip external URLs, data URIs, template literals
            if ref.startswith(('http://', 'https://', 'data:', 'mailto:', 'tel:', 'javascript:', '//', '${', '#', 'blob:')):
                continue
            if ref.startswith('/api/') or ref.startswith('/ws') or ref.startswith('/health') or ref.startswith('/admin/city') or ref.startswith('/admin/run') or ref.startswith('/admin/seo') or ref.startswith('/admin/intelligence'):
                continue
            
            # Resolve path
            if ref.startswith('/'):
                resolved = ROOT / ref.lstrip('/')
            else:
                resolved = html_file.parent / ref
            
            # Strip query params
            resolved = Path(str(resolved).split('?')[0].split('#')[0])
            
            if not resolved.exists() and not resolved.with_suffix('.html').exists():
                # Check if it's a directory with index.html
                if not (resolved / 'index.html').exists():
                    missing_refs.append({
                        "file": str(rel_path),
                        "ref": ref,
                        "resolved": str(resolved.relative_to(ROOT)) if str(resolved).startswith(str(ROOT)) else ref
                    })
    
    return html_files, missing_refs

# ═══════════════════════════════════════════════════════════════
# 2. SCAN JS FILES FOR REMAINING RELATIVE PATHS
# ═══════════════════════════════════════════════════════════════
def scan_js_relative_paths():
    js_dir = ROOT / "assets" / "js"
    issues = []
    
    for js_file in js_dir.rglob("*.js"):
        if '_legacy' in str(js_file):
            continue
        content = js_file.read_text(encoding='utf-8', errors='ignore')
        
        # Find "assets/ without leading / (relative paths)
        matches = re.findall(r'["\']assets/', content)
        if matches:
            issues.append({
                "file": str(js_file.relative_to(ROOT)),
                "count": len(matches),
                "type": "relative_path"
            })
    
    return issues

# ═══════════════════════════════════════════════════════════════
# 3. CHECK JSON DATA FILES
# ═══════════════════════════════════════════════════════════════
def scan_json_data():
    issues = []
    data_dirs = [ROOT / "assets" / "data", ROOT / "data"]
    
    for data_dir in data_dirs:
        if not data_dir.exists():
            continue
        for json_file in data_dir.glob("*.json"):
            try:
                content = json_file.read_text(encoding='utf-8', errors='ignore')
                data = json.loads(content)
                
                # Check for relative asset paths
                rel_paths = re.findall(r'"assets/', content)
                if rel_paths:
                    issues.append({
                        "file": str(json_file.relative_to(ROOT)),
                        "issue": f"{len(rel_paths)} relative asset paths",
                        "severity": "medium"
                    })
                    
            except json.JSONDecodeError as e:
                issues.append({
                    "file": str(json_file.relative_to(ROOT)),
                    "issue": f"Invalid JSON: {str(e)[:80]}",
                    "severity": "critical"
                })
    
    return issues

# ═══════════════════════════════════════════════════════════════
# 4. CHECK LANGUAGE PAGES COMPLETENESS
# ═══════════════════════════════════════════════════════════════
def scan_language_pages():
    langs = ["tr", "en", "de", "fr", "ru", "sr"]
    issues = []
    
    for lang in langs:
        lang_dir = ROOT / lang
        if not lang_dir.exists():
            issues.append({"lang": lang, "issue": "Directory missing", "severity": "critical"})
            continue
        
        index = lang_dir / "index.html"
        if not index.exists():
            issues.append({"lang": lang, "issue": "index.html missing", "severity": "critical"})
            continue
        
        content = index.read_text(encoding='utf-8', errors='ignore')
        
        # Check basics
        if f'lang="{lang}"' not in content and f"lang='{lang}'" not in content:
            issues.append({"lang": lang, "issue": f"html lang attribute not set to {lang}", "severity": "medium"})
        
        if 'santis-core.js' in content:
            issues.append({"lang": lang, "issue": "Still references non-existent santis-core.js", "severity": "high"})
        
        # Check for absolute asset paths
        rel_count = content.count('"assets/') + content.count("'assets/")
        if rel_count > 0:
            issues.append({"lang": lang, "issue": f"{rel_count} relative asset paths in index.html", "severity": "medium"})
    
    return issues

# ═══════════════════════════════════════════════════════════════
# 5. CHECK SERVER.PY ENDPOINTS vs FRONTEND CALLS
# ═══════════════════════════════════════════════════════════════
def check_endpoints():
    issues = []
    server_content = (ROOT / "server.py").read_text(encoding='utf-8', errors='ignore')
    
    # Extract defined routes
    route_pattern = re.compile(r'@app\.(get|post|put|delete)\(["\']([^"\']+)')
    defined_routes = set()
    for match in route_pattern.finditer(server_content):
        defined_routes.add(match.group(2))
    
    # Extract frontend API calls from admin JS
    admin_js_files = list((ROOT / "admin").glob("*.js"))
    called_endpoints = set()
    
    for js_file in admin_js_files:
        content = js_file.read_text(encoding='utf-8', errors='ignore')
        fetch_pattern = re.compile(r'fetch\(["\']([^"\']+)')
        for match in fetch_pattern.finditer(content):
            endpoint = match.group(1).split('?')[0]
            if endpoint.startswith('/'):
                called_endpoints.add(endpoint)
    
    # Find missing endpoints
    for endpoint in sorted(called_endpoints):
        # Check if any defined route matches (could be prefix match)
        found = False
        for route in defined_routes:
            if endpoint == route or endpoint.startswith(route.rstrip('/')):
                found = True
                break
        if not found:
            issues.append({"endpoint": endpoint, "issue": "Called by frontend but not defined in server.py"})
    
    return defined_routes, called_endpoints, issues

# ═══════════════════════════════════════════════════════════════
# 6. CHECK PYTHON IMPORTS
# ═══════════════════════════════════════════════════════════════
def check_python_imports():
    issues = []
    server_content = (ROOT / "server.py").read_text(encoding='utf-8', errors='ignore')
    
    import_pattern = re.compile(r'(?:from|import)\s+(\w+)')
    stdlib = {'os', 'sys', 'json', 'csv', 'html', 'asyncio', 'logging', 'time', 'datetime', 
              'pathlib', 'hashlib', 'uuid', 're', 'subprocess', 'traceback', 'collections',
              'typing', 'functools', 'io', 'math', 'random', 'string', 'base64', 'urllib',
              'shutil', 'glob', 'copy', 'textwrap', 'abc', 'inspect', 'heapq', 'threading',
              'multiprocessing', 'signal', 'contextlib', 'dataclasses', 'enum'}
    
    pip_packages = {'fastapi', 'uvicorn', 'starlette', 'pydantic', 'aiofiles', 'websockets',
                    'httpx', 'playwright', 'jinja2', 'dotenv', 'PIL', 'requests', 'bs4'}
    
    for match in import_pattern.finditer(server_content):
        module = match.group(1)
        if module in stdlib or module in pip_packages or module == 'core':
            continue
        # Check if local module exists
        if not (ROOT / f"{module}.py").exists() and not (ROOT / module).is_dir():
            issues.append({"module": module, "issue": f"Imported in server.py but file not found"})
    
    return issues

# ═══════════════════════════════════════════════════════════════
# RUN ALL SCANS
# ═══════════════════════════════════════════════════════════════
print("=" * 60)
print("🔬 SANTIS DEEP HEALTH AUDIT v2.0")
print("=" * 60)

print("\n📄 [1/6] Scanning HTML references...")
html_files, missing_refs = scan_html_refs()
print(f"   Scanned: {len(html_files)} HTML files")
print(f"   Missing refs: {len(missing_refs)}")

print("\n📜 [2/6] Scanning JS relative paths...")
js_issues = scan_js_relative_paths()
print(f"   Files with relative paths: {len(js_issues)}")
for issue in js_issues:
    print(f"   ⚠️ {issue['file']}: {issue['count']} relative paths")

print("\n📊 [3/6] Scanning JSON data...")
json_issues = scan_json_data()
print(f"   Issues: {len(json_issues)}")
for issue in json_issues:
    print(f"   {'🔴' if issue['severity'] == 'critical' else '🟡'} {issue['file']}: {issue['issue']}")

print("\n🌐 [4/6] Scanning language pages...")
lang_issues = scan_language_pages()
print(f"   Issues: {len(lang_issues)}")
for issue in lang_issues:
    sev = {'critical': '🔴', 'high': '🟠', 'medium': '🟡'}.get(issue['severity'], '⚪')
    print(f"   {sev} /{issue['lang']}/: {issue['issue']}")

print("\n🔌 [5/6] Checking endpoints...")
defined, called, endpoint_issues = check_endpoints()
print(f"   Server routes: {len(defined)}")
print(f"   Frontend calls: {len(called)}")
print(f"   Missing endpoints: {len(endpoint_issues)}")
for issue in endpoint_issues:
    print(f"   🔴 {issue['endpoint']}: {issue['issue']}")

print("\n🐍 [6/6] Checking Python imports...")
import_issues = check_python_imports()
print(f"   Missing modules: {len(import_issues)}")
for issue in import_issues:
    print(f"   🔴 {issue['module']}: {issue['issue']}")

# TOP MISSING REFS (deduplicated)
if missing_refs:
    print(f"\n📋 TOP MISSING REFERENCES ({len(missing_refs)} total):")
    seen = set()
    count = 0
    for ref in missing_refs:
        key = ref['ref']
        if key not in seen and count < 20:
            seen.add(key)
            count += 1
            print(f"   ❌ {ref['ref']}  (from {ref['file']})")

# SUMMARY
print("\n" + "=" * 60)
print("📊 AUDIT SUMMARY")
print("=" * 60)
total_issues = len(missing_refs) + len(js_issues) + len(json_issues) + len(lang_issues) + len(endpoint_issues) + len(import_issues)
critical = len([i for i in json_issues if i['severity'] == 'critical']) + len([i for i in lang_issues if i['severity'] == 'critical']) + len(endpoint_issues) + len(import_issues)
print(f"   Total issues: {total_issues}")
print(f"   Critical: {critical}")
print(f"   HTML files scanned: {len(html_files)}")
print(f"   Missing refs: {len(missing_refs)}")

# Save report
report_data = {
    "missing_refs": missing_refs[:50],
    "js_issues": js_issues,
    "json_issues": json_issues,
    "lang_issues": lang_issues,
    "endpoint_issues": endpoint_issues,
    "import_issues": import_issues,
    "summary": {
        "total_issues": total_issues,
        "critical": critical,
        "html_scanned": len(html_files)
    }
}
report_path = ROOT / "reports" / "deep_health_audit.json"
report_path.parent.mkdir(exist_ok=True)
report_path.write_text(json.dumps(report_data, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"\n💾 Full report saved: {report_path}")
