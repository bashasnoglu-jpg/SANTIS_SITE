import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableDB

db = AirtableDB()

therapists, _ = db.fetch_table("Therapists", params={"maxRecords": 2})
if therapists:
    print("Therapists Fields:", list(therapists[0]["fields"].keys()))

locations, _ = db.fetch_table("Locations", params={"maxRecords": 2})
if locations:
    print("Locations Fields:", list(locations[0]["fields"].keys()))
