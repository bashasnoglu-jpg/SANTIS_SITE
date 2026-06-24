import os
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

import requests
from app.services.airtable_db import AirtableConfig

if __name__ == "__main__":
    url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/Staff_Shifts?maxRecords=1"
    res = requests.get(url, headers={'Authorization': f'Bearer {os.environ.get("AIRTABLE_PAT")}'})
    print("Staff_Shifts Table HTTP Status:", res.status_code)
    print("Response:", res.text)
