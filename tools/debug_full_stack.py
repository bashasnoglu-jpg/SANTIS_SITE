import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def debug():
    # 1. Login
    print("Logging in...")
    try:
        auth_resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "admin@santis.com", 
            "password": "admin123"
        })
        auth_resp.raise_for_status()
        data = auth_resp.json()
        token = data["access_token"]
        print("Login successful.")
        
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Fetch User Me
        print("\nFetching Current User...")
        try:
            me_resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
            if me_resp.status_code == 200:
                me = me_resp.json()
                print(f"User: {me['email']} (ID: {me['id']})")
                print(f"Tenant ID: {me.get('tenant_id')}")
            else:
                print(f"Failed to fetch user: {me_resp.status_code}")
        except Exception as e:
            print(f"Failed to fetch /users/me: {e}")

    except Exception as e:
        print(f"Login failed: {e}")
        if 'auth_resp' in locals():
             print(auth_resp.text)
        return

    # 3. Hit Bookings with WIDE range
    print("\nFetching Bookings (2025-2027)...")
    try:
        resp = requests.get(
            f"{BASE_URL}/bookings/",
            headers=headers,
            params={
                "start_date": "2025-01-01T00:00:00",
                "end_date": "2027-01-01T00:00:00"
            }
        )
        if resp.status_code == 200:
            bookings = resp.json()
            print(f"Status: 200 OK. Count: {len(bookings)}")
            print(bookings)
        else:
            print(f"Status: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    debug()
