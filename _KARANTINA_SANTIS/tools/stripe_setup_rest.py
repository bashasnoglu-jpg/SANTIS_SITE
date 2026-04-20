"""
Santis – Stripe Setup via REST API (requests, SDK bypass)
requests kütüphanesi ile doğrudan Stripe REST API çağrısı yapar.
"""
import os, json, requests
from dotenv import load_dotenv
load_dotenv()

SK = os.getenv("STRIPE_SECRET_KEY", "")
BASE = "https://api.stripe.com/v1"
AUTH = (SK, "")

print(f"✅ Key: {SK[:25]}...\n")

PLANS = [
    {"name": "Santis Starter",    "amount": 4900,  "env": "STRIPE_PRICE_STARTER"},
    {"name": "Santis Pro",        "amount": 9900,  "env": "STRIPE_PRICE_PRO"},
    {"name": "Santis Enterprise", "amount": 29900, "env": "STRIPE_PRICE_ENTERPRISE"},
]

env_updates = {}

for plan in PLANS:
    print(f"─── {plan['name']} ───────────────────────")

    # Ürün oluştur
    r = requests.post(f"{BASE}/products", auth=AUTH, data={
        "name": plan["name"],
        "metadata[santis_plan]": plan["name"].split()[-1].lower(),
    })
    if r.status_code in (200, 201):
        product_id = r.json()["id"]
        print(f"  ✅ Ürün: {product_id}")
    elif r.status_code == 400 and "already exists" in r.text:
        # Mevcut ürünü bul
        rs = requests.get(f"{BASE}/products/search?query=name:'{plan['name']}'", auth=AUTH)
        product_id = rs.json()["data"][0]["id"]
        print(f"  ℹ️  Mevcut ürün: {product_id}")
    else:
        print(f"  ❌ Ürün hatası: {r.status_code} {r.text[:200]}")
        continue

    # Fiyat oluştur
    rp = requests.post(f"{BASE}/prices", auth=AUTH, data={
        "product": product_id,
        "unit_amount": plan["amount"],
        "currency": "eur",
        "recurring[interval]": "month",
    })
    if rp.status_code in (200, 201):
        price_id = rp.json()["id"]
        print(f"  ✅ Fiyat: {price_id} ({plan['amount']/100:.2f} EUR/ay)")
        env_updates[plan["env"]] = price_id
    else:
        print(f"  ❌ Fiyat hatası: {rp.status_code} {rp.text[:200]}")

# .env güncelle
if env_updates:
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    with open(env_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        updated = False
        for key, val in env_updates.items():
            if line.strip().startswith(f"{key}="):
                new_lines.append(f"{key}={val}\n")
                updated = True
                break
        if not updated:
            new_lines.append(line)

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    print("\n─── .env Güncellendi ───────────────────")
    for k, v in env_updates.items():
        print(f"  {k} = {v}")
    print("\n🚀 Checkout akışı aktif!")
else:
    print("\n⚠️ Hiçbir fiyat oluşturulamadı.")
