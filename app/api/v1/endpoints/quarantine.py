from __future__ import annotations
import os
import shutil
import json
from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter()

# [SOVEREIGN SEAL: THE EXECUTIONER / HITL CONTROLLER]
QUARANTINE_DIR = Path("quarantine_zone")
UNIVERSE_DATA = Path("ai/content_universe.json")
MUSCLE_EXECUTOR = "ai/universe_builder.py"

@router.post("/seal/{filename}")
async def seal_and_create(filename: str):
    """👑 SEAL: JSON'ı Evren Matrisine Mühürler ve Kas'ı Tetikler"""
    source_path = QUARANTINE_DIR / filename
    
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Mühimmat bulunamadı, Cellat şaşkın.")

    # 1. Veriyi Oku ve Matrise Ekle
    with open(source_path, "r", encoding="utf-8") as f:
        new_data = json.load(f)

    # Content Universe'e ekleme (Örn: de/wien segmenti)
    # create directory and file if not exists
    os.makedirs(UNIVERSE_DATA.parent, exist_ok=True)
    
    try:
        with open(UNIVERSE_DATA, "r", encoding="utf-8") as f:
            universe = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        universe = {"pages": {}}

    # Handle if page structure matches array or dict
    if isinstance(universe.get("pages"), list):
        universe["pages"].append(new_data)
    else:
        if "pages" not in universe:
            universe["pages"] = {}
        node_id = list(new_data.keys())[0] if isinstance(new_data, dict) and len(new_data) == 1 else filename.split('.')[0]
        if isinstance(new_data, dict) and node_id in new_data:
            universe["pages"][node_id] = new_data[node_id]
        else:
            universe["pages"][node_id] = new_data

    with open(UNIVERSE_DATA, "w", encoding="utf-8") as f:
        json.dump(universe, f, indent=4, ensure_ascii=False)

    # 2. Fiziksel İnfaz (Kas'ı bir kez çalıştır)
    # manage.py --watch modunda değilse manuel tetikleme
    os.system(f"python {MUSCLE_EXECUTOR} --build-single {filename}")

    # 3. Karantinadan Temizle
    os.remove(source_path)
    
    # 🚨 Matrix Loguna Ateşle
    log_dir = Path("ai/logs/matrix_build.log")
    os.makedirs(log_dir.parent, exist_ok=True)
    try:
        with open(log_dir, "a", encoding="utf-8") as f:
            from datetime import datetime
            payload = {
                "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                "message": f"[HITL_SEALED] {filename} mühürlendi ve inşa edildi.",
                "pages_active": len(universe.get("pages", [])),
                "node_health": "100%",
                "hreflang_status": "REBUILD REQUIRED"
            }
            f.write(json.dumps(payload) + "\n")
    except:
        pass

    return {"status": "SUCCESS", "message": f"{filename} mühürlendi, sayfa inşa edildi."}

@router.delete("/burn/{filename}")
async def burn_asset(filename: str):
    """🔥 BURN: Kusurlu zekayı acımasızca yok eder"""
    target = QUARANTINE_DIR / filename
    if target.exists():
        os.remove(target)
        return {"status": "PURGED", "message": "Kusurlu mühimmat küle dönüştürüldü."}
    raise HTTPException(status_code=404, detail="Yok edilecek bir şey bulunamadı.")
