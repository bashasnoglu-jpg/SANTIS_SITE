import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def login():
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "admin@santis.com",
            "password": "admin123"
        })
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"Login failed: {e}")
        try:
            print("Response:", response.text)
        except:
            pass
        return None

def get_bookings(token):
    headers = {"Authorization": f"Bearer {token}"}
    start_date = datetime.now().replace(day=1).isoformat()
    end_date = (datetime.now() + timedelta(days=60)).isoformat()
    
    try:
        response = requests.get(
            f"{BASE_URL}/bookings/",
            headers=headers,
            params={"start_date": start_date, "end_date": end_date}
        )
        response.raise_for_status()
        bookings = response.json()
        print(f"Success! Retrieved {len(bookings)} bookings.")
        for b in bookings[:2]:
            c_name = b.get('customer', {}).get('full_name') if b.get('customer') else "None"
            s_name = b.get('service', {}).get('name') if b.get('service') else "None"
            print(f" - Booking: {c_name} | {s_name} | {b['start_time']}")
    except Exception as e:
        print(f"Fetch failed: {e}")
        if response:
            print(response.text)

if __name__ == "__main__":
    token = login()
    if token:
        get_bookings(token)
