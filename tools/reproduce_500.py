import asyncio
import sys
import os
from sqlalchemy import select
from datetime import datetime, timedelta
import uuid

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.booking import Booking, BookingStatus
from app.db.models.customer import Customer
from app.db.models.service import Service
from app.db.models.staff import Staff
from app.db.models.room import Room

async def seed_and_test():
    async with AsyncSessionLocal() as db:
        print("1. Getting Admin User...")
        result = await db.execute(select(User).where(User.email == "admin@santis.com"))
        admin = result.scalar_one_or_none()
        if not admin:
            print("Admin not found!")
            return

        print(f"Admin Tenant: {admin.tenant_id}")
        
        # 2. Check/Create Service
        # Try to find specific service first
        result = await db.execute(select(Service).where(Service.name == "Deep Tissue Massage"))
        service = result.scalars().first()
        if not service:
            # Fallback to any service
            result = await db.execute(select(Service).limit(1))
            service = result.scalars().first()
            
        if not service:
            print("Creating dummy service...")
            service = Service(
                tenant_id=admin.tenant_id,
                name="Deep Tissue Massage",
                duration_minutes=60,
                price=100.0,
                currency="EUR"
            )
            db.add(service)
            try:
                await db.flush()
            except Exception as e:
                print(f"Service creation failed (likely exists): {e}")
                await db.rollback()
                result = await db.execute(select(Service).limit(1))
                service = result.scalars().first()
        
        print(f"Using Service: {service.id}")

        # 3. Check/Create Customer
        result = await db.execute(select(Customer).where(Customer.full_name == "John Doe"))
        customer = result.scalars().first()
        if not customer:
             # Fallback
            result = await db.execute(select(Customer).limit(1))
            customer = result.scalars().first()

        if not customer:
            print("Creating dummy customer...")
            customer = Customer(
                tenant_id=admin.tenant_id,
                full_name="John Doe",
                phone="+905551234567",
                visit_count=0,
                total_spent=0
            )
            db.add(customer)
            try:
                await db.flush()
            except Exception as e:
                print(f"Customer creation failed: {e}")
                await db.rollback()
                result = await db.execute(select(Customer).limit(1))
                customer = result.scalars().first()

        print(f"Using Customer: {customer.id}")
            
        # 4. Create Booking
        print("Creating test booking...")
        start_time = datetime.utcnow() + timedelta(days=1)
        end_time = start_time + timedelta(minutes=60)
        
        booking = Booking(
            tenant_id=admin.tenant_id,
            user_id=admin.id,
            customer_id=customer.id,
            service_id=service.id,
            start_time=start_time,
            end_time=end_time,
            price_snapshot=100.0,
            status=BookingStatus.PENDING
        )
        try:
            db.add(booking)
            await db.commit()
            print(f"Booking created: {booking.id}")
        except Exception as e:
            print(f"Booking creation failed: {e}")
            if hasattr(e, 'orig'):
                print(f"Original error: {e.orig}")
            # Try to find existing booking
            await db.rollback()
            result = await db.execute(select(Booking).limit(1))
            booking = result.scalars().first()
            if booking:
                print(f"Using existing booking: {booking.id}")
            else:
                print("No booking found or created. Exiting.")
                return
        
    # Now try to fetch it via API logic (simulated)
    # or just use requests to hit the actual endpoint
    import requests
    
    print("\n5. Fetching via API...")
    try:
        # Login first
        auth_resp = requests.post("http://localhost:8000/api/v1/auth/login", data={
            "username": "admin@santis.com", 
            "password": "admin123"
        })
        token = auth_resp.json()["access_token"]
        
        # Fetch
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(
            "http://localhost:8000/api/v1/bookings/",
            headers=headers,
            params={
                "start_date": datetime.now().isoformat(),
                "end_date": (datetime.now() + timedelta(days=365)).isoformat()
            }
        )
        if resp.status_code == 200:
            print("Success! JSON:", resp.json())
        else:
            print(f"Failed: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"API Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(seed_and_test())
