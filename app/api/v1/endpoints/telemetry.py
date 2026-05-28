import time
import logging
import os
import requests
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict, ValidationError
from typing import Optional, Dict, Any, Literal

router = APIRouter()
logger = logging.getLogger("santis.telemetry")

_rate_limit_store = {}
MAX_REQUESTS_PER_MINUTE = 60
MAX_PAYLOAD_SIZE = 45 * 1024  # 45KB matching frontend bounds

def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []
    
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if now - t < 60]
    
    if len(_rate_limit_store[ip]) >= MAX_REQUESTS_PER_MINUTE:
        return True
        
    _rate_limit_store[ip].append(now)
    return False

# Known Telemetry Events
KnownEvents = Literal[
    "BOOKING_VIEWED",
    "SERVICE_SELECTED",
    "HOLD_REQUESTED",
    "HOLD_CREATED",
    "HOLD_FAILED",
    "FALLBACK_SAVED",
    "BOOKING_ABANDONED",
    "ADMIN_TELEMETRY_VIEWED",
    "VAULT_STATE_CHANGE",
    "API_HANDOFF_SUCCESS",
    "API_HANDOFF_ERROR",
    "SESSION_PAUSED_OR_ENDED",
    "SPA_ROUTE_CHANGED"
]

class TelemetryPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    event_type: KnownEvents
    session_id: Optional[str] = Field(None, max_length=100)
    client_time: Optional[str] = Field(None, max_length=50)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

def redact_pii(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return data
    safe_data = {}
    forbidden_keys = ['phone', 'email', 'name', 'tc', 'passport', 'credit', 'card']
    for k, v in data.items():
        if any(fk in k.lower() for fk in forbidden_keys):
            safe_data[k] = "[REDACTED]"
        elif isinstance(v, dict):
            safe_data[k] = redact_pii(v)
        else:
            safe_data[k] = v
    return safe_data

@router.post("/beacon")
async def receive_telemetry_beacon(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    
    # 1. Soft Guard Rate Limiter
    if _is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
            detail="Too many telemetry requests"
        )
        
    # 2. Payload Size Check
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_PAYLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large"
        )

    body = await request.body()
    if len(body) > MAX_PAYLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
            detail="Payload too large"
        )
        
    # 3. Validation
    try:
        if not body:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty body")
        payload = TelemetryPayload.model_validate_json(body)
    except ValidationError as e:
        # Ignore unknown events gracefully without breaking frontend
        logger.warning(f"Invalid telemetry payload rejected: {e.errors()[0].get('msg')}")
        return {"status": "accepted", "note": "payload ignored"}
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    # 4. PII Redaction
    safe_metadata = redact_pii(payload.metadata)

    # 5. Persist to Supabase
    supabase_url = os.environ.get("SUPABASE_URL", "").replace('"', '').replace("'", "").strip()
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    # We do NOT invent a table. The DB currently lacks `santis_telemetry_events`.
    # Fallback to no-op if no explicit table config or missing credentials.
    has_db = bool(supabase_url and supabase_key)
    if not has_db:
        logger.debug(f"Telemetry beacon accepted (degraded, no DB): event={payload.event_type} from {client_ip} metadata={safe_metadata}")
        return {"status": "accepted", "degraded": True}
        
    # WARNING: Table does not exist in DB migrations. Stopping before INSERT.
    logger.debug(f"Telemetry beacon accepted (persistance skipped, table missing): event={payload.event_type} session={payload.session_id}")

    return {"status": "accepted", "persisted": False, "reason": "table_missing"}
