import os
import csv
import requests
from bs4 import BeautifulSoup

site_url = input("Site URL (e.g. http://127.0.0.1:8000): ").strip()
report_file = os.path.join("reports", "site_audit_report.csv")
os.makedirs("reports", exist_ok=True)

seen = set([site_url])
queue = [site_url]
results = []

while queue:
    link = queue.pop(0)
    try:
        r = requests.get(link, timeout=10)
        status = r.status_code
        results.append({"URL": link, "Status": status})
        if status >= 400:
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.find_all("a", href=True):
            url = a["href"]
            if url.startswith("#") or url.startswith("mailto:") or url.startswith("tel:"):
                continue
            if not url.startswith("http"):
                url = site_url.rstrip("/") + "/" + url.lstrip("/")
            if url not in seen:
                seen.add(url)
                queue.append(url)
    except Exception:
        results.append({"URL": link, "Status": 404})

with open(report_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["URL", "Status"])
    writer.writeheader()
    writer.writerows(results)

print(f"[DONE] Report: {report_file}")
