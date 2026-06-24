import sys
import os
from dotenv import load_dotenv
load_dotenv(".env.local")

sys.path.insert(0, os.path.abspath("."))

from app.api.v1.endpoints.reception import get_today_bookings
from app.services.airtable_db import AirtableDB

def test_get_bookings():
    print("Running Reception Endpoint Function Test (JSON Output)...")
    try:
        db = AirtableDB()
        response = get_today_bookings(location="Budva", db=db)
        print("=== JSON RESPONSE ===")
        print(response.model_dump_json(indent=2))
        print("=====================")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_bookings()
