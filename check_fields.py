import sys
import os
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')

from app.services.airtable_db import AirtableDB
import json

db = AirtableDB()

for table in ["Rooms", "Services", "Therapists", "Staff_Shifts", "Bookings"]:
    try:
        recs, _ = db.fetch_table(table)
        if recs:
            print(f"--- {table} ---")
            print(json.dumps(list(recs[0]["fields"].keys()), indent=2))
        else:
            print(f"--- {table} --- no records")
    except Exception as e:
        print(f"Error fetching {table}: {e}")
