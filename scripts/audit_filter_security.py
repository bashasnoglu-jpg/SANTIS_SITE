import sys, os, requests, urllib.parse, json
sys.path.insert(0, os.path.abspath('.'))
from dotenv import load_dotenv
load_dotenv('.env.local', override=True)
load_dotenv('.env')
from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get('AIRTABLE_PAT')

TABLES_TO_AUDIT = {
    'Bookings': 'tblocCFVgSNfaLAH6',
    'Payments': 'tblcUltjoMusYcQob',
    'Staff_Shifts': 'tblQjvfz4ljnvCl1R'
}

def audit_views():
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    
    leaking_views = []
    secure_views = []
    
    for t in res.get("tables", []):
        table_name = t["name"]
        if table_name not in TABLES_TO_AUDIT:
            continue
            
        table_id = t["id"]
        print(f"\nAuditing Table: {table_name}")
        
        # Only audit operational views (starting with 0, or emojis like 🟢, 🏨, etc.)
        operational_views = [v for v in t.get("views", []) if any(c.isdigit() or c in '🟢🟡🔵🟠🟦🏨🏙️🌊🛥️🏖️' for c in v["name"][:3])]
        
        for v in operational_views:
            view_id = v["id"]
            view_name = v["name"]
            
            # Query the view, and filter for records where Environment is NOT 'Live'
            formula = "OR(Environment='Test', Environment='Archive', Environment='')"
            query_url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}?view={view_id}&filterByFormula={urllib.parse.quote(formula)}&maxRecords=1"
            
            try:
                view_res = requests.get(query_url, headers={"Authorization": f"Bearer {PAT}"}).json()
                records = view_res.get("records", [])
                
                if len(records) > 0:
                    print(f"❌ LEAK DETECTED in view: {view_name} (ID: {view_id})")
                    leaking_views.append(f"{table_name} -> {view_name}")
                else:
                    print(f"✅ SECURE: {view_name}")
                    secure_views.append(f"{table_name} -> {view_name}")
            except Exception as e:
                print(f"Error querying view {view_name}: {e}")

    print("\n--- AUDIT SUMMARY ---")
    print(f"Secure Views: {len(secure_views)}")
    print(f"Leaking Views: {len(leaking_views)}")
    for lv in leaking_views:
        print(f"  - {lv}")
        


if __name__ == "__main__":
    audit_views()
