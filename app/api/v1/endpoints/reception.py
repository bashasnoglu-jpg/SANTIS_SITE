from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from app.services.airtable_db import AirtableDB
# from app.schemas.reception import ReceptionBookingsResponse, BookingCalendarItem

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - Python < 3.9 fallback
    ZoneInfo = None

<<<<<<< Updated upstream
router = APIRouter(prefix="/reception", tags=["reception"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")
BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
TIMEZONE = "Europe/Podgorica"
USER_LOCALE = "en-us"
=======
def get_airtable_db():
    return AirtableDB()

@router.get("/reception/bookings/today", response_model=ReceptionBookingsResponse)
def get_today_bookings(
    location: str = Query(..., description="Location name, e.g., 'Budva'"),
    db: AirtableDB = Depends(get_airtable_db)
):
    try:
        records, _ = db.get_reception_bookings_by_location_and_date(location)
        
        parsed_bookings = []
        for r in records:
            fields = r.get("fields", {})
            parsed_bookings.append(BookingCalendarItem(
                id=r.get("id"),
                start_time=fields.get("Start_DateTime"),
                end_time=fields.get("Calculated_Finish_DateTime"),
                status=fields.get("Status_New"),
                location_link=fields.get("Location_Link"),
                environment=fields.get("Environment")
            ))
            
        return ReceptionBookingsResponse(
            location=location,
            date=datetime.now().strftime("%Y-%m-%d"),
            bookings=parsed_bookings
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Airtable Backend Error: {str(e)}")

@router.get("/reception/day")
def get_reception_day(date: str = Query(..., description="Target date YYYY-MM-DD")):
    try:
        db = AirtableDB()
        
        bookings, _ = db.get_bookings_by_date(date)
        therapists, th_cache = db.get_active_therapists()
        rooms, rm_cache = db.get_rooms()
        services, sv_cache = db.get_services()
        
        return {
            "date": date,
            "dataSource": "airtable",
            "cache": {
                "therapists": th_cache,
                "rooms": rm_cache,
                "services": sv_cache
            },
            "therapists": therapists,
            "rooms": rooms,
            "services": services,
            "bookings": bookings
        }
    except ValueError as e:
        # Missing API Key or config error
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Backend or network errors
        raise HTTPException(status_code=500, detail=f"Airtable Backend Error: {str(e)}")

@router.get("/reception/shifts")
def get_reception_shifts(date: str = Query(..., description="Target date YYYY-MM-DD")):
    try:
        db = AirtableDB()
        shifts, _ = db.get_shifts_by_date(date)
        
        filtered_shifts = []
        for s in shifts:
            fields = s.get("fields", {})
            
            filtered_shifts.append({
                "id": s.get("id"),
                "fields": {
                    "Shift_ID": fields.get("Shift_ID"),
                    "Staff_Link": fields.get("Staff_Link") or fields.get("Staff"),
                    "Location_Link": fields.get("Location_Link") or fields.get("Location"),
                    "Date": fields.get("Date") or fields.get("Shift_Date"),
                    "Shift_Start": fields.get("Shift_Start"),
                    "Shift_End": fields.get("Shift_End"),
                    "Shift_Status": fields.get("Shift_Status"),
                    "Scheduler_Visibility": fields.get("Scheduler Visibility") or fields.get("Scheduler_Visibility"),
                    "Daily_Shift_Standard_Check": fields.get("Daily Shift Standard Check"),
                    "Shift_Readiness_Check": fields.get("Shift Readiness Check")
                }
            })
            
        return {
            "date": date,
            "dataSource": "airtable",
            "shifts": filtered_shifts
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Airtable Backend Error: {str(e)}")

class StatusUpdate(BaseModel):
    status: str
>>>>>>> Stashed changes

BOOKING_FIELDS = [
    "Booking ID",
    "Reception Time Display",
    "Start_DateTime",
    "Calculated_Finish_DateTime",
    "Client_Link",
    "Service_Link",
    "Therapist_Link",
    "Room_Link",
    "Location_Link",
    "Status_New",
    "Payment_Status_New",
    "Payment Method",
    "Total Paid EUR",
    "Balance_Due_EUR",
    "Reception Ready Status",
    "Therapist Shift Gate",
    "Reception_Priority",
    "Environment",
]

LOCATION_ALIASES = {
    "budva": "01 BUDVA — Santis Club Budva",
    "01 budva": "01 BUDVA — Santis Club Budva",
    "rec1qc31hfqbulhzu": "01 BUDVA — Santis Club Budva",
}

EXCLUDED_STATUSES = {"cancelled", "no-show"}


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _airtable_token() -> str:
    token = _first_env(AIRTABLE_TOKEN_ENV_KEYS)
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Airtable token is not configured. Set AIRTABLE_PAT or AIRTABLE_API_KEY on the backend.",
        )
    return token


def _airtable_base_id() -> str:
    base_id = _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
    if not base_id:
        raise HTTPException(
            status_code=503,
            detail="Airtable base is not configured. Set AIRTABLE_BASE_ID on the backend.",
        )
    return base_id


def _today_in_podgorica() -> str:
    if ZoneInfo is not None:
        return datetime.now(ZoneInfo(TIMEZONE)).date().isoformat()
    return datetime.now(timezone.utc).date().isoformat()


def _escape_formula_text(value: str) -> str:
    return value.replace("'", "\\'")


def _airtable_get(table_id: str, params: list[tuple[str, str]]) -> dict[str, Any]:
    base_id = _airtable_base_id()
    token = _airtable_token()
    url = f"{AIRTABLE_API_URL}/{base_id}/{table_id}?{urlencode(params)}"
    request = Request(url, headers={"Authorization": f"Bearer {token}"})

    try:
<<<<<<< Updated upstream
        with urlopen(request, timeout=15) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Airtable read failed: {body[:500]}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Airtable network error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Airtable returned invalid JSON") from exc


def _airtable_list_bookings(selected_date: str, environment: str) -> list[dict[str, Any]]:
    safe_environment = _escape_formula_text(environment)
    safe_date = _escape_formula_text(selected_date)
    formula = (
        "AND("
        f"{{Environment}} = '{safe_environment}',"
        f"DATETIME_FORMAT(SET_TIMEZONE({{Start_DateTime}}, '{TIMEZONE}'), 'YYYY-MM-DD') = '{safe_date}',"
        "NOT(OR({Status_New} = 'Cancelled', {Status_New} = 'No-show'))"
        ")"
    )

    params: list[tuple[str, str]] = [
        ("cellFormat", "string"),
        ("timeZone", TIMEZONE),
        ("userLocale", USER_LOCALE),
        ("pageSize", "100"),
        ("filterByFormula", formula),
        ("sort[0][field]", "Start_DateTime"),
        ("sort[0][direction]", "asc"),
    ]
    for field_name in BOOKING_FIELDS:
        params.append(("fields[]", field_name))

    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        page_params = list(params)
        if offset:
            page_params.append(("offset", offset))
        payload = _airtable_get(BOOKINGS_TABLE_ID, page_params)
        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            return records


def _normalize(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(_normalize(item) for item in value if item is not None)
    if isinstance(value, dict):
        if "name" in value or "id" in value:
            extracted = value.get("name") or value.get("id")
            return _normalize(extracted) if extracted is not None else ""
        return str(value).strip()
    return str(value).strip()


def _number(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[^0-9,.-]", "", str(value)).replace(",", ".")
    if cleaned.count(".") > 1:
        first, *rest = cleaned.split(".")
        cleaned = first + "." + "".join(rest)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _booking_id(value: Any) -> int | str | None:
    normalized = _normalize(value)
    if not normalized:
        return None
    try:
        return int(float(normalized))
    except ValueError:
        return normalized


def _location_filter(location_id: str | None, location_name: str | None, location: str | None) -> tuple[str, str]:
    raw = _normalize(location_id or location_name or location or "budva")
    key = raw.lower()
    canonical = LOCATION_ALIASES.get(key, raw)
    return key, canonical


def _matches_location(fields: dict[str, Any], canonical_location: str, location_key: str) -> bool:
    location_value = _normalize(fields.get("Location_Link"))
    if not location_value:
        return False
    location_lower = location_value.lower()
    canonical_lower = canonical_location.lower()
    return canonical_lower in location_lower or location_key in location_lower


def _normalize_booking(record: dict[str, Any]) -> dict[str, Any]:
    fields = record.get("fields", {})
    payment_status = _normalize(fields.get("Payment_Status_New"))
    balance_due = _number(fields.get("Balance_Due_EUR"))
    total_paid = _number(fields.get("Total Paid EUR"))
    priority = _normalize(fields.get("Reception_Priority"))
    payment_attention = payment_status.lower() == "unpaid" or balance_due > 0

    if payment_attention:
        priority = "Payment Attention"

    return {
        "id": record.get("id"),
        "bookingId": _booking_id(fields.get("Booking ID")),
        "timeDisplay": _normalize(fields.get("Reception Time Display")),
        "startDateTime": _normalize(fields.get("Start_DateTime")),
        "finishDateTime": _normalize(fields.get("Calculated_Finish_DateTime")),
        "clientName": _normalize(fields.get("Client_Link")),
        "serviceName": _normalize(fields.get("Service_Link")),
        "therapistName": _normalize(fields.get("Therapist_Link")),
        "roomName": _normalize(fields.get("Room_Link")),
        "locationName": _normalize(fields.get("Location_Link")),
        "status": _normalize(fields.get("Status_New")),
        "paymentStatus": payment_status,
        "paymentMethod": _normalize(fields.get("Payment Method")),
        "totalPaidEur": total_paid,
        "balanceDueEur": balance_due,
        "receptionReadyStatus": _normalize(fields.get("Reception Ready Status")),
        "therapistShiftGate": _normalize(fields.get("Therapist Shift Gate")),
        "receptionPriority": priority,
        "paymentAttention": payment_attention,
        "environment": _normalize(fields.get("Environment")),
    }


@router.get("/bookings/today")
def get_reception_bookings_today(
    location_id: str | None = Query(default=None, alias="locationId"),
    location_name: str | None = Query(default=None, alias="locationName"),
    location: str | None = Query(default=None),
    date: str | None = Query(default=None),
    environment: str = Query(default="Live"),
) -> dict[str, Any]:
    selected_date = date or _today_in_podgorica()
    location_key, canonical_location = _location_filter(location_id, location_name, location)

    records = _airtable_list_bookings(selected_date, environment)
    filtered_records = [
        record for record in records if _matches_location(record.get("fields", {}), canonical_location, location_key)
    ]
    bookings = [_normalize_booking(record) for record in filtered_records]
    bookings = [booking for booking in bookings if booking["status"].lower() not in EXCLUDED_STATUSES]

    display_location = bookings[0]["locationName"] if bookings else canonical_location

    return {
        "date": selected_date,
        "timezone": TIMEZONE,
        "location": display_location,
        "environment": environment,
        "count": len(bookings),
        "bookings": bookings,
    }
=======
        db = AirtableDB()
        db.update_booking_status(record_id, payload.status)
        
        # LOCK-06: Package Usage Ledger Automation
        if payload.status in ["Completed", "completed"]:
            try:
                booking = db.get_record("Bookings", record_id)
                fields = booking.get("fields", {})
                
                payment_source = fields.get("Payment/Coverage Source")
                client_package_link = fields.get("Client Package Link") or fields.get("Linked Package")
                auto_trigger = fields.get("Package Ledger Auto Trigger")
                ledger_created = fields.get("Ledger Created?")
                sessions_to_deduct = fields.get("Sessions To Deduct", 1)
                
                # Check criteria
                if payment_source == "Covered by Package" and client_package_link and auto_trigger == "CREATE PACKAGE LEDGER" and not ledger_created:
                    import datetime
                    usage_date = fields.get("Start_DateTime", datetime.datetime.now().isoformat())[:10]
                    
                    ledger_data = {
                        "Usage Date": usage_date,
                        "Sessions Deducted": sessions_to_deduct,
                        "Booking": [record_id],
                        "Client_Package_Link": client_package_link,
                        "Environment": fields.get("Environment", "Live")
                    }
                    
                    # Create ledger record
                    db.create_record("Package_Usage_Ledger", ledger_data)
                    
                    # Update Booking to mark ledger as created
                    db.update_record("Bookings", record_id, {"Ledger Created?": True})
                    print(f"✅ [Automation] Package Usage Ledger created for booking {record_id}")
            except Exception as auto_err:
                print(f"🚨 [Automation Error] Failed to create Package Ledger for booking {record_id}: {str(auto_err)}")
                # We don't fail the status update if automation fails, but we log it.

            # LOCK-07: Inventory Deduction Rule
            try:
                inventory_deducted = fields.get("Inventory_Deducted", False)
                if not inventory_deducted:
                    service_links = fields.get("Service_Link", [])
                    location_links = fields.get("Location_Link", [])
                    
                    if service_links and location_links:
                        loc_id = location_links[0]
                        import datetime
                        usage_date = fields.get("Start_DateTime", datetime.datetime.now().isoformat())[:10]
                        env = fields.get("Environment", "Live")
                        
                        # Fetch existing transactions to prevent double-deduction per item
                        tx_links = fields.get("Inventory_Transactions", [])
                        existing_txs = db.get_transactions_by_ids(tx_links) if tx_links else []
                        
                        deductions_made = False
                        
                        for s_id in service_links:
                            rules = db.get_service_consumption_rules(s_id, loc_id)
                            for rule in rules:
                                r_fields = rule.get("fields", {})
                                inventory_links = r_fields.get("Inventory_Link", [])
                                qty_used = r_fields.get("Quantity Used", 1)
                                
                                if inventory_links:
                                    inv_id = inventory_links[0]
                                    
                                    # Guard 4: Check if transaction already exists for this Item
                                    already_deducted = False
                                    for tx in existing_txs:
                                        tx_f = tx.get("fields", {})
                                        if tx_f.get("Transaction_Source") == "Booking Completed" and \
                                           tx_f.get("Transaction_Status") == "Posted" and \
                                           tx_f.get("Item") and tx_f.get("Item")[0] == inv_id:
                                            already_deducted = True
                                            break
                                            
                                    if not already_deducted:
                                        tx_data = {
                                            "Type": "Stock Out",
                                            "Quantity Change": -qty_used,
                                            "Transaction_Source": "Booking Completed",
                                            "Transaction_Status": "Posted",
                                            "Created_By_Automation": True,
                                            "Environment": env,
                                            "Date": usage_date,
                                            "Booking_Link": [record_id],
                                            "Service_Link": [s_id],
                                            "Location_Link": [loc_id],
                                            "Item": [inv_id]
                                        }
                                        db.create_inventory_transaction(tx_data)
                                        
                                        # Update Inventory Current Stock
                                        inv_item = db.get_record("Inventory", inv_id)
                                        current_stock = inv_item.get("fields", {}).get("Current Stock", 0)
                                        new_stock = current_stock - qty_used
                                        db.update_inventory_stock(inv_id, new_stock)
                                        
                                        deductions_made = True
                        
                        if deductions_made:
                            db.update_record("Bookings", record_id, {"Inventory_Deducted": True})
                            print(f"✅ [Automation] LOCK-07 Inventory deducted for booking {record_id}")
            except Exception as auto_err:
                print(f"🚨 [Automation Error] Failed LOCK-07 Inventory Deduction for booking {record_id}: {str(auto_err)}")

        return {"success": True, "record_id": record_id, "status": payload.status}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update Airtable: {str(e)}")
>>>>>>> Stashed changes
