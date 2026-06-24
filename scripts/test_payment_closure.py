
import os
import sys
import requests
from pprint import pprint

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

BASE_ID = "app7VPfdgji5FzLHg"
PAT = os.environ.get("AIRTABLE_PAT")
BOOKINGS_TABLE = "tblocCFVgSNfaLAH6"

def get_table_id(name):
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    for t in res.get("tables", []):
        if t["name"] == name:
            return t["id"]
    return None

PAYMENTS_TABLE = get_table_id("Payments")
PACKAGE_USAGE_TABLE = get_table_id("Package_Usage_Ledger")

def create_booking(start, note):
    clone_fields = {
        "fldWbz4kZzqerUxhn": start,
        "fldecPedQfpnjc83O": "Confirmed",
        "fldaVJ6XmE9M3ZsXN": "Test",
        "flddXRKNIeh72ROX5": ["recClzUcFGJpPGNl7"], # ZAHIDE
        "fld5xL3ciOBQRBt24": ["recpjMJZLsuEdM9zM"], # Budva Massage Room 1
        "fldLkesTF4z1iiQp9": ["rec1qC31hFqbuLHZU"], # Budva
        "fldylvOBQE47M0JKU": 100, # Manual Final Price EUR
        "fldHkZPKdUvkG4duG": note # Reception_Notes
    }
    
    post_url = f"https://api.airtable.com/v0/{BASE_ID}/{BOOKINGS_TABLE}"
    post_res = requests.post(
        post_url,
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
        json={"records": [{"fields": clone_fields}], "typecast": True, "returnFieldsByFieldId": True}
    )
    res = post_res.json()
    if "error" in res:
        print("Error creating booking:", res)
        sys.exit(1)
    
    record = res["records"][0]
    return record["id"], record["fields"].get("fldhzaXE78UUYOKmE")

def create_payment(booking_id, amount, method):
    fields = {
        "fldcitRkQVA5oQK3E": [booking_id], # Booking_Link
        "fldOwPIhbkMZ3hmYN": amount, # Amount_EUR
        "fld5GNmGspBa7TsC2": method, # Method
        "flddUKlVutoSrBzFW": "Test", # Environment
        "fldLe5FHoePO3aYZG": "Completed" # Payment_Status_New?
    }
    post_url = f"https://api.airtable.com/v0/{BASE_ID}/{PAYMENTS_TABLE}"
    post_res = requests.post(
        post_url,
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
        json={"records": [{"fields": fields}], "typecast": True, "returnFieldsByFieldId": True}
    )
    res = post_res.json()
    if "error" in res:
        print("Error creating payment:", res)

# 1. Cash full payment
b1, b1_id = create_booking("2026-06-25T10:00:00.000Z", "FAZ 1-03 Test - Cash")
create_payment(b1, 100, "Cash")
print(f"Created Cash Booking: {b1_id}")

# 2. Card full payment
b2, b2_id = create_booking("2026-06-25T11:00:00.000Z", "FAZ 1-03 Test - Card")
create_payment(b2, 100, "Card")
print(f"Created Card Booking: {b2_id}")

# 3. Unpaid booking
b3, b3_id = create_booking("2026-06-25T12:00:00.000Z", "FAZ 1-03 Test - Unpaid")
print(f"Created Unpaid Booking: {b3_id}")

# 4. Package-covered booking
b4, b4_id = create_booking("2026-06-25T13:00:00.000Z", "FAZ 1-03 Test - Package")
if PACKAGE_USAGE_TABLE:
    usage_fields = {
        "Booking_Link": [b4],
        "Environment": "Test",
        "Sessions_Deducted": 1
    }
    requests.post(
        f"https://api.airtable.com/v0/{BASE_ID}/{PACKAGE_USAGE_TABLE}",
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
        json={"records": [{"fields": usage_fields}], "typecast": True}
    )
print(f"Created Package Booking: {b4_id}")
print(f"\nCreated booking IDs: {b1_id}, {b2_id}, {b3_id}, {b4_id}")

