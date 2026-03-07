import requests
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:8000"

def attack_endpoint():
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    payload = {"username": "spammer_burst@santis.club", "password": "wrong"}
    try:
        start = time.time()
        res = requests.post(f"{BASE_URL}/api/v1/auth/login", data=payload, headers=headers)
        return res.status_code, time.time() - start
    except Exception as e:
        return 500, 0.0

def run_tests():
    print("--- STARTING 100-REQUEST BURST ATTACK ---")
    
    start_total = time.time()
    results = []
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(attack_endpoint) for _ in range(100)]
        for f in futures:
            results.append(f.result())

    end_total = time.time()
    
    status_counts = {}
    total_latency = 0
    for status, latency in results:
        status_counts[status] = status_counts.get(status, 0) + 1
        total_latency += latency
        
    avg_latency = (total_latency / 100) * 1000 # ms
    
    print(f"Total Time for 100 requests: {end_total - start_total:.2f}s")
    print(f"Average Request Latency: {avg_latency:.2f}ms")
    print(f"Status Codes Distribution: {status_counts}")
    
    # Now check SLA latency
    print("\n--- CHECKING SLA POST-BURST ---")
    status_res = requests.get(f"{BASE_URL}/api/admin/content/status")
    if status_res.status_code == 200:
        print(f"SLA DB Latency: {status_res.json().get('sla_db_latency_ms')} ms")
        if float(status_res.json().get('sla_db_latency_ms')) <= 10.0:
            print("✅ TEST PASSED: DB Latency is well under 10ms under stress.")
        else:
            print("❌ TEST FAILED: DB Latency exceeded 10ms.")
    else:
        print("Failed to get SLA.")

if __name__ == "__main__":
    run_tests()
