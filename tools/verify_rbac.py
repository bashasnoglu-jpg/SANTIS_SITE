import asyncio
import sys
import os
import uuid
import uuid as uuid_lib

# Adjust path to find app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select

from app.core import security
from app.core.config import settings
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.audit import AuditLog
from app.core.permissions import Permission
from app.db.models.user import UserRole

# Setup Async DB
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def setup_test_data(session: AsyncSession):
    print("--- SETUP TEST DATA ---")
    
    # 1. Cleaner: Drop test users/tenants if exist
    await session.execute(text("DELETE FROM audit_logs WHERE details LIKE '%rbac_test%'"))
    await session.execute(text("DELETE FROM users WHERE email LIKE '%rbac_test%'"))
    await session.execute(text("DELETE FROM tenants WHERE name LIKE '%RBAC_Test_Tenant%'"))
    await session.commit()
    
    # 2. Create Tenants
    t1_id = uuid.uuid4()
    t2_id = uuid.uuid4()
    
    t1 = Tenant(id=t1_id, name="RBAC_Test_Tenant_1", country="TR", is_active=True)
    t2 = Tenant(id=t2_id, name="RBAC_Test_Tenant_2", country="TR", is_active=True)
    
    session.add(t1)
    session.add(t2)
    # 3. Create Users
    
    # Superadmin (OWNER of T1, but has superuser flag)
    admin_id = uuid.uuid4()
    admin = User(
        id=admin_id,
        email="super_rbac_test@santis.com",
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=True,
        role=UserRole.OWNER,
        tenant_id=t1_id,
        is_platform_admin=True
    )
    
    # Tenant Admin T1
    ta1_id = uuid.uuid4()
    ta1 = User(
        id=ta1_id,
        email="manager_t1_rbac_test@santis.com",
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=False,
        role=UserRole.MANAGER,
        tenant_id=t1_id
    )
    
    # Tenant Admin T2
    ta2_id = uuid.uuid4()
    ta2 = User(
        id=ta2_id,
        email="manager_t2_rbac_test@santis.com",
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=False,
        role=UserRole.MANAGER,
        tenant_id=t2_id
    )

    # User T1 (Target)
    u1_id = uuid.uuid4()
    u1 = User(
        id=u1_id,
        email="user_t1_rbac_test@santis.com",
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=False,
        role=UserRole.USER,
        tenant_id=t1_id
    )
    
    # User T2 (Target)
    u2_id = uuid.uuid4()
    u2 = User(
        id=u2_id,
        email="user_t2_rbac_test@santis.com",
        hashed_password=security.get_password_hash("password"),
        is_active=True,
        is_superuser=False,
        role=UserRole.USER,
        tenant_id=t2_id
    )
    
    session.add(admin)
    session.add(ta1)
    session.add(ta2)
    session.add(u1)
    session.add(u2)
    
    await session.commit()
    
    print(f"Created Tenants: {t1_id}, {t2_id}")
    print(f"Created Users: Super({admin_id}), TA1({ta1_id}), TA2({ta2_id}), U1({u1_id}, U2({u2_id})")
    
    return {
        "t1": t1_id, "t2": t2_id,
        "super": admin, "ta1": ta1, "ta2": ta2,
        "u1": u1, "u2": u2
    }

import requests

BASE_URL = "http://localhost:8000/api/v1"

def get_token(email, password="password"):
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed for {email}: {resp.text}")
        return None
    return resp.json()["access_token"]

def test_delete_user(token, target_id, scenario_name, expected_code=200):
    print(f"   TEST: {scenario_name} -> DELETE /users/{target_id}")
    if not token:
        print("   SKIP: No token")
        return False
        
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(f"{BASE_URL}/users/{target_id}", headers=headers)
    
    print(f"   RESULT: {resp.status_code} (Expected: {expected_code})")
    if resp.status_code == expected_code:
        print("   ✅ PASS")
        return True
    else:
        print(f"   ❌ FAIL: {resp.text}")
        return False

async def verify_audit_log(session, actor_id, action, status="SUCCESS"):
    print(f"   VERIFY AUDIT: Actor={actor_id} Action={action} Status={status}")
    # We need to query sync or async? this is async func
    result = await session.execute(
        select(AuditLog).where(
            AuditLog.actor_id == actor_id,
            AuditLog.action == action,
            AuditLog.status == status
        ).order_by(AuditLog.timestamp.desc()).limit(1)
    )
    log = result.scalar_one_or_none()
    if log:
        print(f"   ✅ AUDIT FOUND: {log.id} - {log.details}")
        return True
    else:
        print("   ❌ AUDIT MISSING")
        return False

async def main():
    async with AsyncSessionLocal() as session:
        data = await setup_test_data(session)
        
        # Logins
        super_token = get_token("super_rbac_test@santis.com")
        ta1_token = get_token("manager_t1_rbac_test@santis.com")
        ta2_token = get_token("manager_t2_rbac_test@santis.com")
        u1_token = get_token("user_t1_rbac_test@santis.com")
        
        print("\n--- TEST CASE 1: Tenant Admin deletes OWN user --")
        # TA1 deletes U1 (Same Tenant) -> Should work, but wait.. USER_DELETE is NOT in MANAGER permissions in my default map?
        # Let's check permissions.py... 
        # MANAGER has: BOOKING_*, USER_READ. 
        # Actually... MANAGER usually can only manage Bookings. 
        # OWNER has USER_DELETE. 
        # My setup made TA1 a MANAGER. 
        # Result: Should FAIL with 403 PERMISSION_DENIED.
        
        # Let's adjust expectation based on codebase.
        # permissions.py says MANAGER = {USER_READ, BOOKING_...}
        # So MANAGER CANNOT delete users.
        
        test_delete_user(ta1_token, data["u1"].id, "Tenant Manager deletes User", expected_code=403)
        await verify_audit_log(session, data["ta1"].id, "PERMISSION_DENIED", "FAILURE")

        print("\n--- TEST CASE 2: Superadmin deletes User (Cross Tenant) ---")
        # Superadmin deletes U2 (T2)
        test_delete_user(super_token, data["u2"].id, "Superadmin deletes Cross-Tenant User", expected_code=200)
        await verify_audit_log(session, data["super"].id, "DELETE", "SUCCESS")
        
        print("\n--- TEST CASE 3: Regular User deletes Self/Other ---")
        # User tries to delete TA1
        test_delete_user(u1_token, data["ta1"].id, "User deletes User", expected_code=403)
        await verify_audit_log(session, data["u1"].id, "PERMISSION_DENIED", "FAILURE")
        
        print("\n--- TEST CASE 4: Soft Delete Check ---")
        # U2 was deleted by Superadmin. Check U2 is_deleted in DB.
        # Need new session for fresh data
        await session.refresh(data["u2"])
        print(f"   U2 is_deleted: {data['u2'].is_deleted}")
        if data['u2'].is_deleted:
             print("   ✅ PASS: User marked deleted")
        else:
             print("   ❌ FAIL: User not marked deleted")

        # Try deleting again -> Should be 409
        print("\n--- TEST CASE 5: Delete Already Deleted ---")
        test_delete_user(super_token, data["u2"].id, "Delete again", expected_code=409)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
