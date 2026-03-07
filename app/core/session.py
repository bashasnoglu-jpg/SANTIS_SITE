import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

from app.core.config import settings

# 7 Days default session TTL (sliding window)
SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

# Local In-Memory Fallback for Windows/Local environments without Redis
_memory_sessions: Dict[str, str] = {}
_memory_user_index: Dict[str, set] = {}

class SessionManager:
    @staticmethod
    async def create_session(user_id: str, tenant_id: str, role: str, ip: str, user_agent: str, fingerprint: str) -> str:
        session_id = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()
        
        session_data = {
            "sub": user_id,
            "tenant_id": tenant_id or "hq",
            "role": role,
            "ip": ip,
            "user_agent": user_agent,
            "fingerprint": fingerprint,
            "created_at": now_str,
            "last_active": now_str,
        }
        
        session_key = f"session:{session_id}"
        _memory_sessions[session_key] = json.dumps(session_data)
        
        index_key = f"user_sessions:{user_id}"
        if index_key not in _memory_user_index:
            _memory_user_index[index_key] = set()
        _memory_user_index[index_key].add(session_id)
        
        return session_id

    @staticmethod
    async def verify_session(session_id: str, ip: str = None, fingerprint: str = None) -> Optional[Dict[str, Any]]:
        session_key = f"session:{session_id}"
        
        raw_data = _memory_sessions.get(session_key)
        if not raw_data:
            return None
            
        session_data = json.loads(raw_data)
        
        session_data["last_active"] = datetime.now(timezone.utc).isoformat()
        if ip:
            session_data["ip"] = ip 
            
        _memory_sessions[session_key] = json.dumps(session_data)
        
        return session_data

    @staticmethod
    async def revoke_session(session_id: str) -> bool:
        session_key = f"session:{session_id}"
        
        raw_data = _memory_sessions.pop(session_key, None)
        if not raw_data:
            return False
            
        session_data = json.loads(raw_data)
        user_id = session_data.get("sub")
        
        if user_id:
            index_key = f"user_sessions:{user_id}"
            if index_key in _memory_user_index:
                _memory_user_index[index_key].discard(session_id)
                if not _memory_user_index[index_key]:
                    del _memory_user_index[index_key]
            
        return True

    @staticmethod
    async def revoke_all_user_sessions(user_id: str) -> int:
        index_key = f"user_sessions:{user_id}"
        session_ids = _memory_user_index.get(index_key, set())
        
        count = len(session_ids)
        for sid in list(session_ids):
            _memory_sessions.pop(f"session:{sid}", None)
            
        if index_key in _memory_user_index:
            del _memory_user_index[index_key]
            
        return count

    @staticmethod
    async def get_active_sessions(user_id: str) -> list:
        index_key = f"user_sessions:{user_id}"
        session_ids = _memory_user_index.get(index_key, set())
        
        active_sessions = []
        stale_sids = []
        
        for sid in session_ids:
            raw_data = _memory_sessions.get(f"session:{sid}")
            if raw_data:
                data = json.loads(raw_data)
                active_sessions.append({
                    "session_id": sid,
                    "ip": data.get("ip"),
                    "user_agent": data.get("user_agent"),
                    "created_at": data.get("created_at"),
                    "last_active": data.get("last_active")
                })
            else:
                stale_sids.append(sid)
                
        for sid in stale_sids:
            _memory_user_index[index_key].discard(sid)
            
        return active_sessions

session_manager = SessionManager()
