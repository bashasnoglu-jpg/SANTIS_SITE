import os
import secrets
import hashlib
import requests
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uuid

router = APIRouter(prefix="/scheduling", tags=["scheduling"])

class HoldBookingRequestSchema(BaseModel):
    tenant_id: str
    service_id: str
    room_id: str
    therapist_id: str
    service_start_time: str
    service_end_time: str
    cleanup_end_time: str
    customer_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class HoldBookingResponseSchema(BaseModel):
    held: bool
    holdId: str
    holdToken: str
    status: str
    expiresAt: str
    ttlSeconds: int
    validation: Dict[str, Any]
    dryRun: bool

@router.post("/booking/hold", response_model=HoldBookingResponseSchema)
def hold_booking(payload: HoldBookingRequestSchema):
    raw_enable = os.environ.get("ENABLE_PERSISTENT_HOLDS", "false")
    # Strip quotes and spaces, convert to lowercase
    clean_enable = raw_enable.replace('"', '').replace("'", "").strip().lower()
    enable_persistent = (clean_enable == "true")
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=10)

    validation_res = {
        "ok": True,
        "errors": []
    }

    if not enable_persistent:
        # Dry-run / mock mode
        return HoldBookingResponseSchema(
            held=True,
            holdId=str(uuid.uuid4()),
            holdToken="mock_" + secrets.token_hex(28),
            status="active",
            expiresAt=expires_at.isoformat().replace("+00:00", "Z"),
            ttlSeconds=600,
            validation=validation_res,
            dryRun=True
        )

    # Persistent Mode
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_url_clean = supabase_url.replace('"', '').replace("'", "").strip()
    
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=503,
            detail="Persistent holds are enabled but database credentials (SUPABASE_URL, SUPABASE_KEY) are missing."
        )

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # 1. Conflict Check: fetch active holds for the same room that expire in the future
    try:
        res = requests.get(
            f"{supabase_url_clean}/rest/v1/booking_holds",
            params={
                "room_id": f"eq.{payload.room_id}",
                "status": "eq.active",
                "expires_at": f"gt.{now.isoformat()}"
            },
            headers=headers,
            timeout=10
        )
        if res.status_code >= 400:
            raise HTTPException(status_code=500, detail="Database read error during conflict check.")

        active_holds = res.json()
        new_start = datetime.fromisoformat(payload.service_start_time.replace("Z", "+00:00"))
        new_end = datetime.fromisoformat(payload.cleanup_end_time.replace("Z", "+00:00"))

        for hold in active_holds:
            exist_start = datetime.fromisoformat(hold["service_start_time"].replace("Z", "+00:00"))
            exist_end = datetime.fromisoformat(hold["cleanup_end_time"].replace("Z", "+00:00"))
            
            if new_start < exist_end and new_end > exist_start:
                raise HTTPException(status_code=409, detail="The requested time slot is no longer available.")

        # Hold token oluştur
        raw_token = secrets.token_hex(16)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = now + timedelta(minutes=15)

        insert_payload = {
            "tenant_id": payload.tenant_id,
            "service_id": payload.service_id,
            "room_id": payload.room_id,
            "therapist_id": payload.therapist_id,
            "service_start_time": payload.service_start_time,
            "service_end_time": payload.service_end_time,
            "cleanup_end_time": payload.cleanup_end_time,
            "hold_token_hash": token_hash,
            "status": "active",
            "expires_at": expires_at.isoformat()
        }

        post_res = requests.post(
            f"{supabase_url_clean}/rest/v1/booking_holds",
            json=insert_payload,
            headers=headers,
            timeout=10
        )
        if post_res.status_code >= 400:
            raise HTTPException(status_code=500, detail=f"Failed to persist hold into the database. Status: {post_res.status_code}, Body: {post_res.text}")

        inserted_rows = post_res.json()
        if not inserted_rows:
            raise HTTPException(status_code=500, detail="Failed to retrieve inserted hold from the database.")

        hold_id = inserted_rows[0]["id"]

    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Failed to communicate with the database: {str(e)}")

    return HoldBookingResponseSchema(
        held=True,
        holdId=str(hold_id),
        holdToken=raw_token,
        status="active",
        expiresAt=expires_at.isoformat().replace("+00:00", "Z"),
        ttlSeconds=600,
        validation=validation_res,
        dryRun=False
    )
