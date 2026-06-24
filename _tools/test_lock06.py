import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableDB, AirtableConfig
from app.api.v1.endpoints.reception import update_booking_status, StatusUpdate

def find_test_booking(db):
    # Fetch some bookings and find a test booking with package
    print("Searching for a suitable Test booking...")
    bookings, _ = db.fetch_table("Bookings", params={
        "filterByFormula": "AND({Environment}='Test', {Payment/Coverage Source}='Covered by Package', NOT({Ledger Created?}))"
    })
    
    if bookings:
        # Prefer one with CREATE PACKAGE LEDGER
        for b in bookings:
            if b["fields"].get("Package Ledger Auto Trigger") == "CREATE PACKAGE LEDGER":
                return b
        return bookings[0]
        
    print("Could not find a booking with NOT({Ledger Created?}) and 'Covered by Package'. Finding any Test booking...")
    bookings, _ = db.fetch_table("Bookings", params={
        "filterByFormula": "{Environment}='Test'",
        "maxRecords": 50
    })
    
    for b in bookings:
        if b["fields"].get("Ledger Created?") != True and b["fields"].get("Status_New") != "Completed":
            return b
            
    return None

def main():
    db = AirtableDB()
    booking = find_test_booking(db)
    
    if not booking:
        print("Could not find any suitable Test booking to run the test.")
        return
        
    record_id = booking["id"]
    
    # Ensure the booking is primed for our automation if it isn't already
    fields = booking["fields"]
    needs_update = False
    patch_fields = {}
    
    if fields.get("Payment/Coverage Source") != "Covered by Package":
        patch_fields["Payment/Coverage Source"] = "Covered by Package"
        needs_update = True
        
    # Give it a test package link if it doesn't have one
    if not fields.get("Client Package Link") and not fields.get("Linked Package"):
        # We need a package record ID to link it. Let's fetch one from Client_Packages
        client_pkgs, _ = db.fetch_table("Client_Packages", params={"maxRecords": 1})
        if client_pkgs:
            patch_fields["Client Package Link"] = [client_pkgs[0]["id"]]
            needs_update = True
            
    # Set the auto trigger if not present
    if fields.get("Package Ledger Auto Trigger") != "CREATE PACKAGE LEDGER":
        # Note: If it's a formula field, we can't patch it directly! 
        pass

    if needs_update:
        print(f"Priming test booking {record_id} with necessary fields...")
        try:
            db.update_record("Bookings", record_id, patch_fields)
        except Exception as e:
            print("Failed to prime booking (might be formula fields or read-only):", e)
            
    # Re-fetch for BEFORE state
    booking = db.get_record("Bookings", record_id)
    fields = booking["fields"]
    
    print("\n--- BEFORE ACTION ---")
    print(f"booking record id: {record_id}")
    print(f"Booking ID: {fields.get('Booking ID')}")
    print(f"Environment: {fields.get('Environment')}")
    print(f"Status_New: {fields.get('Status_New')}")
    print(f"Payment/Coverage Source: {fields.get('Payment/Coverage Source')}")
    print(f"Client Package Link: {fields.get('Client Package Link')}")
    print(f"Sessions To Deduct: {fields.get('Sessions To Deduct')}")
    print(f"Package Ledger Auto Trigger: {fields.get('Package Ledger Auto Trigger')}")
    print(f"Ledger Created?: {fields.get('Ledger Created?')}")
    print(f"existing Package_Usage_Ledger links/count: {fields.get('Package_Usage_Ledger', [])} / {len(fields.get('Package_Usage_Ledger', []))}")

    print("\n--- ACTION: Setting Status_New = Completed ---")
    try:
        # Call the endpoint function directly
        update_booking_status(record_id, StatusUpdate(status="Completed"))
        print("Endpoint called successfully.")
    except Exception as e:
        print(f"Error calling endpoint: {e}")
        
    print("\n--- AFTER ACTION ---")
    after_booking = db.get_record("Bookings", record_id)
    af = after_booking["fields"]
    
    print(f"booking Status_New: {af.get('Status_New')}")
    print(f"Ledger Created?: {af.get('Ledger Created?')}")
    
    new_ledgers = af.get("Package_Usage_Ledger", [])
    print(f"Package_Usage_Ledger links/count: {new_ledgers} / {len(new_ledgers)}")
    
    if new_ledgers:
        latest_ledger_id = new_ledgers[-1]
        try:
            ledger_rec = db.get_record("Package_Usage_Ledger", latest_ledger_id)
            lf = ledger_rec["fields"]
            print(f"created ledger record id: {latest_ledger_id}")
            print(f"ledger Usage Date: {lf.get('Usage Date')}")
            print(f"ledger Sessions Deducted: {lf.get('Sessions Deducted')}")
            print(f"ledger Booking link: {lf.get('Booking')}")
            print(f"ledger Client_Package_Link: {lf.get('Client_Package_Link')}")
            print(f"ledger Environment: {lf.get('Environment')}")
            
            if lf.get("Client_Package_Link"):
                pkg_id = lf.get("Client_Package_Link")[0]
                pkg_rec = db.get_record("Client_Packages", pkg_id)
                print(f"Client_Packages Remaining Sessions: {pkg_rec['fields'].get('Remaining Sessions')}")
        except Exception as e:
            print(f"Could not fetch ledger details: {e}")
    else:
        print("No new ledger found on the booking record.")
        print("Checking Package_Usage_Ledger table manually...")
        ledgers, _ = db.fetch_table("Package_Usage_Ledger", params={"filterByFormula": f"FIND('{record_id}', ARRAYJOIN({{Booking}})) > 0"})
        if ledgers:
            lf = ledgers[0]["fields"]
            print(f"created ledger record id: {ledgers[0]['id']}")
            print(f"ledger Usage Date: {lf.get('Usage Date')}")
            print(f"ledger Sessions Deducted: {lf.get('Sessions Deducted')}")
            print(f"ledger Booking link: {lf.get('Booking')}")
            print(f"ledger Client_Package_Link: {lf.get('Client_Package_Link')}")
            print(f"ledger Environment: {lf.get('Environment')}")
        else:
            print("Ledger definitely not created.")
            
    print("\n--- IDEMPOTENCY CHECK ---")
    print("Calling same Completed update again...")
    try:
        update_booking_status(record_id, StatusUpdate(status="Completed"))
    except Exception as e:
        pass
        
    final_booking = db.get_record("Bookings", record_id)
    ff = final_booking["fields"]
    final_ledgers = ff.get("Package_Usage_Ledger", [])
    print(f"Package_Usage_Ledger links/count after 2nd call: {final_ledgers} / {len(final_ledgers)}")

if __name__ == "__main__":
    main()
