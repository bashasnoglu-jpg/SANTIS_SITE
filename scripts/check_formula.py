
import sys
import os
import json
sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env.local", override=True)
load_dotenv(".env")
from app.services.airtable_db import AirtableDB
db = AirtableDB()
t_id = "recClzUcFGJpPGNl7"
records, _ = db.fetch_table("Staff_Shifts", params={"filterByFormula": f"FIND('{t_id}', ARRAYJOIN({{Staff_Link}})) > 0"})
print(f"Found {len(records)} for t_id {t_id} with FIND")

records, _ = db.fetch_table("Staff_Shifts", params={"filterByFormula": f"SEARCH('{t_id}', ARRAYJOIN({{Staff_Link}}))"})
print(f"Found {len(records)} for t_id {t_id} with SEARCH")


