from __future__ import annotations
import asyncio
from fastapi import APIRouter, BackgroundTasks, Request
from loguru import logger
from app.core.limiter import limiter

# router instance
router = APIRouter()

async def heavy_genesis_task(whale_id: str):
    """Bu fonksiyon HTTP döngüsünün dışında, arka planda çalışır."""
    try:
        logger.info(f"⏳ [WORKER] {whale_id} için LLM yaratımı başladı...")
        # Örnek: await openai.images.generate(...)
        # Simüle edilmiş asenkron bekleme
        await asyncio.sleep(15)
        
        logger.success(f"🎨 [WORKER] Görsel üretildi! DB'ye yazılıyor...")
        # İşlem bitince DB'yi güncelle ve SSE üzerinden UI'a sinyal at.
    except Exception as e:
        logger.error(f"Task Failed: {e}")

@router.post("/engage_sentience")
@limiter.limit("5/minute") # 🚨 FATURA ZIRHI: Bir IP dakikada max 5 yapay zeka tetikleyebilir!
async def engage_sentience(request: Request, whale_id: str, bg_tasks: BackgroundTasks):
    
    # Ağır API işini BackgroundTasks kuyruğuna at
    bg_tasks.add_task(heavy_genesis_task, whale_id)
    
    # Sunucu kilitlenmeden anında 202 (Accepted) dön
    return {
        "status": "accepted", 
        "message": "İşlem kuyruğa alındı. Hazır olduğunda SSE üzerinden iletilecek."
    }
