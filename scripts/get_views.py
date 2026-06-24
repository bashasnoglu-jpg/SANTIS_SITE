import sys, os, requests, json
sys.path.insert(0, os.path.abspath('.'))
from dotenv import load_dotenv
load_dotenv('.env.local', override=True)
load_dotenv('.env')
from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get('AIRTABLE_PAT')

url = f'https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables'
res = requests.get(url, headers={'Authorization': f'Bearer {PAT}'}).json()
for t in res.get('tables', []):
    if t['name'] in ('Bookings', 'Staff_Shifts', 'Payments'):
        print(f"\n--- {t['name']} Views ---")
        for v in t.get('views', []):
            print(f"- {v['name']} ({v['id']})")
