from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class PublishRequest(BaseModel):
    slug: str
    content: Dict[str, Any]
    region_id: Optional[str] = None
    ab_split_config: Optional[Dict[str, Any]] = {}

class PublishResponse(BaseModel):
    status: str
    version_hash: str
    warnings: list[str] = []
    
class ContentResponse(BaseModel):
    slug: str
    version_hash: str
    content: Dict[str, Any]

class TimelineItem(BaseModel):
    version_hash: str
    action: str
    actor: str
    timestamp: str  # ISO format string
    ip_address: str # Masked (e.g. 192.168.1.***)

class TimelineResponse(BaseModel):
    slug: str
    region_id: Optional[str] = None
    history: list[TimelineItem]

class RollbackRequest(BaseModel):
    target_version_hash: str
    dry_run: bool = False

class RollbackDryRunResponse(BaseModel):
    status: str
    target_version_hash: str
    action: str
    simulation_warnings: list[str] = []

class SystemStatusResponse(BaseModel):
    active_db_engine: str
    storage_driver: str
    blob_count: int
    last_purge_result: str
    active_hashes: int
    sla_db_latency_ms: float
    sla_last_24h_errors: int
