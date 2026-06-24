import sys, os, requests, urllib.parse, json
sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv('.env.local', override=True)
load_dotenv('.env')
from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get('AIRTABLE_PAT')

table_id = 'tblQjvfz4ljnvCl1R'
view_id = 'viw94JUUUGeG7yznz'
formula = "OR(Environment='Test', Environment='Archive', Environment='')"
query_url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}?view={view_id}&filterByFormula={urllib.parse.quote(formula)}&maxRecords=1"

res = requests.get(query_url, headers={'Authorization': f'Bearer {PAT}'}).json()
print(json.dumps(res, indent=2))
