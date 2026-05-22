import time
import logging
from fastapi import APIRouter, Request, HTTPException, status
from app.schemas.telemetry import TelemetryPayload
from pydantic import ValidationError

router = APIRouter()
logger = logging.getLogger("santis.telemetry")

_rate_limit_store = {}
MAX_REQUESTS_PER_MINUTE = 60
MAX_PAYLOAD_SIZE = 50 * 1024  # 50KB

def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []
    
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if now - t < 60]
    
    if len(_rate_limit_store[ip]) >= MAX_REQUESTS_PER_MINUTE:
        return True
        
    _rate_limit_store[ip].append(now)
    return False

@router.post("/beacon")
async def receive_telemetry_beacon(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    
    # 1. Soft Guard Rate Limiter
    if _is_rate_limited(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
            detail="Too many telemetry requests"
        )
        
    # 2. Payload Size Check BEFORE Pydantic parsing
    body = await request.body()
    if len(body) > MAX_PAYLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
            detail="Payload too large"
        )
        
    # 3. Pydantic Schema Validation
    try:
        if not body:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty body")
        payload = TelemetryPayload.model_validate_json(body)
    except ValidationError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid payload schema")
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    # 4. Process (No-op logging)
    logger.debug(f"Telemetry beacon accepted: event_type={payload.event_type} from {client_ip}")
    
    return {"status": "accepted"}
