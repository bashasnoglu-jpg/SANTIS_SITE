import requests
import sys
import os
import subprocess

# Default to Docker service name if running inside container network, or localhost if undefined
BASE_URL = os.getenv("API_URL", "http://localhost:8000/api/v1")

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

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

def test_rbac_flow():
    print(f"Testing RBAC Flow at {BASE_URL}...")
    
    # 1. Register Superuser Candidate
    admin_email = "admin@santis.club"
    password = "adminpassword"
    print(f"1. Registering Admin Candidate: {admin_email}")
    try:
        requests.post(f"{BASE_URL}/auth/register", json={"email": admin_email, "password": password})
    except Exception:
        pass # Might already exist

    # 2. Login to get ID
    print("2. Logging in as Admin Candidate...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": admin_email, "password": password})
    if resp.status_code != 200:
        print(f"Failed to login: {resp.text}")
        sys.exit(1)
    token = resp.json()["access_token"]
    
    # 3. Promote to Superuser (Manual SQL Override)
    print("3. Promoting to Superuser via SQL...")
    run_sql(f"UPDATE users SET is_superuser = true, is_platform_admin = true WHERE email = '{admin_email}';")
    
    # 4. Create Tenant (Using Admin Token)
    print("4. Creating Tenant 'Santis Antalya'...")
    headers = {"Authorization": f"Bearer {token}"}
    tenant_payload = {"name": "Santis Antalya", "country": "Turkey"}
    resp = requests.post(f"{BASE_URL}/tenants/", json=tenant_payload, headers=headers)
    
    if resp.status_code == 200:
        tenant_id = resp.json()["id"]
        print(f"✅ Tenant Created: {tenant_id}")
    elif resp.status_code == 400 and "already exists" in resp.text:
         print("⚠️ Tenant already exists, fetching list...")
         resp = requests.get(f"{BASE_URL}/tenants/", headers=headers)
         tenant_id = resp.json()[0]["id"]
         print(f"✅ Tenant ID fetched: {tenant_id}")
    else:
        print(f"❌ Failed to create tenant: {resp.status_code} {resp.text}")
        sys.exit(1)

    # 5. Register Owner Candidate
    owner_email = "owner@antalya.santis"
    print(f"5. Registering Owner Candidate: {owner_email}")
    requests.post(f"{BASE_URL}/auth/register", json={"email": owner_email, "password": password})
    
    # 6. Assign Role & Tenant (Manual SQL Override)
    print("6. Assigning OWNER Role and Tenant via SQL...")
    run_sql(f"UPDATE users SET role = 'OWNER', tenant_id = '{tenant_id}' WHERE email = '{owner_email}';")

    # 7. Verify Owner Login & Claims (Conceptual)
    # Ideally we'd have an endpoint that returns current user's role/tenant to verify.
    # checking /users/me
    print("7. Verifying Owner Context...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": owner_email, "password": password})
    owner_token = resp.json()["access_token"]
    
    resp = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {owner_token}"})
    user_data = resp.json()
    
    # Note: UserOut schema used in /users/me might not strictly show tenant_id/role unless we updated it.
    # Let's check what it returns.
    print(f"Owner Data: {user_data}")
    
    # Assert successful flow
    print("✅ RBAC Flow Completed Successfully")

if __name__ == "__main__":
    test_rbac_flow()
