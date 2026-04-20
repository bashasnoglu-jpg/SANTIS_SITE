"""
Santis – Stripe Product & Price Setup
3 SaaS planı Stripe'ta otomatik oluşturur ve Price ID'lerini döner.
"""
import os, sys

# .env yükle
from dotenv import load_dotenv
load_dotenv()

try:
    import stripe
except ImportError:
    print("stripe paketi yok, kuruluyor...")
    os.system(f"{sys.executable} -m pip install stripe -q")
    import stripe

key = os.getenv("STRIPE_SECRET_KEY", "")
if not key.startswith("sk_"):
    print(f"❌ STRIPE_SECRET_KEY geçersiz: {key[:20]}...")
    sys.exit(1)

stripe.api_key = key
print(f"✅ Stripe bağlı: {key[:20]}...")
print(f"   Mod: {'CANLI' if 'live' in key else 'TEST'}\n")

PLANS = [
    {
        "id":       "starter",
        "name":     "Santis Starter",
        "desc":     "50 AI mesaj, 500 rezervasyon, 1 şube",
        "amount":   4900,   # 49.00 EUR (kuruş cinsinden)
        "currency": "eur",
        "env_key":  "STRIPE_PRICE_STARTER",
    },
    {
        "id":       "pro",
        "name":     "Santis Pro",
        "desc":     "500 AI mesaj, sınırsız rezervasyon, 3 şube",
        "amount":   9900,   # 99.00 EUR
        "currency": "eur",
        "env_key":  "STRIPE_PRICE_PRO",
    },
    {
        "id":       "enterprise",
        "name":     "Santis Enterprise",
        "desc":     "Sınırsız AI, sınırsız rezervasyon, 99 şube",
        "amount":   29900,  # 299.00 EUR
        "currency": "eur",
        "env_key":  "STRIPE_PRICE_ENTERPRISE",
    },
]

env_updates = {}

for plan in PLANS:
    print(f"─── {plan['name']} ──────────────────────────────────")
    try:
        # Mevcut ürün var mı?
        existing = stripe.Product.search(query=f"name:'{plan['name']}'", limit=1)
        if existing.data:
            product = existing.data[0]
            print(f"  ℹ️  Ürün mevcut: {product.id}")
        else:
            product = stripe.Product.create(
                name=plan["name"],
                description=plan["desc"],
                metadata={"santis_plan": plan["id"]},
            )
            print(f"  ✅ Ürün oluşturuldu: {product.id}")

        # Fiyat var mı?
        prices = stripe.Price.list(product=product.id, active=True, limit=5)
        match = next(
            (p for p in prices.data
             if p.unit_amount == plan["amount"] and p.currency == plan["currency"] and p.recurring),
            None
        )

        if match:
            price_id = match.id
            print(f"  ℹ️  Fiyat mevcut: {price_id}")
        else:
            price = stripe.Price.create(
                product=product.id,
                unit_amount=plan["amount"],
                currency=plan["currency"],
                recurring={"interval": "month"},
                metadata={"santis_plan": plan["id"]},
            )
            price_id = price.id
            print(f"  ✅ Fiyat oluşturuldu: {price_id}")

        print(f"  💰 {plan['amount']/100:.2f} {plan['currency'].upper()}/ay")
        env_updates[plan["env_key"]] = price_id

    except Exception as e:
        print(f"  ❌ Hata: {e}")

print("\n─── .env Güncellemesi ──────────────────────────────────")
# .env dosyasını güncelle
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
with open(env_path, "r", encoding="utf-8") as f:
    content = f.read()

for key_name, price_id in env_updates.items():
    # Eski satırı değiştir
    import re
    content = re.sub(
        rf"^{key_name}=.*$",
        f"{key_name}={price_id}",
        content,
        flags=re.MULTILINE
    )
    print(f"  ✅ {key_name}={price_id}")

with open(env_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n✅ .env güncellendi!")
print("\n─── Sonuç Özeti ────────────────────────────────────────")
for k, v in env_updates.items():
    print(f"  {k} = {v}")
print("\n🚀 Checkout artık gerçek Stripe planlarıyla çalışıyor!")
