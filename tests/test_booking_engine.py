import asyncio
import os
import requests
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from datetime import datetime, timedelta

# Default to Docker service name if running inside container network, or localhost if undefined
BASE_URL = os.getenv("API_URL", "http://localhost:8000/api/v1")

def run_sql(sql):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Fallback for local testing if env var missing
        db_url = "postgresql+asyncpg://santis:password@localhost/santis_db"
        
    async def _exec():
        engine = create_async_engine(db_url)
        async with engine.begin() as conn:
            await conn.execute(text(sql))
        await engine.dispose()
        
    asyncio.run(_exec())

def get_admin_token():
    admin_email = "admin@santis.club"
    password = "adminpassword"
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": admin_email, "password": password})
    if resp.status_code != 200:
        print(f"Failed to login as Admin: {resp.text}")
        return None
    return resp.json()["access_token"]

def test_booking_engine():
    print(f"Testing Booking Engine at {BASE_URL}...")
    
    token = get_admin_token()
    if not token:
        # Ensure admin exists and has SUPERUSER role
        print("Creating/Promoting admin...")
        requests.post(f"{BASE_URL}/auth/register", json={"email": "admin@santis.club", "password": "adminpassword"})
        run_sql("UPDATE users SET is_superuser = true, is_platform_admin = true, role = 'OWNER' WHERE email = 'admin@santis.club';")
        token = get_admin_token()
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Ensure Tenant (Reuse or Create) - user should have tenant_id from previous tests.
    # Check current user tenant
    me_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    user_data = me_resp.json()
    tenant_id = user_data.get("tenant_id")
    
    if not tenant_id:
        print("User has no tenant, creating one...")
        t_resp = requests.post(f"{BASE_URL}/tenants/", json={"name": "Santis Test Hotel", "country": "Testland"}, headers=headers)
        if t_resp.status_code == 200:
            tenant_id = t_resp.json()["id"]
        elif t_resp.status_code == 400:
             # fetch existing
             t_list = requests.get(f"{BASE_URL}/tenants/", headers=headers).json()
             tenant_id = t_list[0]["id"]
        
        # Assign tenant to user
        run_sql(f"UPDATE users SET tenant_id = '{tenant_id}' WHERE email = 'admin@santis.club';")
        print(f"Assigned user to tenant {tenant_id}")

    # 2. Create Service "Bali Massage"
    print("2. Creating Service 'Bali Massage'...")
    service_payload = {
        "name": "Bali Massage",
        "duration_minutes": 60,
        "price": 100.0,
        "currency": "EUR"
    }
    svc_resp = requests.post(f"{BASE_URL}/bookings/services", json=service_payload, headers=headers)
    if svc_resp.status_code != 200:
        print(f"Failed to create service: {svc_resp.text}")
        return
    service_id = svc_resp.json()["id"]
    print(f"✅ Service Created: {service_id}")

    # 3. Create Staff "Ayşe"
    print("3. Creating Staff 'Ayşe'...")
    staff_payload = {
        "name": "Ayşe Therapist",
        "role": "Therapist",
        "commission_rate": 0.1
    }
    staff_resp = requests.post(f"{BASE_URL}/bookings/staff", json=staff_payload, headers=headers)
    staff_id = staff_resp.json()["id"]
    print(f"✅ Staff Created: {staff_id}")

    # 4. Create Booking A (10:00 - 11:00)
    print("4. Creating Booking A (10:00 - 11:00)...")
    start_time_a = (datetime.utcnow() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    booking_a_payload = {
        "service_id": service_id,
        "staff_id": staff_id,
        "start_time": start_time_a.isoformat()
    }
    bk_a_resp = requests.post(f"{BASE_URL}/bookings/", json=booking_a_payload, headers=headers)
    if bk_a_resp.status_code != 200:
         print(f"Failed A: {bk_a_resp.text}")
         return
    print("✅ Booking A Created.")

    # 5. Try Create Overlapping Booking B (10:30 - 11:30) -> EXPECT FAIL
    print("5. Attempting Overlap Booking B (10:30 - 11:30)...")
    start_time_b = start_time_a + timedelta(minutes=30)
    booking_b_payload = {
        "service_id": service_id,
        "staff_id": staff_id, # SAME STAFF
        "start_time": start_time_b.isoformat()
    }
    bk_b_resp = requests.post(f"{BASE_URL}/bookings/", json=booking_b_payload, headers=headers)
    
    if bk_b_resp.status_code == 409:
        print("✅ Overlap Prevented! (409 Conflict)")
    else:
        print(f"❌ Overlap Check Failed! Status: {bk_b_resp.status_code}")
        print(bk_b_resp.text)
        return

    # 6. Create Non-Overlapping Booking C (11:00 - 12:00) -> EXPECT SUCCESS
    print("6. Creating Valid Booking C (11:00 - 12:00)...")
    start_time_c = start_time_a + timedelta(minutes=60)
    booking_c_payload = {
        "service_id": service_id,
        "staff_id": staff_id,
        "start_time": start_time_c.isoformat()
    }
    bk_c_resp = requests.post(f"{BASE_URL}/bookings/", json=booking_c_payload, headers=headers)
    if bk_c_resp.status_code == 200:
        print("✅ Booking C Created.")
    else:
        print(f"❌ Booking C Failed: {bk_c_resp.text}")
        return

    print("🎉 Booking Engine Logic Verified!")

if __name__ == "__main__":
    test_booking_engine()
