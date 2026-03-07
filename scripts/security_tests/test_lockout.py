import requests
import json
import time

URL = "http://localhost:8000/api/v1/auth/login"

def run_tests():
    print("--- STARTING DB-BACKED LOCKOUT TESTS ---")
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    payload = {"username": "admin_hacker@santis.club", "password": "wrongpassword"}

    for i in range(1, 7):
        response = requests.post(URL, data=payload, headers=headers)
        
        if response.status_code == 400:
            print(f"[{i}] LOGIN_FAILED: {response.json().get('detail')}")
        elif response.status_code == 423:
            print(f"[{i}] LOCKOUT_TRIGGERED (423): {response.json().get('detail')}")
            break
        else:
             print(f"[{i}] UNEXPECTED {response.status_code}: {response.text}")

    print("\n--- TEST COMPLETE ---")

if __name__ == "__main__":
    run_tests()
