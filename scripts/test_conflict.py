import os
import sys
import json
import requests
from pprint import pprint

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

BASE_ID = "app7VPfdgji5FzLHg"
PAT = os.environ.get("AIRTABLE_PAT")
URL = f"https://api.airtable.com/v0/{BASE_ID}/tblocCFVgSNfaLAH6/recdJ1s02PCFuwdbP?returnFieldsByFieldId=true"

res = requests.get(URL, headers={"Authorization": f"Bearer {PAT}"}).json()
fields = res.get("fields", {})

# Let us create a clone
clone_fields = {
    "fldWbz4kZzqerUxhn": "2026-06-23T17:30:00.000Z", # Start (UTC, maps to 19:30 Budva Time)
    "fldecPedQfpnjc83O": "Confirmed",                # Status
    "fldaVJ6XmE9M3ZsXN": "Test",                     # Environment
}

# Add therapist, room, location
if "flddXRKNIeh72ROX5" in fields:
    clone_fields["flddXRKNIeh72ROX5"] = fields["flddXRKNIeh72ROX5"]
if "fld5xL3ciOBQRBt24" in fields:
    clone_fields["fld5xL3ciOBQRBt24"] = fields["fld5xL3ciOBQRBt24"]
if "fldLkesTF4z1iiQp9" in fields:
    clone_fields["fldLkesTF4z1iiQp9"] = fields["fldLkesTF4z1iiQp9"]

# Also add a Client_Link and Service_Link just in case
if "fldq07SPCXfwQ39Tc" in fields:
    clone_fields["fldq07SPCXfwQ39Tc"] = fields["fldq07SPCXfwQ39Tc"]
if "fldLVMNj1biBuRMGJ" in fields:
    clone_fields["fldLVMNj1biBuRMGJ"] = fields["fldLVMNj1biBuRMGJ"]

post_url = f"https://api.airtable.com/v0/{BASE_ID}/tblocCFVgSNfaLAH6"
post_res = requests.post(
    post_url,
    headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
    json={"records": [{"fields": clone_fields}], "typecast": True, "returnFieldsByFieldId": True}
)

created = post_res.json()
print("CREATED FAKE BOOKING:")
pprint(created)

# If successful, extract the new Booking ID (the auto-number ID)
if "records" in created:
    record = created["records"][0]
    b_id = record["fields"].get("fldhzaXE78UUYOKmE")
    print(f"\nNEW BOOKING ID NUMBER: {b_id}")
    print(f"NEW RECORD ID: {record['id']}")
