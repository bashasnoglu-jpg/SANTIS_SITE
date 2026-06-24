import urllib.request
import urllib.parse
import json
import os

def get_env(key):
    if os.environ.get(key): return os.environ.get(key)
    try:
        with open(".env") as f:
            for line in f:
                if line.startswith(key + "="):
                    return line.strip().split("=", 1)[1]
    except FileNotFoundError: pass
    return None

PAT = get_env("AIRTABLE_PAT") or get_env("AIRTABLE_API_KEY")
BASE_ID = get_env("AIRTABLE_BASE_ID") or "app7VPfdgji5FzLHg"

TABLES = [
    "Bookings",
    "Client_Packages",
    "Package_Usage_Ledger"
]

def fetch_table(table_name):
    records = []
    offset = None
    url = f"https://api.airtable.com/v0/{BASE_ID}/{urllib.parse.quote(table_name)}"
    
    while True:
        req_url = url
        if offset:
            req_url += f"?offset={offset}"
        req = urllib.request.Request(req_url, headers={"Authorization": f"Bearer {PAT}"})
        try:
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode("utf-8"))
            records.extend(data.get("records", []))
            offset = data.get("offset")
            if not offset:
                break
        except Exception as e:
            print(f"Error fetching {table_name}: {e}")
            break
            
    return records

def update_record(table_name, record_id, fields):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{urllib.parse.quote(table_name)}/{record_id}"
    body = json.dumps({"fields": fields}).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json"
    }, method="PATCH")
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        print(f"Error updating {record_id} in {table_name}: {e}")
        return None

def main():
    print("Starting cleanup for 'TEST CRM - Maria Novak' records...")
    
    updated_count = 0
    
    for table in TABLES:
        print(f"Fetching {table}...")
        records = fetch_table(table)
        
        for r in records:
            fields = r.get("fields", {})
            env = fields.get("Environment", "")
            
            # search all text fields for Maria Novak
            all_text = " ".join([str(v).upper() for k, v in fields.items() if isinstance(v, str)])
            
            if "MARIA NOVAK" in all_text and env != "Test":
                print(f"Found record in {table} (ID: {r['id']}) - Current Env: '{env}'. Updating to 'Test'...")
                update_res = update_record(table, r['id'], {"Environment": "Test"})
                if update_res:
                    updated_count += 1
                    print("  -> Success")
                else:
                    print("  -> Failed")
                    
    print(f"\nCleanup complete. Total records updated: {updated_count}")

if __name__ == "__main__":
    main()
