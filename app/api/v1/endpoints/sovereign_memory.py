from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.memory import MemoryNode
from app.services.sovereign_memory_service import SovereignMemoryService

router = APIRouter(prefix="/memory", tags=["Sovereign Memory"])

@router.get("/nodes", response_model=List[MemoryNode])
async def get_memory_nodes():
    return SovereignMemoryService.get_memory_nodes()

@router.get("/nodes/{date}", response_model=MemoryNode)
async def get_memory_node(date: str):
    node = SovereignMemoryService.get_memory_node(date)
    if not node:
        raise HTTPException(status_code=404, detail="Memory node not found")
    return node
