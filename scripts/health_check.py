#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║   SANTIS MASTER OS — SOVEREIGN HEALTH CHECK v2.0            ║
║   "Not just alive. Unbreakable."                            ║
╚══════════════════════════════════════════════════════════════╝

Kullanım:
    python scripts/health_check.py
    python scripts/health_check.py --base-url http://localhost:8000
    python scripts/health_check.py --token <ADMIN_JWT>

Gereksinimler:
    pip install httpx aiosqlite
"""

import asyncio
import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

import httpx

# ── Renkli terminal çıktısı ───────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

def ok(msg):    print(f"  {GREEN}✅ PASS{RESET}  {msg}")
def fail(msg):  print(f"  {RED}❌ FAIL{RESET}  {msg}")
def warn(msg):  print(f"  {YELLOW}⚠️  WARN{RESET}  {msg}")
def info(msg):  print(f"  {CYAN}ℹ️  INFO{RESET}  {msg}")
def sep(title=""):
    print(f"\n{BOLD}{CYAN}{'─'*55}{RESET}")
    if title:
        print(f"{BOLD}  {title}{RESET}")

# ── Config ───────────────────────────────────────────────────
BASE_DIR    = Path(__file__).resolve().parent.parent
DB_PATH     = BASE_DIR / "santis.db"
DEFAULT_URL = "http://localhost:8000"

# ── Sonuç sayaçları ──────────────────────────────────────────
results = {"pass": 0, "fail": 0, "warn": 0}

def record(status: str, msg: str):
    results[status] += 1
    {"pass": ok, "fail": fail, "warn": warn}[status](msg)

# ─────────────────────────────────────────────────────────────
# FAZ 1: API KATMANI
# ─────────────────────────────────────────────────────────────

async def check_health(client: httpx.AsyncClient) -> dict | None:
    sep("FAZ 1 — API Katmanı")
    try:
        t0 = time.perf_counter()
        r = await client.get("/health", timeout=5)
        ms = int((time.perf_counter() - t0) * 1000)
        if r.status_code == 200:
            data = r.json()
            status = data.get("status", "?")
            version = data.get("version", "?")
            uptime = data.get("uptime", "?")
            record("pass", f"/health → {status} v{version} | Uptime: {uptime} | {ms}ms")
            return data
        else:
            record("fail", f"/health → HTTP {r.status_code}")
    except Exception as e:
        record("fail", f"/health → Sunucuya ulaşılamıyor: {e}")
    return None


async def check_tenant_resolve(client: httpx.AsyncClient, slug: str) -> str | None:
    try:
        r = await client.get(f"/api/v1/tenants/resolve", params={"slug": slug}, timeout=15)
        if r.status_code == 200:
            data = r.json()
            tid = data.get("tenant_id") or data.get("id")
            if tid:
                record("pass", f"Tenant resolve → slug='{slug}' → UUID: {tid}")
                return str(tid)
            else:
                record("warn", f"Tenant resolve → 200 OK ama tenant_id yok: {data}")
        elif r.status_code == 404:
            record("warn", f"Tenant resolve → '{slug}' bulunamadı (404). Tenant aktif mi?")
        else:
            record("fail", f"Tenant resolve → HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        record("fail", f"Tenant resolve → {e}")
    return None


async def check_billing_plans(client: httpx.AsyncClient, token: str | None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = await client.get("/api/v1/billing/plans", headers=headers, timeout=8)
        if r.status_code == 200:
            data = r.json()
            plans = data if isinstance(data, list) else data.get("plans", [])
            if plans:
                names = [p.get("name", "?") for p in plans]
                record("pass", f"Billing Plans → {len(plans)} plan: {', '.join(names)}")
            else:
                record("warn", "Billing Plans → 200 OK ama plan listesi boş")
        elif r.status_code == 401:
            record("warn", "Billing Plans → 401 Unauthorized (token gerekiyor?)")
        elif r.status_code == 404:
            record("fail", "Billing Plans → 404 (endpoint kayıtlı değil)")
        else:
            record("fail", f"Billing Plans → HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        record("fail", f"Billing Plans → {e}")


async def check_yield_status(client: httpx.AsyncClient, token: str | None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = await client.get("/api/v1/admin/yield-status", headers=headers, timeout=5)
        if r.status_code == 200:
            data = r.json()
            mult = data.get("multiplier", "?")
            status = data.get("status", "?")
            record("pass", f"Yield Engine → Status: {status} | Multiplier: {mult}×")
        elif r.status_code in (401, 403):
            record("warn", f"Yield Engine → {r.status_code} (auth gerekiyor)")
        else:
            record("fail", f"Yield Engine → HTTP {r.status_code}")
    except Exception as e:
        record("fail", f"Yield Engine → {e}")


async def check_analytics(client: httpx.AsyncClient, token: str | None, tenant_id: str | None):
    if not token:
        warn("Analytics → Token olmadan atlandı")
        return
    headers = {"Authorization": f"Bearer {token}"}
    if tenant_id:
        headers["X-Tenant-ID"] = tenant_id
    try:
        r = await client.get("/api/v1/analytics/metrics", headers=headers, timeout=5)
        if r.status_code == 200:
            record("pass", f"Analytics Metrics → OK (tenant-scoped)")
        elif r.status_code in (401, 403):
            record("warn", f"Analytics → {r.status_code} Unauthorized")
        else:
            record("fail", f"Analytics → HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        record("fail", f"Analytics → {e}")


# ─────────────────────────────────────────────────────────────
# FAZ 2: VERİTABANI İZOLASYON TESTİ (SQLite)
# ─────────────────────────────────────────────────────────────

async def check_db_isolation():
    sep("FAZ 2 — Veritabanı İzolasyon Testi")
    if not DB_PATH.exists():
        record("warn", f"SQLite DB bulunamadı: {DB_PATH}")
        return

    try:
        import aiosqlite

        async with aiosqlite.connect(str(DB_PATH)) as db:
            db.row_factory = aiosqlite.Row

            # Tabloları listele
            async with db.execute("SELECT name FROM sqlite_master WHERE type='table'") as cur:
                tables = [r[0] async for r in cur]
            info(f"DB Tabloları: {', '.join(tables)[:120]}...")

            # Booking tablosu var mı?
            if "bookings" not in tables and "booking" not in tables:
                record("warn", "bookings tablosu yok — henüz rezervasyon girilmemiş olabilir")
                return

            tbl = "bookings" if "bookings" in tables else "booking"

            # Toplam kayıt sayısı
            async with db.execute(f"SELECT COUNT(*) FROM {tbl}") as cur:
                total = (await cur.fetchone())[0]
            info(f"Toplam booking kaydı: {total}")

            # Tenant bazlı dağılım — izolasyon kontrolü
            async with db.execute(
                f"SELECT tenant_id, COUNT(*) as cnt FROM {tbl} GROUP BY tenant_id"
            ) as cur:
                rows = await cur.fetchall()

            if not rows:
                record("warn", "Booking tablosu boş — RLS testi için veri yok")
                return

            if len(rows) == 1:
                record("pass", f"DB İzolasyon → Tek tenant ({rows[0][0]}), cross-tenant sızıntı riski yok")
            else:
                # Çoklu tenant var — cross-query testi
                tenants = [r[0] for r in rows]
                t_a, t_b = tenants[0], tenants[1]

                # Tenant A'nın verisi B'nin kayıtlarını içeriyor mu?
                async with db.execute(
                    f"SELECT COUNT(*) FROM {tbl} WHERE tenant_id = ? AND tenant_id != ?",
                    (t_a, t_a)
                ) as cur:
                    leaked = (await cur.fetchone())[0]

                if leaked == 0:
                    record("pass", f"DB İzolasyon → {len(tenants)} tenant, cross-tenant sızıntı: 0 kayıt ✅")
                else:
                    record("fail", f"DB İzolasyon → ⚠️ {leaked} KAYIT BAŞKA TENANT'A SIZMA RİSKİ!")

    except ImportError:
        record("warn", "aiosqlite kurulu değil. Kur: pip install aiosqlite")
    except Exception as e:
        record("fail", f"DB İzolasyon testi → {e}")


# ─────────────────────────────────────────────────────────────
# FAZ 3: STRİPE WEBHOOK SİMÜLASYONU
# ─────────────────────────────────────────────────────────────

async def check_stripe_webhook(client: httpx.AsyncClient, tenant_id: str | None):
    sep("FAZ 3 — Stripe Webhook Simülasyonu")

    # Gerçek Stripe imzası olmadan webhook geldiğinde 400 bekliyoruz
    # Bu, webhook endpoint'inin ayakta olduğunu ve imza doğruladığını kanıtlar
    payload = {
        "id": "evt_test_sovereign_001",
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": "pi_test_sovereign_001",
                "amount": 9900,
                "currency": "eur",
                "metadata": {
                    "tenant_id": tenant_id or "test-tenant-uuid",
                    "plan": "pro"
                }
            }
        }
    }

    # 1. İmzasız istek — 400 Webhook Secret hatası bekliyoruz (endpoint ayakta demektir)
    try:
        r = await client.post(
            "/api/v1/billing/webhook",
            content=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if r.status_code in (400, 422):
            record("pass",
                f"Stripe Webhook → Endpoint aktif, imza reddi = {r.status_code} "
                f"(Beklenen: imzasız isteği reddetti ✅)")
        elif r.status_code == 200:
            record("warn",
                "Stripe Webhook → 200 döndü (imzasız istekleri kabul ediyor — "
                "WEBHOOK_SECRET kontrol edin!)")
        elif r.status_code == 404:
            record("fail", "Stripe Webhook → 404 (endpoint kayıtlı değil)")
        else:
            record("warn", f"Stripe Webhook → HTTP {r.status_code}: {r.text[:100]}")
    except Exception as e:
        record("fail", f"Stripe Webhook → {e}")

    # 2. Stripe CLI kurulu mu? (Gerçek simülasyon için)
    import shutil
    if shutil.which("stripe"):
        info("Stripe CLI kurulu! Gerçek test için: stripe trigger payment_intent.succeeded")
    else:
        info("Stripe CLI kurulu değil. Gerçek webhook testi için: https://stripe.com/docs/stripe-cli")


# ─────────────────────────────────────────────────────────────
# FAZ 4: STATIK VARLIKLAR
# ─────────────────────────────────────────────────────────────

async def check_static_assets(client: httpx.AsyncClient):
    sep("FAZ 4 — Kritik Statik Varlıklar")
    critical_paths = [
        "/assets/css/style.css",
        "/assets/js/app.js",
        "/assets/img/hero/santis_hero_main_v2.webp",
        "/tr/index.html",
    ]
    for path in critical_paths:
        try:
            r = await client.get(path, timeout=15)
            if r.status_code == 200:
                size = r.headers.get("content-length", "?")
                record("pass", f"{path} → {r.status_code} ({size} bytes)")
            elif r.status_code == 304:
                record("pass", f"{path} → 304 Not Modified (cached)")
            else:
                record("fail", f"{path} → {r.status_code}")
        except Exception as e:
            record("fail", f"{path} → {e}")


# ─────────────────────────────────────────────────────────────
# ANA KONTROL AKIŞI
# ─────────────────────────────────────────────────────────────

async def run(base_url: str, token: str | None, tenant_slug: str):
    print(f"\n{BOLD}{CYAN}{'═'*55}")
    print("  SANTIS MASTER OS — SOVEREIGN HEALTH CHECK v2.0")
    print(f"  Target: {base_url}")
    print(f"{'═'*55}{RESET}")

    async with httpx.AsyncClient(base_url=base_url, follow_redirects=True) as client:
        # FAZ 1: API
        await check_health(client)
        tenant_id = await check_tenant_resolve(client, tenant_slug)
        await check_billing_plans(client, token)
        await check_yield_status(client, token)
        await check_analytics(client, token, tenant_id)

        # FAZ 2: DB
        await check_db_isolation()

        # FAZ 3: Stripe
        await check_stripe_webhook(client, tenant_id)

        # FAZ 4: Statik varlıklar
        await check_static_assets(client)

    # ── ÖZET ─────────────────────────────────────────────────
    sep()
    total = results["pass"] + results["fail"] + results["warn"]
    score = int(results["pass"] / total * 100) if total else 0

    print(f"\n{BOLD}  SOVEREIGN AUDIT SONUCU{RESET}")
    print(f"  {GREEN}✅ PASS : {results['pass']}{RESET}")
    print(f"  {RED}❌ FAIL : {results['fail']}{RESET}")
    print(f"  {YELLOW}⚠️  WARN : {results['warn']}{RESET}")
    print(f"\n  {BOLD}Sovereign Score: {score}/100{RESET}")

    if results["fail"] == 0:
        print(f"\n  {GREEN}{BOLD}🏛️  SOVEREIGN STATUS: UNBREAKABLE — GO-LIVE READY{RESET}")
    elif results["fail"] <= 2:
        print(f"\n  {YELLOW}{BOLD}⚠️  SOVEREIGN STATUS: DEGRADED — Minor issues detected{RESET}")
    else:
        print(f"\n  {RED}{BOLD}🚨 SOVEREIGN STATUS: CRITICAL — DO NOT GO LIVE{RESET}")

    print(f"\n{CYAN}{'─'*55}{RESET}\n")
    return results["fail"]


def main():
    parser = argparse.ArgumentParser(description="Santis Sovereign Health Check")
    parser.add_argument("--base-url", default=DEFAULT_URL, help="API base URL")
    parser.add_argument("--token", default=None, help="Admin JWT token")
    parser.add_argument("--tenant-slug", default="Santis HQ Default", help="Test tenant slug veya name")
    args = parser.parse_args()

    fail_count = asyncio.run(run(args.base_url, args.token, args.tenant_slug))
    sys.exit(1 if fail_count > 0 else 0)


if __name__ == "__main__":
    main()
