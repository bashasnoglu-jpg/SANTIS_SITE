import sys
import os
import time
import json
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Must add project root to sys.path to import app
import os
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')

from fastapi import FastAPI
from app.api.v1.endpoints import tenant_setup

app = FastAPI()
app.include_router(tenant_setup.router, prefix="/api/v1")
client = TestClient(app)

def print_banner(title):
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80)

# 1. Test Room
print_banner("1. Submitting Test Room")
room_payload = {
    "name": "Alba Test Room 1",
    "room_type": "Massage Room",
    "capacity": 1,
    "cleaning_buffer_minutes": 10,
    "status": "Available"
}
print(f"Payload sent from frontend:\n{json.dumps(room_payload, indent=2)}")
res = client.post("/api/v1/tenant-setup/rooms", json=room_payload)
print(f"Response: {res.status_code}")
res_json = res.json()
if res.status_code != 200:
    print("Error detail:", json.dumps(res_json, indent=2))
room_id = res_json.get("record", {}).get("id")
print(f"=> Created Room ID: {room_id}")
print("Airtable Record Fields:", json.dumps(res_json.get("record", {}).get("fields", {}), indent=2))

# 2. Test Service
print_banner("2. Submitting Test Service")
service_payload = {
    "name": "Alba Test Massage 60",
    "category": "Massage",
    "duration_minutes": 60,
    "price": 1500.0,
    "active": True
}
print(f"Payload sent from frontend:\n{json.dumps(service_payload, indent=2)}")
res = client.post("/api/v1/tenant-setup/services", json=service_payload)
print(f"Response: {res.status_code}")
res_json = res.json()
if res.status_code != 200:
    print("Error detail:", json.dumps(res_json, indent=2))
service_id = res_json.get("record", {}).get("id")
print(f"=> Created Service ID: {service_id}")
print("Airtable Record Fields:", json.dumps(res_json.get("record", {}).get("fields", {}), indent=2))

# 3. Test Therapist
print_banner("3. Submitting Test Therapist")
therapist_payload = {
    "name": "Alba Test Therapist 1",
    "phone": "555-0000",
    "specialties": "Massage",
    "active": True
}
print(f"Payload sent from frontend:\n{json.dumps(therapist_payload, indent=2)}")
res = client.post("/api/v1/tenant-setup/therapists", json=therapist_payload)
print(f"Response: {res.status_code}")
res_json = res.json()
if res.status_code != 200:
    print("Error detail:", json.dumps(res_json, indent=2))
therapist_id = res_json.get("record", {}).get("id")
print(f"=> Created Therapist ID: {therapist_id}")
print("Airtable Record Fields:", json.dumps(res_json.get("record", {}).get("fields", {}), indent=2))

# 4. Fetch Context
print_banner("4. Fetching Dropdown Context Data")
res = client.get("/api/v1/tenant-setup/context-data")
print(f"Response: {res.status_code}")
context_data = res.json()
print("Therapists in Dropdown:")
for t in context_data.get("therapists", []):
    print(f" - {t['name']} (ID: {t['id']})")
    
print("Rooms in Dropdown:")
for r in context_data.get("rooms", []):
    print(f" - {r['name']} (ID: {r['id']})")

print("Services in Dropdown:")
for s in context_data.get("services", []):
    print(f" - {s['name']} (ID: {s['id']})")

# 5. Test Shift Pattern
print_banner("5. Submitting Test Shift Pattern")
shift_payload = {
    "therapist_id": therapist_id,
    "days_of_week": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "start_time": "09:00",
    "end_time": "18:00",
    "break_minutes": 60
}
print(f"Payload sent from frontend:\n{json.dumps(shift_payload, indent=2)}")
res = client.post("/api/v1/tenant-setup/shifts", json=shift_payload)
print(f"Response: {res.status_code}")
res_json = res.json()
if res.status_code != 200:
    print("Error detail:", json.dumps(res_json, indent=2))
shift_id = res_json.get("record", {}).get("id")
print(f"=> Created Shift ID: {shift_id}")
print("Airtable Record Fields:", json.dumps(res_json.get("record", {}).get("fields", {}), indent=2))

# 6. Test Booking
print_banner("6. Submitting Test Booking")
tomorrow_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
booking_payload = {
    "guest_name": "Test Guest",
    "service_id": service_id,
    "date": tomorrow_date,
    "time": "10:00",
    "therapist_id": therapist_id,
    "room_id": room_id
}
print(f"Payload sent from frontend:\n{json.dumps(booking_payload, indent=2)}")
res = client.post("/api/v1/tenant-setup/test-booking", json=booking_payload)
print(f"Response: {res.status_code}")
res_json = res.json()
if res.status_code != 200:
    print(json.dumps(res_json, indent=2))
else:
    booking_id = res_json.get("record", {}).get("id")
    print(f"=> Created Booking ID: {booking_id}")
    print("Airtable Record Fields:", json.dumps(res_json.get("record", {}).get("fields", {}), indent=2))

print("Sleeping 5 seconds for Airtable indexing before collision test...")
time.sleep(5)

print_banner("7. Test Collision Booking")
print("Submitting the exact same booking to verify collision block...")
res2 = client.post("/api/v1/tenant-setup/test-booking", json=booking_payload)
print(f"Response: {res2.status_code}")
print(json.dumps(res2.json(), indent=2))
