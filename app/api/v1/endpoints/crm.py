from __future__ import annotations
import logging
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.crm import GuestTrace, IntentSummary

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic schema for the incoming beacon/POST payload
class TracePayload(BaseModel):
    session_id: str
    tenant_id: Optional[str] = None
    action_type: str = Field(..., description="hover, click, dwell, scroll")
    target_element: str
    intent_score_delta: float = 0.0
    payload: Optional[Dict[str, Any]] = None

def process_trace_async(db: Session, data: TracePayload, user_agent: str, client_ip: str):
    """
    Background worker function that writes to JSONB GhostTrace vault
    and updates the cumulative intent score.
    """
    try:
        # Calculate real-time modifier based on payload details if needed
        # (e.g., if dwell_time_ms > 5000: multiplier = 1.5)
        modifier = 1.0
        if data.payload and "dwell_time_ms" in data.payload:
            if data.payload["dwell_time_ms"] > 8000:
                modifier = 2.0
        
        final_score = data.intent_score_delta * modifier

        # 1. Insert Event into Raw Ghost Trace JSONB Vault
        trace = GuestTrace(
            session_id=data.session_id,
            action_type=data.action_type,
            target_element=data.target_element,
            intent_score=final_score,
            payload={
                **(data.payload or {}),
                "_meta": {
                    "ip": client_ip,
                    "ua": user_agent
                }
            }
        )
        if data.tenant_id:
            try:
                import uuid
                trace.tenant_id = uuid.UUID(data.tenant_id)
            except:
                pass

        db.add(trace)
        
        # 2. Update Aggregated Intent Summary for Surge Engine
        summary = db.query(IntentSummary).filter(IntentSummary.session_id == data.session_id).first()
        if not summary:
            summary = IntentSummary(
                session_id=data.session_id,
                tenant_id=trace.tenant_id,
                service_scores={},
                dominant_intent="EXPLORATORY"
            )
            db.add(summary)
            
        # Update JSONB score map
        scores = summary.service_scores or {}
        # Simple extraction: assume target_element resembles a service slug if prefix matches
        # e.g., service-royal-hamam
        target_key = data.target_element
        if target_key.startswith("service-"):
            key = target_key.replace("service-", "")
            current = scores.get(key, 0.0)
            scores[key] = current + final_score
            summary.service_scores = scores
            
            # Recalculate dominant intent
            if scores:
                top_service = max(scores, key=scores.get)
                summary.dominant_intent = f"INTENT_{top_service.upper()}"
        
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"[Phase 5 CRM] Background Vault Write Failed: {e}")
    finally:
        db.close()


@router.post("/trace", status_code=202)
async def track_guest_intent(
    payload: TracePayload, 
    request: Request,
):
    """
    Sovereign CRM Vault Ingress (Ghost Trace).
    Returns 202 Accepted immediately. Writes trace + event bus atomically.
    """
    import uuid as _uuid
    from datetime import datetime
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import text
    import json

    user_agent = request.headers.get("user-agent", "unknown")
    client_ip = request.client.host if request.client else "unknown"

    trace_id = str(_uuid.uuid4().hex)
    now = datetime.now().isoformat()
    idem_key = f"{payload.session_id}_{payload.action_type}_{payload.target_element}_{int(datetime.now().timestamp())}"

    import asyncio
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with AsyncSessionLocal() as db:
                tenant_id_val = None
                if payload.tenant_id:
                    res = await db.execute(text("SELECT id FROM tenants WHERE slug = :val OR id = :val LIMIT 1"), {"val": payload.tenant_id})
                    row = res.fetchone()
                    if row: 
                        tenant_id_val = row[0]
                
                if not tenant_id_val:
                    res = await db.execute(text("SELECT id FROM tenants WHERE is_active = 1 LIMIT 1"))
                    row = res.fetchone()
                    if row: 
                        tenant_id_val = row[0]

                # 1. Write CRM trace
                await db.execute(text(
                    "INSERT INTO crm_guest_traces (id, timestamp, session_id, tenant_id, action_type, target_element, intent_score, payload) "
                    "VALUES (:id, :ts, :sid, :tid, :act, :target, :intent, :payload)"
                ), {"id": trace_id, "ts": now, "sid": payload.session_id, "tid": tenant_id_val,
                    "act": payload.action_type, "target": payload.target_element,
                    "intent": payload.intent_score_delta,
                    "payload": json.dumps({**(payload.payload or {}), "_meta": {"ip": client_ip, "ua": user_agent}})})

                # 2. Write to Event Bus (atomic with trace)
                await db.execute(text(
                    "INSERT INTO outbox_events (event_type, payload, status, created_at, tenant_id, source, attempts, idempotency_key) "
                    "VALUES (:etype, :payload, 'PENDING', :ts, :tid, 'ghost', 0, :idem)"
                ), {"etype": f"visitor.{payload.action_type}",
                    "payload": json.dumps({"trace_id": trace_id, "target": payload.target_element, "intent_delta": payload.intent_score_delta}),
                    "ts": now, "tid": tenant_id_val, "idem": idem_key})

                await db.commit()
            break # Success, escape retry
        except Exception as e:
            error_str = str(e)
            if "database is locked" in error_str.lower() and attempt < max_retries - 1:
                await asyncio.sleep(0.3 * (attempt + 1))
                continue
            else:
                logger.error(f"[CRM Trace] Write failed (Attempt {attempt+1}): {repr(e)}")
                # Sessiz fail veriyoruz
                return {"status": "error", "detail": "Trace ingest failed"}

    return {"status": "accepted", "trace_id": trace_id}

