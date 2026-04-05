import os
import json
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.content import ContentRegistry, ContentAuditLog
from app.utils.hash_utils import generate_canonical_hash, generate_shard_path
from app.services.content_storage import get_storage_provider

logger = logging.getLogger(__name__)

class AtomicPublishEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = get_storage_provider()

    async def _analyze_tone(self, payload: dict) -> dict:
        """
        Advisory AI Tone Check.
        In a real scenario, this would call OpenAI/Gemini to evaluate the 'Luxury Score'.
        For now, we mock the advisory response based on payload content.
        """
        warnings = []
        score = 100
        
        # Simple mock logic for demonstration
        content_str = json.dumps(payload).lower()
        if "cheap" in content_str or "discount" in content_str:
            score = 75
            warnings.append("Luxury Score < 88: Avoid words like 'cheap' or 'discount' in premium spa copy.")
            
        return {"score": score, "warnings": warnings}

    async def _write_blob(self, slug: str, payload: dict) -> str:
        """
        Writes the canonical JSON payload to disk.
        Returns the hash of the written shard.
        """
        version_hash = await self.storage.write_blob(slug, payload)
        return version_hash

    async def _trigger_cdn_purge(self, slug: str, region: str):
        """
        Asynchronous CDN Purge.
        In production, this fires off an HTTP request to Cloudflare API.
        """
        # Mocking async background task execution
        logger.info(f"[CDN_PURGE] Async purge triggered for {slug} (Region: {region})")
        pass

    async def publish_content(
        self, 
        slug: str, 
        region: str, 
        locale: str, 
        payload: dict, 
        actor: str,
        action: str = "publish" # publish, or migration_publish
    ) -> dict:
        """
        The Core Atomic Pipeline.
        1. Tone Check
        2. Hash & Canonicalize
        3. Idempotency Check
        4. Blob Write
        5. DB Transaction (Active Hash, Audit Log)
        6. Async CDN Purge
        """
        response_meta = {"status": "success", "warnings": [], "action_taken": None}

        # 1. Advisory Tone Check
        tone_result = await self._analyze_tone(payload)
        if tone_result["warnings"]:
            response_meta["warnings"].extend(tone_result["warnings"])

        # 2. Canonicalize & Hash
        active_hash = generate_canonical_hash(payload)
        # 1. AI Tone Advisory
        tone_check = await self._analyze_tone(payload)
        response_meta["warnings"].extend(tone_check["warnings"])

        # 2. Existing Pointer Lock
        stmt = select(ContentRegistry).where(
            ContentRegistry.slug == slug,
            ContentRegistry.region == region,
            ContentRegistry.locale == locale
        )
        result = await self.db.execute(stmt)
        existing_record = result.scalars().first()
        
        # 3. Canonical Hash Check (for pure Idempotency before disk write)
        active_hash = generate_canonical_hash(payload)
        if existing_record and existing_record.active_hash == active_hash:
            # 3a. Exact content already live. No-op.
            logger.info(f"[IDEMPOTENT] Hash {active_hash} already live for {slug} ({region}/{locale})")
            
            # Still log this attempt as 'no_change' for audit trails if necessary, but returning 200 early is the goal.
            audit = ContentAuditLog(
                slug=slug, region=region, actor=actor, action="no_change", hash=active_hash
            )
            self.db.add(audit)
            await self.db.commit()

            response_meta["action_taken"] = "no_change"
            response_meta["version_hash"] = active_hash
            return response_meta

        # 4. Blob Write Phase (Before DB Transaction)
        try:
            stored_hash = await self._write_blob(slug, payload)
            logger.info(f"[BLOB_WRITE] Shard created with hash {stored_hash}")
        except Exception as e:
            logger.error(f"[BLOB_ERROR] Failed to write blob: {e}")
            raise RuntimeError(f"Storage I/O failure: {e}")

        # 4. DB Transaction Phase
        try:
            if existing_record:
                # Pointer update
                existing_record.active_hash = stored_hash
            else:
                # First time registration
                # We need a unique ID, generating simple slug-region-locale key
                reg_id = f"{slug}_{region}_{locale}"
                new_reg = ContentRegistry(
                    id=reg_id,
                    slug=slug,
                    region=region,
                    locale=locale,
                    active_hash=stored_hash
                )
                self.db.add(new_reg)

            # Insert Immutable Audit Log
            audit_entry = ContentAuditLog(
                slug=slug,
                region=region,
                actor=actor,
                action=action, # Allows distinguishing normal publish vs migration wave
                hash=stored_hash
            )
            self.db.add(audit_entry)

            # Final Atomic Commit
            await self.db.commit()
            logger.info(f"[DB_COMMIT] Pointer updated to {active_hash} for {slug}")
            response_meta["action_taken"] = "publish"

        except Exception as e:
            # If DB commit fails, rollback the DB session state. 
            # The Blob written in step 4 becomes an 'Orphan'. This is ACCEPTABLE as per architecture.
            await self.db.rollback()
            logger.error(f"[TRANSACTION_FAILED] Committing {active_hash} failed. Orphan blob created. Error: {e}")
            raise e

        # 6. Async CDN Purge Trigger (Post-Commit)
        await self._trigger_cdn_purge(slug, region)

        response_meta["hash"] = active_hash
        return response_meta
