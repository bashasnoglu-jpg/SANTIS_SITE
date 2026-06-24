
import sys
import os
import json
sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env.local", override=True)
load_dotenv(".env")
from app.services.airtable_db import AirtableDB
db = AirtableDB()
records, _ = db.fetch_table("Staff_Shifts", params={"filterByFormula": "IS_SAME({Shift_Date}, '2026-06-23', 'day')", "maxRecords": 50})
for r in records:
    print(r.get("fields", {}).get("Shift_Start"), r.get("fields", {}).get("Staff_Link"))

