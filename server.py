import sys
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import uvicorn

# 📌 1️⃣ Event Loop (Windows stabil)
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

BASE_DIR = Path(__file__).resolve().parent

# 📌 2️⃣ FastAPI Setup
app = FastAPI(title="Santis Club API", version="3.0")

from app.api.v1.endpoints import auth, users, tenants, bookings
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["auth"],
)
app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["users"],
)
app.include_router(
    tenants.router,
    prefix="/api/v1/tenants",
    tags=["tenants"],
)
app.include_router(
    bookings.router,
    prefix="/api/v1/bookings",
    tags=["bookings"],
)

from app.api.v1.endpoints import revenue
app.include_router(
    revenue.router,
    prefix="/api/v1/revenue",
    tags=["revenue"],
)

from app.api.v1.endpoints import admin
app.include_router(
    admin.router,
    tags=["admin"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("GLOBAL ERROR HANDLER CAUGHT EXCEPTION")
    traceback.print_exc()
    print(f"Error: {exc}")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc), "trace": traceback.format_exc()},
    )

# 📌 3️⃣ CORS (Production-safe basic)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # production’da domain ile sınırla
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📌 4️⃣ Static Mount
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")
app.mount("/components", StaticFiles(directory=BASE_DIR / "components"), name="components")

# 📌 4.1️⃣ WebSocket Bridge for SantisBrain
active_sockets = set()

@app.websocket("/ws")
async def websocket_bridge(websocket: WebSocket):
    await websocket.accept()
    active_sockets.add(websocket)
    try:
        await websocket.send_text(json.dumps({"type": "welcome", "source": "server", "message": "brain-online"}))
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except Exception:
                payload = {"type": "message", "text": data}

            # Echo back to sender (as self) and broadcast to others as peer
            for sock in list(active_sockets):
                try:
                    source = "self" if sock is websocket else "peer"
                    sock_payload = dict(payload)
                    sock_payload["source"] = source
                    await sock.send_text(json.dumps(sock_payload))
                except Exception:
                    try:
                        active_sockets.discard(sock)
                    except Exception:
                        pass
    except WebSocketDisconnect:
        active_sockets.discard(websocket)
    except Exception:
        active_sockets.discard(websocket)

# 📌 5️⃣ API Route (Asıl Mesele)
@app.get("/api/v1/services")
async def get_services():
    services_path = BASE_DIR / "assets" / "data" / "services.json"
    if not services_path.exists():
         return {"error": "Services data not found"}
    with open(services_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

# 📌 5.5️⃣ Missing API Endpoints (Stubbed/Mocked)
from fastapi import UploadFile, File, Form, Body
import random

@app.get("/api/pages/{slug}")
async def get_page_data(slug: str):
    # Try to load from assets/data/{slug}_data.json
    data_path = BASE_DIR / "assets" / "data" / f"{slug}_data.json"
    if data_path.exists():
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    # Default structure for page builder
    return {"title": slug.title(), "blocks": []}

@app.post("/api/pages/{slug}")
async def save_page_data(slug: str, payload: dict = Body(...)):
    # Mock save
    print(f"Mock saving page {slug}: {payload.keys()}")
    return {"status": "success", "message": "Page saved (mock)"}

@app.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...)):
    # Mock upload
    return {"filename": f"mock_{file.filename}", "url": f"/uploads/mock_{file.filename}"}

@app.post("/admin/generate-ai")
async def generate_ai(payload: dict = Body(...)):
    # Mock AI generation
    return {"text": "This is AI generated content placeholder for " + payload.get("prompt", "")}

@app.get("/api/health-score")
async def get_health_score():
    return {"score": 98}

@app.get("/api/health-history")
async def get_health_history():
    return {
        "scores": [92, 94, 95, 98],
        "reports": ["report_1.html", "report_2.html"]
    }

@app.get("/api/config")
async def get_config():
    return {"animation_level": "high", "env": "dev"}

# 📌 6️⃣ HTML Route (TR Pages & Home)
@app.get("/")
async def homepage():
    return FileResponse(BASE_DIR / "index.html")

@app.get("/{lang}/{path:path}")
async def serve_pages(lang: str, path: str):
    # Security check to prevent directory traversal
    if ".." in path or ".." in lang:
        return FileResponse(BASE_DIR / "404.html", status_code=404)
        
    file_path = BASE_DIR / lang / path
    
    # Check if file exists and is a file (not directory)
    if file_path.exists():
        if file_path.is_file():
            return FileResponse(file_path)
        if file_path.is_dir():
            index_path = file_path / "index.html"
            if index_path.exists() and index_path.is_file():
                return FileResponse(index_path)
    
    # Try adding .html if missing
    if not path.endswith(".html"):
        html_path = file_path.with_suffix(".html")
        if html_path.exists() and html_path.is_file():
            return FileResponse(html_path)
            
    return FileResponse(BASE_DIR / "404.html", status_code=404)

@app.on_event("startup")
async def startup_event():
    print("--- SERVER STARTING NEW CODE v2 ---")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        print(f"Route: {route.path} Methods: {methods}")

# 📌 7️⃣ Run Config
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
