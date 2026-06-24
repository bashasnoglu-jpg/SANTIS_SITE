import os
import json
import urllib.request
import urllib.error

API_KEY = "[REDACTED]"
BASE_ID = "app7VPfdgji5FzLHg"
TABLE_ID = "tblocCFVgSNfaLAH6"

def update_record(record_id, fields):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}/{record_id}"
    data = json.dumps({"fields": fields}).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("Content-Type", "application/json")
    try:
        res = urllib.request.urlopen(req)
        return json.loads(res.read())
    except urllib.error.HTTPError as e:
        print(f"Error updating {record_id}: {e.code} - {e.read()}")
        return None

def main():
    # Load dump to find the record ID
    with open("airtable_dump.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    target_rec_id = None
    for r in data.get("records", []):
        flds = r.get("fields", {})
        # Depending on how the field is named:
        b_id = str(flds.get("Booking ID", flds.get("fldtlqLi9JpNxpnwh", "")))
        if b_id == "36":
            target_rec_id = r["id"]
            break
            
    if not target_rec_id:
        print("Booking 36 bulunamadı.")
        return
        
    print(f"Booking 36 ({target_rec_id}) güncelleniyor...")
    
    # "Status_New" was confirmed to be a single select or similar.
    # We will pass "Confirmed"
    fields_to_update = {
        "Status_New": "Confirmed"
    }
    
    result = update_record(target_rec_id, fields_to_update)
    if result:
        print(f"Başarıyla güncellendi! Yeni durum: {result['fields'].get('Status_New')}")

if __name__ == "__main__":
    main()
