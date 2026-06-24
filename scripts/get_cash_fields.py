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
tables_of_interest = ['tblsbrK83eQS2WG0v', 'tbliKm67lg4NnsrdA', 'tblqKxZB2HMJrRa3S']

for t in res.get('tables', []):
    if t['id'] in tables_of_interest:
        print(f'\n--- Table: {t["name"]} ({t["id"]}) ---')
        for f in t['fields']:
            print(f"{f['name']}: {f['id']}")
