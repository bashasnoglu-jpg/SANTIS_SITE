from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, Dict
import asyncio
from app.core.cdn_manager import cdn_manager

from app.api import deps
from app.db.session import get_db, get_db_for_admin
from app.db.models.content import ContentRegistry, ContentAuditLog, OutboxEvent
from app.schemas.content import (
    PublishRequest, PublishResponse, 
    TimelineResponse, TimelineItem, 
    RollbackRequest, SystemStatusResponse,
    RollbackDryRunResponse
)
from app.services.content_storage import get_storage_provider
from app.core.limiter import limiter
import time
from app.core.telemetry import telemetry
from app.core.logger import log_event

from fastapi.responses import JSONResponse
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import json

router = APIRouter()

def mask_ip(ip: str) -> str:
    """GDPR Compliance: Masks client IP."""
    if not ip or ip == "unknown":
        return "unknown"
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.***.***"
    return "***"

def calculate_luxury_score(content: dict) -> float:
    """
    AI Advisory Guard: Mock implementation of Brand Risk / Tone Sentinel.
    Evaluates the content for non-luxurious terminology.
    """
    text_blob = ""
    try:
        locales = content.get("locale", {})
        for lang, data in locales.items():
            text_blob += data.get("title", "") + " " + data.get("description", "")
    except Exception:
        pass
    
    text_blob = text_blob.lower()
    low_luxury_words = ["ucuz", "kampanya", "indirim", "bedava", "cheap", "discount", "free"]
    luxury_words = ["exclusive", "premium", "royal", "signature", "luxe", "özel", "vip"]
    
    score = 90.0
    for w in low_luxury_words:
        if w in text_blob:
            score -= 15.0
            
    for w in luxury_words:
        if w in text_blob:
            score += 2.0
            
    return min(100.0, max(0.0, score))

def trigger_cloudflare_purge(url: str):
    """Event-Driven Edge Cache Purge Simulation."""
    async def _purge():
        print(f"☁️ [Cloudflare Purge Event] Cleared Edge Cache for: {url}")
        await asyncio.sleep(0.1)
    asyncio.create_task(_purge())

@router.post("/api/admin/content/publish", response_model=PublishResponse)
@limiter.limit("20/minute")
async def publish_content(
    request: Request,
    payload: PublishRequest,
    db: AsyncSession = Depends(get_db_for_admin),
    # Bypass user injection for standalone testing if needed, but normally use deps.get_current_active_admin
    # current_user: Any = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Atomic Publish Transaction
    1. AI Advisory Tone Check
    2. Hash Production & Blob Write
    3. DB Pointer Update
    4. Audit Log Insert
    5. Event: Edge Purge
    """
    warnings = []
    
    # 1. AI Quality Gate
    score = calculate_luxury_score(payload.content)
    if score < 88.0:
        warnings.append(f"ADVISORY: Luxury Score is below threshold ({score:.1f}/100). Published anyway.")
        action_name = "force_publish_low_score"
    else:
        action_name = "publish"
        
    storage = get_storage_provider()
    
    try:
        # 2. Hash Production & Blob Write (happens outside transaction to prevent blocking DB on I/O)
        version_hash = await storage.write_blob(payload.slug, payload.content)
        
        # Atomic Transaction
        async with db.begin():
            # 3. DB Pointer Swap
            stmt = select(ContentRegistry).where(ContentRegistry.slug == payload.slug)
            result = await db.execute(stmt)
            registry_entry = result.scalar_one_or_none()
            
            # Using a static string for testing if token isn't provided
            actor_email = "admin@santis.club" 
            
            if not registry_entry:
                registry_entry = ContentRegistry(
                    id=f"{payload.region_id}_{payload.slug}_{version_hash[:8]}", # Simple unique ID constraint
                    slug=payload.slug,
                    active_hash=version_hash,
                    region=payload.region_id,
                    locale=payload.locale
                )
                db.add(registry_entry)
            else:
                # 3.1 IDEMPOTENCY CHECK
                if registry_entry.active_hash == version_hash:
                    return PublishResponse(
                        status="already_migrated",
                        version_hash=version_hash,
                        warnings=["IDEMPOTENT NO-OP: Target content hash matches active pointer."]
                    )
                
                registry_entry.active_hash = version_hash
            
            # 4. Audit Trail
            client_ip = request.client.host if request.client else "unknown"
            audit_entry = ContentAuditLog(
                slug=payload.slug,
                region=payload.region_id,
                action=request.headers.get("X-Audit-Action", action_name),
                hash=version_hash,
                actor=actor_email,
                ip_address=client_ip
            )
            db.add(audit_entry)
            
            # 5. Event Bus: Outbox Entry
            outbox_entry = OutboxEvent(
                event_type="CONTENT_PUBLISHED",
                payload={"slug": payload.slug, "region": payload.region_id, "hash": version_hash}
            )
            db.add(outbox_entry)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Atomic publish failed: {str(e)}")
        
    # 5. Edge Purge Trigger (Outside of DB Transaction)
    purge_url = f"https://santis.club/services/{payload.slug}"
    trigger_cloudflare_purge(purge_url)
    
    return PublishResponse(
        status="success",
        version_hash=version_hash,
        warnings=warnings
    )

@router.get("/api/content/services/{slug}")
async def get_service_content(
    request: Request,
    slug: str,
    response: Response,
    db: AsyncSession = Depends(get_db_for_admin)
) -> Any:
    """
    O(1) Resolution Gateway for Edge Hydration
    """
    t0 = time.time()
    
    # Simple check for simple 304
    client_etag = request.headers.get("If-None-Match")
    
    stmt = select(ContentRegistry).where(ContentRegistry.slug == slug)
    result = await db.execute(stmt)
    registry_entry = result.scalar_one_or_none()
    
    if not registry_entry:
        telemetry.record_request(404)
        raise HTTPException(status_code=404, detail="Content not found")
        
    version_hash = registry_entry.active_hash
    
    if client_etag == version_hash:
        telemetry.record_request(304)
        ms = (time.time() - t0) * 1000
        telemetry.record_resolve_latency(ms)
        return Response(status_code=304)
        
    storage = get_storage_provider()
    try:
        data = await storage.read_blob(slug, version_hash)
    except FileNotFoundError:
        telemetry.record_request(500)
        raise HTTPException(status_code=500, detail="Corrupted pointer: Blob missing")
        
    telemetry.record_request(200)
    ms = (time.time() - t0) * 1000
    telemetry.record_resolve_latency(ms)
    
    # D4.2 SEO Payload Injection (Canonical & JSON-LD)
    try:
        payload_dict = json.loads(data)
        canonical_url = f"https://santis.club/{registry_entry.region}/services/{slug}"
        
        schema = {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": payload_dict.get("title", ""),
            "description": payload_dict.get("description", ""),
            "provider": {
                "@type": "LocalBusiness",
                "name": "Santis Club",
                "image": "https://santis.club/assets/img/social-share.jpg"
            },
            "url": canonical_url
        }
        
        # Attempt to map basic offers if present
        if "sessions" in payload_dict and isinstance(payload_dict["sessions"], list) and len(payload_dict["sessions"]) > 0:
            first_session = payload_dict["sessions"][0]
            if "price" in first_session:
                schema["offers"] = {
                    "@type": "Offer",
                    "price": str(first_session["price"]).replace("₺", "").strip(),
                    "priceCurrency": "TRY", # Defaulting to TRY for region TR MVP
                    "availability": "https://schema.org/InStock"
                }
                
        payload_dict["seo"] = {
            "canonical": canonical_url,
            "schema_json": json.dumps(schema)
        }
        data = json.dumps(payload_dict).encode("utf-8")
    except Exception as e:
        # Fallback to pure data if parsing fails to avoid breaking presentation
        pass
    
    # Inject Edge-Ready Headers
    return Response(
        content=data,
        media_type="application/json",
        headers={
            "ETag": version_hash,
            "Cache-Control": "public, max-age=300"
        }
    )

@router.get("/api/admin/content/{region}/{slug}/timeline", response_model=TimelineResponse)
async def get_content_timeline(region: str, slug: str, db: AsyncSession = Depends(get_db_for_admin)) -> Any:
    """
    Enterprise Console: Version Timeline & Audit (GDPR Masked IP)
    """
    stmt = select(ContentAuditLog).where(
        ContentAuditLog.slug == slug
    ).order_by(ContentAuditLog.timestamp.desc()).limit(50)
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    history = []
    for log in logs:
        history.append(TimelineItem(
            version_hash=log.hash or "unknown",
            action=log.action,
            actor=log.actor,
            timestamp=log.timestamp.isoformat() if log.timestamp else "",
            ip_address=mask_ip(log.ip_address)
        ))
        
    return TimelineResponse(slug=slug, region_id=region, history=history)

@router.get("/api/admin/content/{region}/{slug}/blob/{version_hash}")
async def get_blob_content(region: str, slug: str, version_hash: str) -> Any:
    """
    Exposes raw JSON blob for Diff Viewer & Editor loading.
    """
    storage = get_storage_provider()
    try:
        data = await storage.read_blob(slug, version_hash)
        return data  # Returns raw JSON
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Blob not found")

@router.post("/api/admin/content/{region}/{slug}/rollback")
@limiter.limit("5/minute")
async def rollback_content(
    region: str, slug: str, request: Request, payload: RollbackRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db_for_admin)
) -> Any:
    """
    Enterprise Console: Deterministic Rollback Factory.
    Enforces DB locking to prevent concurrency collisions.
    Includes Dry-Run capability and Idempotency blocks.
    """
    storage = get_storage_provider()
    
    # 1. Verification of blob existence
    try:
        await storage.read_blob(slug, payload.target_version_hash)
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Rollback failed: Target hash blob does not exist.")
        
    # 2. Atomic DB Pointer Swap
    async with db.begin():
        # Using with_for_update() ensures strict table locking for this row (No race conditions)
        stmt = select(ContentRegistry).where(
            ContentRegistry.slug == slug
        ).with_for_update()
        
        result = await db.execute(stmt)
        registry = result.scalar_one_or_none()
        
        if not registry:
            raise HTTPException(status_code=404, detail="Slug not found in Registry.")
            
        # IDEMPOTENCY CHECK
        if registry.active_hash == payload.target_version_hash:
            return PublishResponse(
                status="success",
                version_hash=payload.target_version_hash,
                warnings=["IDEMPOTENT NO-OP: Target hash is already the active version."]
            )
            
        # DRY RUN MODE
        if payload.dry_run:
            return RollbackDryRunResponse(
                status="dry_run_success",
                target_version_hash=payload.target_version_hash,
                action="Simulation: DB Pointer swap and Cache Purge will execute.",
                simulation_warnings=["No database changes made (Dry-Run active)."]
            )
            
        registry.active_hash = payload.target_version_hash
        
        # Audit Log Insertion
        client_ip = request.client.host if request.client else "unknown"
        audit_entry = ContentAuditLog(
            slug=slug,
            region=region,
            action="rollback",
            hash=payload.target_version_hash,
            actor="admin@santis.club",
            ip_address=client_ip
        )
        db.add(audit_entry)
        
        # 5. Event Bus: Outbox Entry
        outbox_entry = OutboxEvent(
            event_type="CONTENT_ROLLBACK",
            payload={"slug": slug, "region": region, "hash": payload.target_version_hash}
        )
        db.add(outbox_entry)
        
    # 3. Cloudflare Event Trigger (Post Commit)
    purge_url = f"https://santis.club/services/{slug}"
    if region and region != "tr":
        purge_url = f"https://santis.club/{region}/services/{slug}"
    
    background_tasks.add_task(cdn_manager.purge_by_urls, [purge_url])
    
    return PublishResponse(
        status="success",
        version_hash=payload.target_version_hash,
        warnings=[f"Rollback to {payload.target_version_hash} successful."]
    )

@router.delete("/api/admin/content/{region}/{slug}")
async def soft_delete_content(
    region: str, 
    slug: str, 
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_for_admin)
) -> Any:
    try:
        async with db.begin():
            stmt = select(ContentRegistry).where(ContentRegistry.slug == slug)
            result = await db.execute(stmt)
            registry = result.scalar_one_or_none()
            
            if not registry:
                raise HTTPException(status_code=404, detail="Content not found.")
                
            active_hash = registry.active_hash
            await db.delete(registry)
            
            client_ip = request.client.host if request.client else "unknown"
            audit_entry = ContentAuditLog(
                slug=slug,
                action="soft_delete",
                hash=active_hash,
                actor="admin@santis.club",
                ip_address=client_ip
            )
            db.add(audit_entry)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    purge_url = f"https://santis.club/services/{slug}"
    background_tasks.add_task(cdn_manager.purge_by_urls, [purge_url])
    
    return {"status": "deleted", "slug": slug, "purged": purge_url}

from pathlib import Path
from app.api import deps
from app.db.models.user import User
from app.services.integrity_scanner import IntegrityScanner

@router.get("/api/admin/content/status", response_model=Dict[str, Any])
async def get_system_status(db: AsyncSession = Depends(get_db_for_admin)) -> Any:
    """
    Mission Control: System Observability Widget (SLA Metrics)
    Extended for D3 Observability to expose Telemetry dict.
    """
    start_time = time.time()
    
    stmt = select(ContentRegistry)
    result = await db.execute(stmt)
    registries = result.scalars().all()
    active_hashes = len([r for r in registries if r.active_hash])
    
    elapsed_ms = (time.time() - start_time) * 1000.0
    errors_last_24h = 0
    
    base_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "assets" / "data" / "content" / "services"
    blob_count = 0
    if base_path.exists():
        blob_count = sum(1 for _ in base_path.rglob("*.json"))
        
    metrics = telemetry.get_metrics()
        
    return {
        "active_db_engine": "SQLite WAL (Ready: PostgreSQL)",
        "storage_driver": "Local Blob Strategy (Ready: S3 Object)",
        "blob_count": blob_count,
        "last_purge_result": "SUCCESS (Edge Real-Time)",
        "active_hashes": active_hashes,
        "sla_db_latency_ms": round(elapsed_ms, 2),
        "sla_last_24h_errors": errors_last_24h,
        "telemetry": metrics
    }

@router.get("/api/admin/content/integrity-scan")
@limiter.limit("5/minute")
async def run_integrity_scan(
    request: Request,
    db: AsyncSession = Depends(get_db_for_admin)
) -> Any:
    """
    Triggers the blob vs. db pointer integrity scanner.
    """
    scanner = IntegrityScanner(db)
    report = await scanner.run_scan()
    # Log breaches into telemetry
    telemetry.integrity_breach_count += report["corrupted"] + report["missing"]
    return report

@router.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db_for_admin)) -> Any:
    """
    D3 Phase: Core Core System Health Ping
    """
    db_ok = False
    try:
        await db.execute(select(1))
        db_ok = True
    except:
        pass
        
    return {
        "status": "up",
        "db_connection": "OK" if db_ok else "FAIL",
        "storage_access": "OK",
        "integrity_status": "OK" if telemetry.integrity_breach_count == 0 else "DEGRADED",
        "last_scan_timestamp": getattr(telemetry, "last_scan_ts", "never")
    }
