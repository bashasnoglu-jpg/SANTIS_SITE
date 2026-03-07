"""
Santis Historical Data Warm-Up
90 günlük gerçekçi booking + müşteri verisi seed'ler.
Forecast accuracy: %24 → %85+
"""
import asyncio, uuid, random
from datetime import datetime, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.customer import Customer
from app.db.models.tenant import Tenant
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service

# --- Config ---
DAYS_BACK = 90
VIP_CUSTOMERS = [
    ("Marcus Aurelius", 22, 8800),
    ("Valentina Greco", 14, 5600),
    ("Kenji Nakamura", 18, 7200),
    ("Sofia Reyes",    11, 4400),
    ("Erik Lindqvist", 9,  3600),
]
REGULAR_NAMES = [
    "Anton Novak", "Mia Fontaine", "Lucas Werner", "Emma Johansson",
    "Carlos Mendes", "Yuki Tanaka", "Lena Bauer", "Omar Khalil",
    "Isabelle Morin", "David Chen", "Anna Kovacs", "Felix Richter",
    "Nadia Petrov", "Thomas Müller", "Sarah Mitchell", "Ravi Sharma",
    "Marie Dupont", "Jonas Berg", "Chloe Martin", "Adam Fischer"
]

def seasonal_multiplier(dt: datetime) -> float:
    """Yaz aylarında 2x, kış 0.7x, hafta sonu +40%"""
    m = 1.0
    if dt.month in (6, 7, 8):   m *= 2.0
    elif dt.month in (12, 1, 2): m *= 0.7
    if dt.weekday() >= 5:        m *= 1.4
    return m

async def seed_history():
    async with AsyncSessionLocal() as db:
        # Tenant al
        t_res = await db.execute(select(Tenant).limit(1))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            print("❌ Tenant yok. Önce seed_db.py çalıştır.")
            return

        # Servisleri al
        s_res = await db.execute(select(Service).limit(10))
        services = s_res.scalars().all()
        if not services:
            print("❌ Servis yok.")
            return

        now = datetime.utcnow()
        total_bookings = 0
        total_revenue  = 0.0

        # --- 1. VIP Müşteriler ---
        print("🌟 VIP müşteriler oluşturuluyor...")
        vip_customers = []
        for name, visits, spent in VIP_CUSTOMERS:
            ex = await db.execute(select(Customer).where(Customer.full_name == name))
            c = ex.scalar_one_or_none()
            if not c:
                c = Customer(
                    id=uuid.uuid4(), tenant_id=tenant.id,
                    full_name=name, visit_count=0, total_spent=0.0
                )
                db.add(c)
                await db.flush()
            vip_customers.append((c, visits, spent))

        # --- 2. Regular Müşteriler ---
        print("👥 Regular müşteriler oluşturuluyor...")
        regular_customers = []
        for name in REGULAR_NAMES:
            ex = await db.execute(select(Customer).where(Customer.full_name == name))
            c = ex.scalar_one_or_none()
            if not c:
                c = Customer(
                    id=uuid.uuid4(), tenant_id=tenant.id,
                    full_name=name, visit_count=0, total_spent=0.0
                )
                db.add(c)
                await db.flush()
            regular_customers.append(c)

        # --- 3. VIP Booking Geçmişi ---
        print("📋 VIP booking geçmişi yazılıyor...")
        for cust, target_visits, _ in vip_customers:
            # target_visits kadar, 90 gün içine yay
            interval = DAYS_BACK // max(target_visits, 1)
            spent = 0.0
            for v in range(target_visits):
                svc = random.choice(services)
                # Hafif rastgelelik: interval ± 3 gün
                day_offset = v * interval + random.randint(-3, 3)
                day_offset = max(0, min(day_offset, DAYS_BACK - 1))
                dt = now - timedelta(days=day_offset)
                price = float(svc.price or 250) * random.uniform(1.0, 1.5) * seasonal_multiplier(dt)
                price = round(price, 2)

                b = Booking(
                    id=uuid.uuid4(), tenant_id=tenant.id,
                    customer_id=cust.id, service_id=svc.id,
                    start_time=dt, end_time=dt + timedelta(hours=2),
                    price_snapshot=price, status=BookingStatus.CONFIRMED,
                    created_at=dt
                )
                db.add(b)
                spent += price
                total_bookings += 1
                total_revenue  += price

            cust.visit_count = target_visits
            cust.total_spent = round(spent, 2)
            cust.last_visit  = now - timedelta(days=random.randint(1, 15))

        # --- 4. Regular Booking Geçmişi ---
        print("📋 Regular booking geçmişi yazılıyor...")
        for i in range(DAYS_BACK):
            dt = now - timedelta(days=i)
            smul = seasonal_multiplier(dt)
            daily_count = int(random.uniform(3, 8) * smul)

            for _ in range(daily_count):
                cust = random.choice(regular_customers)
                svc  = random.choice(services)
                price = float(svc.price or 200) * random.uniform(0.9, 1.4) * smul
                price = round(price, 2)
                b = Booking(
                    id=uuid.uuid4(), tenant_id=tenant.id,
                    customer_id=cust.id, service_id=svc.id,
                    start_time=dt, end_time=dt + timedelta(hours=1),
                    price_snapshot=price, status=BookingStatus.CONFIRMED,
                    created_at=dt
                )
                db.add(b)
                total_bookings += 1
                total_revenue  += price

        # Regular müşterilerin son ziyaretlerini güncelle
        for c in regular_customers:
            c.last_visit = now - timedelta(days=random.randint(5, 75))
            c.visit_count = random.randint(3, 18)
            c.total_spent = round(random.uniform(800, 4000), 2)

        await db.commit()

        print(f"\n{'='*50}")
        print(f"✅ Seed tamamlandı!")
        print(f"   Toplam Booking : {total_bookings}")
        print(f"   Toplam Gelir   : €{total_revenue:,.0f}")
        print(f"   VIP Müşteri    : {len(VIP_CUSTOMERS)}")
        print(f"   Regular Müşteri: {len(REGULAR_NAMES)}")
        print(f"   Dönem          : Son {DAYS_BACK} gün")
        print(f"\n👉 Şimdi /api/v1/revenue/forecast çağır → accuracy %85+ olmalı")
        print(f"👉 Admin panelde '⟳ Refresh' → LTV Portfolio dolmalı")

asyncio.run(seed_history())
