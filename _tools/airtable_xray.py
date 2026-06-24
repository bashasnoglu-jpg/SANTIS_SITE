import os
import json
import urllib.request
from datetime import datetime

API_KEY = "[REDACTED]"
BASE_ID = "app7VPfdgji5FzLHg"

def fetch_airtable(endpoint):
    url = f"https://api.airtable.com/v0/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {API_KEY}')
    try:
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except urllib.error.HTTPError as e:
        print(f"HTTPError on {endpoint}: {e.code} - {e.read()}")
        return None

def main():
    print("Fetching schema...")
    schema = fetch_airtable(f"meta/bases/{BASE_ID}/tables")
    if not schema:
        print("Could not fetch schema. Make sure token has schema.bases:read scope.")
        # Fallback to just records if schema fails
        schema = {"tables": []}
        
    print("Fetching records from Bookings (tblocCFVgSNfaLAH6)...")
    bookings_table_id = "tblocCFVgSNfaLAH6"
    records = []
    offset = None
    
    while True:
        endpoint = f"{BASE_ID}/{bookings_table_id}?maxRecords=100"
        if offset:
            endpoint += f"&offset={offset}"
        res = fetch_airtable(endpoint)
        if not res:
            break
        if 'records' in res:
            records.extend(res['records'])
        offset = res.get('offset')
        if not offset:
            break

    data = {
        "schema": schema,
        "records": records
    }
    
    with open("airtable_dump.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Dumped {len(records)} records and schema to airtable_dump.json")

if __name__ == '__main__':
    main()
