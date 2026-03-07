"""
Santis – Sovereign Health Check v2
Gerçek endpoint path'leri ile test eder.
"""
import urllib.request
import urllib.error
import json
import sys

BASE = "http://localhost:8000"

ENDPOINTS = [
    ("GET",  "/api/v1/admin/system/health",    "System Health"),
    ("GET",  "/api/health",                    "DB/API Health"),
    ("GET",  "/api/v1/billing/plans",          "Billing Plans"),
    ("POST", "/api/v1/webhook/stripe",         "Stripe Webhook"),
    ("GET",  "/api/admin/yield-status",        "Yield Status"),
    ("GET",  "/",                              "Ana Sayfa"),
]

print("=" * 65)
print("🏆  SANTIS SOVEREIGN HEALTH CHECK v2")
print("=" * 65)

passed = 0
results = []

for method, path, label in ENDPOINTS:
    url = BASE + path
    try:
        req = urllib.request.Request(url, method=method)
        req.add_header("Content-Type", "application/json")
        if method == "POST":
            req.data = b"{}"
        with urllib.request.urlopen(req, timeout=6) as resp:
            code = resp.status
            body = resp.read(200).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        code = e.code
        body = ""
    except Exception as e:
        code = f"ERR"
        body = str(e)[:60]

    # Stripe webhook: 200 veya 400/422 kabul edilir (signature required), 500 = hata
    if path == "/api/v1/webhook/stripe":
        ok = isinstance(code, int) and code != 500
        note = f"(500=DB hatası, {code}=OK)" if code != 500 else "❌ 500 PostgreSQL sorunu"
    elif isinstance(code, int) and code < 500:
        ok = True
        note = ""
    else:
        ok = False
        note = f"→ {body[:60]}"

    if ok:
        passed += 1

    icon = "✅" if ok else "❌"
    print(f"  {icon}  {label:<25} HTTP {code}  {note}")
    results.append({"label": label, "path": path, "code": str(code), "ok": ok})

total = len(ENDPOINTS)
pct = int(passed / total * 100)
print("\n" + "─" * 65)

if passed == total:
    bar = "█" * 10
    print(f"🎯 SOVEREIGN SCORE: {passed}/{total} → {pct}/100  {bar}  FULL GREEN 🚀")
else:
    filled = int(passed / total * 10)
    bar = "█" * filled + "░" * (10 - filled)
    print(f"⚡ SOVEREIGN SCORE: {passed}/{total} → {pct}/100  {bar}")

print("=" * 65)

with open("health_result.txt", "w", encoding="utf-8") as f:
    json.dump({"score": passed, "total": total, "pct": pct, "results": results}, f, ensure_ascii=False, indent=2)
print("📄 Sonuç: health_result.txt")
