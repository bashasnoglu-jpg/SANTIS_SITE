from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.airtable_db import AirtableDB

router = APIRouter(prefix="/tenant-setup", tags=["tenant-setup"])

# Pilot Context
PILOT_TENANT_ID = "recXRJQPnS91LbURI"
PILOT_LOCATION_ID = "recglzH6Z9R3E7vsh"

def get_tenant_context():
    """
    Pilot phase: Inject Alba Quin context server-side.
    Production: Resolve from Tenant_Users by logged-in email.
    """
    return {
        "tenant_id": PILOT_TENANT_ID,
        "location_id": PILOT_LOCATION_ID,
        "role": "Tenant Owner",
        "canAccessSetupWizard": True
    }

def get_airtable_db():
    return AirtableDB()

class RoomCreate(BaseModel):
    name: str
    room_type: str
    capacity: int
    cleaning_buffer_minutes: int
    status: str

class ServiceCreate(BaseModel):
    name: str
    category: str
    duration_minutes: int
    price: float
    active: bool

class TherapistCreate(BaseModel):
    name: str
    phone: str
    specialties: str
    active: bool

class ShiftPatternCreate(BaseModel):
    therapist_id: str
    days_of_week: List[str]
    start_time: str
    end_time: str
    break_minutes: int

class TestBookingCreate(BaseModel):
    guest_name: str
    service_id: str
    date: str
    time: str
    therapist_id: str
    room_id: str
    mode: str = "Test"


@router.get("/context-data")
def get_context_data(
    context: dict = Depends(get_tenant_context),
    db: AirtableDB = Depends(get_airtable_db)
):
    """Fetch therapists, rooms, and services for dropdowns using tenant context."""
    tenant_id = context["tenant_id"]
    location_id = context["location_id"]
    
    try:
        # Fetch Therapists
        th_params = {
            "filterByFormula": f"FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0"
        }
        therapists_records, _ = db.fetch_table("Therapists", params=th_params)
        therapists = [{"id": r["id"], "name": r["fields"].get("Name")} for r in therapists_records]

        # Fetch Rooms (Rooms uses specific field IDs per user instruction)
        rm_params = {
            "filterByFormula": f"FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0"
        }
        rooms_records, _ = db.fetch_table("Rooms", params=rm_params)
        rooms = [{"id": r["id"], "name": r["fields"].get("Name")} for r in rooms_records]

        # Fetch Services
        sv_params = {
            "filterByFormula": f"FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0"
        }
        services_records, _ = db.fetch_table("Services", params=sv_params)
        services = [{"id": r["id"], "name": r["fields"].get("Name")} for r in services_records]

        # Fetch Shifts
        sh_params = {
            "filterByFormula": f"FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0",
            "maxRecords": 1
        }
        shifts_records, _ = db.fetch_table("Staff_Shifts", params=sh_params)
        has_shifts = len(shifts_records) > 0

        # Fetch Bookings
        bk_params = {
            "filterByFormula": f"FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0",
            "maxRecords": 1
        }
        bookings_records, _ = db.fetch_table("Bookings", params=bk_params)
        has_bookings = len(bookings_records) > 0

        return {
            "therapists": therapists,
            "rooms": rooms,
            "services": services,
            "has_shifts": has_shifts,
            "has_bookings": has_bookings,
            "role": context.get("role", "Unknown"),
            "canAccessSetupWizard": context.get("canAccessSetupWizard", False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rooms")
def create_room(
    data: RoomCreate,
    context: dict = Depends(get_tenant_context),
    db: AirtableDB = Depends(get_airtable_db)
):
    try:
        tenant_id = context["tenant_id"]
        location_id = context["location_id"]
        
        # Idempotency check: same name + tenant + location
        # Room Tenant_Link uses fld74v43Ou62HTrqv or we can just fetch all for tenant and check python-side
        params = {"filterByFormula": f"AND(FIND('{data.name}', {{Name}}) > 0, FIND('{tenant_id}', ARRAYJOIN({{fld74v43Ou62HTrqv}})) > 0, FIND('{location_id}', ARRAYJOIN({{fldjckeuLjARiK2LX}})) > 0)"}
        existing, _ = db.fetch_table("Rooms", params=params)
        if existing:
            return {"success": True, "record": existing[0], "reused": True}

        fields = {
            "Name": data.name,
            "Room_Type": data.room_type,
            "Capacity": data.capacity,
            "Cleaning_Buffer_Minutes": data.cleaning_buffer_minutes,
            "Room_Status": data.status,
            "fld74v43Ou62HTrqv": [tenant_id], # Rooms Tenant_Link
            "fldjckeuLjARiK2LX": [location_id] # Rooms Location_Link
        }
        result = db.create_record("Rooms", fields)
        return {"success": True, "record": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/services")
def create_service(
    data: ServiceCreate,
    context: dict = Depends(get_tenant_context),
    db: AirtableDB = Depends(get_airtable_db)
):
    try:
        tenant_id = context["tenant_id"]

        # Idempotency check: same name + tenant
        params = {"filterByFormula": f"AND(FIND('{data.name}', {{Name}}) > 0, FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0)"}
        existing, _ = db.fetch_table("Services", params=params)
        if existing:
            return {"success": True, "record": existing[0], "reused": True}

        fields = {
            "Name": data.name,
            "Category": data.category,
            "Duration_Minutes": data.duration_minutes,
            "Price_EUR": data.price,
            "Active": data.active,
            "Tenant_Link": [tenant_id]
        }
        result = db.create_record("Services", fields)
        return {"success": True, "record": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/therapists")
def create_therapist(
    data: TherapistCreate,
    context: dict = Depends(get_tenant_context),
    db: AirtableDB = Depends(get_airtable_db)
):
    try:
        tenant_id = context["tenant_id"]
        location_id = context["location_id"]

        # Idempotency check: same name + tenant + location
        params = {"filterByFormula": f"AND(FIND('{data.name}', {{Name}}) > 0, FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0, FIND('{location_id}', ARRAYJOIN({{Location_Link}})) > 0)"}
        existing, _ = db.fetch_table("Therapists", params=params)
        if existing:
            return {"success": True, "record": existing[0], "reused": True}

        skill_tags = [s.strip() for s in data.specialties.split(",") if s.strip()] if data.specialties else []
        fields = {
            "Name": data.name,
            "Skill_Tags": skill_tags,
            "Active": data.active,
            "Staff_Role": "Therapist",
            "Status": "Active",
            "Tenant_Link": [tenant_id],
            "Location_Link": [location_id]
        }
        # Phone isn't directly listed in fields output, we omit it or add it if it's there
        # Let's omit phone since it's optional and might cause UNKNOWN_FIELD
        result = db.create_record("Therapists", fields)
        return {"success": True, "record": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shifts")
def create_shift_pattern(
    data: ShiftPatternCreate,
    context: dict = Depends(get_tenant_context),
    db: AirtableDB = Depends(get_airtable_db)
):
    try:
        tenant_id = context["tenant_id"]
        location_id = context["location_id"]
        # Defaulting date to 2026-06-25 for testing pilot
        shift_date = "2026-06-25"
        shift_start = f"{shift_date}T{data.start_time}:00.000Z"
        shift_end = f"{shift_date}T{data.end_time}:00.000Z"

        # Idempotency check: same staff + location + date + start + end + tenant
        params = {"filterByFormula": f"AND(FIND('{tenant_id}', ARRAYJOIN({{Tenant_Link}})) > 0, FIND('{location_id}', ARRAYJOIN({{Location_Link}})) > 0, FIND('{data.therapist_id}', ARRAYJOIN({{Staff_Link}})) > 0, {{Shift_Date}} = '{shift_date}', {{Shift_Start}} = '{shift_start}', {{Shift_End}} = '{shift_end}')"}
        existing, _ = db.fetch_table("Staff_Shifts", params=params)
        if existing:
            return {"success": True, "record": existing[0], "reused": True}

        fields = {
            "Staff_Link": [data.therapist_id],
            "Shift_Date": shift_date,
            "Shift_Start": shift_start,
            "Shift_End": shift_end,
            "Environment": "Test",
            "Tenant_Link": [tenant_id],
            "Location_Link": [location_id],
            "Notes": f"Days: {','.join(data.days_of_week)}, Break: {data.break_minutes} min"
        }
        # In Airtable config, table name might be "Staff_Shifts"
        result = db.create_record("Staff_Shifts", fields)
        return {"success": True, "record": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-booking")
def create_test_booking(
    data: TestBookingCreate,
    context: dict = Depends(get_tenant_context),
    db: AirtableDB = Depends(get_airtable_db)
):
    try:
        # Before creating booking, check if therapist is working, room available
        # Mocking this validation for now or doing basic checks.
        # Strict validation would involve checking existing Bookings for overlap.
        date_str = data.date
        target_start = f"{data.date}T{data.time}:00.000Z"
        # Fetch bookings for this tenant to check overlap in Python
        # to avoid Airtable formula indexing delays.
        # We fetch the latest 100 bookings without a formula to ensure immediate read-after-write consistency.
        overlap_params = {
            "sort[0][field]": "Start_DateTime",
            "sort[0][direction]": "desc",
            "maxRecords": 100
        }
        overlapping, _ = db.fetch_table("Bookings", params=overlap_params)
        
        for booking in overlapping:
            # Check tenant link manually
            tenant_links = booking.get("fields", {}).get("Tenant_Link", [])
            if context["tenant_id"] not in tenant_links:
                continue
            
            # Skip if cancelled
            b_status = booking.get("fields", {}).get("Status_New")
            if b_status == 'Cancelled':
                continue
                
            room_links = booking.get("fields", {}).get("Room_Link", [])
            therapist_links = booking.get("fields", {}).get("Therapist_Link", [])
            location_links = booking.get("fields", {}).get("Location_Link", [])
            b_start = booking.get("fields", {}).get("Start_DateTime")

            # 1. Idempotency rule: exact same tenant + location + room + therapist + start time => BLOCK
            if data.room_id in room_links and data.therapist_id in therapist_links and context["location_id"] in location_links and b_start == target_start:
                raise ValueError("Duplicate Booking Blocked: A booking for this therapist and room at this exact time already exists.")

            # 2. General collision rule: same room + same time
            if data.room_id in room_links and b_start and date_str in b_start and data.time in b_start:
                raise ValueError("Collision Blocked: Room is already booked at this time.")

        fields = {
            "Reception_Notes": f"Test Guest: {data.guest_name}",
            "Service_Link": [data.service_id],
            "Therapist_Link": [data.therapist_id],
            "Room_Link": [data.room_id],
            "Start_DateTime": target_start,
            "Status_New": "Confirmed",
            "Environment": data.mode, # Only live if data.mode == "Live"
            "Tenant_Link": [context["tenant_id"]],
            "Location_Link": [context["location_id"]]
        }
        result = db.create_record("Bookings", fields)
        return {"success": True, "record": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
