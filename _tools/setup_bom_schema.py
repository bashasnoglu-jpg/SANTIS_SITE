import sys
import os
import json
import requests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableConfig

def setup():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    bom_table_id = "tblTEzJnHSL8E1NYe"
    inventory_table_id = "tbl1HzavzuHMtneEP"
    locations_table_id = "tblR03tg5WNkKgJ74"
    services_table_id = "tbluiywBUXipbWlIa"
    
    # 1. Create Inventory_Link
    print("Creating Inventory_Link field...")
    payload1 = {
        "name": "Inventory_Link",
        "type": "multipleRecordLinks",
        "options": {
            "linkedTableId": inventory_table_id
        }
    }
    res1 = requests.post(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables/{bom_table_id}/fields", headers=headers, json=payload1)
    if res1.status_code == 200:
        print("Success: Inventory_Link created.")
    else:
        print(f"Failed to create Inventory_Link: {res1.status_code} {res1.text}")

    # 2. Create Location_Link
    print("\nCreating Location_Link field...")
    payload2 = {
        "name": "Location_Link",
        "type": "multipleRecordLinks",
        "options": {
            "linkedTableId": locations_table_id
        }
    }
    res2 = requests.post(f"https://api.airtable.com/v0/meta/bases/{base_id}/tables/{bom_table_id}/fields", headers=headers, json=payload2)
    if res2.status_code == 200:
        print("Success: Location_Link created.")
    else:
        print(f"Failed to create Location_Link: {res2.status_code} {res2.text}")

    # Fetch a Service, an Inventory item, and a Location to link
    print("\nFetching data for test record...")
    
    service_id = None
    res = requests.get(f"https://api.airtable.com/v0/{base_id}/{services_table_id}?maxRecords=1", headers=headers)
    if res.status_code == 200 and res.json().get('records'):
        service_id = res.json()['records'][0]['id']
        
    inv_id = None
    res = requests.get(f"https://api.airtable.com/v0/{base_id}/{inventory_table_id}?maxRecords=1", headers=headers)
    if res.status_code == 200 and res.json().get('records'):
        inv_id = res.json()['records'][0]['id']
        
    loc_id = None
    res = requests.get(f"https://api.airtable.com/v0/{base_id}/{locations_table_id}?maxRecords=1&filterByFormula=Name='Podgorica'", headers=headers)
    if res.status_code == 200 and res.json().get('records'):
        loc_id = res.json()['records'][0]['id']

    if service_id and inv_id and loc_id:
        print("\nCreating test rule record...")
        rule_payload = {
            "fields": {
                "Rule Name": "TEST — Podgorica Massage Oil Usage",
                "Service_Link": [service_id],
                "Inventory_Link": [inv_id],
                "Location_Link": [loc_id],
                "Quantity Used": 1,
                "Trigger Event": "Booking Completed",
                "Active": True
            }
        }
        res3 = requests.post(f"https://api.airtable.com/v0/{base_id}/{bom_table_id}", headers=headers, json=rule_payload)
        if res3.status_code == 200:
            print("Success: Test rule created.")
        else:
            print(f"Failed to create test rule: {res3.status_code} {res3.text}")
    else:
        print(f"Missing IDs for test record. Service: {service_id}, Inv: {inv_id}, Loc: {loc_id}")

if __name__ == "__main__":
    setup()
