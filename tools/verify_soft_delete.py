import requests
import json
import uuid
import time
from datetime import datetime
import sys
import os

# Add root to sys.path
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash

# Adjust if running on different port
BASE_URL = "http://localhost:8001"

def verify_soft_delete():
    print("--- STARTING SOFT DELETE VERIFICATION ---")

    db_url = settings.DATABASE_URL.replace("+aiosqlite", "")
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    admin_email = "admin_verify@example.com"
    admin_pass = "password123"
    
    victim_email = "soft_delete_victim@example.com"

    try:
        # CLEANUP BAD DATA (Dashed IDs)
        session.execute(text(f"DELETE FROM users WHERE email='{admin_email}'"))
        session.execute(text(f"DELETE FROM users WHERE email='{victim_email}'"))
        session.commit()
    
        # 1. Create/Ensure Superuser
        print("1. Ensuring Superuser...")
        # Check if exists (it won't, just deleted, but generic logic)
        
        print("   Creating Superuser with HEX ID...")
        admin_id = uuid.uuid4()
        admin_id_hex = admin_id.hex
        p_hash = get_password_hash(admin_pass)
        
        # Raw SQL to ensure HEX storage
        session.execute(text(f"INSERT INTO users (id, email, hashed_password, is_active, is_superuser, role, is_deleted, is_platform_admin, token_version, created_at, tenant_id) VALUES ('{admin_id_hex}', '{admin_email}', '{p_hash}', 1, 1, 'OWNER', 0, 0, 0, '{datetime.utcnow()}', NULL)"))
        session.commit()
        print(f"   Created Admin: {admin_id_hex}")

        # 2. Create/Ensure Victim
        print("2. Ensuring Victim User...")
        print("   Creating Victim with HEX ID...")
        victim_id = uuid.uuid4()
        victim_id_hex = victim_id.hex
        
        session.execute(text(f"INSERT INTO users (id, email, hashed_password, is_active, is_superuser, role, is_deleted, is_platform_admin, token_version, created_at, tenant_id) VALUES ('{victim_id_hex}', '{victim_email}', 'dummy', 1, 0, 'USER', 0, 0, 0, '{datetime.utcnow()}', NULL)"))
        session.commit()
        print(f"   Created Victim: {victim_id_hex}")
        
        # Use HEX for valid variable
        victim_id = victim_id_hex

        # 3. Login
        print("3. Logging in...")
        resp = requests.post(f"{BASE_URL}/api/v1/auth/login", data={"username": admin_email, "password": admin_pass})
        if resp.status_code != 200:
            print(f"   LOGIN FAILED: {resp.text}")
            return
            
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Login Successful.")

        # 4. Verify Victim in List (Pre-Delete)
        print("4. Verifying Victim in List (Pre-Delete)...")
        list_resp = requests.get(f"{BASE_URL}/api/v1/users/?limit=100", headers=headers)
        if list_resp.status_code != 200:
            print(f"   LIST USERS FAILED: {list_resp.status_code} {list_resp.text}")
            return
            
        users = list_resp.json()
        if not isinstance(users, list):
             print(f"   UNEXPECTED RESPONSE FORMAT: {users}")
             return

        if any(u["id"] == str(victim_id) for u in users):
            print("   Victim found in list.")
        else:
            print("   WARNING: Victim NOT found in list even before delete!")

        # 5. Delete Victim via API
        print(f"5. Deleting Victim {victim_id} via API...")
        del_resp = requests.delete(f"{BASE_URL}/api/v1/users/{victim_id}", headers=headers)
        print(f"   Status: {del_resp.status_code}")
        if del_resp.status_code == 200:
            print("   API Delete Success.")
        else:
            print(f"   API Delete FAILED: {del_resp.text}")

        # 6. Verify Victim GONE from List
        print("6. Verifying Victim Gone from List...")
        list_resp = requests.get(f"{BASE_URL}/api/v1/users/?limit=100", headers=headers)
        users = list_resp.json()
        if not any(u["id"] == str(victim_id) for u in users):
            print("   SUCCESS: Victim NOT found in list (Filter Working).")
        else:
            print("   FAILURE: Victim STILL in list!")

        # 7. Verify DB State (Soft Deleted)
        print("7. Verifying DB State...")
        row = session.execute(text(f"SELECT is_deleted, deleted_at, deleted_by FROM users WHERE id='{victim_id}'")).fetchone()
        if row and row[0]:
            print(f"   SUCCESS: DB is_deleted={row[0]}")
            print(f"            DB deleted_at={row[1]}")
            print(f"            DB deleted_by={row[2]}")
        else:
             print(f"   FAILURE: DB is_deleted={row[0] if row else 'None'}")

        # 8. Verify Audit Log via API
        print("8. Verifying Audit Log via API...")
        audit_resp = requests.get(f"{BASE_URL}/api/admin/activity-log?limit=5", headers=headers)
        if audit_resp.status_code == 200:
            logs = audit_resp.json()
            # Look for DELETE action on User entity
            found_log = False
            for log in logs:
                if log.get("action") == "DELETE" and log.get("entity_type") == "User" and log.get("entity_id") == str(victim_id):
                    found_log = True
                    print(f"   SUCCESS: Audit Log Found: {log}")
                    break
            if not found_log:
                print("   WARNING: Audit Log for DELETE not found in top 5.")
                print(f"   Top Logs: {logs}")
        else:
             print(f"   Audit Log API Failed: {audit_resp.status_code}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    verify_soft_delete()
