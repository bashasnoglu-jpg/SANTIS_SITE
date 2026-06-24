import sys
import os
import json
import requests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableConfig

def explore():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    headers = {"Authorization": f"Bearer {api_key}"}
    
    print("Checking Service Consumption Rules (BOM) schema...")
    res = requests.get(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables", headers=headers)
    if res.status_code == 200:
        schema = res.json()
        for table in schema.get("tables", []):
            if table["name"] == "Service Consumption Rules":
                print(f"\n--- {table['name']} Fields ---")
                for f in table.get("fields", []):
                    print(f"- {f['name']} ({f['type']})")
    else:
        print(f"Error fetching schema: {res.status_code}")
        
    print("\nFetching BOM Records...")
    try:
        # Use table ID for Service Consumption Rules: tblTEzJnHSL8E1NYe
        res = requests.get(f"https://api.airtable.com/v0/{base_id}/tblTEzJnHSL8E1NYe?maxRecords=5", headers=headers)
        if res.status_code == 200:
            records = res.json().get("records", [])
            print(f"Found {len(records)} records.")
            for r in records:
                print(json.dumps(r.get("fields", {}), indent=2))
        else:
            print(f"Error fetching records: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    explore()
