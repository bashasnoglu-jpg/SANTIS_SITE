import sys
import os
import json
import requests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableConfig

def dump():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    headers = {"Authorization": f"Bearer {api_key}"}
    
    print("Fetching one booking...")
    res = requests.get(f"https://api.airtable.com/v0/{base_id}/Bookings?maxRecords=1", headers=headers)
    if res.status_code == 200:
        records = res.json().get('records', [])
        if records:
            print(json.dumps(records[0].get('fields', {}), indent=2))
    else:
        print(f"Error: {res.status_code}")

if __name__ == "__main__":
    dump()
