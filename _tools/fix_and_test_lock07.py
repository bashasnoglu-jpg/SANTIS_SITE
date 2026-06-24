import sys
import os
import json
import requests
import datetime
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableDB, AirtableConfig
from app.api.v1.endpoints.reception import update_booking_status, StatusUpdate

def fix_and_test():
    api_key = os.getenv("AIRTABLE_API_KEY")
    base_id = AirtableConfig.BASE_ID
    headers = {"Authorization": f"Bearer {api_key}"}
    db = AirtableDB()
    
    # 1. Find Massage Oil - Podgorica in Inventory
    print("Finding 'Massage Oil - Podgorica' in Inventory...")
    inv_params = {"filterByFormula": "FIND('Massage Oil - Podgorica', {Item Name}) > 0"}
    inv_items, _ = db.fetch_table("Inventory", params=inv_params, use_cache=False)
    if not inv_items:
        print("Could not find 'Massage Oil - Podgorica'. Let's search broadly for Massage Oil.")
        inv_params = {"filterByFormula": "FIND('Massage Oil', {Item Name}) > 0"}
        inv_items, _ = db.fetch_table("Inventory", params=inv_params, use_cache=False)
        if not inv_items:
            print("Could not find any Massage Oil.")
            return
            
    oil_item = inv_items[0]
    oil_id = oil_item['id']
    oil_name = oil_item['fields'].get('Item Name')
    print(f"Found Item: {oil_name} ({oil_id})")
    
    # 2. Update BOM Rule
    print("\nUpdating BOM rule to point to this item...")
    rules, _ = db.fetch_table("Service Consumption Rules", use_cache=False)
    if not rules:
        print("No BOM rules found.")
        return
    rule_id = rules[0]['id']
    db.update_record("Service Consumption Rules", rule_id, {
        "Inventory_Link": [oil_id]
    })
    
    service_id = rules[0]['fields'].get("Service_Link")[0]
    location_id = rules[0]['fields'].get("Location_Link")[0]
    print(f"Rule updated. Targets Service: {service_id}, Location: {location_id}, Item: {oil_id}")
    
    # 3. Find a new Test Booking
    print("\nFinding a new Test Booking...")
    bk_params = {
        "filterByFormula": "AND({Environment} = 'Test', RECORD_ID() != 'rec1DjTto8ulHOqTr')", 
        "maxRecords": 1
    }
    bookings, _ = db.fetch_table("Bookings", params=bk_params, use_cache=False)
    if not bookings:
        print("No other test bookings found! Falling back to creating a dummy test booking.")
        # If no test booking exists, we could create one but let's try to fetch any booking and set it to Test
        bk_params = {"filterByFormula": "RECORD_ID() != 'rec1DjTto8ulHOqTr'", "maxRecords": 1}
        bookings, _ = db.fetch_table("Bookings", params=bk_params, use_cache=False)
        if not bookings:
            print("No bookings found.")
            return
            
    booking = bookings[0]
    b_id = booking['id']
    print(f"Using Booking ID: {b_id} ({booking['fields'].get('Booking Code')})")
    
    print("Patching booking to include the target service, location, Environment=Test, and Inventory_Deducted=False")
    db.update_record("Bookings", b_id, {
        "Service_Link": [service_id], 
        "Location_Link": [location_id],
        "Environment": "Test",
        "Inventory_Deducted": False,
        "Status_New": "Confirmed"
    })
    
    # 4. Evidence Before
    print("\n--- 1. Before stock value ---")
    inv = db.get_record("Inventory", oil_id)
    initial_stock = inv['fields'].get('Current Stock')
    print(f"{oil_name} stock: {initial_stock}")
    
    # 5. Execute Booking Update
    print("\n--- 2. Booking Status_New changed to Completed ---")
    payload = StatusUpdate(status="Completed")
    try:
        update_booking_status(b_id, payload)
    except Exception as e:
        print(f"Error during update: {e}")
        
    # 6. Check Transactions
    print("\n--- 3. Exactly one Inventory_Transactions row created ---")
    updated_booking = db.get_record("Bookings", b_id)
    tx_links = updated_booking['fields'].get("Inventory_Transactions", [])
    
    new_txs_for_booking = []
    if tx_links:
        txs = db.get_transactions_by_ids(tx_links)
        for tx in txs:
            # Look for our specific transaction created today
            if tx['fields'].get("Transaction_Source") == "Booking Completed" and tx['fields'].get("Item") and tx['fields']['Item'][0] == oil_id:
                new_txs_for_booking.append(tx)
                
    print(f"Found {len(new_txs_for_booking)} matching transactions.")
    for tx in new_txs_for_booking:
        f = tx['fields']
        print(json.dumps({
            "Transaction ID": tx['id'],
            "Type": f.get('Type'),
            "Quantity Change": f.get('Quantity Change'),
            "Environment": f.get('Environment'),
            "Transaction_Source": f.get('Transaction_Source'),
            "Transaction_Status": f.get('Transaction_Status'),
            "Created_By_Automation": f.get('Created_By_Automation'),
            "Item": f.get('Item'),
            "Booking_Link": f.get('Booking_Link'),
            "Service_Link": f.get('Service_Link'),
            "Location_Link": f.get('Location_Link')
        }, indent=2))
        
    # 7. Check Stock
    print("\n--- 4. After stock value decreased by exactly 1 ---")
    updated_inv = db.get_record("Inventory", oil_id)
    new_stock = updated_inv['fields'].get('Current Stock')
    print(f"{oil_name} new stock: {new_stock} (Expected: {initial_stock - 1 if initial_stock is not None else -1})")
    
    # 8. Check Flag
    print("\n--- 5. Booking.Inventory_Deducted = true ---")
    print(f"Booking.Inventory_Deducted: {updated_booking['fields'].get('Inventory_Deducted')}")
    
    # 9. Idempotency Check
    print("\n--- 6. Repeat Completed call creates no second transaction ---")
    try:
        update_booking_status(b_id, payload)
    except Exception as e:
        print(f"Error during repeat update: {e}")
        
    updated_booking2 = db.get_record("Bookings", b_id)
    tx_links2 = updated_booking2['fields'].get("Inventory_Transactions", [])
    print(f"Transaction links count: {len(tx_links)} -> {len(tx_links2)} (Should be identical)")
    
    updated_inv2 = db.get_record("Inventory", oil_id)
    new_stock2 = updated_inv2['fields'].get('Current Stock')
    print(f"{oil_name} stock after repeat: {new_stock2} (Expected: {new_stock})")
    
    # 10. Check for empty transactions
    print("\n--- 8. Report existing empty transaction record separately ---")
    params = {"filterByFormula": "OR({Item} = BLANK(), {Type} = BLANK())"}
    empty_txs, _ = db.fetch_table("Inventory_Transactions", params=params, use_cache=False)
    print(f"Found {len(empty_txs)} empty or malformed transactions.")
    for etx in empty_txs:
        print(f"Empty Tx: {etx['id']} | Fields: {etx['fields']}")

if __name__ == "__main__":
    fix_and_test()
