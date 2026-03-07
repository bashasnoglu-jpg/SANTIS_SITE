"""
John Wick – CONTINENTAL Seed Script
VIP Score hedefi: 100/100
"""
import asyncio, uuid
from datetime import datetime, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.customer import Customer
from app.db.models.tenant import Tenant
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service

async def seed_john_wick():
    async with AsyncSessionLocal() as db:
        # 1. Mevcut John Wick'i kontrol et
        existing = await db.execute(select(Customer).where(Customer.full_name == "John Wick"))
        jw = existing.scalar_one_or_none()

        # 2. Tenant al
        tenant_res = await db.execute(select(Tenant).limit(1))
        tenant = tenant_res.scalar_one_or_none()
        if not tenant:
            print("❌ Tenant bulunamadı. Önce seed_db.py çalıştır.")
            return

        # 3. Servis al
        svc_res = await db.execute(select(Service).limit(1))
        svc = svc_res.scalar_one_or_none()

        if not jw:
            jw = Customer(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                full_name="John Wick",
                email=None,
                phone=None,
                notes="Handle with absolute discretion. Continental Protocol active.",
                visit_count=0,
                total_spent=0.0,
                last_visit=None
            )
            db.add(jw)
            await db.flush()
            print(f"✅ John Wick oluşturuldu: {jw.id}")
        else:
            print(f"ℹ️  John Wick zaten mevcut: {jw.id}")

        # 4. 20 adet yüksek değerli booking ekle (CONTINENTAL için)
        services_pool = [
            ("Royal Hamam", 490),
            ("The Continental Package", 1200),
            ("Protocol Alpha – Deep Tissue", 380),
            ("Sothys Diamond Facial", 320),
            ("Thai Massage Ritual", 250),
        ]
        added = 0
        for i in range(20):
            svc_name, price = services_pool[i % len(services_pool)]
            booking = Booking(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                customer_id=jw.id,
                service_id=svc.id if svc else None,
                start_time=datetime.utcnow() - timedelta(days=i * 5),
                end_time=datetime.utcnow() - timedelta(days=i * 5) + timedelta(hours=2),
                price_snapshot=price,
                status=BookingStatus.CONFIRMED
            )
            db.add(booking)
            added += 1

        # 5. Toplam güncelle
        total = sum(p for _, p in services_pool) * 4  # 5 servis × 4 döngü
        jw.visit_count = 20
        jw.total_spent = float(total)
        jw.last_visit = datetime.utcnow()

        await db.commit()

        # VIP Skor hesapla
        vip_score = min(100, int(
            (min(20, 20) / 20 * 40) +
            (min(total, 5000) / 5000 * 40) +
            (20 if total > 1000 else 0)
        ))
        print(f"\n🎯 John Wick Seed Tamamlandı!")
        print(f"   Bookings eklendi : {added}")
        print(f"   Toplam harcama   : €{total:,.0f}")
        print(f"   VIP Score        : {vip_score}/100")
        tier = "CONTINENTAL" if vip_score >= 80 else "PLATINUM" if vip_score >= 60 else "GOLD"
        print(f"   VIP Tier         : {tier} 🌟")
        print(f"\n👉 Admin panelde '⟳ Refresh' yap, sonra '✦ Generate AI Persona' tıkla.")

asyncio.run(seed_john_wick())
