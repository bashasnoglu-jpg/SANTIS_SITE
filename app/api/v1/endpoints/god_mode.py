from __future__ import annotations
import asyncio
import json
import os
import re
import aiofiles
from datetime import datetime
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

# Sovereign Telemetry Bridge
from app.api.v1.endpoints.telemetry import SOVEREIGN_STATE
import time

router = APIRouter()

LOG_FILE_PATH = "ai/singularity.log"
PROMPT_FILE = "ai/prompt_matrix.json"
ASSETS_DIR = "assets/img"

async def get_cortex_metrics():
    """Matrisi ve fiziksel klasörü tarayıp eksik slotları otonom hesaplar."""
    try:
        if not os.path.exists(PROMPT_FILE):
            return 0, 0
            
        async with aiofiles.open(PROMPT_FILE, mode='r', encoding='utf-8') as f:
            content = await f.read()
            matrix = json.loads(content)
            total_slots = len(matrix)
            
            # Klasörde olmayan (eksik) dosyaları say
            missing = sum(1 for item in matrix if not os.path.exists(os.path.join(ASSETS_DIR, item.get("file", ""))))
            return total_slots, missing
    except Exception:
        return 0, 0

def get_live_telemetry_metrics():
    """RAM'deki verileri temizler ve God Mode UI için canlı metrikleri hesaplar."""
    now = time.time()
    
    # 1. Zombi Oturumları Temizle (Son 15 saniyede ping atmayanları sil)
    dead_sessions = [sid for sid, data in SOVEREIGN_STATE["active_sessions"].items() if now - data["last_seen"] > 15]
    for sid in dead_sessions:
        del SOVEREIGN_STATE["active_sessions"][sid]
        
    # 2. Canlı Metrikleri Çek
    active_users = len(SOVEREIGN_STATE["active_sessions"])
    active_whales = sum(1 for s in SOVEREIGN_STATE["active_sessions"].values() if s["is_whale"])
    
    # Hesitation Index (Ortalama Kararsızlık Şiddeti)
    if active_users > 0:
        avg_hesitation = sum(s["total_hesitation"] for s in SOVEREIGN_STATE["active_sessions"].values()) / active_users
        # 5 saniye (5000ms) = %100 Kararsızlık olarak indeksle
        hesitation_index = f"{min(100, int((avg_hesitation / 5000) * 100))}%" 
    else:
        hesitation_index = "0%"
        
    # Oracle Durumu (Fiyat Bükücü)
    oracle_status = "MONITORING"
    if active_whales > 0:
        oracle_status = "🔥 SURGE PREP: BENDING PRICES!"
        
    return active_whales, hesitation_index, oracle_status

def get_quarantine_data():
    pending_nodes = []
    if os.path.exists("quarantine_zone"):
        for filename in os.listdir("quarantine_zone"):
            if filename.endswith(".json"):
                filepath = os.path.join("quarantine_zone", filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        node_id = list(data.keys())[0]
                        node_data = data[node_id]
                        
                        # Editorial title veya SEO title
                        title = node_data.get("editorial_title", {}).get("en", "")
                        if not title:
                            title = node_data.get("seo", {}).get("title", {}).get("en", "Unknown Expansion")
                            
                        pending_nodes.append({
                            "filename": filename,
                            "node_id": node_id,
                            "title": title,
                            "prompt": node_data.get("hero_image_prompt", "Awaiting AI...")
                        })
                except Exception:
                    pass
    return pending_nodes

async def get_matrix_metrics():
    """Artık kullanılmıyor. Veri doğrudan Asenkron JSONL dosyasından (Matrix Log) okunacak."""
    return "0", "100%", "STANDBY"

MATRIX_LOG_FILE = "ai/logs/matrix_build.log"

async def holy_trinity_stream(request: Request):
    """singularity.log ve matrix_build.log dosyalarını anlık okuyan Sovereign Streamer"""
    
    os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
    if not os.path.exists(LOG_FILE_PATH):
        with open(LOG_FILE_PATH, 'w', encoding="utf-8") as f:
            f.write("[SYSTEM] Singularity Engine Kognitif Korteks başlatıldı.\n")

    os.makedirs(os.path.dirname(MATRIX_LOG_FILE), exist_ok=True)
    if not os.path.exists(MATRIX_LOG_FILE):
        with open(MATRIX_LOG_FILE, 'w', encoding="utf-8") as f:
            f.write(json.dumps({
                "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                "message": "[SYSTEM] SSG Matrix Core başlatıldı.",
                "pages_active": 0,
                "node_health": "100%",
                "hreflang_status": "STANDBY"
            }) + "\n")

    async with aiofiles.open(LOG_FILE_PATH, mode='r', encoding='utf-8') as f_cortex, \
               aiofiles.open(MATRIX_LOG_FILE, mode='r', encoding='utf-8') as f_matrix:
        
        await f_cortex.seek(0, os.SEEK_END) 
        await f_matrix.seek(0, os.SEEK_END)
        
        while True:
            if await request.is_disconnected():
                print("👁️ [GOD MODE] İzleyici ayrıldı. Korteks akışı durduruldu.")
                break

            line_cortex = await f_cortex.readline()
            line_matrix = await f_matrix.readline()
            
            queue_size, missing_slots = await get_cortex_metrics()
            
            latest_cortex_log = line_cortex.strip() if line_cortex else None
            new_image = None
            
            if latest_cortex_log and ".webp" in latest_cortex_log:
                match = re.search(r'([a-zA-Z0-9_\-]+\.webp)', latest_cortex_log)
                if match and any(keyword in latest_cortex_log.lower() for keyword in ["saved", "mühürlendi", "created"]):
                    new_image = match.group(1) 
                    
            matrix_payload = {"pages_active": "WAITING P3", "health": "-", "hreflang_status": "STANDBY", "latest_log": None}
            if line_matrix:
                try:
                    m_data = json.loads(line_matrix.strip())
                    matrix_payload = {
                        "pages_active": str(m_data.get("pages_active", 0)),
                        "health": m_data.get("node_health", "100%"),
                        "hreflang_status": m_data.get("hreflang_status", "SYNCED"),
                        "latest_log": m_data.get("message", "") # Hedefteski UI bunu da basabilir
                    }
                except json.JSONDecodeError:
                    pass

            # Canlı Telemetry Matematiği
            live_whales, live_hesitation, live_oracle = get_live_telemetry_metrics()
            
            payload = {
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "cortex": {
                    "latest_log": latest_cortex_log,
                    "new_image": new_image,
                    "queue_size": queue_size, 
                    "missing_slots": missing_slots
                },
                "telemetry": {
                    "active_whales": str(live_whales),
                    "hesitation_index": live_hesitation,
                    "oracle_status": live_oracle,
                    "ghost_score": "-", 
                    "revenue_today": f"€{SOVEREIGN_STATE['total_revenue_sim']:,.0f}"
                },
                "matrix": matrix_payload,
                "quarantine": {
                    "pending_nodes": get_quarantine_data()
                }
            }
            
            # Sadece yeni bir log (Cortex veya Matrix) varsa anında fırlat
            if latest_cortex_log or line_matrix:
                yield f"data: {json.dumps(payload)}\n\n"
            else:
                payload["cortex"]["latest_log"] = None 
                payload["matrix"]["latest_log"] = None
                yield f"data: {json.dumps(payload)}\n\n"
                await asyncio.sleep(1.0)

@router.get("/stream")
async def god_mode_stream(request: Request):
    return StreamingResponse(holy_trinity_stream(request), media_type="text/event-stream")
