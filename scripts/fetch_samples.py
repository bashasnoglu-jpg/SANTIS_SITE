import urllib.request
import json
import urllib.parse
import os

def get_env(key):
    try:
        with open('.env') as f:
            for line in f:
                if line.startswith(key + '='):
                    return line.strip().split('=', 1)[1]
    except: pass
    return None

PAT = get_env('AIRTABLE_PAT') or get_env('AIRTABLE_API_KEY')
BASE_ID = get_env('AIRTABLE_BASE_ID') or 'app7VPfdgji5FzLHg'

def fetch(table, filter_formula):
    url = f'https://api.airtable.com/v0/{BASE_ID}/{urllib.parse.quote(table)}?filterByFormula={urllib.parse.quote(filter_formula)}&maxRecords=1'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {PAT}'})
    res = urllib.request.urlopen(req)
    return json.loads(res.read())['records']

cp = fetch('Client_Packages', "{Environment}='Test'")
if cp:
    print('Test Client_Package:', json.dumps(cp[0]['fields'], indent=2))
    cp_id = cp[0]['id']
else:
    print('No Test Client_Package found')

bk = fetch('Bookings', "{Environment}='Test'")
if bk:
    print('Test Booking:', json.dumps(bk[0]['fields'], indent=2))
