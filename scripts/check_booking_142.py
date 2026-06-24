
import sys
import os
import json
sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env.local", override=True)
load_dotenv(".env")
from app.services.airtable_db import AirtableDB
db = AirtableDB()
records, _ = db.fetch_table("Bookings", params={"filterByFormula": "{Booking ID}=142"})
if records:
    print("Found booking 142")
    print(json.dumps(records[0].get("fields", {}), indent=2))
else:
    print("Booking 142 not found")

