import os
import sys
import requests
import json

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get("AIRTABLE_PAT")

CASH_REGISTER_TABLE = "tblsbrK83eQS2WG0v"
CASH_MOVEMENTS_TABLE = "tbliKm67lg4NnsrdA"

def find_or_create_test_register():
    url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_REGISTER_TABLE}"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    for r in res.get("records", []):
        if r["fields"].get("Environment") == "Test":
            return r["id"], r["fields"].get("Location_Link"), r["fields"].get("Tenant_Link")
            
    # Create if not found
    fields = {
        "Cash Register Name": "Test Kasa",
        "Environment": "Test",
        "Currency": "EUR",
        "Status": "Active"
    }
    res = requests.post(
        url,
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
        json={"records": [{"fields": fields}], "typecast": True}
    ).json()
    
    rec = res["records"][0]
    return rec["id"], rec["fields"].get("Location_Link"), rec["fields"].get("Tenant_Link")

def create_movement(register_id, location_link, tenant_link, date, amount, direction, method, mov_type, category):
    fields = {
        "Movement Date": date,
        "Movement Type": mov_type,
        "Category": category,
        "Cash_Register_Link": [register_id],
        "Amount": amount,
        "Currency": "EUR",
        "Method": method,
        "Direction": direction,
        "Approval Status": "Posted",
        "Environment": "Test"
    }
    if location_link: fields["Location_Link"] = location_link
    if tenant_link: fields["Tenant_Link"] = tenant_link
    
    url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_MOVEMENTS_TABLE}"
    requests.post(
        url,
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
        json={"records": [{"fields": fields}], "typecast": True}
    )

def main():
    reg_id, loc_link, ten_link = find_or_create_test_register()
    print(f"Using Cash Register: {reg_id}")
    
    # 2026-06-26 Scenario
    print("Creating movements for 2026-06-26...")
    create_movement(reg_id, loc_link, ten_link, "2026-06-26", 150, "In", "Cash", "Income", "Service Payment")
    create_movement(reg_id, loc_link, ten_link, "2026-06-26", 100, "In", "Card", "Income", "Service Payment")
    create_movement(reg_id, loc_link, ten_link, "2026-06-26", 20, "Out", "Cash", "Expense", "General")
    
    # 2026-06-27 Scenario
    print("Creating movements for 2026-06-27...")
    create_movement(reg_id, loc_link, ten_link, "2026-06-27", 150, "In", "Cash", "Income", "Service Payment")
    create_movement(reg_id, loc_link, ten_link, "2026-06-27", 100, "In", "Card", "Income", "Service Payment")
    create_movement(reg_id, loc_link, ten_link, "2026-06-27", 20, "Out", "Cash", "Expense", "General")
    
    print("Test movements created successfully.")

if __name__ == "__main__":
    main()
