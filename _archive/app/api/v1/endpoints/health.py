from __future__ import annotations
from fastapi import APIRouter
import os
import json

router = APIRouter()

QUARANTINE_DIR = "quarantine_zone"

@router.get("/panel-audit")
async def panel_audit():
    """
    Orta Sütun Karantina Paneli ve Butonların durumu (God Mode Hitl Matrix)
    """
    report = []
    if os.path.exists(QUARANTINE_DIR):
        for filename in os.listdir(QUARANTINE_DIR):
            if filename.endswith(".json"):
                filepath = os.path.join(QUARANTINE_DIR, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        node_id = list(data.keys())[0]
                        
                        report.append({
                            "filename": filename,
                            "node_id": node_id,
                            "seal_button": True,   # JS tarafında render edilecek
                            "burn_button": True,
                            "title": data[node_id].get("editorial_title", {}).get("en", "Unknown"),
                            "prompt": data[node_id].get("hero_image_prompt", "")
                        })
                except Exception as e:
                    report.append({"filename": filename, "error": str(e)})
    
    return {"status": "ok", "quarantine_nodes": report}

@router.get("/health-report")
async def health_report():
    """
    Santis OS Genel Sağlık Raporu
    """
    # Karantina durumu
    try:
        quarantine_count = len([f for f in os.listdir(QUARANTINE_DIR) if f.endswith(".json")]) if os.path.exists(QUARANTINE_DIR) else 0
    except:
        quarantine_count = 0
    
    # Matrix Build durumu
    matrix_log_file = "logs/matrix_build.log"
    try:
        if os.path.exists(matrix_log_file):
            with open(matrix_log_file, "r", encoding="utf-8") as f:
                logs = f.readlines()[-20:]
        else:
            logs = ["No matrix build logs found."]
    except Exception:
        logs = ["Error reading logs."]

    # Telemetry Shield durumu
    telemetry_health = "ACTIVE" if os.path.exists("santis_state.db") else "INACTIVE"

    return {
        "status": "ok",
        "quarantine_nodes_count": quarantine_count,
        "last_matrix_logs": logs,
        "telemetry_status": telemetry_health
    }
