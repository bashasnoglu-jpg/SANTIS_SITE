
import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
TOKEN = os.environ.get("AIRTABLE_PAT")
headers = {"Authorization": f"Bearer {TOKEN}"}

today_str = datetime.now().strftime("%Y-%m-%d")
print(f"Date used for query: {today_str}")

# 1. Check Staff_Shifts
url_shifts = f"https://api.airtable.com/v0/{BASE_ID}/Staff_Shifts?filterByFormula=SEARCH('{today_str}', {{Shift_Date}})"
res_shifts = requests.get(url_shifts, headers=headers).json()
shifts = res_shifts.get("records", [])
print(f"\n=== 1. Staff_Shifts ({today_str}) ===")
print(f"Total found: {len(shifts)}")
for s in shifts:
    print(f"- {s['fields'].get('Shift_ID')} / {s['fields'].get('Shift_Date')} / {s['fields'].get('Shift_Status')} / {s['fields'].get('Scheduler Visibility')}")

# 2. Check Offline_Daily_Schedule_Exports
url_exports = f"https://api.airtable.com/v0/{BASE_ID}/Offline_Daily_Schedule_Exports?filterByFormula=SEARCH('{today_str}', {{Export Date}})"
res_exports = requests.get(url_exports, headers=headers).json()
exports = res_exports.get("records", [])
print(f"\n=== 2. Offline_Daily_Schedule_Exports ({today_str}) ===")
print(f"Total found: {len(exports)}")
for e in exports:
    print(f"- {e['fields'].get('Export Name')} / {e['fields'].get('Export Status')}")

# 3. Check Bookings
url_bookings = f"https://api.airtable.com/v0/{BASE_ID}/Bookings?filterByFormula=SEARCH('{today_str}', {{Start_DateTime}})"
res_bookings = requests.get(url_bookings, headers=headers).json()
bookings = res_bookings.get("records", [])
print(f"\n=== 3. Today's Bookings ({today_str}) ===")
print(f"Total found: {len(bookings)}")
test_records = []
for b in bookings:
    env = str(b['fields'].get('Environment', ''))
    status = str(b['fields'].get('Status_New', ''))
    if 'Test' in env or 'QA' in env or 'Archive' in status or 'Demo' in env or 'Test' in status:
         test_records.append(b)
print(f"Test/QA/Archive records found today: {len(test_records)}")
for b in test_records:
    print(f"- {b['fields'].get('Booking ID', 'No ID')} / Env: {b['fields'].get('Environment')} / Status: {b['fields'].get('Status_New')}")

