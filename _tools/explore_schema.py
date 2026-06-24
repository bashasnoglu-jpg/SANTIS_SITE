import sys
import os
import json
import requests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableDB, AirtableConfig

def explore():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    print("Fetching base schema for fields...")
    res = requests.get(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables", headers=headers)
    if res.status_code == 200:
        schema = res.json()
        
        # Look for Inventory_Transactions and Service Consumption Rules
        for table in schema.get("tables", []):
            if table["name"] in ["Inventory_Transactions", "Service Consumption Rules", "Bookings", "Inventory"]:
                print(f"\n--- {table['name']} Fields ---")
                for f in table.get("fields", []):
                    print(f"- {f['name']} ({f['type']})")
    else:
        print(f"Schema fetch failed: {res.status_code} {res.text}")

if __name__ == "__main__":
    explore()
