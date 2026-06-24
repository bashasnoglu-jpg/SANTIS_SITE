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
    if t['id'] == 'tblqKxZB2HMJrRa3S': # Daily_Cash_Closing
        print("--- Daily_Cash_Closing ---")
        for f in t['fields']:
            if f['type'] in ('formula', 'rollup', 'multipleLookupValues', 'currency'):
                print(f"{f['name']}: {f['type']}")
    if t['id'] == 'tbliKm67lg4NnsrdA': # Cash_Movements
        print("--- Cash_Movements ---")
        for f in t['fields']:
            if f['name'] == 'Method':
                print(f"Method options: {f.get('options', {}).get('choices', [])}")
