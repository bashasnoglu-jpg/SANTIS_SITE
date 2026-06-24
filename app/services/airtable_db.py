import os
import time
import requests
from typing import Dict, Any, Tuple

class AirtableConfig:
    # Centralized mappings to avoid hardcoded hashes in routers
    BASE_ID = os.getenv("AIRTABLE_BASE_ID", "app7VPfdgji5FzLHg")
    
    TABLES = {
        "Bookings": "tblocCFVgSNfaLAH6",
        "Therapists": "tblP1I56GubdY96Es",
        "Rooms": "tblikrHnBSMKt5B3h",
        "Services": "tbluiywBUXipbWlIa",
        "Package_Usage_Ledger": "tbljoNfFOZfiS9cSQ",
        "Client_Packages": "tblttYYEFDwu9gC3D",
        "Locations": "Locations",
        "Staff_Shifts": "Staff_Shifts",
        "Inventory_Transactions": "tbl87C0x20babcBTf",
        "Service Consumption Rules": "tblTEzJnHSL8E1NYe",
        "Inventory": "tbl1HzavzuHMtneEP"
    }

    FIELDS = {
        "Bookings": {
            "Start_DateTime": "fldWbz4kZzqerUxhn",
            "Status": "fldecPedQfpnjc83O"
        }
    }

class AirtableDB:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("AIRTABLE_API_KEY")
        if not self.api_key:
            raise ValueError("AIRTABLE_API_KEY environment variable is missing or not provided")
            
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Simple in-memory TTL Cache
        # cache_store = { "table_name": { "timestamp": <float>, "data": <list> } }
        self.CACHE_TTL_SECONDS = 300

    # Share cache across instances of AirtableDB
    _cache_store: Dict[str, Dict[str, Any]] = {}

    def fetch_table(self, table_name: str, params: dict = None, use_cache: bool = False) -> Tuple[list, str]:
        """
        Returns (records, cache_status)
        Abstracts the pagination, retry, exponential backoff and rate limits.
        """
        now = time.time()
        
        if table_name not in AirtableConfig.TABLES:
            raise ValueError(f"Unknown table name: {table_name}")
            
        table_id = AirtableConfig.TABLES[table_name]
        
        # Check cache
        if use_cache and table_name in self._cache_store:
            cached = self._cache_store[table_name]
            if now - cached["timestamp"] < self.CACHE_TTL_SECONDS:
                return cached["data"], "hit"

        url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/{table_id}"
        records = []
        offset = None
        
        if params is None:
            params = {}
            
        while True:
            req_params = params.copy()
            if offset:
                req_params["offset"] = offset
                
            retries = 3
            backoff = 0.5
            res = None
            
            while retries > 0:
                try:
                    res = requests.get(url, headers=self.headers, params=req_params, timeout=10)
                    if res.status_code == 429:
                        time.sleep(backoff)
                        retries -= 1
                        backoff *= 2
                        continue
                    if res.status_code != 200:
                        raise Exception(f"Airtable error {res.status_code}: {res.text}")
                    break
                except requests.exceptions.RequestException as e:
                    retries -= 1
                    if retries <= 0:
                        raise Exception(f"Network error: {str(e)}")
                    time.sleep(backoff)
                    backoff *= 2
                    
            if res is None or res.status_code != 200:
                raise Exception("Failed to fetch from Airtable after retries")

            data = res.json()
            records.extend(data.get("records", []))
            
            offset = data.get("offset")
            if not offset:
                break
                
        # Save to cache
        if use_cache:
            self._cache_store[table_name] = {"timestamp": now, "data": records}
            
        return records, "miss"

    def update_record(self, table_name: str, record_id: str, fields: dict, **kwargs) -> dict:
        """
        Updates a specific record with retry logic.
        """
        if table_name not in AirtableConfig.TABLES:
            raise ValueError(f"Unknown table name: {table_name}")
            
        table_id = AirtableConfig.TABLES[table_name]
        url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/{table_id}/{record_id}"
        
        body = {"fields": fields}
        body.update(kwargs)
        
        retries = 3
        backoff = 0.5
        res = None
        
        while retries > 0:
            try:
                res = requests.patch(url, headers=self.headers, json=body, timeout=10)
                if res.status_code == 429:
                    time.sleep(backoff)
                    retries -= 1
                    backoff *= 2
                    continue
                if res.status_code != 200:
                    raise Exception(f"Airtable error {res.status_code}: {res.text}")
                break
            except requests.exceptions.RequestException as e:
                retries -= 1
                if retries <= 0:
                    raise Exception(f"Network error: {str(e)}")
                time.sleep(backoff)
                backoff *= 2
                
        if res is None or res.status_code != 200:
            raise Exception("Failed to update Airtable after retries")

        return res.json()

    def create_record(self, table_name: str, fields: dict, **kwargs) -> dict:
        """
        Creates a specific record with retry logic.
        """
        if table_name not in AirtableConfig.TABLES:
            raise ValueError(f"Unknown table name: {table_name}")
            
        if table_name in ["Staff_Shifts", "Bookings", "Payments", "Cash_Movements", "Daily_Cash_Closing"]:
            if "Environment" not in fields:
                raise ValueError(f"Environment field is REQUIRED when creating records in {table_name}.")
                
        table_id = AirtableConfig.TABLES[table_name]
        url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/{table_id}"
        
        body = {"fields": fields}
        body.update(kwargs)
        
        retries = 3
        backoff = 0.5
        res = None
        
        while retries > 0:
            try:
                res = requests.post(url, headers=self.headers, json=body, timeout=10)
                if res.status_code == 429:
                    time.sleep(backoff)
                    retries -= 1
                    backoff *= 2
                    continue
                if res.status_code != 200:
                    raise Exception(f"Airtable error {res.status_code}: {res.text}")
                break
            except requests.exceptions.RequestException as e:
                retries -= 1
                if retries <= 0:
                    raise Exception(f"Network error: {str(e)}")
                time.sleep(backoff)
                backoff *= 2
                
        if res is None or res.status_code != 200:
            raise Exception("Failed to create record in Airtable after retries")

        return res.json()

    def delete_record(self, table_name: str, record_id: str) -> dict:
        """
        Deletes a specific record. Only to be used for automated cleanups or service-level deletes.
        """
        if table_name not in AirtableConfig.TABLES:
            raise ValueError(f"Unknown table name: {table_name}")
            
        table_id = AirtableConfig.TABLES[table_name]
        url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/{table_id}/{record_id}"
        
        retries = 3
        backoff = 0.5
        res = None
        
        while retries > 0:
            try:
                res = requests.delete(url, headers=self.headers, timeout=10)
                if res.status_code == 429:
                    time.sleep(backoff)
                    retries -= 1
                    backoff *= 2
                    continue
                if res.status_code != 200:
                    raise Exception(f"Airtable error {res.status_code}: {res.text}")
                break
            except requests.exceptions.RequestException as e:
                retries -= 1
                if retries <= 0:
                    raise Exception(f"Network error: {str(e)}")
                time.sleep(backoff)
                backoff *= 2
                
        if res is None or res.status_code != 200:
            raise Exception("Failed to delete record from Airtable after retries")

        return res.json()

    def get_record(self, table_name: str, record_id: str) -> dict:
        """
        Retrieves a specific record.
        """
        if table_name not in AirtableConfig.TABLES:
            raise ValueError(f"Unknown table name: {table_name}")
            
        table_id = AirtableConfig.TABLES[table_name]
        url = f"https://api.airtable.com/v0/{AirtableConfig.BASE_ID}/{table_id}/{record_id}"
        
        res = requests.get(url, headers=self.headers, timeout=10)
        if res.status_code != 200:
            raise Exception(f"Airtable error {res.status_code}: {res.text}")
            
        return res.json()

    def get_bookings_by_date(self, date: str) -> Tuple[list, str]:
        date_field_id = AirtableConfig.FIELDS["Bookings"]["Start_DateTime"]
        params = {
            "filterByFormula": f"AND(IS_SAME({{{date_field_id}}}, '{date}', 'day'), {{Environment}}='Live')"
        }
        return self.fetch_table("Bookings", params=params, use_cache=False)

    def get_reception_bookings_by_location_and_date(self, location_name: str) -> Tuple[list, str]:
        # NOTE: TODAY() evaluates in UTC/GMT. Airtable date boundaries might shift.
        # MVP requests Europe/Podgorica timezone behavior via IS_SAME({Start_DateTime}, TODAY(), 'day').
        date_field_id = AirtableConfig.FIELDS["Bookings"]["Start_DateTime"]
        formula = (
            "AND("
            "{Environment}='Live', "
            f"FIND('{location_name}', ARRAYJOIN({{Location_Link}})) > 0, "
            f"IS_SAME({{{date_field_id}}}, TODAY(), 'day'), "
            "{Status_New}!='Cancelled', "
            "{Status_New}!='No-show'"
            ")"
        )
        params = {"filterByFormula": formula}
        return self.fetch_table("Bookings", params=params, use_cache=False)

    def get_shifts_by_date(self, date: str) -> Tuple[list, str]:
        # Using a broad formula or no formula initially to avoid breaking if Date vs Shift_Date differs,
        # but Date or Shift_Date is required to filter
        params = {
            "filterByFormula": f"IS_SAME({{Shift_Date}}, '{date}', 'day')"
        }
        return self.fetch_table("Staff_Shifts", params=params, use_cache=False)

    def get_active_therapists(self) -> Tuple[list, str]:
        # Optimize O(N) by fetching only active, complete therapists
        # Using the active field identified in adapter: fldIEZrpm3TxglDTL
        params = {
            "filterByFormula": "AND({fldIEZrpm3TxglDTL} != FALSE(), {Location Assignment Check} = '✅ Location Set', {Staff Card Completeness} = '✅ Complete')"
        }
        therapists, cache_status = self.fetch_table("Therapists", params=params, use_cache=True)
        locations, _ = self.get_locations()
        
        active_location_ids = set()
        for loc in locations:
            if loc.get("fields", {}).get("Status") == "Active":
                active_location_ids.add(loc["id"])
                
        filtered_therapists = []
        for t in therapists:
            fields = t.get("fields", {})
            linked_loc_ids = fields.get("Location_Link") or fields.get("Location") or []
            
            # Check if at least one linked location is active
            if any(lid in active_location_ids for lid in linked_loc_ids):
                filtered_therapists.append(t)
                
        return filtered_therapists, cache_status

    def get_locations(self) -> Tuple[list, str]:
        return self.fetch_table("Locations", use_cache=True)

    def get_rooms(self) -> Tuple[list, str]:
        # Fetch all rooms and locations to apply strong location-based filtering
        rooms, cache_status = self.fetch_table("Rooms", use_cache=True)
        locations, _ = self.get_locations()
        
        # Determine active location IDs
        active_location_ids = set()
        for loc in locations:
            if loc.get("fields", {}).get("Status") == "Active":
                active_location_ids.add(loc["id"])
                
        # Filter rooms based on active locations and Location Assignment Check
        filtered_rooms = []
        for r in rooms:
            fields = r.get("fields", {})
            assignment_check = fields.get("Location Assignment Check")
            
            # Identify linked location
            linked_loc_ids = fields.get("Location_Link") or fields.get("Location") or []
            
            # Check if any linked location is active
            has_active_loc = any(lid in active_location_ids for lid in linked_loc_ids)
            
            if has_active_loc and assignment_check == "✅ Location Set":
                filtered_rooms.append(r)
                
        return filtered_rooms, cache_status

    def get_services(self) -> Tuple[list, str]:
        params = {
            "filterByFormula": "{Active} != FALSE()"
        }
        return self.fetch_table("Services", params=params, use_cache=True)
        
    def update_booking_status(self, record_id: str, new_status: str) -> dict:
        status_field_id = AirtableConfig.FIELDS["Bookings"]["Status"]
        return self.update_record("Bookings", record_id, {
            status_field_id: new_status
        })

    def get_service_consumption_rules(self, service_id: str, location_id: str) -> list:
        params = {"filterByFormula": "{Active} != FALSE()"}
        rules, _ = self.fetch_table("Service Consumption Rules", params=params, use_cache=True)
        
        filtered = []
        for r in rules:
            fields = r.get("fields", {})
            s_links = fields.get("Service_Link", [])
            l_links = fields.get("Location_Link", [])
            if service_id in s_links:
                # If Location_Link is provided, it must match. If empty, it's global.
                if not l_links or location_id in l_links:
                    filtered.append(r)
        return filtered

    def get_transactions_by_ids(self, transaction_ids: list) -> list:
        if not transaction_ids:
            return []
        
        # Max 100 conditions in OR usually safe, chunk if necessary. Usually a booking has < 10 txs.
        conditions = [f"RECORD_ID()='{tid}'" for tid in transaction_ids]
        formula = f"OR({','.join(conditions)})"
        params = {"filterByFormula": formula}
        txs, _ = self.fetch_table("Inventory_Transactions", params=params, use_cache=False)
        return txs

    def create_inventory_transaction(self, fields: dict) -> dict:
        return self.create_record("Inventory_Transactions", fields)

    def update_inventory_stock(self, item_id: str, new_stock: float) -> dict:
        return self.update_record("Inventory", item_id, {"Current Stock": new_stock})

