"""
SANTIS LINK AUDITOR v3 (Async)
- AIOHTTP tabanlı yüksek hızlı tarama (fallback: requests)
- Sitemap + ana URL’den BFS, derinlik kontrollü
- Akıllı hız limiti: 429/503 görünce yavaşlar
- JSON doğrulama, yavaş yanıt işaretleme
- Slug map önerisi ve isteğe bağlı oto-fix (AUTO_FIX=1)
- Çıktılar: reports/fixed_links_report.csv & reports/link_audit_report.html
"""

import asyncio
import csv
import html
import json
import os
import time
import datetime
import difflib
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import Optional

import bs4
import xml.etree.ElementTree as ET

try:
    import aiohttp
except ImportError:  # pragma: no cover
    aiohttp = None
    import requests  # type: ignore


BASE_URL = (
    os.getenv("AUDIT_BASE_URL")
    or os.getenv("SANTIS_BASE_URL")
    or "http://localhost:8000"
).rstrip("/")
MAX_DEPTH = int(os.getenv("CRAWL_DEPTH", "3"))
MAX_CONCURRENCY = int(os.getenv("CRAWL_CONCURRENCY", "50"))
TIMEOUT = int(os.getenv("CRAWL_TIMEOUT", "8"))
INITIAL_DELAY = float(os.getenv("CRAWL_DELAY", "0"))
BACKOFF_FACTOR = 1.5
SLOW_MS = 2000
AUTO_FIX = os.getenv("AUTO_FIX", "0") == "1"
ALERT_WEBHOOK = os.getenv("ALERT_WEBHOOK_URL", "")

DIRECTORY = Path(__file__).resolve().parent
REPORT_DIR = Path("reports")
CSV_PATH = REPORT_DIR / "fixed_links_report.csv"
HTML_PATH = REPORT_DIR / "link_audit_report.html"
BACKUP_DIR = REPORT_DIR / "link_fixes"
HISTORY_PATH = REPORT_DIR / "history.json"
DOM_JSON_PATH = REPORT_DIR / "dom_audit_results.json"
DIFF_DIR = REPORT_DIR / "diff_previews"
DIFF_DIR.mkdir(parents=True, exist_ok=True)


slug_map = {}
checked = {}
visited_pages = set()
fetching = set()
fetch_lock = asyncio.Lock()
# Validation Data Globals
base_headers = {}
base_perf = {}


# --------------------------------------------------
# Helpers
# --------------------------------------------------
def is_internal(url: str) -> bool:
    netloc = urlparse(url).netloc
    return netloc in ("", urlparse(BASE_URL).netloc)


def normalize(url: str) -> str:
    return url.split("#")[0]


def build_slug_map():
    global slug_map
    slug_map = {}
    site_json = Path("data/site_content.json")
    db_json = Path("db/services.json")

    def add_slug(lang, section, slug):
        if slug:
            slug_map[slug] = f"/{lang}/{section}/{slug}"

    try:
        if site_json.exists():
            data = json.load(site_json.open(encoding="utf-8-sig"))
            for lang, lang_data in (data.get("languages") or {}).items():
                for section, sec_data in (lang_data or {}).get("sections", {}).items():
                    for item in (sec_data or {}).get("items", []):
                        add_slug(lang, section, item.get("id") or item.get("slug"))
    except Exception:
        pass

    try:
        if db_json.exists():
            items = json.load(db_json.open(encoding="utf-8-sig"))
            if isinstance(items, list):
                for item in items:
                    slug = item.get("slug") or item.get("id")
                    lang = item.get("lang") or "tr"
                    section = item.get("category") or "products"
                    add_slug(lang, section, slug)
    except Exception:
        pass


def url_to_file(url: str) -> Optional[Path]:
    parsed = urlparse(url)
    rel = parsed.path.lstrip("/")
    if not rel:
        return None
    candidate = DIRECTORY / rel
    return candidate if candidate.exists() else None


def apply_fix(referer_url: str, broken_url: str, suggested: str):
    file_path = url_to_file(referer_url)
    if not file_path:
        return
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return

    if broken_url not in content:
        return

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / f"{file_path.name}.bak"
    if not backup_path.exists():
        try:
            backup_path.write_text(content, encoding="utf-8")
        except Exception:
            return

    new_content = content.replace(broken_url, suggested)

    def create_diff_preview(old, new):
        diff = difflib.HtmlDiff().make_file(
            old.splitlines(), new.splitlines(),
            fromdesc="Before", todesc="After"
        )
        out = DIFF_DIR / f"{file_path.name}.diff.html"
        out.write_text(diff, encoding="utf-8")

    try:
        create_diff_preview(content, new_content)
    except Exception:
        pass

    if AUTO_FIX:
        try:
            file_path.write_text(new_content, encoding="utf-8")
        except Exception:
            return


def suggest_slug(url: str) -> str:
    path_part = urlparse(url).path.strip("/").split("/")[-1]
    if not path_part or not slug_map:
        return ""
    best = difflib.get_close_matches(path_part, slug_map.keys(), n=1, cutoff=0.75)
    return slug_map[best[0]] if best else ""


# --------------------------------------------------
# Async fetch
# --------------------------------------------------
async def fetch(session, url, delay_holder):
    await asyncio.sleep(delay_holder["delay"])
    start = time.time()
    try:
        async with session.get(url, timeout=TIMEOUT, allow_redirects=True) as resp:
            text = await resp.text(errors="replace")
            elapsed = round((time.time() - start) * 1000)
            return resp.status, resp.headers.get("Content-Type", ""), str(resp.url), elapsed, text
    except Exception as e:
        return None, "", url, None, str(e)


def record(url, status, kind, referer="", content_type="", final_url="", elapsed=None, note=""):
    checked[url] = {
        "url": url,
        "status": status,
        "kind": kind,
        "referer": referer,
        "content_type": content_type,
        "final_url": final_url or url,
        "elapsed_ms": elapsed,
        "note": note,
    }

def merge_dom_results():
    if not DOM_JSON_PATH.exists():
        return
    try:
        dom_data = json.load(DOM_JSON_PATH.open(encoding="utf-8"))
        for r in dom_data:
            url = r.get("url")
            if not url or url in checked:
                continue
            checked[url] = {
                "url": url,
                "status": r.get("status", "DOM"),
                "kind": "dom-link",
                "referer": "headless",
                "content_type": "",
                "final_url": url,
                "elapsed_ms": None,
                "note": r.get("note", "js-discovered"),
            }
    except Exception:
        pass


async def crawl_url(session, url, depth, queue, delay_holder):
    url = normalize(url)
    if url in visited_pages or depth > MAX_DEPTH:
        return
    visited_pages.add(url)

    status, ctype, final_url, elapsed, body = await fetch(session, url, delay_holder)
    note = ""
    if status is None:
        record(url, "ERR", "page", referer="", note=body)
        return

    if status in (429, 503):
        delay_holder["delay"] = min(delay_holder["delay"] * BACKOFF_FACTOR + 0.2, 3)
    else:
        delay_holder["delay"] = max(INITIAL_DELAY, delay_holder["delay"] * 0.7)

    if elapsed and elapsed > SLOW_MS:
        note = f"slow:{elapsed}ms"

    if status >= 400:
        record(url, status, "page", referer="", content_type=ctype, final_url=final_url, elapsed=elapsed, note=note or "broken")
        return

    record(url, status, "page", referer="", content_type=ctype, final_url=final_url, elapsed=elapsed, note=note)

    if "text/html" not in (ctype or ""):
        return

    soup = bs4.BeautifulSoup(body, "html.parser")
    # anchors
    for tag in soup.find_all("a", href=True):
        link = urljoin(url, tag["href"])
        if is_internal(link) and depth + 1 <= MAX_DEPTH:
            await queue.put((normalize(link), depth + 1, url))
        # still check existence
        await check_url(session, link, "link", url, delay_holder)

    # assets
    for tag in soup.find_all(["script", "link", "img"]):
        src = tag.get("src") or tag.get("href")
        if src:
            asset = urljoin(url, src)
            if is_internal(asset):
                await check_url(session, asset, "asset", url, delay_holder)


async def check_url(session, url, kind, referer, delay_holder):
    url = normalize(url)
    if not is_internal(url):
        return
    if url in checked:
        return
    async with fetch_lock:
        if url in fetching:
            return
        fetching.add(url)

    suggestion = suggest_slug(url)
    status, ctype, final_url, elapsed, body = await fetch(session, url, delay_holder)
    note = ""
    if status is None:
        note = body or ""
        if suggestion:
            note += f";suggest:{suggestion}"
        record(url, "ERR", kind, referer, note=note)
        async with fetch_lock:
            fetching.discard(url)
        return

    if status in (429, 503):
        delay_holder["delay"] = min(delay_holder["delay"] * BACKOFF_FACTOR + 0.2, 3)
    else:
        delay_holder["delay"] = max(INITIAL_DELAY, delay_holder["delay"] * 0.7)

    if elapsed and elapsed > SLOW_MS:
        note = f"slow:{elapsed}ms"

    if status >= 400:
        note = note or "broken"
        if suggestion:
            note += f";suggest:{suggestion}"
            if AUTO_FIX and referer:
                apply_fix(referer, url, suggestion)
        record(url, status, kind, referer, ctype, final_url, elapsed, note)
    else:
        if "json" in ctype or url.endswith(".json"):
            try:
                json.loads(body)
            except Exception:
                record(url, status, kind, referer, ctype, final_url, elapsed, "invalid-json")
                async with fetch_lock:
                    fetching.discard(url)
                return
        record(url, status, kind, referer, ctype, final_url, elapsed, note)
    async with fetch_lock:
        fetching.discard(url)


# --------------------------------------------------
# Sitemap seeds
# --------------------------------------------------
def read_sitemap_urls():
    urls = set()
    sm_path = Path("sitemap.xml")
    if sm_path.exists():
        try:
            tree = ET.parse(sm_path)
            for loc in tree.getroot().iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
                if loc.text:
                    urls.add(loc.text.strip())
        except Exception:
            pass
    return urls


# --------------------------------------------------
# Reporting
# --------------------------------------------------
def write_reports():
    merge_dom_results()
    REPORT_DIR.mkdir(exist_ok=True)
    run_ts = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    run_html_path = REPORT_DIR / f"link_audit_report_{run_ts}.html"
    fieldnames = ["File", "URL", "Status", "Kind", "Final", "ElapsedMs", "Note", "Referer"]
    with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in checked.values():
            writer.writerow({
                "File": r["url"],
                "URL": r["url"],
                "Status": r["status"],
                "Kind": r["kind"],
                "Final": r["final_url"],
                "ElapsedMs": r["elapsed_ms"] or "",
                "Note": r["note"],
                "Referer": r["referer"],
            })

    def is_broken(r):
        try:
            return int(r["status"]) >= 400
        except Exception:
            return True if r["status"] not in ("200", 200) else False

    broken = [r for r in checked.values() if is_broken(r)]
    slow = [r for r in checked.values() if str(r.get("note", "")).startswith("slow")]

    def row_html(r):
        return f"<tr><td>{html.escape(str(r['kind']))}</td><td>{html.escape(str(r['status']))}</td><td>{html.escape(r['url'])}</td><td>{html.escape(r['final_url'])}</td><td>{html.escape(str(r.get('note','')))}</td></tr>"

    # Trend table (last 10)
    trend_rows = ""
    try:
        hist = json.load(HISTORY_PATH.open(encoding="utf-8"))
        last10 = hist[-10:]
        for h in last10:
            trend_rows += f"<tr><td>{html.escape(h.get('ts',''))}</td><td>{h.get('broken',0)}</td><td>{h.get('slow',0)}</td><td>{h.get('pages',0)}</td><td>{h.get('checked',0)}</td></tr>"
    except Exception:
        trend_rows = ""

    html_content = f"""
    <html><head><meta charset='utf-8'><style>
    body{{background:#0f0f0f;color:#ddd;font-family:Inter,Arial,sans-serif;padding:20px}}
    table{{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}}
    th,td{{border-bottom:1px solid #222;padding:6px;text-align:left}}
    th{{color:#9ad}}
    .bad{{color:#ff6b6b}}
    .slow{{color:#f5a524}}
    </style></head><body>
    <h2>Santis Link Audit v3 (Async)</h2>
    <p>Base: {BASE_URL} — Pages: {len(visited_pages)} — Checked: {len(checked)} — Broken: {len(broken)}</p>

    <h3 class='bad'>Broken / Error</h3>
    <table><thead><tr><th>Type</th><th>Status</th><th>URL</th><th>Final</th><th>Note</th></tr></thead>
    <tbody>{''.join(row_html(r) for r in broken) or '<tr><td colspan=5>None</td></tr>'}</tbody></table>

    <h3 class='slow'>Slow (>2s)</h3>
    <table><thead><tr><th>Type</th><th>Status</th><th>URL</th><th>Final</th><th>Note</th></tr></thead>
    <tbody>{''.join(row_html(r) for r in slow) or '<tr><td colspan=5>None</td></tr>'}</tbody></table>

    <h3>Trend (last 10 runs)</h3>
    <table><thead><tr><th>Zaman (UTC)</th><th>Broken</th><th>Slow</th><th>Pages</th><th>Checked</th></tr></thead>
    <tbody>{trend_rows or '<tr><td colspan=5>No history</td></tr>'}</tbody></table>
    </body></html>
    """
    HTML_PATH.write_text(html_content, encoding="utf-8")
    try:
        run_html_path.write_text(html_content, encoding="utf-8")
    except Exception:
        pass

    # History + alerts
    avg_ms = round(
        sum(r["elapsed_ms"] for r in checked.values() if isinstance(r.get("elapsed_ms"), (int, float))) /
        max(1, len([r for r in checked.values() if r.get("elapsed_ms")]))
    , 2) if checked else 0
    max_ms = max([r["elapsed_ms"] or 0 for r in checked.values()] or [0])

    checked_count = len(checked)
    broken_count = len(broken)
    slow_count = len(slow)
    def clamp(x, lo=0, hi=100):
        return max(lo, min(hi, x))

    broken_rate = broken_count / max(1, checked_count)
    slow_rate = slow_count / max(1, checked_count)

    score = 100
    score -= broken_rate * 6000
    score -= slow_rate * 3000
    score -= min(avg_ms / 1500, 1) * 15
    health_score = clamp(round(score, 1))

    summary = {
        "ts": datetime.datetime.utcnow().isoformat() + "Z",
        "base": BASE_URL,
        "pages": len(visited_pages),
        "checked": checked_count,
        "broken": broken_count,
        "slow": slow_count,
        "autofix": AUTO_FIX,
        "avg_ms": avg_ms,
        "max_ms": max_ms,
        "broken_rate": round(broken_rate, 4),
        "slow_rate": round(slow_rate, 4),
        "health_score": health_score,
        "report": run_html_path.name,
    }
    history = []
    if HISTORY_PATH.exists():
        try:
            history = json.load(HISTORY_PATH.open(encoding="utf-8"))
        except Exception:
            history = []
    history = (history + [summary])[-50:]
    HISTORY_PATH.write_text(json.dumps(history, indent=2), encoding="utf-8")


    # Alert if webhook set and broken increased
    if ALERT_WEBHOOK:
        prev_rate = history[-2].get("broken_rate", 0) if len(history) > 1 else 0
        if summary["broken_rate"] > (prev_rate + 0.02):
            try:
                import requests
                msg = {
                    "text": f"Santis Audit Alert: broken_rate {prev_rate:.3f} -> {summary['broken_rate']:.3f} (base {BASE_URL})"
                }
                requests.post(ALERT_WEBHOOK, json=msg, timeout=5)
            except Exception:
                pass


    # --------------------------------------------------
    # JSON REPORT FOR AI
    # --------------------------------------------------
    ai_report_path = REPORT_DIR / "audit_result.json"
    
    # Validation Data (Headers, SSL, etc)
    validation_data = {
        "headers": {
            k: {"present": True, "value": v} for k, v in base_headers.items()
        },
        "ssl_info": {
            "valid": BASE_URL.startswith("https"),
        },
        "exposed_files": [] # Filler for now
    }
    
    # Check for specific security headers being MISSING
    for h in ["Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security", "X-Content-Type-Options"]:
        if h not in base_headers:
            validation_data["headers"][h] = {"present": False, "value": None}

    # Performance Data
    perf_data = {
        "ttfb": base_perf.get("ttfb", 0),
        "lcp": 0,
        "cls": 0
    }
    
    full_json = {
        "summary": summary,
        "broken_links": [
             {"url": r["url"], "status": r["status"], "referer": r["referer"], "kind": r["kind"]}
             for r in checked.values() if is_broken(r)
        ],
        "security": validation_data,
        "performance": perf_data,
        "checked_urls": list(checked.keys())
    }
    
    try:
        ai_report_path.write_text(json.dumps(full_json, indent=2), encoding="utf-8")
        print(f"✅ AI Report Generated: {ai_report_path}")
    except Exception as e:
        print(f"❌ Failed to write AI report: {e}")



# --------------------------------------------------
# Main
# --------------------------------------------------
async def main():
    build_slug_map()
    seeds = {f"{BASE_URL}/"} | read_sitemap_urls()
    delay_holder = {"delay": INITIAL_DELAY}

    if not aiohttp:
        # Fallback: sequential requests (rare case)
        import requests
        class DummySession:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def get(self, url, **kw):
                loop = asyncio.get_event_loop()
                resp = await loop.run_in_executor(None, lambda: requests.get(url, timeout=TIMEOUT, allow_redirects=True))
                class R:
                    status = resp.status_code
                    headers = resp.headers
                    url = resp.url
                    async def text(self, errors="replace"):
                        return resp.text
                return R()

        session_ctx = DummySession()
    else:
        session_ctx = aiohttp.ClientSession()

    async with session_ctx as session:
        # 1. PRE-FLIGHT CHECK (BASE URL ANALYSIS)
        # Capture headers and basic perf from Base URL before crawling
        print(f"🚀 Pre-flight check: {BASE_URL}")
        try:
            start_t = time.time()
            async with session.get(BASE_URL, timeout=10, allow_redirects=True) as resp:
                 # Force read to get TTFB roughly
                await resp.text() 
                elapsed = round((time.time() - start_t) * 1000)
                
                # Store globally for reporting
                global base_headers, base_perf
                base_headers = dict(resp.headers)
                base_perf = {"ttfb": elapsed}
                print(f"✅ Base connection established. TTFB: {elapsed}ms")
        except Exception as e:
            print(f"⚠️ Pre-flight failed: {e}")
            base_headers = {}
            base_perf = {"ttfb": 0}

        # 2. CRAWL
        queue = asyncio.Queue()
        for u in seeds:
            await queue.put((normalize(u), 0, ""))
        sem = asyncio.Semaphore(MAX_CONCURRENCY)

        async def worker():
            while True:
                try:
                    url, depth, ref = await queue.get()
                except asyncio.CancelledError:
                    return
                async with sem:
                    await crawl_url(session, url, depth, queue, delay_holder)
                queue.task_done()

        workers = [asyncio.create_task(worker()) for _ in range(MAX_CONCURRENCY)]
        await queue.join()
        for w in workers:
            w.cancel()

    write_reports()
    broken_count = sum(1 for r in checked.values() if isinstance(r["status"], int) and r["status"] >= 400)
    print(f"✅ Tamamlandı. CSV: {CSV_PATH} | HTML: {HTML_PATH} | Broken: {broken_count}")


if __name__ == "__main__":
    asyncio.run(main())
