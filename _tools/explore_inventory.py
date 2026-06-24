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
    
    print("\nFetching Service Consumption Rules...")
    try:
        res = requests.get(f"https://api.airtable.com/v0/{base_id}/tblTEzJnHSL8E1NYe?maxRecords=2", headers=headers)
        if res.status_code == 200:
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"Error: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Request error: {e}")
        
    print("\nFetching Inventory...")
    try:
        res = requests.get(f"https://api.airtable.com/v0/{base_id}/tbl1HzavzuHMtneEP?maxRecords=1", headers=headers)
        if res.status_code == 200:
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"Error: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Request error: {e}")
        
    print("\nFetching Bookings to see if there is Inventory Deduction Trigger...")
    try:
        res = requests.get(f"https://api.airtable.com/v0/{base_id}/tblocCFVgSNfaLAH6?maxRecords=1", headers=headers)
        if res.status_code == 200:
            print(json.dumps(res.json().get('records', [])[0].get('fields'), indent=2))
        else:
            print(f"Error: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Request error: {e}")

if __name__ == "__main__":
    explore()
