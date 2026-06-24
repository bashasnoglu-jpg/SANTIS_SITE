import json
from collections import defaultdict
from datetime import datetime

def load_data():
    with open("airtable_dump.json", "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    data = load_data()
    records = data.get("records", [])
    
    print(f"Total Bookings: {len(records)}")
    
    # 1. Field Analysis
    all_fields = set()
    for r in records:
        all_fields.update(r['fields'].keys())
    print("\n--- Fields Detected ---")
    for f in sorted(all_fields):
        print(f)
        
    # Variables for conflict checking
    conflicts = []
    missing_data = {
        "client": 0, "service": 0, "therapist": 0, "room": 0, "location": 0, "payment_status": 0
    }
    double_data = {
        "therapist": 0, "room": 0, "location": 0
    }
    package_service_conflicts = []
    test_archive_live = []
    time_display_errors = []
    end_of_day_risks = {
        "Confirmed_kalan": 0,
        "Checked_in_kalan": 0,
        "Completed_but_not_Paid": 0,
        "Paid_but_0_total": 0
    }
    
    # Simple schedule overlaps check
    # Structure: schedule[entity_id] = [(start, end, booking_id)]
    therapist_schedule = defaultdict(list)
    room_schedule = defaultdict(list)
    
    for r in records:
        f = r.get('fields', {})
        b_id = f.get('Booking ID', r['id'])
        if not f.get('Booking ID'):
            b_id = f.get('fldtlqLi9JpNxpnwh', r['id']) # fallback field id if named different
            
        env = f.get('Environment', 'Unknown')
        if isinstance(env, dict): env = env.get('name', 'Unknown')
        
        status = f.get('Status_New', 'Unknown')
        if isinstance(status, dict): status = status.get('name', 'Unknown')
            
        payment_status = f.get('Payment_Status_New', 'Unknown')
        if isinstance(payment_status, dict): payment_status = payment_status.get('name', 'Unknown')
            
        total_paid = f.get('Total Paid EUR', 0)
        
        # Missing & Double Data
        client = f.get('Client_Link') or f.get('Client') or f.get('fldq07SPCXfwQ39Tc')
        service = f.get('Service_Link') or f.get('Service') or f.get('fldLVMNj1biBuRMGJ')
        therapist = f.get('Therapist_Link') or f.get('Therapist') or f.get('flddXRKNIeh72ROX5')
        room = f.get('Room_Link') or f.get('Room') or f.get('fld5xL3ciOBQRBt24')
        location = f.get('Location_Link') or f.get('Location') or f.get('fldLkesTF4z1iiQp9')
        package = f.get('Package_Link') or f.get('Package') or f.get('Linked Package') or f.get('fldQZ0dfcxDY9haGp')
        
        if not client: missing_data['client'] += 1
        if not service: missing_data['service'] += 1
        if not therapist: missing_data['therapist'] += 1
        elif isinstance(therapist, list) and len(therapist) > 1: double_data['therapist'] += 1
        
        if not room: missing_data['room'] += 1
        elif isinstance(room, list) and len(room) > 1: double_data['room'] += 1
        
        if not location: missing_data['location'] += 1
        elif isinstance(location, list) and len(location) > 1: double_data['location'] += 1
        
        if payment_status == 'Unknown': missing_data['payment_status'] += 1
        
        # Package / Service Conflict
        if service and package:
            package_service_conflicts.append(b_id)
            
        # Test/Archive pollution in Live
        notes = str(f.get('Internal Notes', '')) + " " + str(f.get('Reception Time Display', ''))
        if env == 'Live' and ('TEST' in notes.upper() or 'ARCHIVE' in notes.upper() or 'AUTO BOOKING' in notes.upper()):
            test_archive_live.append(b_id)
            
        # End of day checks
        if env == 'Live' and status not in ['No-show', 'Cancelled']:
            if status == 'Confirmed': end_of_day_risks['Confirmed_kalan'] += 1
            if status == 'checkedIn': end_of_day_risks['Checked_in_kalan'] += 1
            if status == 'Completed' and payment_status != 'Paid': end_of_day_risks['Completed_but_not_Paid'] += 1
            if payment_status == 'Paid' and (not total_paid or total_paid == 0): end_of_day_risks['Paid_but_0_total'] += 1
            
        # Schedule overlaps
        start_time = f.get('Start_DateTime') or f.get('fldWbz4kZzqerUxhn')
        end_time = f.get('Calculated_Finish_DateTime') or f.get('fld2AW9Mmj7mvF7Dn')
        
        if start_time and not end_time:
            conflicts.append(f"Booking {b_id}: Start_DateTime var ama Finish yok.")
        
        if start_time and end_time and therapist:
            th_list = therapist if isinstance(therapist, list) else [therapist]
            for th in th_list:
                th_id = th if isinstance(th, str) else th.get('id', str(th))
                therapist_schedule[th_id].append((start_time, end_time, b_id))
                
        if start_time and end_time and room:
            rm_list = room if isinstance(room, list) else [room]
            for rm in rm_list:
                rm_id = rm if isinstance(rm, str) else rm.get('id', str(rm))
                room_schedule[rm_id].append((start_time, end_time, b_id))
                
    # Overlap logic
    def check_overlaps(schedule_dict, entity_type):
        for entity, times in schedule_dict.items():
            times.sort() # sort by start time
            for i in range(len(times) - 1):
                end_prev = times[i][1]
                start_next = times[i+1][0]
                if start_next < end_prev:
                    conflicts.append(f"Çakışma ({entity_type}): {times[i][2]} ve {times[i+1][2]}")
                    
    check_overlaps(therapist_schedule, "Therapist")
    check_overlaps(room_schedule, "Room")
    
    print("\n--- Missing Data ---")
    print(missing_data)
    print("\n--- Double Data ---")
    print(double_data)
    print("\n--- End of Day Risks ---")
    print(end_of_day_risks)
    print("\n--- Conflicts / Issues ---")
    for c in conflicts: print(c)
    print(f"Package + Service selected simultaneously: {len(package_service_conflicts)}")
    print(f"Test/Archive records hiding in Live: {len(test_archive_live)}")

if __name__ == '__main__':
    main()
