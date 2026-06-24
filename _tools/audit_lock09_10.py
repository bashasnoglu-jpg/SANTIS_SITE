import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.services.airtable_db import AirtableDB

def run_audit():
    try:
        db = AirtableDB()
    except ValueError as e:
        if "AIRTABLE_API_KEY" in str(e):
            print("AUTH BLOCKED")
            print("Verdict: AUTH_BLOCKED")
            return
        raise

    print("=========================================")
    print(" LOCK-09 & LOCK-10 READ-ONLY AUDIT ")
    print("=========================================\n")
    
    try:
        # Fetch Locations first
        locations, _ = db.fetch_table("Locations")
        loc_by_status = {}
        active_loc_ids = set()
        
        for loc in locations:
            f = loc.get("fields", {})
            status = f.get("Status", "Unknown")
            name = f.get("Name", "Unknown")
            
            if status not in loc_by_status:
                loc_by_status[status] = []
            loc_by_status[status].append(name)
            
            if status == "Active":
                active_loc_ids.add(loc["id"])
                
        print("--- LOCATIONS ---")
        print(f"Active locations list: {', '.join(loc_by_status.get('Active', []))}")
        print(f"Planned locations list: {', '.join(loc_by_status.get('Planned', []))}")
        print(f"Other statuses: {', '.join(loc_by_status.get('Unknown', []))}")
        
        # Fetch Therapists
        therapists, _ = db.fetch_table("Therapists", params={"filterByFormula": "{Active} != FALSE()"})
        
        safe_therapists = []
        incomplete_staff = []
        planned_loc_staff = []
        
        for t in therapists:
            f = t.get("fields", {})
            name = f.get("Name", "Unknown")
            completeness = f.get("Staff Card Completeness")
            loc_check = f.get("Location Assignment Check")
            linked_locs = f.get("Location_Link") or f.get("Location") or []
            
            is_complete = (completeness == "✅ Complete" and loc_check == "✅ Location Set")
            has_active_loc = any(lid in active_loc_ids for lid in linked_locs)
            
            if not is_complete:
                incomplete_staff.append(f"{name} (Card: {completeness}, LocCheck: {loc_check})")
            elif not has_active_loc:
                planned_loc_staff.append(name)
            else:
                safe_therapists.append(name)
                
        print("\n--- THERAPISTS ---")
        print(f"SAFE_THERAPIST_PAYLOAD list: {', '.join(safe_therapists)}")
        print(f"EXCLUDED_INCOMPLETE_ACTIVE_STAFF list: {', '.join(incomplete_staff)}")
        print(f"EXCLUDED_PLANNED_LOCATION_STAFF list: {', '.join(planned_loc_staff)}")
            
        # Fetch Rooms
        rooms, _ = db.fetch_table("Rooms")
        safe_rooms = []
        planned_loc_rooms = []
        
        for r in rooms:
            f = r.get("fields", {})
            name = f.get("Name", "Unknown")
            room_status = f.get("Room_Status", "Unknown")
            assignment_check = f.get("Location Assignment Check")
            linked_locs = f.get("Location_Link") or f.get("Location") or []
            
            has_active_loc = any(lid in active_loc_ids for lid in linked_locs)
            
            if has_active_loc and assignment_check == "✅ Location Set":
                safe_rooms.append(name)
            elif not has_active_loc:
                planned_loc_rooms.append(f"{name} (RoomStatus: {room_status})")
                
        print("\n--- ROOMS ---")
        print(f"SAFE_ROOM_PAYLOAD location names: {', '.join(safe_rooms)}")
        print(f"EXCLUDED_PLANNED_LOCATION_ROOMS list: {', '.join(planned_loc_rooms)}")

        print("\nVerdict: PASS_READY_FOR_LOCK")
        
    except Exception as e:
        print(f"\nVerdict: FAIL_STAFF_LOCATION_LEAK")
        print(f"Error encountered: {e}")

if __name__ == "__main__":
    run_audit()
