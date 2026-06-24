import sys
import os
import requests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableConfig

def explore():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    headers = {"Authorization": f"Bearer {api_key}"}
    
    res = requests.get(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables", headers=headers)
    if res.status_code == 200:
        schema = res.json()
        for table in schema.get("tables", []):
            if table["name"] == "Inventory_Transactions":
                print(f"--- {table['name']} SingleSelect Options ---")
                for f in table.get("fields", []):
                    if f['name'] in ["Type", "Transaction_Source", "Transaction_Status"]:
                        options = f.get('options', {}).get('choices', [])
                        names = [o['name'] for o in options]
                        print(f"- {f['name']}: {', '.join(names)}")
    else:
        print(f"Error: {res.status_code}")

if __name__ == "__main__":
    explore()
