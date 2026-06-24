import urllib.request
import urllib.parse
import json
import time
import os

def get_env(key):
    try:
        with open('.env') as f:
            for line in f:
                if line.startswith(key + '='):
                    return line.strip().split('=', 1)[1]
    except: pass
    return None

PAT = get_env('AIRTABLE_PAT') or get_env('AIRTABLE_API_KEY')
BASE_ID = get_env('AIRTABLE_BASE_ID') or 'app7VPfdgji5FzLHg'

def request(method, table, record_id=None, data=None):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{urllib.parse.quote(table)}"
    if record_id:
        url += f"/{record_id}"
    headers = {
        'Authorization': f'Bearer {PAT}',
        'Content-Type': 'application/json'
    }
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def main():
    # 1. Target Client Package
    cp_id = "rec8DCIEzKhOHoJZ5"
    cp = request('GET', 'Client_Packages', cp_id)
    rem_before = cp['fields'].get('Remaining Sessions', 0)
    print(f"Initial Package Remaining Sessions: {rem_before}")

    # 2. Create isolated TEST Booking
    print("Creating TEST Booking...")
    b_data = {
        "fields": {
            "Status_New": "Confirmed",
            "Payment_Status_New": "Covered by Package",
            "Environment": "Test",
            "Client Package Link": [cp_id],
            "Client_Link": ["recJQ3PBTTJZyutDp"],
            "Start_DateTime": "2026-06-25T12:00:00.000Z",
            "Reception_Notes": "LOCK-06 Idempotency Test - initial"
        }
    }
    try:
        b_res = request('POST', 'Bookings', data=b_data)
        b_id = b_res['id']
        print(f"Created TEST Booking: {b_id}")
    except Exception as e:
        print("Failed to create booking:", getattr(e, 'read', lambda: str(e))().decode('utf-8') if hasattr(e, 'read') else e)
        return

    # Check initial ledger count
    ledgers_before = len(b_res['fields'].get('Package_Usage_Ledger', []))
    print(f"Ledger count before: {ledgers_before}")

    # 3. Change booking to Completed
    print("Changing booking to Completed...")
    request('PATCH', 'Bookings', b_id, data={"fields": {"Status_New": "Completed"}})

    print("Waiting 5 seconds for Airtable Automations...")
    time.sleep(5)

    # 4. Verify Ledger Creation
    b_res2 = request('GET', 'Bookings', b_id)
    b_fields2 = b_res2['fields']
    ledgers_after1 = b_fields2.get('Package_Usage_Ledger', [])
    ledger_count1 = len(ledgers_after1)
    print(f"Ledger count after first trigger: {ledger_count1}")
    
    if ledger_count1 == 1:
        l_id = ledgers_after1[0]
        l_res = request('GET', 'Package_Usage_Ledger', l_id)
        print(f"Ledger ID: {l_id}")
        print(f"Sessions Deducted: {l_res['fields'].get('Sessions Deducted')}")
    else:
        print("Ledger ID: NONE or MULTIPLE")
        l_id = None
        
    print(f"Ledger Created? checkbox: {b_fields2.get('Ledger Created?')}")

    cp2 = request('GET', 'Client_Packages', cp_id)
    rem_after1 = cp2['fields'].get('Remaining Sessions', 0)
    print(f"Remaining sessions after first trigger: {rem_after1}")

    # 8. Trigger again (Update a field to force sync/trigger)
    print("Updating booking again to test idempotency...")
    request('PATCH', 'Bookings', b_id, data={"fields": {"Reception_Notes": "LOCK-06 Idempotency Test - duplicate trigger"}})
    
    print("Waiting 5 seconds...")
    time.sleep(5)
    
    b_res3 = request('GET', 'Bookings', b_id)
    b_fields3 = b_res3['fields']
    ledgers_after2 = b_fields3.get('Package_Usage_Ledger', [])
    ledger_count2 = len(ledgers_after2)
    print(f"Ledger count after duplicate trigger: {ledger_count2}")
    
    cp3 = request('GET', 'Client_Packages', cp_id)
    rem_after2 = cp3['fields'].get('Remaining Sessions', 0)
    print(f"Remaining sessions after duplicate trigger: {rem_after2}")

if __name__ == "__main__":
    main()
