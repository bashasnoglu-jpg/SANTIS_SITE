
import sys
import os
import json
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath("."))

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableDB, AirtableConfig
import requests

db = AirtableDB()

def get_first(table_name, filter_formula=None):
    table_id = AirtableConfig.TABLES.get(table_name, table_name)
    url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/{table_id}?maxRecords=1"
    if filter_formula:
        url += f"&filterByFormula={filter_formula}"
    res = requests.get(url, headers={"Authorization": f"Bearer {os.environ.get('AIRTABLE_PAT')}"})
    records = res.json().get("records", [])
    if records:
        return records[0]["id"], records[0]["fields"]
    return None, {}

budva_loc_id, budva_loc = get_first("Locations", "SEARCH('Budva', {Name})")
print(f"Location: {budva_loc_id} - {budva_loc.get('Name')}")

client_id, client = get_first("Clients", "{Environment}='Test'")
if not client_id:
    client_id, client = get_first("Clients")
print(f"Client: {client_id} - {client.get('Full Name', 'Unknown')}")

therapist_id, therapist = get_first("Therapists", f"FIND('{budva_loc.get('Name', '')}', ARRAYJOIN({{Location_Link}})) > 0")
print(f"Therapist: {therapist_id} - {therapist.get('Name')}")

room_id, room = get_first("Rooms", f"FIND('{budva_loc.get('Name', '')}', ARRAYJOIN({{Location_Link}})) > 0")
print(f"Room: {room_id} - {room.get('Name')}")

service_id, service = get_first("Services")
print(f"Service: {service_id} - {service.get('Name')}")

