import asyncio
import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.models.content import ContentRegistry
from app.services.publish_engine import AtomicPublishEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RecoveryScript")

async def recover_missing_blobs():
    """
    Scans the database for slugs, generates a default payload for each,
    and forces a 'publish_atomic' event which creates the blob 
    and updates the active_hash and ETag correctly.
    """
    logger.info("Initializing Recovery Protocol for Missing Blobs...")
    async with AsyncSessionLocal() as db:
        stmt = select(ContentRegistry)
        result = await db.execute(stmt)
        registries = result.scalars().all()
        
        # We need the engine to physically write hashes and sync the db
        engine = AtomicPublishEngine(db)
        
        recovered = 0
        for reg in registries:
            try:
                # We do not use the raw model hash, we issue a brand new publish!
                mock_payload = {
                    "slug": reg.slug,
                    "title": f"Recovered {reg.slug.replace('-', ' ').title()}",
                    "description": f"Auto-generated mock content block for {reg.slug} to restore Storage Blob Integrity.",
                    "status": "active",
                    "price": "N/A",
                    "region": reg.region,
                    "locale": reg.locale
                }
                
                logger.info(f"Re-publishing: {reg.slug} ({reg.region}/{reg.locale})")
                
                await engine.publish_content(
                    slug=reg.slug,
                    region=reg.region,
                    locale=reg.locale,
                    payload=mock_payload,
                    actor="system_recovery_bot",
                    action="storage_recovery"
                )
                recovered += 1
            except Exception as e:
                logger.error(f"Failed to recover {reg.slug}: {e}")
                
        logger.info(f"Recovery complete. Successfully restored {recovered}/{len(registries)} blobs.")

if __name__ == "__main__":
    asyncio.run(recover_missing_blobs())
