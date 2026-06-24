import os
import sys
import requests
import urllib.parse
import json

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get("AIRTABLE_PAT")

CASH_CLOSING_TABLE = "tblqKxZB2HMJrRa3S"

def verify_closing(date):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_CLOSING_TABLE}"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    records = res.get("records", [])
    
    found = False
    for r in records:
        f = r["fields"]
        if f.get("Closing Date") and date in f.get("Closing Date") and f.get("Environment") == "Test":
            found = True
            print(f"\n--- Closing Record for {date} ({r['id']}) ---")
            print(f"Cash Income:     {f.get('Cash Income')}")
            print(f"Card Income:     {f.get('Card Income')}")
            print(f"Expenses:        {f.get('Expenses')}")
            print(f"Cash Counted:    {f.get('Cash Counted')}")
            print(f"Expected Cash:   {f.get('Expected Cash')}  <-- (Formula)")
            print(f"Cash Difference: {f.get('Cash Difference')}  <-- (Formula)")
            print(f"Closing Status:  {f.get('Closing Status')}")
            print(f"Notes:           {f.get('Notes', '')}")
            print(f"Manager Appr:    {f.get('Manager Approval')}")
            
    if not found:
        print(f"No Daily_Cash_Closing record found for {date} (Test Env)")

def main():
    verify_closing("2026-06-26")
    verify_closing("2026-06-27")

if __name__ == "__main__":
    main()
