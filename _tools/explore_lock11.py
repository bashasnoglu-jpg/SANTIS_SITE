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
    
    print("Fetching Live_Operation_Lock...")
    res = requests.get(f"https://api.airtable.com/v0/{base_id}/tblWAaSnJVrWbnz9m", headers=headers)
    if res.status_code == 200:
        records = res.json().get('records', [])
        for r in records:
            # Let's print the fields if it has 'LOCK-11' somewhere
            fields_str = json.dumps(r.get('fields', {}))
            if 'LOCK-11' in fields_str:
                print(json.dumps(r.get('fields', {}), indent=2))
    else:
        print(f"Error fetching Live_Operation_Lock: {res.status_code}")

if __name__ == "__main__":
    explore()
