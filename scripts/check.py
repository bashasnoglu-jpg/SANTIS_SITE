import sys, os, requests, urllib.parse
sys.path.insert(0, os.path.abspath('.'))
from dotenv import load_dotenv
load_dotenv('.env.local', override=True)
load_dotenv('.env')
from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get('AIRTABLE_PAT')

b_id = 'recCpLJV4XAvr1Dhy'
formula = f"FIND('{b_id}', ARRAYJOIN({{Booking_Link}})) > 0"
url = f"https://api.airtable.com/v0/{BASE_ID}/Payments?filterByFormula={urllib.parse.quote(formula)}&returnFieldsByFieldId=true"
res = requests.get(url, headers={'Authorization': f'Bearer {PAT}'}).json()
print("FIND ARRAYJOIN:", res)

formula2 = f"{{Booking_Link}}='{b_id}'"
url2 = f"https://api.airtable.com/v0/{BASE_ID}/Payments?filterByFormula={urllib.parse.quote(formula2)}&returnFieldsByFieldId=true"
res2 = requests.get(url2, headers={'Authorization': f'Bearer {PAT}'}).json()
print("EQ:", res2)
