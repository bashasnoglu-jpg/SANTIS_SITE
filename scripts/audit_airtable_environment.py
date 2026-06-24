import urllib.request
import urllib.parse
import json
import csv
import os

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
    "Package_Usage_Ledger",
    "Payments",
    "Inventory_Transactions"
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

def determine_recommendation(table, record):
    fields = record.get("fields", {})
    env = fields.get("Environment", "Empty")
    
    # Table specific primary_display
    primary_display = "Unknown"
    
    if table == "Bookings":
        b_id = str(fields.get("Booking ID", ""))
        r_time = str(fields.get("Reception Time Display", ""))
        primary_display = f"{b_id} {r_time}".strip()
    elif table == "Client_Packages":
        primary_display = str(fields.get("Client Package Name", ""))
    elif table == "Package_Usage_Ledger":
        primary_display = str(fields.get("Usage ID", ""))
    elif table == "Payments":
        primary_display = str(fields.get("Payment Name", ""))
    elif table == "Inventory_Transactions":
        primary_display = str(fields.get("Transaction ID", ""))
        
    if not primary_display or primary_display == "Unknown":
        # Fallback without using status fields like 'Active' or 'Cash'
        for k, v in fields.items():
            if isinstance(v, str) and len(v) > 0 and k not in ['Environment', 'Status', 'Payment Method']:
                primary_display = v
                break

    # Search all text fields for keywords
    all_text = " ".join([str(v).upper() for k, v in fields.items() if isinstance(v, str)])
    
    recommended = env
    reason = "No change needed"
    confidence = "High"

    if env == "Empty":
        recommended = "Test"
        reason = "Missing Environment"
        confidence = "High"
        
    if "DO NOT USE" in all_text:
        recommended = "Archive"
        reason = "Do Not Use marker"
        confidence = "High"
    elif "LEGACY" in all_text or "GOLIVE" in all_text:
        recommended = "Archive"
        reason = "Legacy bridge / Go-Live marker"
        confidence = "High"
    elif "TEST" in all_text or "QA " in all_text:
        recommended = "Test"
        reason = "Record contains TEST/QA"
        confidence = "High"
    elif env == "Live":
        recommended = "Test"
        reason = "Preflight booking / Santis OS not live"
        confidence = "High"
        
    return {
        "table": table,
        "record_id": record["id"],
        "primary_display": primary_display.replace('\n', ' ')[:100],
        "current_environment": env,
        "recommended_environment": recommended,
        "reason": reason,
        "confidence": confidence
    }

def main():
    print("Starting Phase 1: Read-only Audit across Airtable Environments...")
    
    plan = []
    
    for table in TABLES:
        print(f"Fetching {table}...")
        records = fetch_table(table)
        print(f"  Found {len(records)} records.")
        
        for r in records:
            rec = determine_recommendation(table, r)
            plan.append(rec)
            
    # Write to JSON
    json_path = "airtable_environment_reclassification_plan.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=2, ensure_ascii=False)
        
    # Write to CSV
    csv_path = "airtable_environment_reclassification_plan.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["table", "record_id", "primary_display", "current_environment", "recommended_environment", "reason", "confidence"])
        writer.writeheader()
        writer.writerows(plan)
        
    print(f"\nAudit complete. Output written to:\n- {csv_path}\n- {json_path}")
    print("\nPlease review these files before proceeding to Phase 3.")

if __name__ == "__main__":
    main()
