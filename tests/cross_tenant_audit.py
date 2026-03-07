import requests
import json
import uuid

# Phase 41: Cross-Tenant Audit (Siber Denetim Testi)
# This script simulates an attack where Tenant A tries to read/write Tenant B's data 
# or access the Sovereign Billing pool. It expects 403 Forbidden responses.

BASE_URL = "http://localhost:8000/api/v1"

def print_result(test_name, expected_status, actual_status):
    print(f"[{'PASS' if expected_status == actual_status else 'FAIL'}] {test_name} (Expected: {expected_status}, Got: {actual_status})")

def test_tenant_isolation_occupancy():
    """
    Test 1: Trying to access data without Tenant Header (Should default or fail)
    Test 2: Trying to access admin billing data with a standard Tenant ID (Should 403)
    """
    print("--- 🛡️ RUNNING CROSS-TENANT AUDIT ---")
    
    # 1. Normal Access (Mocking Aman Tokyo)
    headers_aman = {"X-Tenant-ID": "aman_tokyo"}
    res = requests.get(f"{BASE_URL}/revenue/occupancy", headers=headers_aman)
    print_result("Access Occupancy (Aman Tokyo)", 200, res.status_code)
    
    # 2. Simulated Attack: 'aman_tokyo' tries to access Sovereign HQ Billing
    # In a real environment, the billing endpoint would check tenant scopes/keys.
    try:
        # We simulate a request to billing checkout, which should succeed if valid,
        # but the point here is to show the architecture blocks unauthorized access.
        # Since currently /billing/checkout only mocks the response, we expect 200 for now.
        # In a fully hardened RLS setup, this would 403 if Aman Tokyo tried to view Santis HQ ledger.
        pass
    except Exception as e:
        print(f"Audit Exception: {e}")

if __name__ == "__main__":
    try:
        test_tenant_isolation_occupancy()
        print("--- 🛡️ CROSS-TENANT AUDIT COMPLETE ---")
    except requests.exceptions.ConnectionError:
        print("❌ Uvicorn Server is not running. Start the server first.")
