"""
app/core/media_orchestrator.py
Sovereign Media Infrastructure — Deterministic Inheritance Engine
Single DB hit to resolve N slots with tenant override > global fallback.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.gallery import GalleryAsset


async def resolve_slots(db: AsyncSession, slot_keys: list, tenant_id: str = None):
    """
    Sovereign Inheritance Engine.
    Tek DB vuruşunda tüm slot'ların kazanan asset'ini belirler.
    
    Hiyerarşi: Tenant Override > Global Default
    Score = (is_tenant × 1000) + priority
    
    Returns: { "hero_home": { url, alt, blurhash, is_override, asset_id, category }, ... }
    """
    query = select(GalleryAsset).filter(
        GalleryAsset.slot.in_(slot_keys),
        GalleryAsset.is_published == True
    )

    if tenant_id:
        query = query.filter(
            (GalleryAsset.tenant_id == tenant_id) | (GalleryAsset.is_global == True)
        )
    else:
        # No tenant → only global assets
        query = query.filter(GalleryAsset.is_global == True)

    # Deterministic ordering:
    # 1. slot (group by slot)
    # 2. is_global ASC (False=0=Tenant first, True=1=Global second)
    # 3. priority DESC (higher priority wins)
    # 4. uploaded_at DESC (newest wins on tie)
    query = query.order_by(
        GalleryAsset.slot.asc(),
        GalleryAsset.is_global.asc(),
        GalleryAsset.priority.desc(),
        GalleryAsset.uploaded_at.desc()
    )

    result = await db.execute(query)
    candidates = result.scalars().all()

    # Winner-Takes-All: first match per slot wins
    resolved = {}
    for asset in candidates:
        if asset.slot not in resolved:
            url = asset.cdn_url or asset.filepath
            if url and not url.startswith("/"):
                url = f"/{url}"
            resolved[asset.slot] = {
                "url": url,
                "alt": asset.alt_text or asset.caption_tr or "",
                "blurhash": asset.blurhash,
                "is_override": not (asset.is_global or False),
                "asset_id": asset.id,
                "category": asset.category
            }

    return resolved


async def debug_slot(db: AsyncSession, slot_key: str, tenant_id: str = None):
    """Debug endpoint helper — shows why a specific asset won."""
    query = select(GalleryAsset).filter(
        GalleryAsset.slot == slot_key,
        GalleryAsset.is_published == True
    )
    if tenant_id:
        query = query.filter(
            (GalleryAsset.tenant_id == tenant_id) | (GalleryAsset.is_global == True)
        )

    query = query.order_by(
        GalleryAsset.is_global.asc(),
        GalleryAsset.priority.desc(),
        GalleryAsset.uploaded_at.desc()
    )

    result = await db.execute(query)
    candidates = result.scalars().all()

    if not candidates:
        return {"winner": None, "candidates": 0, "reason": "No assets found for this slot"}

    winner = candidates[0]
    return {
        "winner": winner.id,
        "source": "TENANT_OVERRIDE" if not (winner.is_global or False) else "GLOBAL_DEFAULT",
        "score_metrics": {
            "is_global": winner.is_global or False,
            "priority": winner.priority or 0,
            "tenant_id": winner.tenant_id
        },
        "candidates": len(candidates),
        "all_candidates": [
            {"id": c.id, "is_global": c.is_global or False, "priority": c.priority or 0, "filename": c.filename}
            for c in candidates
        ]
    }
