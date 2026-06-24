import sys, os, requests, json
sys.path.insert(0, os.path.abspath('.'))
from dotenv import load_dotenv
load_dotenv('.env.local', override=True)
load_dotenv('.env')
from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get('AIRTABLE_PAT')
BOOKINGS_TABLE = AirtableConfig.TABLES.get("Bookings", "Bookings")

print("--- Payment Verification Results ---")
for b_id in [144, 145, 146, 147]:
    url = f'https://api.airtable.com/v0/{BASE_ID}/{BOOKINGS_TABLE}?filterByFormula={{Booking ID}}={b_id}&returnFieldsByFieldId=true'
    res = requests.get(url, headers={'Authorization': f'Bearer {PAT}'}).json()['records'][0]['fields']
    
    note = res.get('fldHkZPKdUvkG4duG', '') # Reception Notes
    scenario = "Unknown"
    if "Cash" in note: scenario = "Cash"
    elif "Card" in note: scenario = "Card"
    elif "Unpaid" in note: scenario = "Unpaid"
    elif "Package" in note: scenario = "Package"
    
    print(f"Booking {b_id} ({scenario}):")
    print(f"  Payment_Status_New: {res.get('fldwA6xq5WGq5z3ND')}")
    print(f"  Total Paid EUR: {res.get('fldPmQrj61MdcsR6l')}")
    print(f"  Balance Due EUR: {res.get('fldXOUkF9zoog57sD')}")
    print()
