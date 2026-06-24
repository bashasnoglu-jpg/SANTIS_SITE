import os
import sys
import argparse
import requests
import json
import urllib.parse

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableConfig

BASE_ID = AirtableConfig.BASE_ID
PAT = os.environ.get("AIRTABLE_PAT")

CASH_MOVEMENTS_TABLE = "tbliKm67lg4NnsrdA"
CASH_CLOSING_TABLE = "tblqKxZB2HMJrRa3S"
CASH_REGISTER_TABLE = "tblsbrK83eQS2WG0v"

def find_register_by_name(name):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_REGISTER_TABLE}?filterByFormula={{Cash Register Name}}='{name}'"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    records = res.get("records", [])
    if records:
        return records[0]["id"], records[0]["fields"].get("Location_Link"), records[0]["fields"].get("Tenant_Link")
    return None, None, None

def find_movements(date, reg_id):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_MOVEMENTS_TABLE}"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    records = res.get("records", [])
    
    filtered = []
    for r in records:
        f = r["fields"]
        mov_date = f.get("Movement Date")
        if mov_date and date in mov_date:
            reg_links = f.get("Cash_Register_Link", [])
            if reg_id in reg_links:
                filtered.append(r)
    return filtered

def find_closing(date, reg_id):
    url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_CLOSING_TABLE}"
    res = requests.get(url, headers={"Authorization": f"Bearer {PAT}"}).json()
    records = res.get("records", [])
    for r in records:
        f = r["fields"]
        closing_date = f.get("Closing Date")
        if closing_date and date in closing_date:
            reg_links = f.get("Cash_Register_Link", [])
            if reg_id in reg_links:
                return r["id"]
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True, help="Closing Date YYYY-MM-DD")
    parser.add_argument("--register", required=True, help="Cash Register Name")
    parser.add_argument("--cash-counted", type=float, default=0, help="Amount of cash counted in drawer")
    parser.add_argument("--write", action="store_true", help="Write changes to Airtable")
    args = parser.parse_args()

    reg_id, loc_link, ten_link = find_register_by_name(args.register)
    if not reg_id:
        print(f"Register '{args.register}' not found.")
        sys.exit(1)

    print(f"Running engine for Date: {args.date}, Register: {args.register} ({reg_id})")
    
    movements = find_movements(args.date, reg_id)
    print(f"Found {len(movements)} cash movements.")
    
    cash_income = 0
    card_income = 0
    bank_income = 0
    expenses = 0
    transfers_in = 0
    transfers_out = 0
    
    mov_ids = []
    
    for m in movements:
        fields = m["fields"]
        mov_ids.append(m["id"])
        
        amt = fields.get("Amount", 0)
        direction = fields.get("Direction")
        method = fields.get("Method")
        mov_type = fields.get("Movement Type")
        
        if direction == "In":
            if mov_type == "Transfer":
                transfers_in += amt
            elif method == "Cash":
                cash_income += amt
            elif method == "Card":
                card_income += amt
            elif method in ["Transfer", "Bank", "Online"]:
                bank_income += amt
        elif direction == "Out":
            if mov_type == "Transfer":
                transfers_out += amt
            elif method == "Cash":
                expenses += amt
                
    opening_cash = 0
    expected_cash = opening_cash + cash_income + transfers_in - expenses - transfers_out
    difference = args.cash_counted - expected_cash
    
    status = "Ready for Review"
    manager_approval = "Pending"
    
    notes = ""
    if difference != 0:
        notes = f"WARNING: Difference of {difference} EUR detected during closing."
        
    payload = {
        "Closing Date": args.date,
        "Cash_Register_Link": [reg_id],
        "Cash_Movements_Link": mov_ids,
        "Opening Cash": opening_cash,
        "Cash Income": cash_income,
        "Card Income": card_income,
        "Bank Income": bank_income,
        "Expenses": expenses,
        "Transfers In": transfers_in,
        "Transfers Out": transfers_out,
        "Cash Counted": args.cash_counted,
        "Closing Status": status,
        "Manager Approval": manager_approval,
        "Notes": notes,
        "Environment": "Test"
    }
    if loc_link: payload["Location_Link"] = loc_link
    if ten_link: payload["Tenant_Link"] = ten_link
    
    print("\n--- DRY RUN PAYLOAD ---")
    print(json.dumps(payload, indent=2))
    
    if args.write:
        existing_id = find_closing(args.date, reg_id)
        if existing_id:
            print(f"Updating existing closing: {existing_id}")
            url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_CLOSING_TABLE}/{existing_id}"
            res = requests.patch(
                url,
                headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
                json={"fields": payload, "typecast": True}
            ).json()
        else:
            print("Creating new closing record")
            url = f"https://api.airtable.com/v0/{BASE_ID}/{CASH_CLOSING_TABLE}"
            res = requests.post(
                url,
                headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
                json={"records": [{"fields": payload}], "typecast": True}
            ).json()
            
        if "error" in res:
            print("Error saving to Airtable:", res)
        else:
            print("Saved successfully.")

if __name__ == "__main__":
    main()
