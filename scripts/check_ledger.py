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

def request(table, filter_formula):
    url = f'https://api.airtable.com/v0/{BASE_ID}/{urllib.parse.quote(table)}?filterByFormula={urllib.parse.quote(filter_formula)}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {PAT}'})
    return json.loads(urllib.request.urlopen(req).read())['records']

ledgers = request('Package_Usage_Ledger', "FIND('rec2yqfuAksvgYrdQ', {Booking_Link} & '') > 0")
print('Found ledgers for booking 89:', len(ledgers))
if len(ledgers) > 0:
    print(json.dumps(ledgers[0]['fields'], indent=2))
