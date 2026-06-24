import os
import sys
import argparse
import requests
import json
import urllib.parse

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get("AIRTABLE_PAT")
BOOKINGS_TABLE = AirtableConfig.TABLES.get("Bookings", "Bookings")

def get_table_id(name):
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    for t in res.get("tables", []):
        if t["name"] == name:
            return t["id"]
    return None

PAYMENTS_TABLE = get_table_id("Payments")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--booking", required=True, type=int, help="Booking Auto-number ID")
    parser.add_argument("--write", action="store_true", help="Write changes to Airtable")
    args = parser.parse_args()

    print(f"Starting Payment Closure Engine... (DRY-RUN: {not args.write})")
    print(f"Fetching Booking ID number: {args.booking}")

    # Fetch booking
    url = f"https://api.airtable.com/v0/{BASE_ID}/{BOOKINGS_TABLE}?filterByFormula={{Booking ID}}={args.booking}&returnFieldsByFieldId=true"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    
    if not res.get("records"):
        print("Booking not found.")
        sys.exit(1)
        
    booking = res["records"][0]
    b_id = booking["id"]
    fields = booking["fields"]
    print(f"--- Validating BKG-260623-{args.booking} (Record ID: {b_id}) ---")
    
    # Is it package covered?
    is_package = False
    if "fldSLgFG7mFuF4dFn" in fields and fields["fldSLgFG7mFuF4dFn"]: # Package_Usage_Ledger
        is_package = True
        
    # Read Payments list directly from Booking
    payment_ids = fields.get("flda1K0Td716KyWro", [])
    total_paid = 0
    
    if payment_ids:
        # Build OR formula for all payment IDs
        conditions = [f"RECORD_ID()='{pid}'" for pid in payment_ids]
        formula = "OR(" + ",".join(conditions) + ")"
        
        payments_url = f"https://api.airtable.com/v0/{BASE_ID}/{PAYMENTS_TABLE}?filterByFormula={urllib.parse.quote(formula)}&returnFieldsByFieldId=true"
        payments_res = requests.get(payments_url, headers={"Authorization": f"Bearer {PAT}"}).json()
        
        for p in payments_res.get("records", []):
            amt = p["fields"].get("fldOwPIhbkMZ3hmYN", 0) # Amount_EUR
            total_paid += amt
            
    final_price = fields.get("fldylvOBQE47M0JKU", fields.get("fld2copXIWZXeaAKj", 0)) # Manual Final Price EUR or Final Amount EUR

    status = "Unpaid"
    if is_package:
        status = "Covered by Package"
    elif total_paid >= final_price and final_price > 0:
        status = "Paid"
    elif total_paid > 0:
        status = "Partially Paid"
        
    payload = {
        "fldPmQrj61MdcsR6l": total_paid,
        "fldwA6xq5WGq5z3ND": status
    }
    
    print("\n--- DRY RUN OUTPUT (PAYLOAD) ---")
    print(json.dumps(payload, indent=2))
    print("--------------------------------\n")
    
    if args.write:
        patch_url = f"https://api.airtable.com/v0/{BASE_ID}/{BOOKINGS_TABLE}/{b_id}"
        patch_res = requests.patch(
            patch_url,
            headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
            json={"fields": payload, "typecast": True, "returnFieldsByFieldId": True}
        )
        data = patch_res.json()
        if "error" in data:
            print("Error updating booking:", data)
        else:
            print(f"Updated Booking {args.booking} successfully.")
    else:
        print("Dry run mode: No changes were made to Airtable.")

if __name__ == "__main__":
    main()
