import os
import re
import json

admin_dir = r"c:\Users\tourg\Desktop\SANTIS_SITE\admin"

report = {
    "html_files": {},
    "js_files": {}
}

# Scan HTML files
for f in os.listdir(admin_dir):
    if f.endswith(".html"):
        filepath = os.path.join(admin_dir, f)
        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()
            title_match = re.search(r"<title>(.*?)</title>", content)
            scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', content)
            report["html_files"][f] = {
                "title": title_match.group(1).strip() if title_match else "No Title",
                "scripts": scripts
            }

# Scan JS files root
for f in os.listdir(admin_dir):
    if f.endswith(".js"):
        filepath = os.path.join(admin_dir, f)
        with open(filepath, "r", encoding="utf-8") as file:
            content = file.read()
            fetches = len(re.findall(r'fetch\(', content))
            intervals = len(re.findall(r'setInterval\(', content))
            report["js_files"][f] = {
                "fetches": fetches,
                "intervals": intervals,
                "size_kb": round(os.path.getsize(filepath) / 1024, 2)
            }

js_dir = os.path.join(admin_dir, "assets", "js")
if os.path.exists(js_dir):
    for f in os.listdir(js_dir):
        if f.endswith(".js"):
            filepath = os.path.join(js_dir, f)
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()
                fetches = len(re.findall(r'fetch\(', content))
                intervals = len(re.findall(r'setInterval\(', content))
                report["js_files"]["assets/js/" + f] = {
                    "fetches": fetches,
                    "intervals": intervals,
                    "size_kb": round(os.path.getsize(filepath) / 1024, 2)
                }

with open(r"c:\Users\tourg\Desktop\SANTIS_SITE\admin_scan_report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, indent=4)
