
import sys
import os
import argparse
import datetime
import dateutil.parser
import pytz
import json

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv

load_dotenv(".env.local", override=True)
load_dotenv(".env")

from app.services.airtable_db import AirtableDB, AirtableConfig

# Force TABLE IDs as requested
AirtableConfig.TABLES["Bookings"] = "tblocCFVgSNfaLAH6"
AirtableConfig.TABLES["Staff_Shifts"] = "tblQjvfz4ljnvCl1R"

db = AirtableDB()

TBL_BOOKINGS = "Bookings"
TBL_SHIFTS = "Staff_Shifts"

# FIELD IDs - Bookings
FLD_BKG_CODE = "fldtlqLi9JpNxpnwh"
FLD_BKG_THERAPIST = "flddXRKNIeh72ROX5"
FLD_BKG_ROOM = "fld5xL3ciOBQRBt24"
FLD_BKG_LOCATION = "fldLkesTF4z1iiQp9"
FLD_BKG_START = "fldWbz4kZzqerUxhn"
FLD_BKG_FINISH = "fldpaOk9fUiXirFkY"
FLD_BKG_SHIFT_LINK = "fldQFbHmThpli90X9"
FLD_BKG_SHIFT_MATCH_STATUS = "fldrltM3t8es8DseE"
FLD_BKG_SHIFT_NOTES = "fldnlno6uJ2Mlu0vg"
FLD_BKG_SHIFT_CHECKED_AT = "fldRIsXRE8RtBBzzI"
FLD_BKG_ID_NUMBER = "fldhzaXE78UUYOKmE" # Booking ID auto-number
FLD_BKG_STATUS_NEW = "fldecPedQfpnjc83O"
FLD_BKG_ENV = "fldaVJ6XmE9M3ZsXN"

# Conflict Fields
FLD_BKG_CONFLICT_WARN = "fldhCa5fT8Ydqe809" # Conflict ⚠️ (checkbox)
FLD_BKG_CONFLICT_STATUS = "fldsTtebXyASNaeyb" # singleSelect
FLD_BKG_CONFLICT_TYPE = "fldRrZGHfPnZ1ON2B" # singleSelect

# FIELD IDs - Staff_Shifts
FLD_SHF_STAFF = "fldTs11ioPDlITZFK"
FLD_SHF_DATE = "fldsmN8DFQWAkHCkR"
FLD_SHF_START = "fldKCATQLI55EVKfe"
FLD_SHF_END = "fld8iwneGGZDmgPgo"
FLD_SHF_STATUS = "fldYKQ88WImjhOzkS"

def check_conflicts(current_b_id, current_b_start, current_b_finish, current_t_id, current_r_id, current_date_str):
    # Fetch other bookings for the same date that are NOT Cancelled/No-show/Archived and are Environment=Test
    formula = (
        f"AND("
        f"IS_SAME({{{FLD_BKG_START}}}, '{current_date_str}', 'day'), "
        f"{{{FLD_BKG_STATUS_NEW}}} != 'Cancelled', "
        f"{{{FLD_BKG_STATUS_NEW}}} != 'No-show', "
        f"{{{FLD_BKG_STATUS_NEW}}} != 'Archived', "
        f"{{{FLD_BKG_ENV}}} = 'Test'"
        f")"
    )
    others, _ = db.fetch_table(TBL_BOOKINGS, params={"filterByFormula": formula, "returnFieldsByFieldId": True})
    
    conflict_type = "None"
    conflict_status = "No Conflict"
    conflict_warn = False
    notes_append = ""
    
    staff_overlap = False
    room_overlap = False

    for o in others:
        o_id = o.get("id")
        if o_id == current_b_id:
            continue
            
        o_fields = o.get("fields", {})
        o_start_str = o_fields.get(FLD_BKG_START)
        o_finish_str = o_fields.get(FLD_BKG_FINISH)
        o_therapists = o_fields.get(FLD_BKG_THERAPIST, [])
        o_rooms = o_fields.get(FLD_BKG_ROOM, [])
        
        if not o_start_str or not o_finish_str:
            continue
            
        o_start = dateutil.parser.isoparse(o_start_str)
        o_finish = dateutil.parser.isoparse(o_finish_str)
        
        # Check time overlap
        if current_b_start < o_finish and current_b_finish > o_start:
            # Time overlaps, now check space/staff
            if current_t_id and current_t_id in o_therapists:
                staff_overlap = True
            if current_r_id and current_r_id in o_rooms:
                room_overlap = True

    if staff_overlap:
        conflict_warn = True
        conflict_status = "Conflict"
        conflict_type = "Staff Overlap"
        if room_overlap:
            notes_append = " Also room overlap detected."
    elif room_overlap:
        conflict_warn = True
        conflict_status = "Conflict"
        conflict_type = "Room Overlap"
        
    return conflict_status, conflict_type, conflict_warn, notes_append


def validate_booking(booking_id=None, dry_run=True):
    print(f"Starting Validation Engine... (DRY-RUN: {dry_run})")
    
    fetch_params = {"returnFieldsByFieldId": True}
    if booking_id:
        print(f"Fetching Booking ID number: {booking_id}")
        fetch_params["filterByFormula"] = f"{{{FLD_BKG_ID_NUMBER}}}={booking_id}"
    else:
        print("Skipping bulk validation, only specific booking ID allowed for testing.")
        return
        
    bookings, _ = db.fetch_table(TBL_BOOKINGS, params=fetch_params)
    
    if not bookings:
        print("No bookings to validate.")
        return

    for b in bookings:
        b_id = b.get("id")
        fields = b.get("fields", {})
        
        b_code = fields.get(FLD_BKG_CODE, b_id)
        therapist_link = fields.get(FLD_BKG_THERAPIST)
        room_link = fields.get(FLD_BKG_ROOM)
        location_link = fields.get(FLD_BKG_LOCATION)
        start_str = fields.get(FLD_BKG_START)
        finish_str = fields.get(FLD_BKG_FINISH)
        
        print(f"--- Validating {b_code} (Record ID: {b_id}) ---")
        
        if not therapist_link or not start_str or not finish_str or not location_link:
            missing_items = []
            if not therapist_link: missing_items.append("Therapist")
            if not location_link: missing_items.append("Location")
            if not start_str: missing_items.append("Start_DateTime")
            if not finish_str: missing_items.append("Calculated_Finish_DateTime")
            
            print(f"Skipping {b_code}: Missing critical data: {', '.join(missing_items)}")
            
            # Missing Location gives NOT READY / Missing Data, otherwise REVIEW - Missing Info
            status_val = "NOT READY / Missing Data" if not location_link else "REVIEW - Missing Info"
            
            update_fields = {
                FLD_BKG_SHIFT_MATCH_STATUS: status_val,
                FLD_BKG_SHIFT_NOTES: f"Cannot validate. Missing: {', '.join(missing_items)}.",
                FLD_BKG_SHIFT_CHECKED_AT: datetime.datetime.now(pytz.utc).isoformat()
            }
        else:
            b_start = dateutil.parser.isoparse(start_str)
            b_finish = dateutil.parser.isoparse(finish_str)
            b_date_str = b_start.strftime("%Y-%m-%d")
            t_id = therapist_link[0]
            r_id = room_link[0] if room_link else None
            
            # 1. SHIFT CHECK
            formula = f"AND(IS_SAME({{{FLD_SHF_DATE}}}, '{b_date_str}', 'day'), {{{FLD_SHF_STATUS}}} != 'Cancelled')"
            shifts, _ = db.fetch_table(TBL_SHIFTS, params={"filterByFormula": formula, "returnFieldsByFieldId": True})
            
            match_found = False
            matched_shift_id = None
            
            for s in shifts:
                s_staff = s.get("fields", {}).get(FLD_SHF_STAFF, [])
                if t_id not in s_staff:
                    continue
                    
                s_start_str = s.get("fields", {}).get(FLD_SHF_START)
                s_end_str = s.get("fields", {}).get(FLD_SHF_END)
                
                if s_start_str and s_end_str:
                    s_start = dateutil.parser.isoparse(s_start_str)
                    s_end = dateutil.parser.isoparse(s_end_str)
                    if b_start >= s_start and b_finish <= s_end:
                        match_found = True
                        matched_shift_id = s.get("id")
                        break
            
            now_str = datetime.datetime.now(pytz.utc).isoformat()
            notes = ""
            
            if match_found:
                update_fields = {
                    FLD_BKG_SHIFT_LINK: [matched_shift_id],
                    FLD_BKG_SHIFT_MATCH_STATUS: "READY - Therapist On Shift",
                    FLD_BKG_SHIFT_CHECKED_AT: now_str
                }
                notes = "Therapist shift found and booking is inside shift."
            else:
                update_fields = {
                    FLD_BKG_SHIFT_LINK: [],
                    FLD_BKG_SHIFT_MATCH_STATUS: "REVIEW - Outside Shift",
                    FLD_BKG_SHIFT_CHECKED_AT: now_str
                }
                notes = "Booking time is outside of the therapist's scheduled shift."
                
            # 2. CONFLICT CHECK
            conflict_status, conflict_type, conflict_warn, notes_append = check_conflicts(
                b_id, b_start, b_finish, t_id, r_id, b_date_str
            )
            
            update_fields[FLD_BKG_CONFLICT_STATUS] = conflict_status
            update_fields[FLD_BKG_CONFLICT_TYPE] = conflict_type
            update_fields[FLD_BKG_CONFLICT_WARN] = conflict_warn
            
            update_fields[FLD_BKG_SHIFT_NOTES] = notes + notes_append
            
        print("\n--- DRY RUN OUTPUT (PAYLOAD) ---")
        print(json.dumps(update_fields, indent=2))
        print("--------------------------------\n")
        
        if not dry_run:
            try:
                db.update_record(TBL_BOOKINGS, b_id, update_fields, returnFieldsByFieldId=True, typecast=True)
                print(f"Updated Booking {b_code} successfully using Field IDs.")
            except Exception as e:
                print(f"Error updating booking: {e}")
        else:
            print("Dry run mode: No changes were made to Airtable.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Booking Validation Engine")
    parser.add_argument("--booking", type=int, help="Specific Booking ID to validate")
    parser.add_argument("--write", action="store_true", help="Execute write mode (default is dry-run)")
    args = parser.parse_args()
    
    validate_booking(args.booking, dry_run=not args.write)

