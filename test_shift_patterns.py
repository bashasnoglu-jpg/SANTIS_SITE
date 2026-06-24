
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
TOKEN = os.environ.get("AIRTABLE_PAT")
headers = {"Authorization": f"Bearer {TOKEN}"}

# Check Staff_Shift_Patterns
url_patterns = f"https://api.airtable.com/v0/{BASE_ID}/Staff_Shift_Patterns?maxRecords=1"
res_patterns = requests.get(url_patterns, headers=headers)
print("Patterns table response:", res_patterns.status_code)
if res_patterns.status_code == 200:
    print(json.dumps(res_patterns.json(), indent=2))
else:
    print(res_patterns.text)

# Check Staff_Shifts
url_shifts = f"https://api.airtable.com/v0/{BASE_ID}/Staff_Shifts?maxRecords=1"
res_shifts = requests.get(url_shifts, headers=headers)
print("\nShifts table response:", res_shifts.status_code)
if res_shifts.status_code == 200:
    print(json.dumps(res_shifts.json(), indent=2))
else:
    print(res_shifts.text)

