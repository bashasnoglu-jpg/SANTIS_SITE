import time
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.auth import AuthLockout

class DBLockoutManager:
    """
    SaaS Security Respond Layer: Persistent (DB-Backed) Brute Force Lockout
    Exponential lockout rules: 5 failures -> 5m, 6 -> 15m, 7 -> 60m...
    """
    def __init__(self, base_threshold: int = 5):
        self.base_threshold = base_threshold
        
    def _get_key(self, ip: str, username: str) -> str:
        return f"{ip}:{username}"
        
    def _calculate_lock_time(self, attempts: int) -> timedelta:
        # Exponential backoff mapping based on threshold
        ext_attempts = attempts - self.base_threshold
        if ext_attempts == 0:
            return timedelta(minutes=5)
        elif ext_attempts == 1:
            return timedelta(minutes=15)
        else:
            return timedelta(minutes=60)

    async def check_lockout(self, db: AsyncSession, ip: str, username: str) -> bool:
        """Returns True if locked out."""
        key = self._get_key(ip, username)
        stmt = select(AuthLockout).where(AuthLockout.actor_identifier == key)
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()
        
        if not record:
            return False
            
        if record.locked_until and record.locked_until > datetime.utcnow():
            return True # Still locked
            
        return False

    async def record_failure(self, db: AsyncSession, ip: str, username: str) -> int:
        """Records failure and returns remaining attempts"""
        key = self._get_key(ip, username)
        stmt = select(AuthLockout).where(AuthLockout.actor_identifier == key)
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()
        
        if not record:
            record = AuthLockout(actor_identifier=key, failed_attempts=1)
            db.add(record)
        else:
            if record.locked_until and record.locked_until > datetime.utcnow():
                return 0
                
            record.failed_attempts += 1
            if record.failed_attempts >= self.base_threshold:
                lock_duration = self._calculate_lock_time(record.failed_attempts)
                record.locked_until = datetime.utcnow() + lock_duration
                await db.commit()
                return 0
        
        await db.commit()
        return max(0, self.base_threshold - record.failed_attempts)

    async def clear_failures(self, db: AsyncSession, ip: str, username: str):
        key = self._get_key(ip, username)
        stmt = select(AuthLockout).where(AuthLockout.actor_identifier == key)
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()
        
        if record:
            await db.delete(record)
            await db.commit()

lockout_manager = DBLockoutManager()
