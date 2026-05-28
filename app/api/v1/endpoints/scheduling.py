import os
import secrets
import hashlib
import requests
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
import uuid

router = APIRouter(prefix="/scheduling", tags=["scheduling"])
logger = logging.getLogger("santis.scheduling")

class HoldBookingRequestSchema(BaseModel):
    tenant_id: str = Field(..., max_length=50)
    service_id: str = Field(..., max_length=50)
    room_id: str = Field(..., max_length=50)
    therapist_id: str = Field(..., max_length=50)
    service_start_time: str = Field(..., max_length=50)
    service_end_time: str = Field(..., max_length=50)
    cleanup_end_time: str = Field(..., max_length=50)
    customer_info: Optional[Dict[str, Any]] = Field(default=None)
    notes: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(extra="ignore")

class HoldBookingResponseSchema(BaseModel):
    held: bool
    holdId: str
    holdToken: str
    status: str
    expiresAt: str
    ttlSeconds: int
    validation: Dict[str, Any]
    dryRun: bool

def redact_pii(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return data
    safe_data = {}
    forbidden_keys = ['phone', 'email', 'name', 'tc', 'passport', 'credit', 'card']
    for k, v in data.items():
        if any(fk in k.lower() for fk in forbidden_keys):
            safe_data[k] = "[REDACTED]"
        else:
            safe_data[k] = v
    return safe_data

@router.post("/booking/hold", response_model=HoldBookingResponseSchema)
def hold_booking(request: Request, payload: HoldBookingRequestSchema):
    # 1. Size Guard: Prevent abuse with oversized payloads
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10240:  # 10KB Limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large"
        )

    safe_customer_info = redact_pii(payload.customer_info)
    logger.info(f"Booking hold requested: tenant={payload.tenant_id} service={payload.service_id} room={payload.room_id} guest={safe_customer_info}")

    raw_enable = os.environ.get("ENABLE_PERSISTENT_HOLDS", "false")
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
        logger.error("Persistent holds enabled but missing DB credentials.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service currently unavailable."
        )

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Conflict Check
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
            logger.error(f"DB read error during conflict check: {res.status_code}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error.")

        active_holds = res.json()
        new_start = datetime.fromisoformat(payload.service_start_time.replace("Z", "+00:00"))
        new_end = datetime.fromisoformat(payload.cleanup_end_time.replace("Z", "+00:00"))

        for hold in active_holds:
            exist_start = datetime.fromisoformat(hold["service_start_time"].replace("Z", "+00:00"))
            exist_end = datetime.fromisoformat(hold["cleanup_end_time"].replace("Z", "+00:00"))
            
            if new_start < exist_end and new_end > exist_start:
                logger.warning(f"Conflict detected for room {payload.room_id}")
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The requested time slot is no longer available.")

        # Create Hold Token
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
            logger.error(f"DB write error during persistence: {post_res.status_code}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error.")

        inserted_rows = post_res.json()
        if not inserted_rows:
            logger.error("DB insertion returned no rows.")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error.")

        hold_id = inserted_rows[0]["id"]

    except requests.RequestException as e:
        logger.error(f"Database communication failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service currently unavailable.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unhandled exception in hold_booking", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error.")

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
