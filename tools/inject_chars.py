import asyncio
import uuid
import datetime
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.customer import Customer
from app.db.models.service import Service
from app.db.models.booking import Booking, BookingStatus

async def inject_master_characters():
    async with AsyncSessionLocal() as db:
        # Get basics
        t_res = await db.execute(select(Tenant).limit(1))
        tenant = t_res.scalar_one_or_none()
        
        s_res = await db.execute(select(Service).limit(2))
        services = s_res.scalars().all()
        
        if not tenant or not services:
            print("Missing tenant or services.")
            return

        # Create John Wick
        c1 = Customer(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            full_name="John Wick",
            email="jw@continental.com",
            phone="+1 555 123456",
            visit_count=1
        )
        db.add(c1)
        
        # Create Mr. Anderson
        c2 = Customer(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            full_name="Thomas Anderson",
            email="thomas.anderson@metacortex.com",
            phone="+1 555 987654",
            visit_count=3
        )
        db.add(c2)
        
        await db.flush()

        # Create Bookings
        now = datetime.datetime.utcnow()
        b1 = Booking(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            customer_id=c1.id,
            service_id=services[0].id,
            start_time=now - datetime.timedelta(minutes=10),
            end_time=now + datetime.timedelta(minutes=50),
            price_snapshot=250.00,
            status=BookingStatus.CONFIRMED,
            created_at=now
        )
        db.add(b1)
        
        b2 = Booking(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            customer_id=c2.id,
            service_id=services[1].id if len(services) > 1 else services[0].id,
            start_time=now - datetime.timedelta(minutes=5),
            end_time=now + datetime.timedelta(minutes=55),
            price_snapshot=180.00,
            status=BookingStatus.CONFIRMED,
            created_at=now
        )
        db.add(b2)
        
        await db.commit()
        print("Master characters John Wick and Thomas Anderson deployed to the database!")

if __name__ == "__main__":
    asyncio.run(inject_master_characters())
