import asyncio
import sys
import os
import uuid
import json
import requests
from pathlib import Path

# Adjust path to find app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# App imports
from app.core import security
from app.core.config import settings
from app.db.models.user import User, UserRole
from app.db.models.tenant import Tenant

# Setup Async DB
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

BASE_URL = "http://localhost:8000"

def get_token(email, password="password"):
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed for {email}: {resp.text}")
        return None
    return resp.json()["access_token"]

async def setup_test_users(session: AsyncSession):
    # Ensure Superuser exists
    admin_email = "super_phase_c@santis.com"
    user_email = "user_phase_c@santis.com"
    tenant_name = "PhaseC_Tenant"
    
    # Cleanup (Order matters: Users first, then Tenant)
    await session.execute(text(f"DELETE FROM users WHERE email IN ('{admin_email}', '{user_email}')"))
    await session.execute(text(f"DELETE FROM tenants WHERE name = '{tenant_name}'"))
    await session.commit()
    
    # Create Superuser (Admin Access)
    t_id = uuid.uuid4()
    tenant = Tenant(id=t_id, name=tenant_name, country="TR")
    session.add(tenant)
    
    admin = User(
        email=admin_email,
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=True,
        role=UserRole.OWNER,
        tenant_id=t_id
    )
    
    # Create Regular User (No Admin)
    user = User(
        email=user_email,
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=False,
        role=UserRole.USER,
        tenant_id=t_id
    )
    
    session.add(admin)
    session.add(user)
    await session.commit()
    
    print(f"Created Test Users: {admin_email}, {user_email}")
    return admin_email, user_email

def test_bridge_save(token, source, lang, content, expected_code=200):
    url = f"{BASE_URL}/api/bridge/save"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "sourcePath": source,
        "targetLang": lang,
        "content": content
    }
    
    print(f"   POST /api/bridge/save ({source} -> {lang})")
    resp = requests.post(url, json=payload, headers=headers)
    
    print(f"   RESULT: {resp.status_code}")
    if resp.status_code == expected_code:
        if expected_code == 200:
            print(f"   RESPONSE: {resp.json()}")
        print("   ✅ PASS")
        return resp.json() if expected_code == 200 else None
    else:
        print(f"   ❌ FAIL: {resp.text}")
        return None

async def main():
    async with AsyncSessionLocal() as session:
        admin_email, user_email = await setup_test_users(session)
        
        # Get Tokens
        # Need to ensure server is running and DB is accessible by server
        # Current script sets up DB directly. Server authenticates via DB.
        
        print("\n--- Phase C Verification ---")
        
        admin_token = get_token(admin_email)
        user_token = get_token(user_email)
        
        if not admin_token or not user_token:
            print("❌ Tokens failed. Is server running?")
            return

        # 1. Unauthorized Access
        print("\n[Test 1] Regular User tries to Save Content (Should Block)")
        test_bridge_save(user_token, "tr/masajlar/index.html", "en", "FAIL CONTENT", expected_code=403)
        
        # 2. Authorized Access (Superuser)
        print("\n[Test 2] Superuser Saves Content (Should Succeed)")
        # Use a path we know resolves: tr/masajlar/index.html -> massages/index.html
        content = "<!-- VERIFY_PHASE_C --> <h1>Verified Content</h1>"
        resp = test_bridge_save(admin_token, "tr/masajlar/index.html", "en", content, expected_code=200)
        
        if resp:
            # Check file on disk
            path = resp.get("fullPath")
            if path and os.path.exists(path):
                print(f"   ✅ File Write Verified: {path}")
                with open(path, "r", encoding="utf-8") as f:
                    if "VERIFY_PHASE_C" in f.read():
                        print("   ✅ Content Verified")
                    else:
                        print("   ❌ Content Mismatch")
            else:
                 print(f"   ❌ File Missing: {path}")
                 
        # 3. Registry Update Check
        # available-routes.json should now have "en": "massages/index.html" for "masajlar/index.html" key.
        # It supposedly already did.
        # Let's try a NEW route? 
        # "tr/yeni-sayfa.html" -> "new-page.html" (if smart mirror/heuristic works)
        # engine.resolve_filesystem_path("tr/yeni-sayfa.html", "en") -> "en/yeni-sayfa.html" (Fallback)
        
        print("\n[Test 3] Registry Update (New Route)")
        new_source = "tr/test-phase-c.html"
        new_content = "<h1>New Page</h1>"
        resp = test_bridge_save(admin_token, new_source, "en", new_content, expected_code=200)
        
        if resp:
            fs_path = resp.get("fullPath")
            print(f"   Created: {fs_path}")
            # Check logic: Fallback likely /en/test-phase-c.html
            
        print("\n🎉 Phase C Verification Complete!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
