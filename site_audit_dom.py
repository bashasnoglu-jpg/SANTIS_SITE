"""
SANTIS DOM AUDIT v1 (Playwright)
- Headless Chromium ile gerçek DOM/JS kaynaklı linkleri yakalar
- Internal isteklerin HTTP statuslerini toplar, kırık/yavaş işaretler
- Çıktılar: reports/dom_audit_report.csv ve reports/dom_audit_report.html
Env:
  SANTIS_BASE_URL (default http://localhost:8000)
  DOM_DEPTH (kaç iç link ziyaret edilsin, default 10)
  DOM_TIMEOUT (ms, default 15000)
"""

import asyncio
import csv
import html
import json
import os
from pathlib import Path
from urllib.parse import urlparse, urljoin

BASE_URL = os.getenv("SANTIS_BASE_URL", "http://localhost:8000").rstrip("/")
DOM_DEPTH = int(os.getenv("DOM_DEPTH", "10"))
DOM_TIMEOUT = int(os.getenv("DOM_TIMEOUT", "15000"))

REPORT_DIR = Path("reports")
CSV_PATH = REPORT_DIR / "dom_audit_report.csv"
HTML_PATH = REPORT_DIR / "dom_audit_report.html"
DOM_JSON_PATH = REPORT_DIR / "dom_audit_results.json"


def is_internal(url: str) -> bool:
    netloc = urlparse(url).netloc
    return netloc in ("", urlparse(BASE_URL).netloc)


async def run_audit():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Playwright yüklü değil. `pip install playwright` ve `playwright install chromium` gerekli.")
        return {"error": "playwright_missing"}

    REPORT_DIR.mkdir(exist_ok=True)
    records = {}
    dom_results = []
    visited = set()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        async def log_response(response):
            url = response.url
            if not is_internal(url):
                return
            status = response.status
            records[url] = {
                "url": url,
                "status": status,
                "kind": "dom",
                "note": "broken" if status >= 400 else "",
            }
            dom_results.append({
                "url": url,
                "status": status,
                "note": "broken" if status >= 400 else "",
                "source": "dom"
            })

        page.on("response", log_response)

        async def visit(url):
            # Normalize URL (strip fragment, trailing slash for dedup)
            parsed = urlparse(url)
            normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
            if normalized in visited or len(visited) >= DOM_DEPTH:
                return
            visited.add(normalized)
            try:
                await page.goto(url, wait_until="networkidle", timeout=DOM_TIMEOUT)
                # scroll to trigger lazy load
                await page.evaluate("() => new Promise(r => { window.scrollTo(0, document.body.scrollHeight); setTimeout(r, 800); })")
                anchors = await page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
                for a in anchors:
                    if is_internal(a) and len(visited) < DOM_DEPTH:
                        await visit(a)
            except Exception as e:
                print(f"⚠️ DOM Audit: Error visiting {url}: {e}")

        await visit(f"{BASE_URL}/")
        await browser.close()

    # write CSV/HTML
    fieldnames = ["URL", "Status", "Note"]
    with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in records.values():
            w.writerow({"URL": r["url"], "Status": r["status"], "Note": r["note"]})

    broken = [r for r in records.values() if r["status"] >= 400]
    slow = []

    def row_html(r):
        return f"<tr><td>{html.escape(r['url'])}</td><td>{r['status']}</td><td>{html.escape(r['note'])}</td></tr>"

    html_content = f"""
    <html><head><meta charset='utf-8'><style>
    body{{background:#0f0f0f;color:#ddd;font-family:Inter,Arial,sans-serif;padding:20px}}
    table{{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}}
    th,td{{border-bottom:1px solid #222;padding:6px;text-align:left}}
    th{{color:#9ad}}
    </style></head><body>
    <h2>Santis DOM Audit v1</h2>
    <p>Base: {BASE_URL} — Visited: {len(visited)} — Requests: {len(records)} — Broken: {len(broken)}</p>

    <h3>Broken / Error</h3>
    <table><thead><tr><th>URL</th><th>Status</th><th>Note</th></tr></thead>
    <tbody>{''.join(row_html(r) for r in broken) or '<tr><td colspan=3>None</td></tr>'}</tbody></table>
    </body></html>
    """
    HTML_PATH.write_text(html_content, encoding="utf-8")
    # JSON output for merge
    DOM_JSON_PATH.write_text(json.dumps(dom_results, indent=2), encoding="utf-8")
    print(f"DOM audit bitti. CSV: {CSV_PATH} | HTML: {HTML_PATH} | Broken: {len(broken)}")
    return {"broken": len(broken), "checked": len(records)}


if __name__ == "__main__":
    asyncio.run(run_audit())
