from fastapi import APIRouter, HTTPException
import time
import logging
from typing import List
from app.schemas.memory import MemoryNode
from app.services.sovereign_memory_service import SovereignMemoryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/memory", tags=["Sovereign Memory"])

@router.get("/health")
async def memory_health():
    return {"status": "ok", "subsystem": "sovereign_memory"}

@router.get("/nodes", response_model=List[MemoryNode])
async def get_memory_nodes():
    start_time = time.time()
    result = SovereignMemoryService.get_memory_nodes()
    duration_ms = (time.time() - start_time) * 1000
    logger.info(f"Sovereign Memory /nodes response time: {duration_ms:.2f}ms")
    return result

@router.get("/nodes/{date}", response_model=MemoryNode)
async def get_memory_node(date: str):
    start_time = time.time()
    node = SovereignMemoryService.get_memory_node(date)
    duration_ms = (time.time() - start_time) * 1000
    if not node:
        logger.warning(f"Sovereign Memory /nodes/{date} NOT FOUND. response time: {duration_ms:.2f}ms")
        raise HTTPException(status_code=404, detail="Memory node not found")
    logger.info(f"Sovereign Memory /nodes/{date} response time: {duration_ms:.2f}ms")
    return node
