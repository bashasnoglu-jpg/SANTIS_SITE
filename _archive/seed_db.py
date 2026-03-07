import asyncio
import uuid
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Import Models
from app.db.base import Base
from app.db.models.tenant import Tenant
from app.db.models.service import Service
from app.db.models.room import Room
from app.db.models.staff import Staff
from app.db.models.customer import Customer
from app.db.models.booking import Booking, BookingStatus
from app.db.models.revenue import DailyRevenue
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def seed_data():
    async with engine.begin() as conn:
        print("Bütün tablolar yeniden oluşturuluyor...")
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        print("Eski veriler temizleniyor...")
        await session.execute(text("DELETE FROM daily_revenue"))
        await session.execute(text("DELETE FROM bookings"))
        await session.execute(text("DELETE FROM customers"))
        await session.execute(text("DELETE FROM staff"))
        await session.execute(text("DELETE FROM rooms"))
        await session.execute(text("DELETE FROM services"))
        await session.execute(text("DELETE FROM tenants"))
        await session.commit()

        print("1. Oteller (Tenants) ekleniyor...")
        t1 = Tenant(name="Delphin Be Grand", country="Turkey", is_active=True)
        t2 = Tenant(name="Santis Resort & Spa", country="Montenegro", is_active=True)
        session.add_all([t1, t2])
        await session.commit()
        await session.refresh(t1)
        await session.refresh(t2)

        print("2. Servisler ekleniyor...")
        s1 = Service(tenant_id=t1.id, name="Deep Tissue Massage", duration_minutes=60, price=180.0, currency="EUR", is_active=True)
        s2 = Service(tenant_id=t1.id, name="Couples Relax", duration_minutes=90, price=350.0, currency="EUR", is_active=True)
        s3 = Service(tenant_id=t1.id, name="Sothys Face Therapy", duration_minutes=45, price=150.0, currency="EUR", is_active=True)
        s4 = Service(tenant_id=t1.id, name="Golden Hamam Ritual", duration_minutes=60, price=200.0, currency="EUR", is_active=True)
        session.add_all([s1, s2, s3, s4])
        await session.commit()
        
        print("3. Odalar ve Terapistler (Rooms & Staff) ekleniyor...")
        r1 = Room(tenant_id=t1.id, name="Bali VIP 1", capacity=2, is_active=True)
        r2 = Room(tenant_id=t1.id, name="Hamam 1", capacity=4, is_active=True)
        st1 = Staff(tenant_id=t1.id, name="Ali", role="Senior Therapist")
        st2 = Staff(tenant_id=t1.id, name="Veli", role="Hamam Master")
        session.add_all([r1, r2, st1, st2])
        await session.commit()
        
        print("4. Müşteriler (Customers) ekleniyor...")
        c1 = Customer(tenant_id=t1.id, full_name="Mr. Anderson", email="neo@matrix.com", phone="+1555123456", visit_count=5, total_spent=1200.0)
        c2 = Customer(tenant_id=t1.id, full_name="Jane Doe", email="jane@doe.com", phone="+1555987654", visit_count=1, total_spent=350.0)
        c3 = Customer(tenant_id=t1.id, full_name="John Wick", email="john@wick.com", phone="+1555000000", visit_count=2, total_spent=600.0)
        session.add_all([c1, c2, c3])
        await session.commit()
        
        print("5. Rezervasyonlar (Bookings) ekleniyor...")
        now = datetime.utcnow()
        b1 = Booking(tenant_id=t1.id, customer_id=c1.id, service_id=s1.id, room_id=r1.id, staff_id=st1.id,
                     start_time=now + timedelta(hours=1), end_time=now + timedelta(hours=2),
                     price_snapshot=180.0, status=BookingStatus.PENDING)
        b2 = Booking(tenant_id=t1.id, customer_id=c2.id, service_id=s2.id, room_id=r1.id, staff_id=st2.id,
                     start_time=now - timedelta(hours=2), end_time=now - timedelta(hours=1),
                     price_snapshot=350.0, status=BookingStatus.COMPLETED)
        b3 = Booking(tenant_id=t1.id, customer_id=c3.id, service_id=s4.id, room_id=r2.id, staff_id=st2.id,
                     start_time=now + timedelta(days=1, hours=2), end_time=now + timedelta(days=1, hours=3),
                     price_snapshot=200.0, status=BookingStatus.CONFIRMED)
        session.add_all([b1, b2, b3])
        await session.commit()
        
        print("6. Gelir Takibi (Daily Revenue) ekleniyor...")
        today = date.today()
        dr1 = DailyRevenue(tenant_id=t1.id, date=today, daily_revenue=3100.0, booking_count=18)
        dr2 = DailyRevenue(tenant_id=t1.id, date=today - timedelta(days=1), daily_revenue=2800.0, booking_count=15)
        dr3 = DailyRevenue(tenant_id=t1.id, date=today - timedelta(days=2), daily_revenue=3400.0, booking_count=22)
        dr4 = DailyRevenue(tenant_id=t1.id, date=today - timedelta(days=3), daily_revenue=4100.0, booking_count=26)
        dr5 = DailyRevenue(tenant_id=t1.id, date=today - timedelta(days=4), daily_revenue=1900.0, booking_count=10)
        dr6 = DailyRevenue(tenant_id=t1.id, date=today - timedelta(days=5), daily_revenue=2200.0, booking_count=12)
        dr7 = DailyRevenue(tenant_id=t1.id, date=today - timedelta(days=6), daily_revenue=3800.0, booking_count=24)
        session.add_all([dr1, dr2, dr3, dr4, dr5, dr6, dr7])
        await session.commit()

        print("Santis Master OS başarıyla canlandırıldı (Veritabanı Dolduruldu)!")

if __name__ == "__main__":
    asyncio.run(seed_data())
