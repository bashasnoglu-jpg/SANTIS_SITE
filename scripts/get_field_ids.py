
import sys
import os
import requests
sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env.local", override=True)
load_dotenv(".env")
from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get("AIRTABLE_PAT")

def get_fields(table_id):
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    for t in res.get("tables", []):
        if t["id"] == table_id or t["name"] == table_id:
            return {f["name"]: f["id"] for f in t["fields"]}
    return {}

print("PAYMENTS:")
for name, fid in get_fields("Payments").items():
    print(f"{name}: {fid}")

