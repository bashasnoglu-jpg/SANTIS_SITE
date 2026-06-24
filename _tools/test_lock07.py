import sys
import os
import json
import requests
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableDB, AirtableConfig
from app.api.v1.endpoints.reception import update_booking_status, StatusUpdate

def test_lock07():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    headers = {"Authorization": f"Bearer {api_key}"}
    
    db = AirtableDB()
    
    # Let's find a test booking that has the required service and location (Podgorica)
    # The rule we created is for Podgorica Massage Oil Usage.
    # It requires the Service_Link we used and Location_Link = Podgorica.
    
    # Fetch the BOM rule to see what service it uses
    res = requests.get(f"https://api.airtable.com/v0/{base_id}/tblTEzJnHSL8E1NYe?maxRecords=1", headers=headers)
    if res.status_code != 200:
        print("Error fetching BOM")
        return
        
    rules = res.json().get('records', [])
    if not rules:
        print("No BOM rule found")
        return
        
    rule = rules[0]
    service_id = rule['fields']['Service_Link'][0]
    location_id = rule['fields']['Location_Link'][0]
    inv_id = rule['fields']['Inventory_Link'][0]
    
    print(f"Test Rule targets Service: {service_id}, Location: {location_id}, Item: {inv_id}")
    
    # Check current stock
    inv = db.get_record("Inventory", inv_id)
    initial_stock = inv['fields'].get('Current Stock')
    print(f"Initial Stock: {initial_stock}")
    
    # Fetch an active booking matching this service and location, which is not yet Completed
    # AND(FIND('service_id', ARRAYJOIN({Service_Link})), FIND('location_id', ARRAYJOIN({Location_Link})), {Status_New} != 'Completed')
    params = {"filterByFormula": "{Environment} = 'Test'", "maxRecords": 1}
    bookings, _ = db.fetch_table("Bookings", params=params, use_cache=False)
    
    if not bookings:
        print("No bookings found at all in Test Environment.")
        return
            
    test_booking = bookings[0]
    b_id = test_booking['id']
    print(f"Using Booking ID: {b_id} ({test_booking['fields'].get('Booking Code')})")
    
    print("Patching booking to include the target service and location, and setting Inventory_Deducted = False")
    db.update_record("Bookings", b_id, {
        "Service_Link": [service_id], 
        "Location_Link": [location_id],
        "Inventory_Deducted": False,
        "Status_New": "Confirmed"
    })
            
    test_booking = bookings[0]
    b_id = test_booking['id']
    print(f"Using Booking ID: {b_id} ({test_booking['fields'].get('Booking Code')})")
    
    # We must ensure the booking has the required service link
    current_services = test_booking['fields'].get("Service_Link", [])
    if service_id not in current_services:
        print("Patching booking to include the target service and setting Inventory_Deducted = False")
        current_services.append(service_id)
        db.update_record("Bookings", b_id, {"Service_Link": current_services, "Inventory_Deducted": False})
    else:
        print("Setting Inventory_Deducted = False just in case")
        db.update_record("Bookings", b_id, {"Inventory_Deducted": False})
        
    print("\n--- Running LOCK-07 Test (Triggering Completed) ---")
    payload = StatusUpdate(status="Completed")
    try:
        update_booking_status(b_id, payload)
    except Exception as e:
        print(f"Error during update: {e}")
        
    # Verify results
    print("\n--- Verifying Results ---")
    updated_booking = db.get_record("Bookings", b_id)
    inv_deducted = updated_booking['fields'].get("Inventory_Deducted")
    print(f"Booking.Inventory_Deducted: {inv_deducted}")
    
    updated_inv = db.get_record("Inventory", inv_id)
    new_stock = updated_inv['fields'].get('Current Stock')
    print(f"New Stock: {new_stock} (Expected: {initial_stock - 1})")
    
    # Check transactions
    tx_links = updated_booking['fields'].get("Inventory_Transactions", [])
    if tx_links:
        txs = db.get_transactions_by_ids(tx_links)
        for tx in txs:
            if tx['fields'].get("Transaction_Source") == "Booking Completed":
                print(f"Created Transaction: {tx['id']} | Qty: {tx['fields'].get('Quantity Change')} | Type: {tx['fields'].get('Type')}")
    else:
        print("No transactions linked to booking!")
        
    print("\n--- Running Idempotency Test (Triggering Completed Again) ---")
    payload = StatusUpdate(status="Completed")
    try:
        update_booking_status(b_id, payload)
    except Exception as e:
        print(f"Error during update: {e}")
        
    # Verify stock hasn't changed again
    updated_inv2 = db.get_record("Inventory", inv_id)
    new_stock2 = updated_inv2['fields'].get('Current Stock')
    print(f"Stock after second trigger: {new_stock2} (Expected: {new_stock})")

if __name__ == "__main__":
    test_lock07()
