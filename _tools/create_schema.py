import sys
import os
import json
import requests

def get_base_id():
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from app.services.airtable_db import AirtableConfig
    return AirtableConfig.BASE_ID

def main():
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
        
    api_key = os.getenv("AIRTABLE_API_KEY")
    if not api_key:
        print("Missing AIRTABLE_API_KEY")
        return

    base_id = get_base_id()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    print("Fetching schema to map table names to IDs...")
    res = requests.get(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables", headers=headers)
    if res.status_code != 200:
        print(f"Failed to fetch schema: {res.status_code} {res.text}")
        return

    schema = res.json()
    tables = {t["name"]: t["id"] for t in schema.get("tables", [])}

    required_links = [
        # Commission Rules
        {"table": "Commission Rules", "name": "Service_Link", "type": "multipleRecordLinks", "target": "Services"},
        {"table": "Commission Rules", "name": "Location_Link", "type": "multipleRecordLinks", "target": "Locations"},
        
        # Commission Ledger
        {"table": "Commission Ledger", "name": "Booking_Link", "type": "multipleRecordLinks", "target": "Bookings"},
        {"table": "Commission Ledger", "name": "Therapist_Link", "type": "multipleRecordLinks", "target": "Therapists"},
        {"table": "Commission Ledger", "name": "Service_Link", "type": "multipleRecordLinks", "target": "Services"},
        {"table": "Commission Ledger", "name": "Location_Link", "type": "multipleRecordLinks", "target": "Locations"},
        
        # Bookings
        {"table": "Bookings", "name": "Commission_Ledger_Link", "type": "multipleRecordLinks", "target": "Commission Ledger"},
    ]

    for req in required_links:
        table_id = tables.get(req["table"])
        target_id = tables.get(req["target"])
        if not table_id or not target_id:
            print(f"Missing table mapping for {req['table']} or {req['target']}")
            continue
            
        payload = {
            "name": req["name"],
            "type": req["type"],
            "options": {
                "linkedTableId": target_id
            }
        }
        
        url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables/{table_id}/fields"
        print(f"Creating field {req['name']} in {req['table']}...")
        r = requests.post(url, headers=headers, json=payload)
        if r.status_code == 200:
            print(f"  Success!")
        else:
            print(f"  Error: {r.status_code} {r.text}")

    # Create checkbox field
    print("Creating Commission_Calculated in Bookings...")
    b_table_id = tables.get("Bookings")
    cb_payload = {
        "name": "Commission_Calculated",
        "type": "checkbox",
        "options": {
            "color": "green",
            "icon": "check"
        }
    }
    r2 = requests.post(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables/{b_table_id}/fields", headers=headers, json=cb_payload)
    if r2.status_code == 200:
        print("  Success!")
    else:
        print(f"  Error: {r2.status_code} {r2.text}")

    print("SCHEMA_READY")

if __name__ == "__main__":
    main()
