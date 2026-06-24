import os
import sys
import argparse
import json
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv()

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app.services.airtable_db import AirtableDB

def main():
    parser = argparse.ArgumentParser(description="Cleanup Alba Test records")
    parser.add_argument("--execute", action="store_true", help="Actually delete the records")
    args = parser.parse_args()

    db = AirtableDB()

    TENANT_ID = "recXRJQPnS91LbURI"
    LOCATION_ID = "recglzH6Z9R3E7vsh"

    print(f"--- CLEANUP TEST RECORDS ---")
    print(f"Mode: {'EXECUTE' if args.execute else 'DRY RUN'}")
    print(f"Tenant: {TENANT_ID}")
    print(f"Location: {LOCATION_ID}\n")

    # 1. Gather Bookings
    # Bookings where Reception_Notes contains "Test Guest" and Tenant_Link = TENANT_ID
    book_params = {
        "filterByFormula": f"FIND('Test Guest', {{Reception_Notes}}) > 0"
    }
    bookings, _ = db.fetch_table("Bookings", params=book_params)

    # 2. Gather Therapists
    therapist_params = {
        "filterByFormula": f"FIND('Alba Test', {{Name}}) > 0"
    }
    therapists, _ = db.fetch_table("Therapists", params=therapist_params)
    therapist_ids = [t["id"] for t in therapists]

    # 3. Gather Staff_Shifts
    shift_params = {
        "filterByFormula": f"FIND('Days: Monday', {{Notes}}) > 0"
    }
    shifts, _ = db.fetch_table("Staff_Shifts", params=shift_params)

    # 4. Gather Rooms
    room_params = {
        "filterByFormula": f"FIND('Alba Test', {{Name}}) > 0"
    }
    rooms, _ = db.fetch_table("Rooms", params=room_params)

    # 5. Gather Services
    service_params = {
        "filterByFormula": f"FIND('Alba Test', {{Name}}) > 0"
    }
    services, _ = db.fetch_table("Services", params=service_params)

    records_to_delete = {
        "Bookings": bookings,
        "Staff_Shifts": shifts,
        "Rooms": rooms,
        "Services": services,
        "Therapists": therapists
    }

    # Backup to JSON
    with open("cleanup_backup.json", "w", encoding="utf-8") as f:
        json.dump(records_to_delete, f, ensure_ascii=False, indent=2)
    print("Saved backup of matched records to cleanup_backup.json")

    # Print summary
    for table, records in records_to_delete.items():
        print(f"--- {table} ({len(records)} records) ---")
        for r in records:
            name_val = r.get("fields", {}).get("Name") or r.get("fields", {}).get("Reception_Notes") or r.get("fields", {}).get("Shift_Date") or r["id"]
            print(f"  {r['id']}: {name_val}")
    
    print("\n")

    if not args.execute:
        print("Dry run completed. To delete, run with --execute.")
        return

    # Delete in safe order: Bookings, Staff_Shifts, Rooms/Services/Therapists
    deletion_order = ["Bookings", "Staff_Shifts", "Rooms", "Services", "Therapists"]
    deleted_count = 0

    for table in deletion_order:
        records = records_to_delete[table]
        for r in records:
            try:
                db.delete_record(table, r["id"])
                print(f"Deleted {table} {r['id']}")
                deleted_count += 1
            except Exception as e:
                print(f"Failed to delete {table} {r['id']}: {e}")

    print(f"\nSuccessfully deleted {deleted_count} records.")

if __name__ == "__main__":
    main()
