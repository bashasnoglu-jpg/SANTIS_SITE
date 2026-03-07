from __future__ import annotations
from app.db.session import get_db, get_db_for_admin
from fastapi import APIRouter, Depends, HTTPException, Header, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import os
import aiofiles
import logging

from database import get_db
from app.db.models.content import ContentRegistry
from app.utils.hash_utils import generate_shard_path
from app.services.content_storage import get_storage_provider
import json

router = APIRouter(prefix="/content", tags=["Edge Resolver"])
logger = logging.getLogger(__name__)

@router.get("/resolve/{slug}", response_class=Response)
async def resolve_edge_content(
    slug: str,
    region: str = "tr",
    locale: str = "tr",
    if_none_match: Optional[str] = Header(None, alias="If-None-Match"),
    db: AsyncSession = Depends(get_db_for_admin)
):
    """
    O(1) Edge Resolver for Immutable JSON Content.
    Returns 304 Not Modified if the active hash matches the ETag requested by the client.
    """
    # 1. Active Hash Lookup
    active_hash = None
    
    if slug == "index":
        # Global Catalog Fallback (Mega Menu & Chatbot)
        # Until we migrate the master catalog to the DB, serve legacy JSON natively.
        legacy_path = os.path.join("assets", "data", "services.json")
        try:
            async with aiofiles.open(legacy_path, "r", encoding="utf-8") as f:
                content_str = await f.read()
            return Response(
                content=content_str,
                media_type="application/json",
                status_code=200,
                headers={"Cache-Control": "public, max-age=60"}
            )
        except Exception as e:
            logger.error(f"[RESOLVER] Master Catalog Missing: {e}")
            raise HTTPException(status_code=404, detail="Master Catalog not found")

    stmt = select(ContentRegistry.active_hash).where(
        ContentRegistry.slug == slug,
        ContentRegistry.region == region,
        ContentRegistry.locale == locale
    )
    result = await db.execute(stmt)
    active_hash = result.scalar_one_or_none()

    if not active_hash:
        raise HTTPException(status_code=404, detail="Content not found in Edge Registry")

    # 2. ETag Check (Idempotent 304 response)
    # The ETag might be enclosed in double quotes based on RFC. Let's strip them if so.
    client_etag = if_none_match.strip('"') if if_none_match else None
    
    if client_etag == active_hash:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    # 3. Asynchronous File Read (Non-Blocking I/O) via StorageProvider
    try:
        storage = get_storage_provider()
        content_dict = await storage.read_blob(slug=slug, version_hash=active_hash)
        content_data = json.dumps(content_dict).encode("utf-8")
    except FileNotFoundError:
        logger.error(f"[RESOLVER] FATAL: Active pointer {active_hash} has no physical blob.")
        raise HTTPException(status_code=500, detail="Data inconsistency: Blob missing")
    except Exception as e:
        logger.error(f"[RESOLVER] I/O Error reading blob {active_hash}: {e}")
        raise HTTPException(status_code=500, detail="Storage read failure")

    # 5. Return High-Speed Immutable Response
    headers = {
        "ETag": f'"{active_hash}"',
        # E3 HA Shield: Serve fresh for 5 mins, but allow serving stale copy for 24h while fetching new one in background if origin is slow/down.
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "Content-Type": "application/json"
    }

    return Response(
        content=content_data, 
        media_type="application/json", 
        headers=headers,
        status_code=200
    )
