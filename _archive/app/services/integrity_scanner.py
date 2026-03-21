import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.db.models.content import ContentRegistry, ContentAuditLog
from app.services.content_storage import get_storage_provider

logger = logging.getLogger(__name__)

class IntegrityScanner:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = get_storage_provider()
        
    async def run_scan(self) -> Dict[str, Any]:
        """
        Validates the active_hash in ContentRegistry against the physical blob on disk.
        Reports mismatches and logs them to the Audit DB for forensics.
        """
        stmt = select(ContentRegistry)
        result = await self.db.execute(stmt)
        registries = result.scalars().all()
        
        report = {
            "total_scanned": len(registries),
            "healthy": 0,
            "corrupted": 0,
            "missing": 0,
            "corrupted_slugs": [],
            "missing_slugs": []
        }
        
        for reg in registries:
            try:
                # 1. Read Blob
                blob = await self.storage.read_blob(reg.slug, reg.active_hash)
                
                # 2. Re-calculate Hash
                actual_hash = self.storage._generate_hash(blob)
                
                # 3. Compare Integrity
                if actual_hash == reg.active_hash:
                    report["healthy"] += 1
                else:
                    report["corrupted"] += 1
                    report["corrupted_slugs"].append(reg.slug)
                    
                    # Log Integrity Breach (Tampering Detected)
                    audit = ContentAuditLog(
                        slug=reg.slug,
                        action="integrity_breach_detected",
                        hash=reg.active_hash,
                        actor="system_integrity_scanner",
                        ip_address="127.0.0.1"
                    )
                    self.db.add(audit)
                    
            except FileNotFoundError:
                report["missing"] += 1
                report["missing_slugs"].append(reg.slug)
                
                # Log Orphan Pointer (Data loss or storage corruption)
                audit = ContentAuditLog(
                    slug=reg.slug,
                    action="blob_missing_detected",
                    hash=reg.active_hash,
                    actor="system_integrity_scanner",
                    ip_address="127.0.0.1"
                )
                self.db.add(audit)
                
        # Commit any newly generated audit logs
        try:
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Integrity Scanner failed to commit audit logs: {e}")
            
        return report
