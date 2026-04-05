from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from database import get_db
from app.services.publish_engine import AtomicPublishEngine
from app.api import deps
from app.core.limiter import limiter
from app.db.models.user import User
import time
from app.core.telemetry import telemetry
from app.core.logger import log_event
from app.core.cdn_manager import cdn_manager

router = APIRouter(prefix="/content", tags=["Atomic Content"])
logger = logging.getLogger(__name__)

# Simulated Request Payload
class PublishRequest(BaseModel):
    slug: str
    old_slug: Optional[str] = None
    region: str
    locale: str
    payload: Dict[str, Any]
    action: Optional[str] = "publish"  # normal publish or 'migration_publish'

class ApproveDraftRequest(BaseModel):
    slug: str
    region: str = "tr"
    locale: str = "tr"

@router.post("/publish/atomic")
@limiter.limit("10/minute")
async def publish_atomic(
    request: Request,
    req: PublishRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    # Lock the regular publish endpoint logic:
    # If a migration is happening, restrict manual "publish" actions if needed.
    # For now, we trust the `req.action` flag supplied via secure backend scripts.
    
    actor = current_user.email
    engine = AtomicPublishEngine(db)
    
    t0 = time.time()
    try:
        result = await engine.publish_content(
            slug=req.slug,
            region=req.region,
            locale=req.locale,
            payload=req.payload,
            actor=actor,
            action=req.action
        )
        
        latency_ms = (time.time() - t0) * 1000
        telemetry.record_publish_latency(latency_ms)
        
        log_event(
            event="atomic_publish", 
            latency_ms=latency_ms, 
            user_role="SUPER_ADMIN", 
            hash=result.version_hash, 
            status="success"
        )
        # Handle Rename & 301 Map
        if req.old_slug and req.old_slug != req.slug:
            try:
                from app.db.models.content import RedirectRegistry, ContentRegistry
                from sqlalchemy import select
                # 1. Register 301 redirect
                redirect_entry = RedirectRegistry(
                    old_slug=req.old_slug,
                    new_slug=req.slug,
                    region=req.region
                )
                db.add(redirect_entry)
                
                # 2. Cleanup old registry pointer
                stmt = select(ContentRegistry).where(
                    ContentRegistry.slug == req.old_slug, 
                    ContentRegistry.region == req.region
                )
                old_reg_result = await db.execute(stmt)
                old_reg = old_reg_result.scalar_one_or_none()
                if old_reg:
                    await db.delete(old_reg)
                await db.commit()
                logger.info(f"Generated 301 SEO Map: {req.old_slug} -> {req.slug}")
            except Exception as red_e:
                logger.error(f"Failed to register redirect map for {req.old_slug}: {str(red_e)}")
                # We do not fail the whole publish if redirect mapping fails
                
        # Fire and forget: Global CDN Cache Invalidation
        # In a real environment, we'd build the full public URL, e.g. "https://santis.club/tr/slug"
        public_url = f"https://santis.club/{req.locale}/{req.slug}"
        background_tasks.add_task(cdn_manager.purge_by_urls, [public_url])
                
        return result
    except Exception as e:
        latency_ms = (time.time() - t0) * 1000
        log_event(
            event="atomic_publish_failed", 
            latency_ms=latency_ms, 
            user_role="SUPER_ADMIN", 
            hash="error", 
            status="failure",
            error=str(e)
        )
        logger.error(f"Publish failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Transaction failed. Contact engineering.")

from sqlalchemy import select
from app.db.models.content import ContentRegistry, DraftRegistry, ContentAuditLog, RedirectRegistry
from app.api.v1.endpoints.content import trigger_cloudflare_purge
from app.utils.hash_utils import generate_canonical_hash

@router.get("/registry")
async def get_content_registry(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns a distinct list of all active slugs across all regions
    for the Headless CMS Studio dropdown selector.
    """
    stmt = select(ContentRegistry.slug).distinct().order_by(ContentRegistry.slug)
    result = await db.execute(stmt)
    slugs = result.scalars().all()
    return {"slugs": list(slugs)}


@router.post("/draft")
@limiter.limit("20/minute")
async def save_draft(
    request: Request,
    req: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_manager)
):
    """
    Saves a content revision to the DraftRegistry (PENDING_REVIEW)
    and writes the payload blob to storage.
    """
    actor = current_user.email
    engine = AtomicPublishEngine(db)
    
    # 1. Advisory Tone Check
    tone_result = await engine._analyze_tone(req.payload)
    
    # 2. Canonicalize & Hash
    draft_hash = generate_canonical_hash(req.payload)
    
    # 3. Write Blob to disk (O(1) storage)
    try:
        await engine._write_blob(draft_hash, req.payload)
    except Exception as e:
        logger.error(f"[DRAFT_BLOB_ERROR] Failed to write draft blob: {e}")
        raise HTTPException(status_code=500, detail="Storage I/O failure.")

    # 4. UPSERT into DraftRegistry
    stmt = select(DraftRegistry).where(
        DraftRegistry.slug == req.slug,
        DraftRegistry.region == req.region,
        DraftRegistry.locale == req.locale
    )
    result = await db.execute(stmt)
    existing_draft = result.scalars().first()

    if existing_draft:
        existing_draft.draft_hash = draft_hash
        existing_draft.actor = actor
        existing_draft.status = "PENDING_REVIEW"
    else:
        new_draft = DraftRegistry(
            slug=req.slug,
            region=req.region,
            locale=req.locale,
            draft_hash=draft_hash,
            actor=actor,
            status="PENDING_REVIEW"
        )
        db.add(new_draft)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"Draft save failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Database Transaction Failed")
        
    return {
        "status": "success",
        "action_taken": "draft_saved",
        "draft_hash": draft_hash,
        "warnings": tone_result.get("warnings", [])
    }

@router.get("/revisions/{slug}")
async def get_revisions(
    slug: str,
    region: str = "tr",
    locale: str = "tr",
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the PENDING_REVIEW draft for a slug, if it exists.
    """
    stmt = select(DraftRegistry).where(
        DraftRegistry.slug == slug,
        DraftRegistry.region == region,
        DraftRegistry.locale == locale
    )
    result = await db.execute(stmt)
    draft = result.scalars().first()

    if not draft:
        return {"draft": None}

    return {
        "draft": {
            "slug": draft.slug,
            "region": draft.region,
            "hash": draft.draft_hash,
            "status": draft.status,
            "actor": draft.actor,
            "updated_at": draft.updated_at
        }
    }

@router.post("/draft/approve")
@limiter.limit("10/minute")
async def approve_draft(
    request: Request,
    req: ApproveDraftRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_superuser)
):
    """
    Promotes a PENDING_REVIEW draft directly to Active Production.
    - Swaps ContentRegistry active_hash pointer.
    - Injects ContentAuditLog entry.
    - Purges Edge.
    - Soft deletes or transitions the Draft.
    """
    actor = current_user.email

    stmt = select(DraftRegistry).where(
        DraftRegistry.slug == req.slug,
        DraftRegistry.region == req.region,
        DraftRegistry.locale == req.locale,
        DraftRegistry.status == "PENDING_REVIEW"
    )
    result = await db.execute(stmt)
    draft = result.scalars().first()

    if not draft:
        raise HTTPException(status_code=404, detail="No pending draft found for approval.")

    target_hash = draft.draft_hash

    # Atomic Pointer Swap & Audit
    try:
        async with db.begin():
            # Pointer Swap
            stmt_reg = select(ContentRegistry).where(ContentRegistry.slug == req.slug)
            res_reg = await db.execute(stmt_reg)
            registry = res_reg.scalar_one_or_none()
            
            if not registry:
                registry = ContentRegistry(
                    slug=req.slug,
                    region_id=req.region,
                    active_version_hash=target_hash,
                    updated_by=actor
                )
                db.add(registry)
            else:
                registry.active_version_hash = target_hash
                registry.updated_by = actor
                
            # Audit Log
            audit = ContentAuditLog(
                slug=req.slug,
                action="draft_approved",
                version_hash=target_hash,
                actor=actor,
                ip_address="system"
            )
            db.add(audit)
            
            # Clean up Draft
            await db.delete(draft)
            
    except Exception as e:
        logger.error(f"Draft approval DB transaction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Database transaction failed")
        
    # Trigger CDN Purge
    purge_url = f"https://santis.club/services/{req.slug}"
    trigger_cloudflare_purge(purge_url)
    
    return {
        "status": "APPROVED",
        "slug": req.slug,
        "active_hash": target_hash
    }
