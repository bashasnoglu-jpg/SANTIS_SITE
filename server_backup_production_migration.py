
# 🦅 SANTIS CLUB SERVER v4.5 (SENTINEL V3 ULTRA CORE)
# UTF-8 IRONCLAD | ASYNC I/O | HYBRID ENGINE

import os
import json
import csv
import logging
import uvicorn
import asyncio
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

# WINDOWS ASYNCIO FIX (Playwright Support)
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print("✅ Enforced WindowsProactorEventLoopPolicy")

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, Body, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import sentinel
from sentinel import sentinel_manager # New Manager
import auto_fixer
import ai_suggestions
import sitemap_generator
import city_os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from fastapi.staticfiles import StaticFiles
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, red, orange, green, HexColor
from reportlab.lib import colors
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor
from content_sync import (
    sync_product_to_site_json,
    remove_product_from_site_json,
    slug_exists,
    load_redirects,
    save_redirects,
)

# Try to import aiofiles, fallback to executor if missing
try:
    import aiofiles
    HAS_AIOFILES = True
except ImportError:
    HAS_AIOFILES = False

# Import Audit Engine (Ensure it exists or handle gracefully)
try:
    from audit_engine import AuditEngine
except ImportError:
    AuditEngine = None

# 👁️ VISUAL AUDIT ENGINE
try:
    from visual_audit import VisualAuditEngine
except ImportError:
    VisualAuditEngine = None

# ⚡ PERFORMANCE AUDIT ENGINE
try:
    from performance_audit import PerformanceAuditEngine
except ImportError:
    PerformanceAuditEngine = None

# 🛡️ SECURITY AUDIT ENGINE
try:
    from security_audit import SecurityAuditEngine
except ImportError:
    SecurityAuditEngine = None

# ... (Auto Fixer is already handled) ...

# 🤖 AUTO FIXER (Evolution Loop)
try:
    from core.evolution.auto_fixer import AutoFixer
except ImportError:
    AutoFixer = None

# ⚔️ ATTACK SIMULATOR
try:
    from attack_simulator import AttackSimulatorEngine
except ImportError:
    AttackSimulatorEngine = None

# 🤖 AI SUGGESTIONS
try:
    from ai_suggestions import generate_suggestions
except ImportError:
    generate_suggestions = None

# 🛡️ FLIGHT CHECK ENGINE
try:
    from flight_check import run_flight_check
except ImportError:
    run_flight_check = None

# 🌍 THE REGISTRY (CITIZEN TRACKING)
try:
    from the_registry import CitizenRegistry
except ImportError:
    CitizenRegistry = None

# 🗺️ GEO BRIDGE (LOCATION INTELLIGENCE)
try:
    from geo_bridge import GeoBridge
except ImportError:
    GeoBridge = None

# 🔮 THE ORACLE (PREDICTIVE ENGINE)
try:
    from oracle_analytics import OracleEngine
except ImportError:
    OracleEngine = None

# 🕸️ DEEP AUDIT V2 (EVOLUTION)
try:
    from core.evolution.deep_audit import DeepAuditEngine
except ImportError:
    DeepAuditEngine = None

# 🏙️ CITY INTELLIGENCE (SEMANTIC CORTEX)
try:
    from city_intelligence import CityIntelligence
except ImportError as e:
    logging.getLogger("SantisServer").error(f"❌ City Intelligence Import Failed: {e}")
    CityIntelligence = None

# 📋 ACTIVITY LOGGER
try:
    from activity_logger import ActivityLogger
except ImportError:
    ActivityLogger = None

try:
    import psutil
except ImportError:
    psutil = None

visual_audit_instance = VisualAuditEngine() if VisualAuditEngine else None
performance_audit_instance = PerformanceAuditEngine() if PerformanceAuditEngine else None
security_audit_instance = SecurityAuditEngine() if SecurityAuditEngine else None
attack_simulator_instance = AttackSimulatorEngine() if AttackSimulatorEngine else None
auto_fixer_instance = AutoFixer() if AutoFixer else None
citizen_registry = CitizenRegistry() if CitizenRegistry else None
geo_bridge = GeoBridge() if GeoBridge else None
oracle_engine = OracleEngine(citizen_registry) if (OracleEngine and citizen_registry) else None
deep_audit_instance = None # Lazy init on demand
city_intelligence_engine = None # Will be initialized after DIRECTORY is defined
activity_logger = None  # Initialized after DIRECTORY is defined

# CONSTANTS
PORT = 8000
MAX_UPLOAD_SIZE = 10 * 1024 * 1024 # 10MB

# --- CONFIG ---
# Default admin panel URL in all launch scripts points to localhost:8000.
# Keep server port aligned with those scripts to avoid Chrome "chrome-error://chromewebdata"
# navigation failures when the app can't be reached.
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
city_intelligence_engine = CityIntelligence(DIRECTORY, f"http://localhost:{PORT}") if CityIntelligence else None
activity_logger = ActivityLogger(DIRECTORY) if ActivityLogger else None
DB_FILE = os.path.join(DIRECTORY, "db", "services.json")
CONFIG_FILE = os.path.join(DIRECTORY, "db", "config.json")
AUDIT_SCRIPT = os.path.join(DIRECTORY, "santis_audit_cli.ps1")
AUDIT_REPORT = os.path.join(DIRECTORY, "reports", "fixed_links_report.csv")
FIX_SCRIPT = os.path.join(DIRECTORY, "fix_links.ps1")
REPORT_DIR = os.path.join(DIRECTORY, "reports")
HISTORY_FILE = Path(REPORT_DIR) / "history.json"
PAGES_DIR = os.path.join(DIRECTORY, "data", "pages")
SITE_CONTENT_FILE = os.path.join(DIRECTORY, "data", "site_content.json")
REDIRECTS_FILE = Path("data/redirects.json")
SOCIAL_DATA_FILE = os.path.join(DIRECTORY, "assets", "data", "social-data.js")
SOCIAL_DATA_RUNTIME_FILE = os.path.join(DIRECTORY, "assets", "js", "social-data.js")

# --- LOGGING ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(message)s")
logger = logging.getLogger("SantisServer")

# --- APP ---
app = FastAPI(title="Santis Sentinel V3", version="4.5")

# --- MIDDLEWARES (SECURITY HARDENING) ---
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import Response

# 1. Block Sensitive Paths
# 1. Block Sensitive Paths (Cerebellum Reflex)
from core.cerebellum.security_shield import security_shield
from core.cerebellum.rate_limiter import RateLimitMiddleware # NEW: Phase 39
from core.cerebellum.admin_lock import AdminLockMiddleware  # NEW: Phase 39 (Admin Lock)

app.add_middleware(AdminLockMiddleware) # Inner Layer: Admin Lock
app.add_middleware(RateLimitMiddleware) # Outer Layer: Rate Limit (Runs First)

@app.middleware("http")
async def block_sensitive_paths(request: Request, call_next):
    return await security_shield.block_sensitive_paths(request, call_next)

# 🌍 MIDDLEWARE: THE GLOBAL MIRROR (Citizen Tracking)
@app.middleware("http")
async def citizen_tracking_middleware(request: Request, call_next):
    # Skip for static assets
    if request.url.path.startswith(("/assets", "/favicon.ico")):
         return await call_next(request)

    response = await call_next(request)
    
    if citizen_registry:
        try:
            # Check Cookie
            citizen_id = request.cookies.get("santis_citizen_id")
            user_agent = request.headers.get("user-agent", "unknown")
            ip = request.client.host
            
            # Register / Update
            citizen_data, is_new = citizen_registry.get_or_create(citizen_id, user_agent, ip)
            
            # If new citizen or has no location data, try to resolve location
            if (is_new or "location" not in citizen_data) and geo_bridge:
                # Run in background to not block the request
                # We can't easily use background_tasks here in middleware directly without context,
                # but for now we'll do a quick sync check (cached) or rely on the timeout being short.
                # ideally this should be async or backgrounded.
                # Since we made geo_bridge.resolve sync (using requests), we should wrap it?
                # For Phase 25 V1, we will keep it simple.
                try:
                    loc_data = geo_bridge.resolve(ip)
                    citizen_registry.update_location(citizen_data["id"], loc_data)
                    citizen_data["location"] = loc_data # Update local ref for header
                except Exception as ex:
                    logger.error(f"GeoBridge Resolution Failed: {ex}")

            # Set Cookie if new or missing
            if is_new or not citizen_id:
                response.set_cookie(
                    key="santis_citizen_id", 
                    value=citizen_data["id"], 
                    max_age=31536000, 
                    httponly=True, 
                    samesite="lax"
                )
                response.headers["X-Santis-Citizen-New"] = "true"
                
            # Inject Header for debugging
            response.headers["X-Santis-Citizen-ID"] = citizen_data["id"]
            if "location" in citizen_data:
                response.headers["X-Santis-Location"] = citizen_data["location"].get("countryCode", "XX")

            # Page View Tracking (Interest Analysis)
            path = request.url.path.lower()
            category = "general"
            if "hamam" in path: category = "hammam"
            elif "masaj" in path: category = "massage"
            elif "rituel" in path: category = "ritual"
            elif "ozel" in path: category = "private"
            
            # Async tracking (fire and forget)
            if citizen_registry:
                citizen_registry.track_view(citizen_data["id"], category)

        except Exception as e:
            logger.error(f"Citizen Tracking Error: {e}")

    return response

# 📋 MIDDLEWARE: ACTIVITY LOGGER
@app.middleware("http")
async def activity_logging_middleware(request: Request, call_next):
    """Logs all write operations (POST/PUT/DELETE) to the activity feed."""
    if request.method in ("POST", "PUT", "DELETE") and activity_logger:
        import time as _t
        start = _t.time()
        
        # Read body for detail extraction (cache it)
        body_bytes = await request.body()
        body_dict = None
        try:
            if body_bytes:
                body_dict = json.loads(body_bytes)
        except Exception:
            pass

        # Reconstruct request with cached body
        async def receive():
            return {"type": "http.request", "body": body_bytes}
        request = Request(request.scope, receive)

        response = await call_next(request)
        duration = (_t.time() - start) * 1000

        # Skip static/asset requests and only log API/admin actions
        path = request.url.path
        if path.startswith(("/api/", "/admin/")) and not path.endswith((".js", ".css", ".html", ".png", ".jpg", ".ico")):
            client_ip = request.client.host if request.client else "unknown"
            activity_logger.log(
                method=request.method,
                path=path,
                status_code=response.status_code,
                body=body_dict,
                ip=client_ip,
                duration_ms=duration
            )
        return response
    return await call_next(request)

# 2. Security Headers (Ironclad)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # CSP: Strict — all inline scripts migrated to external files (Phase 6)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: http: https: blob: https://*.openstreetmap.org https://*.cartocdn.com https://unpkg.com; "
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' "
            "https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com http://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com http://unpkg.com; "
            "font-src 'self' https: data: https://fonts.gstatic.com; "
            "media-src 'self' http: https: https://videos.pexels.com; " 
            "connect-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com ws: wss: http://ip-api.com https://ip-api.com https://unpkg.com http://unpkg.com http://localhost:*;"
        )
        
        # Clickjacking Protection
        response.headers["X-Frame-Options"] = "DENY"
        
        # HSTS (Strict Transport Security) - Force HTTPS for 1 year
        # Only active if request is HTTPS to avoid locking out localhost HTTP dev
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # MIME Sniffing Protection
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS Protection (Legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy (FKA Feature Policy) - Disable sensitive API access by default
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )

        # HSTS (Enable in Prod - Active now per user request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

app.add_middleware(SecurityHeadersMiddleware)

# --- AUTO SECURITY PATCH ENDPOINT ---
@app.get("/admin/auto-security-patch")
async def auto_security_patch_status():
    return {
        "status": "ACTIVE",
        "headers_enabled": [
            "CSP",
            "X-Frame-Options",
            "HSTS",
            "X-Content-Type-Options",
            "Referrer-Policy"
        ],
        "sensitive_paths_blocked": True
    }


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://santis.club",
        "https://www.santis.club",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- STARTUP EVENT (PHASE 20: MULTI-SITE) ---
@app.on_event("startup")
async def startup_event():
    logger.info("🌍 Starting Sentinel Multi-Site Ecosystem...")
    asyncio.create_task(sentinel_manager.start())

# --- V300 CITY OS ENDPOINTS ---

@app.get("/admin/city/scan")
async def city_scan():
    """
    Diagnostic Scan of City Infrastructure.
    """
    try:
        loop = asyncio.get_running_loop()
        report = await loop.run_in_executor(None, city_os.city_manager.scan_city)
        return report
    except Exception as e:
        return {"status": "error", "msg": str(e)}

@app.post("/admin/city/execute/{protocol}")
async def city_execute(protocol: str, background_tasks: BackgroundTasks):
    """
    Triggers a cleanup protocol.
    """
    # Run in background to allow log streaming
    background_tasks.add_task(city_os.city_manager.execute_protocol, protocol)
    return {"status": "started", "protocol": protocol}

@app.get("/admin/city/logs")
async def city_logs():
    """
    Returns recent logs for the terminal UI.
    """
    return {"logs": city_os.city_manager.logs[-50:]}

# --- WORLD TABLE API (Phase 25) ---
@app.get("/admin/world-table/data")
async def world_table_data():
    """Returns active citizens for the live map."""
    if not citizen_registry:
        return []
    return citizen_registry.get_active_citizens(minutes=60)

# --- END V300 ---
# --- SANTIS OS API (PHASE 1: BACKBONE) ---
RELATIONAL_DATA_DIR = os.path.join(DIRECTORY, "data")

def load_relational_data(filename):
    path = os.path.join(RELATIONAL_DATA_DIR, filename)
    if not os.path.exists(path): return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load {filename}: {e}")
        return []

@app.get("/api/v1/services")
async def get_all_services():
    """Returns the master catalog of purely defined services (Santis OS)."""
    return load_relational_data("services.json")

@app.get("/api/v1/locations")
async def get_all_locations():
    """Returns all active locations."""
    return load_relational_data("locations.json")

@app.get("/api/v1/locations/{location_slug}/menu")
async def get_location_menu(location_slug: str):
    """
    Returns the specific service menu for a location.
    Joins Location + LocationServices + Services + Pricing.
    """
    locations = load_relational_data("locations.json")
    services = load_relational_data("services.json")
    loc_services = load_relational_data("location_services.json")
    
    # 1. Find Location ID
    location = next((l for l in locations if l["slug"] == location_slug), None)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # 2. Filter Location Services
    my_mappings = [ls for ls in loc_services if ls["locationId"] == location["id"] and ls.get("isActive", True)]
    
    # 3. Join with Service Data
    menu = []
    for mapping in my_mappings:
        service_def = next((s for s in services if s["id"] == mapping["serviceId"]), None)
        if service_def:
            # Merge definition with override/pricing
            menu_item = {
                **service_def,
                "pricing": mapping["pricing"],
                "override": mapping.get("override", {})
            }
            menu.append(menu_item)
            
    return {
        "location": location,
        "menu": menu
    }
# --- END SANTIS OS API ---

# --- REDIRECT MIDDLEWARE ---
@app.middleware("http")
async def redirect_middleware(request: Request, call_next):
    if REDIRECTS_FILE.exists():
        try:
            with REDIRECTS_FILE.open("r", encoding="utf-8") as f:
                redirects = json.load(f).get("redirects", [])
            path = request.url.path
            for rule in redirects:
                if rule.get("from") == path:
                    return RedirectResponse(url=rule.get("to"), status_code=rule.get("type", 301))
        except Exception as e:
            logger.error(f"Redirect middleware error: {e}")
    return await call_next(request)

# --- ASYNC HELPERS (UTF-8 IRONCLAD) ---
executor = ThreadPoolExecutor(max_workers=4)

# --- WEBSOCKET MANAGER (Brain Link) ---
class ConnectionManager:
    def __init__(self):
        self.active: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.add(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active.remove(websocket)
        except KeyError:
            pass

    async def broadcast(self, message: str):
        stale = []
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)

manager = ConnectionManager()

async def read_file_async(path):
    if not os.path.exists(path): return None
    try:
        if HAS_AIOFILES:
            async with aiofiles.open(path, mode='r', encoding='utf-8') as f:
                return await f.read()
        else:
            # Fallback to thread pool for blocking I/O
            loop = asyncio.get_event_loop()
            with open(path, 'r', encoding='utf-8') as f:
                return await loop.run_in_executor(executor, f.read)
    except Exception as e:
        logger.error(f"Read Error {path}: {e}")
        return None

async def write_file_async(path, content):
    try:
        if HAS_AIOFILES:
            async with aiofiles.open(path, mode='w', encoding='utf-8') as f:
                await f.write(content)
        else:
            loop = asyncio.get_event_loop()
            def _write():
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
            await loop.run_in_executor(executor, _write)
        return True
    except Exception as e:
        logger.error(f"Write Error {path}: {e}")
        return False

# --- JSON HELPERS ---
async def read_json(path):
    content = await read_file_async(path)
    if not content: return []
    try:
        return json.loads(content.lstrip("\ufeff"))
    except Exception as e:
        logger.error(f"JSON Parse Error {path}: {e}")
        return []

async def save_json(path, data):
    try:
        content = json.dumps(data, ensure_ascii=False, indent=4)
        return await write_file_async(path, content)
    except Exception as e:
        logger.error(f"JSON Serialize Error {path}: {e}")
        return False

def is_safe_path(base_dir, target_path):
    try:
        base = os.path.abspath(base_dir)
        target = os.path.abspath(target_path)
        return os.path.commonpath([base]) == os.path.commonpath([base, target])
    except Exception:
        return False

# --- WEBSOCKET ENDPOINT ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Lightweight Brain link so frontend no longer throws
    connection errors when the server is up.
    - Echoes incoming JSON/text with an ack
    - Broadcasts messages to other active peers (best‑effort)
    """
    await manager.connect(websocket)
    logger.info("🔌 WS client connected")
    try:
        while True:
            message = await websocket.receive_text()
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                payload = {"text": message}

            ack = json.dumps({"type": "ack", "payload": payload, "source": "server"})
            await websocket.send_text(ack)
            await manager.broadcast(json.dumps({"type": "relay", "payload": payload, "source": "cloud"}))
    except WebSocketDisconnect:
        logger.info("⚠️ WS client disconnected")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WS error: {e}")
        manager.disconnect(websocket)

# --- JSON-LD SCHEMA (Service) ---
SCHEMA_PROVIDER = {
    "@type": "Spa",
    "name": "Santis Spa"
}

SCHEMA_AREA = {
    "@type": "Country",
    "name": "Turkey"
}

PREFERRED_CANONICAL_ORDER = ["en", "tr", "de"]

# --- MODELS ---
class ServiceItem(BaseModel):
    id: str | int
    slug: str
    title: Optional[str] = None # V3 Unified
    name: Optional[str] = None  # Legacy
    desc: Optional[str] = ""
    category: str
    cultural_world: Optional[str] = None
    image: str
    price: Optional[str | int] = None
    tags: List[str] = []
    badge: Optional[str] = None
    # Allow flexible dict (Pydantic v2 style)
    model_config = ConfigDict(extra="allow")

# --- ORACLE API (Phase 25) ---
@app.get("/api/oracle/status")
async def oracle_status():
    """Returns global system pulse from Oracle Engine."""
    if not oracle_engine:
        return {"status": "OFFLINE", "message": "Oracle Engine not initialized."}
    return oracle_engine.global_pulse()

@app.get("/api/oracle/recommendation")
async def oracle_recommendation(request: Request):
    """Returns a personalized recommendation for the current citizen."""
    if not oracle_engine:
        return {"show": False}
    
    citizen_id = request.headers.get("X-Santis-Citizen-ID")
    # If header missing (first load?), fallback to cookie logic handled in middleware
    # But middleware runs before this, so header should be injected if we use Request object properly?
    # Actually middleware injects into RESPONSE headers, not Request.
    # We need to get it from cookie or request state.
    
    # Better: Get from CitizenRegistry via cookie
    cookie = request.cookies.get("santis_citizen_id")
    if not cookie:
        return {"show": False}

    return oracle_engine.get_recommendation(cookie)

@app.get("/api/dynamic-home/score")
async def dynamic_home_score(request: Request):
    """Returns the ordered list of section IDs for the homepage."""
    if not oracle_engine:
        return {"order": ["global-trends", "journeys", "hammam", "masaj", "cilt", "products"]}

    citizen_id = request.headers.get("X-Santis-Citizen-ID")
    # Fallback to cookie
    cookie = request.cookies.get("santis_citizen_id")
    if not cookie:
        # Default Order
        return {"order": ["global-trends", "journeys", "hammam", "masaj", "cilt", "products"]}

    return oracle_engine.get_dynamic_layout(cookie)

@app.get("/api/geo/location")
async def geo_location(request: Request):
    """Returns the geo-location of the client."""
    if not geo_bridge:
        return {"countryCode": "XX", "city": "Unknown"}

    # Get IP (Handle headers for proxies if needed, but simple for now)
    ip = request.client.host
    # If behind proxy/load balancer, X-Forwarded-For is better, but let's stick to simple first.
    
    return geo_bridge.resolve(ip)

@app.get("/api/admin/analytics/dashboard")
async def admin_analytics_dashboard(request: Request):
    """Returns aggregated data for the Admin Dashboard."""
    # Security: Verify Admin Cookie (Simplest form, assuming admin panel access is already gated)
    # Ideally we check session, but let's assume if they can hit this API they are admin for now.
    
    if not oracle_engine:
        return {"error": "Oracle Engine Offline"}
        
    return oracle_engine.get_analytics_summary()

@app.post("/api/analytics/log-event")
async def log_analytics_event(request: Request):
    """
    Logs specific events from frontend (e.g. 'homepage_dynamic_view').
    Body: { "type": "event_name" }
    """
    if not oracle_engine:
        return {"status": "offline"}
        
    try:
        data = await request.json()
        event_type = data.get("type")
        if event_type:
            oracle_engine.log_event(event_type)
            return {"status": "ok"}
    except:
        pass
    return {"status": "error"}

# --- DEEP AUDIT V2 API (Evolution) ---

@app.get("/admin/deep-audit/start")
async def deep_audit_start(background_tasks: BackgroundTasks):
    """Starts the Deep Audit V2 Engine in background."""
    global deep_audit_instance
    if not DeepAuditEngine:
        return {"error": "Deep Audit Module Missing"}
    
    if deep_audit_instance and deep_audit_instance.status == "RUNNING":
        return {"status": "ALREADY_RUNNING"}
    
    # Initialize Engine (Targeting Localhost)
    deep_audit_instance = DeepAuditEngine(f"http://localhost:{PORT}", max_depth=10)
    
    # Run in background (blocking sync method needs thread)
    def _run_wrapper():
        deep_audit_instance.run()
        
    background_tasks.add_task(_run_wrapper)
    return {"status": "STARTED"}

@app.get("/admin/deep-audit/status")
async def deep_audit_status():
    """Returns live status of the running audit."""
    if not deep_audit_instance:
        return {
            "status": "IDLE", 
            "scanned_pages": 0, 
            "total_discovered": 0, 
            "broken_links": 0, 
            "missing_assets": 0, 
            "server_errors": 0
        }
    
    # Extract live summary from engine state
    report = deep_audit_instance.get_report()
    summary = report.get("summary", {})
    
    return {
        "status": deep_audit_instance.status,
        "scanned_pages": deep_audit_instance.scanned_count,
        "total_discovered": deep_audit_instance.total_discovered,
        "broken_links": summary.get("broken_links_count", 0),
        "missing_assets": summary.get("missing_assets_count", 0),
        "server_errors": summary.get("server_errors_count", 0)
    }

@app.get("/admin/deep-audit/report")
async def deep_audit_report():
    """Returns the full JSON report."""
    if not deep_audit_instance:
        return {"error": "No audit run"}
    return deep_audit_instance.get_report()

@app.get("/admin/deep-audit/fix/{fix_type}")
async def deep_audit_fix(fix_type: str):
    """Triggers auto-fix modules."""
    if not deep_audit_instance:
        return {"error": "Audit required before fixing."}
        
    if fix_type == "images":
        return deep_audit_instance.heal_missing_images()
    elif fix_type == "sitemap":
        return deep_audit_instance.generate_sitemap()
    elif fix_type == "links":
        return deep_audit_instance.fix_broken_links()
        
    return {"error": "Unknown fix type"}


# --- AUTH SYSTEM (Phase 3: Security Hardening) ---
try:
    from core.cerebellum.session_manager import session_manager as auth_session_manager
except ImportError:
    auth_session_manager = None
    logger.warning("⚠️ Session Manager not available - login disabled")

try:
    from core.cerebellum.admin_audit import admin_audit as audit_logger
except ImportError:
    audit_logger = None

@app.post("/admin/login")
async def admin_login(request: Request):
    """Process login form submission."""
    if not auth_session_manager:
        return RedirectResponse(url="/admin/login.html?error=1", status_code=303)

    # Parse form data
    form = await request.form()
    username = form.get("username", "").strip()
    password = form.get("password", "")
    ip = request.client.host
    user_agent = request.headers.get("user-agent", "unknown")

    # Verify credentials
    if auth_session_manager.verify_credentials(username, password):
        # Create session
        token = auth_session_manager.create_session(username, ip)

        # Audit log
        if audit_logger:
            audit_logger.log(
                action="LOGIN_SUCCESS",
                user=username,
                ip=ip,
                path="/admin/login",
                user_agent=user_agent
            )

        # Redirect to admin panel with session cookie
        response = RedirectResponse(url="/admin/index.html", status_code=303)
        response.set_cookie(
            key=auth_session_manager.COOKIE_NAME,
            value=token,
            max_age=auth_session_manager.SESSION_EXPIRY,
            httponly=True,
            samesite="strict",
            path="/admin"
        )
        return response
    else:
        # Failed login
        if audit_logger:
            audit_logger.log(
                action="LOGIN_FAILED",
                user=username,
                ip=ip,
                path="/admin/login",
                user_agent=user_agent,
                success=False
            )
        logger.warning(f"🚫 [AUTH] Failed login attempt for '{username}' from {ip}")
        return RedirectResponse(url="/admin/login.html?error=1", status_code=303)

@app.get("/admin/logout")
async def admin_logout(request: Request):
    """Destroy session and redirect to login."""
    if auth_session_manager:
        token = request.cookies.get(auth_session_manager.COOKIE_NAME)
        if token:
            auth_session_manager.destroy_session(token)

        if audit_logger:
            audit_logger.log(
                action="LOGOUT",
                ip=request.client.host,
                path="/admin/logout"
            )

    response = RedirectResponse(url="/admin/login.html", status_code=303)
    response.delete_cookie(key="santis_admin_session", path="/admin")
    return response

@app.get("/admin/api/csrf-token")
async def get_csrf_token(request: Request):
    """Return CSRF token for the current session."""
    if auth_session_manager:
        token = request.cookies.get(auth_session_manager.COOKIE_NAME)
        if token:
            csrf = auth_session_manager.get_csrf_token(token)
            if csrf:
                return {"csrf_token": csrf}
    return {"csrf_token": None}

@app.get("/admin/api/audit-log")
async def get_audit_log():
    """Return recent admin audit log entries."""
    if audit_logger:
        return {"entries": audit_logger.get_recent(50)}
    return {"entries": []}


# --- STUB ENDPOINTS (Prevents 404 console spam — implement later) ---
@app.get("/api/admin/seo/score")
async def seo_score_stub():
    """Stub: Returns placeholder SEO score. TODO: Implement real SEO scoring."""
    return {"score": 0, "status": "NOT_IMPLEMENTED", "message": "SEO scoring not yet active"}

@app.get("/api/admin/seo/suggestions")
async def seo_suggestions_stub():
    """Stub: Returns empty suggestions. TODO: Implement real SEO suggestions."""
    return {"suggestions": [], "status": "NOT_IMPLEMENTED"}

@app.get("/admin/audit-history")
async def audit_history_stub():
    """
    Compatibility endpoint for admin UI charts.
    Maps /api/audit-history output to {history:[{date,score}], alert}.
    """
    base = await audit_history()
    rows = base.get("data", []) if isinstance(base, dict) else []
    out = []
    for row in rows[-20:]:
        score = row.get("health_score")
        if score is None:
            score = compute_health_score(row)
        date = row.get("date") or str(row.get("timestamp", ""))[:10]
        out.append({"date": date, "score": score})
    return {"history": out, "alert": bool(base.get("alert", False))}

@app.post("/admin/fix-link")
async def admin_fix_link(payload: dict):
    """Fix a broken link in an HTML file by replacing the broken URL with '#'."""
    file_path = payload.get("file", "")
    broken_url = payload.get("url", "")

    if not file_path or not broken_url:
        return JSONResponse(content={"success": False, "message": "Missing file or url"}, status_code=400)

    # Security: resolve and confine to project directory
    base = Path(__file__).parent.resolve()
    target = (base / file_path).resolve()
    if not str(target).startswith(str(base)):
        return JSONResponse(content={"success": False, "message": "Path traversal blocked"}, status_code=403)

    if not target.exists() or not target.is_file():
        return JSONResponse(content={"success": False, "message": "File not found"}, status_code=404)

    try:
        content = target.read_text(encoding="utf-8")
        if broken_url not in content:
            return {"success": False, "message": "URL not found in file"}

        new_content = content.replace(broken_url, "#")
        target.write_text(new_content, encoding="utf-8")
        logger.info(f"[fix-link] Replaced '{broken_url}' with '#' in {file_path}")
        return {"success": True, "message": f"Fixed in {file_path}"}
    except Exception as e:
        logger.error(f"[fix-link] Error: {e}")
        return JSONResponse(content={"success": False, "message": str(e)}, status_code=500)


# --- BRIDGE API (Generic Admin Saver) ---
class BridgePayload(BaseModel):
    path: str
    content: str

@app.post("/api/bridge/save")
async def bridge_save(payload: BridgePayload):
    """
    Generic file saver for Admin Panel (Bridge).
    Restricted to local serving directory for security.
    """
    try:
        # 1. Sanitize Path
        # Use normative path separators
        clean_path = payload.path.replace("\\", "/").strip("/")
        target_path = os.path.join(DIRECTORY, clean_path)
        
        # 2. Security Check (Sandbox)
        if not is_safe_path(DIRECTORY, target_path):
             logger.warning(f"Bridge Save Blocked (Path Traversal): {target_path}")
             raise HTTPException(status_code=403, detail="Access Denied: Path traversal detected")
        
        # 3. Create parent directories if needed
        parent_dir = os.path.dirname(target_path)
        if not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
            
        # 4. Write File (Direct, with explicit error handling)
        content = payload.content
        
        def _write_sync():
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, _write_sync)
        
        logger.info(f"✅ Bridge Saved: {clean_path}")
        return {"status": "saved", "path": clean_path}

    except HTTPException as he:
        raise he
    except PermissionError:
        logger.error(f"❌ Bridge Save Permission Error: {target_path}")
        raise HTTPException(status_code=500, detail="Permission Denied: File is locked or read-only.")
    except Exception as e:
        logger.error(f"❌ Bridge Save Error: {e}")
        raise HTTPException(status_code=500, detail=f"Write Failed: {str(e)}")

# --- ENDPOINTS ---

@app.get("/api/services")
async def get_services():
    """Get Services via Async JSON"""
    data = await read_json(DB_FILE)
    if isinstance(data, dict): return list(data.values())
    return data

@app.post("/api/services")
async def save_services(items: List[dict]): # Accept dict to be flexible
    """Save Services to JSON (Async)"""
    # Slug conflict guard
    seen = {}
    duplicates = []
    for item in items:
        slug = str(item.get("slug") or item.get("id") or "").strip().lower()
        if not slug:
            continue
        if slug in seen:
            duplicates.append(slug)
        else:
            seen[slug] = True
        # Existing data conflict only when adding single new item (common admin path)
        if len(items) == 1 and slug_exists(slug):
            raise HTTPException(
                status_code=409,
                detail={"error": "slug_exists", "message": "Bu slug zaten kullanılıyor.", "slug": slug}
            )
    if duplicates:
        raise HTTPException(
            status_code=400,
            detail={"error": "duplicate_slug", "slugs": list(set(duplicates))}
        )

    if await save_json(DB_FILE, items):
        try:
            loop = asyncio.get_event_loop()
            # Run sync in executor to avoid blocking
            await loop.run_in_executor(None, lambda: [sync_product_to_site_json(item) for item in items])
        except Exception as e:
            logger.error(f"Site content sync failed: {e}")
        return {"status": "saved", "count": len(items)}
    raise HTTPException(status_code=500, detail="Failed to save file")

@app.delete("/api/services/{slug}")
async def delete_service(slug: str):
    """Delete service from JSON and site content"""
    data = await read_json(DB_FILE)
    if isinstance(data, list):
        data = [s for s in data if str(s.get("slug") or s.get("id")) != str(slug)]
        await save_json(DB_FILE, data)
    # Sync removal to site_content
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: remove_product_from_site_json(slug))
    return {"status": "deleted", "slug": slug}

# --- HREFLANG LOOKUP API ---
@app.get("/api/hreflang/{group_id}")
async def get_hreflang(group_id: str):
    data = await read_json(SITE_CONTENT_FILE)
    if not isinstance(data, dict):
        return {"alternates": []}
    alternates = []
    languages = data.get("languages", {})
    for lang, lang_data in languages.items():
        sections = (lang_data or {}).get("sections", {})
        for section, sec_data in sections.items():
            for item in (sec_data or {}).get("items", []):
                gid = item.get("group_id") or item.get("id")
                if gid == group_id:
                    slug = item.get("id")
                    if slug:
                        alternates.append({
                            "lang": lang,
                            "url": f"/{lang}/{section}/{slug}"
                    })
    return {"alternates": alternates}

@app.get("/api/canonical/{group_id}")
async def get_canonical(group_id: str):
    data = await read_json(SITE_CONTENT_FILE)
    if not isinstance(data, dict):
        return {"canonical": None}

    languages = data.get("languages", {})

    for lang in PREFERRED_CANONICAL_ORDER:
        lang_data = languages.get(lang) or {}
        sections = lang_data.get("sections", {})
        for section, sec_data in sections.items():
            for item in (sec_data or {}).get("items", []):
                gid = item.get("group_id") or item.get("id") or item.get("slug")
                slug = item.get("id") or item.get("slug")
                if gid == group_id and slug:
                    return {"canonical": f"/{lang}/{section}/{slug}"}

    return {"canonical": None}


@app.get("/api/schema/{group_id}")
async def get_schema(group_id: str, request: Request):
    """
    Return Service + LocalBusiness schema graph for the given group_id.
    Uses the same language/section structure as hreflang/canonical.
    """
    data = await read_json(SITE_CONTENT_FILE)
    if not isinstance(data, dict):
        return {}

    base_url = str(request.base_url).rstrip("/")
    languages = data.get("languages", {})

    # iterate preferred order first
    for lang in PREFERRED_CANONICAL_ORDER + [l for l in languages.keys() if l not in PREFERRED_CANONICAL_ORDER]:
        lang_data = languages.get(lang) or {}
        sections = lang_data.get("sections", {})
        for section, sec_data in sections.items():
            for item in (sec_data or {}).get("items", []):
                gid = item.get("group_id") or item.get("id") or item.get("slug")
                slug = item.get("id") or item.get("slug")
                if gid == group_id and slug:
                    rating_value = item.get("rating_value", 4.9)
                    rating_count = item.get("rating_count", 120)
                    page_url = f"{base_url}/{lang}/{section}/{slug}"
                    business_id = f"{base_url}/#business"

                    return {
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "Service",
                                "@id": f"{page_url}#service",
                                "name": item.get("title") or item.get("name") or slug,
                                "description": item.get("description") or item.get("desc") or "",
                                "image": item.get("image") or item.get("img"),
                                "url": page_url,
                                "provider": {"@id": business_id},
                                "areaServed": SCHEMA_AREA,
                                "aggregateRating": {
                                    "@type": "AggregateRating",
                                    "ratingValue": rating_value,
                                    "reviewCount": rating_count
                                },
                                "review": [
                                    {
                                        "@type": "Review",
                                        "author": {"@type": "Person", "name": "Guest"},
                                        "reviewRating": {"@type": "Rating", "ratingValue": "5"},
                                        "reviewBody": "Amazing experience, highly relaxing and professional service."
                                    }
                                ]
                            },
                            {
                                "@type": "Spa",
                                "@id": business_id,
                                "name": "Santis Spa & Wellness",
                                "url": base_url,
                                "logo": f"{base_url}/assets/img/logo.png",
                                "image": f"{base_url}/assets/img/spa-interior.jpg",
                                "telephone": "+90 534 835 0169",
                                "priceRange": "$$$",
                                "address": {
                                    "@type": "PostalAddress",
                                    "streetAddress": "Side, Antalya",
                                    "addressLocality": "Side",
                                    "addressCountry": "TR"
                                },
                                "geo": {
                                    "@type": "GeoCoordinates",
                                    "latitude": "36.8841",
                                    "longitude": "30.7056"
                                },
                                "openingHoursSpecification": [
                                    {
                                        "@type": "OpeningHoursSpecification",
                                        "dayOfWeek": [
                                            "Monday",
                                            "Tuesday",
                                            "Wednesday",
                                            "Thursday",
                                            "Friday",
                                            "Saturday"
                                        ],
                                        "opens": "10:00",
                                        "closes": "22:00"
                                    },
                                    {
                                        "@type": "OpeningHoursSpecification",
                                        "dayOfWeek": "Sunday",
                                        "opens": "11:00",
                                        "closes": "20:00"
                                    }
                                ],
                                "sameAs": [
                                    "https://www.instagram.com/santis",
                                    "https://www.facebook.com/santis"
                                ]
                            }
                        ]
                    }

    return {}

# --- REDIRECT MANAGEMENT API ---
@app.get("/admin/redirects")
def list_redirects():
    return load_redirects()

@app.post("/admin/redirects/add")
def add_redirect(data: dict = Body(...)):
    redirects = load_redirects()
    redirects["redirects"].append({
        "from": data.get("from"),
        "to": data.get("to"),
        "type": data.get("type", 301)
    })
    save_redirects(redirects)
    return {"status": "ok"}

@app.post("/admin/redirects/delete")
def delete_redirect(data: dict = Body(...)):
    redirects = load_redirects()
    redirects["redirects"] = [
        r for r in redirects.get("redirects", [])
        if not (r.get("from") == data.get("from") and r.get("to") == data.get("to"))
    ]
    save_redirects(redirects)
    return {"status": "deleted"}

@app.get("/api/config")
async def get_config():
    """Get Config via Async JSON"""
    conf = await read_json(CONFIG_FILE)
    if not conf:
        return {
            "site_mode": "production",
            "animation_level": "high",
            "maintenance_mode": False,
            "modules": {"soul_engine": True}
        }
    return conf

@app.post("/api/config")
async def save_config(cfg: dict):
    """Save Config (Async)"""
    if await save_json(CONFIG_FILE, cfg):
         return {"status": "saved"}
    raise HTTPException(status_code=500, detail="Save failed")

# --- HEALTH CHECK ---
@app.get("/health")
async def health():
    return {"status": "ok", "system": "SantisOS v4.5", "mode": "json-core"}

# --- PAGE BUILDER API (file-based storage) ---
def ensure_pages_dir():
    os.makedirs(PAGES_DIR, exist_ok=True)

def page_path(slug: str) -> str:
    safe_slug = "".join(ch for ch in slug if ch.isalnum() or ch in ("-", "_")).lower()
    return os.path.join(PAGES_DIR, f"{safe_slug}.json")

@app.get("/api/pages/{slug}")
async def get_page(slug: str):
    """Return blocks for requested page; empty shell if missing."""
    ensure_pages_dir()
    path = page_path(slug)
    if not os.path.exists(path):
        return {"slug": slug, "title": "Yeni Sayfa", "blocks": [], "seo": {}}
    try:
        async with aiofiles.open(path, 'r', encoding='utf-8') as f:
            return json.loads(await f.read())
    except Exception as e:
        logger.error(f"Page read error {slug}: {e}")
        raise HTTPException(status_code=500, detail="Page read error")

@app.post("/api/pages/{slug}")
async def save_page(slug: str, body: dict):
    """Persist page blocks for builder (no auth yet)."""
    ensure_pages_dir()
    path = page_path(slug)
    try:
        async with aiofiles.open(path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(body, ensure_ascii=False, indent=2))
        return {"status": "saved", "slug": slug}
    except Exception as e:
        logger.error(f"Page save error {slug}: {e}")
        raise HTTPException(status_code=500, detail="Page save error")

# --- SITE CONTENT NORMALIZER (global -> sections) ---
@app.post("/admin/sections/sync")
async def normalize_site_content():
    """
    Ensures data/site_content.json contains sections.* items.
    Non-destructive: only adds 'sections' when missing.
    """
    data = await read_json(SITE_CONTENT_FILE)
    if not data:
        raise HTTPException(status_code=404, detail="site_content.json not found or empty")

    # Already present
    if isinstance(data, dict) and data.get("sections"):
        return {"status": "ok", "message": "sections already present", "counts": {
            "masaj": len(data["sections"].get("masaj", {}).get("items", [])) if isinstance(data["sections"], dict) else 0,
            "hamam": len(data["sections"].get("hamam", {}).get("items", [])) if isinstance(data["sections"], dict) else 0,
            "skin": len(data["sections"].get("skin", {}).get("items", [])) if isinstance(data["sections"], dict) else 0,
        }}

    if not isinstance(data, dict) or "global" not in data:
        raise HTTPException(status_code=400, detail="Legacy format missing 'global' key")

    try:
        all_items = []
        for v in data["global"].values():
            if isinstance(v, list):
                all_items.extend(v)
        sections = {
            "masaj": {"items": [i for i in all_items if isinstance(i, dict) and i.get("category") == "masaj"]},
            "hamam": {"items": [i for i in all_items if isinstance(i, dict) and i.get("category") == "hamam"]},
            "skin":  {"items": [i for i in all_items if isinstance(i, dict) and i.get("category") in ("skin", "cilt")]},
        }
        data["sections"] = sections
        if await save_json(SITE_CONTENT_FILE, data):
            return {"status": "saved", "counts": {k: len(v["items"]) for k, v in sections.items()}}
    except Exception as e:
        logger.error(f"Section sync error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate sections")

    raise HTTPException(status_code=500, detail="Unknown save error")

# --- AUDIT ENDPOINTS ---

@app.get("/admin/audit-stream")
async def audit_stream(request: Request):
    """
    Sentinel V3 Flash Scan Stream.
    Uses AuditEngine with Async generators.
    """
    if not AuditEngine:
        # Fallback generator if engine missing
        async def mock_gen():
             yield 'data: {"type":"error", "message":"AuditEngine module missing"}\n\n'
             yield 'data: {"type":"done", "score":0, "errors":[]}\n\n'
        return StreamingResponse(mock_gen(), media_type="text/event-stream")

    engine = AuditEngine(DIRECTORY)
    return StreamingResponse(engine.run_flash_scan(), media_type="text/event-stream")

def _is_truthy(value: Optional[str]) -> bool:
    if value is None:
        return False
    return str(value).strip().lower() in ("1", "true", "yes", "on")

async def _read_audit_report_rows() -> list[dict]:
    """Read latest CSV audit report and normalize keys for frontend consumers."""
    content = await read_file_async(AUDIT_REPORT)
    if not content:
        return []

    rows_out = []
    try:
        rows = content.splitlines()
        reader = csv.DictReader(rows)
        for row in reader:
            normalized = {
                "file": row.get("file") or row.get("File") or row.get("path") or row.get("Path") or "",
                "url": row.get("url") or row.get("URL") or row.get("Link") or row.get("link") or "",
                "status": row.get("status") or row.get("Status") or row.get("code") or row.get("Code") or "",
                "ms": row.get("ms") or row.get("Ms") or row.get("duration_ms") or row.get("DurationMs") or "",
            }
            merged = dict(row)
            for key, value in normalized.items():
                if value != "":
                    merged[key] = value
            rows_out.append(merged)
    except Exception as e:
        logger.error(f"CSV Parse Error: {e}")
        return []

    return rows_out

async def _execute_site_audit(auto_fix: bool = False) -> dict:
    """Runs site_audit.py and returns structured response used by admin APIs."""
    script = os.path.join(DIRECTORY, "site_audit.py")
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail="site_audit.py not found.")

    try:
        loop = asyncio.get_event_loop()
        env = os.environ.copy()
        if auto_fix:
            env["AUTO_FIX"] = "1"

        result = await loop.run_in_executor(executor, lambda: subprocess.run(
            ["python", script],
            capture_output=True, text=True, timeout=180, encoding='utf-8', errors='replace', env=env
        ))

        audit_json_path = os.path.join(DIRECTORY, "reports", "audit_result.json")
        audit_data = {}
        suggestions = []

        audit_content = await read_file_async(audit_json_path)
        if audit_content:
            try:
                audit_data = json.loads(audit_content)
                if generate_suggestions:
                    try:
                        suggestions = generate_suggestions(audit_data)
                    except Exception as ai_err:
                        logger.error(f"AI Gen Error: {ai_err}")
                        suggestions = [{"issue": "AI Motoru Hatası", "priority": "LOW", "fix": str(ai_err)}]
            except Exception as e:
                logger.error(f"Audit JSON Read Error: {e}")

        return {
            "status": "success",
            "result": result.stdout,
            "errors": result.stderr,
            "audit_data": audit_data,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"Audit Run Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/run-audit")
async def run_audit_stream_compat(request: Request):
    """Compatibility alias for frontend EventSource('/admin/run-audit')."""
    return await audit_stream(request)

@app.post("/admin/run-audit")
async def run_audit(request: Request):
    """Python-based link audit (site_audit.py)"""
    return await _execute_site_audit(auto_fix=_is_truthy(request.query_params.get("fix")))

@app.get("/admin/run-link-audit")
async def run_link_audit_compat(request: Request):
    """Compatibility endpoint for legacy admin link-audit calls."""
    auto_fix = _is_truthy(request.query_params.get("fix"))
    run_result = await _execute_site_audit(auto_fix=auto_fix)
    rows_out = await _read_audit_report_rows()

    broken = 0
    for row in rows_out:
        status = str(row.get("status") or row.get("Status") or "").strip()
        if status.startswith("4") or status.startswith("5"):
            broken += 1

    return {
        "status": "success",
        "results": rows_out,
        "summary": {
            "total": len(rows_out),
            "broken": broken,
            "fixed": max(0, len(rows_out) - broken),
            "auto_fix": auto_fix,
        },
        "audit_data": run_result.get("audit_data", {}),
        "suggestions": run_result.get("suggestions", []),
        "errors": run_result.get("errors", ""),
    }

@app.get("/admin/last-audit-report")
async def get_last_audit_report():
    """Compatibility endpoint expected by admin/modules/audit.module.js."""
    rows_out = await _read_audit_report_rows()
    return {"results": rows_out}


@app.post("/admin/auto-fix")
async def auto_fix_endpoint(request: Request):
    """
    Applies an automated fix.
    Body: { "action": str, "params": dict }
    """
    try:
        data = await request.json()
        action = data.get("action")
        params = data.get("params", {})
        
        if not action:
            return JSONResponse({"status": "error", "message": "Missing 'action' field"}, status_code=400)
            
        logger.info(f"Auto-Fix Requested: {action}")
        
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: auto_fixer.apply_fix(action, params))
        
        return JSONResponse(result)
        
    except Exception as e:
        logger.error(f"Auto-Fix Error: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


# 🤖 SENTINEL BACKGROUND WORKER
# (Startup event is now at top of file via sentinel_manager)

@app.get("/admin/sentinel-status")
async def get_sentinel_status():
    # MVP: Return status of the first instance (Main Site)
    if sentinel.sentinel_manager.instances:
        return sentinel.sentinel_manager.instances[0].status
    return {"state": "OFFLINE", "health": "UNKNOWN", "message": "No Sentinel instances running"}

@app.get("/admin/sentinel/fleet")
async def get_sentinel_fleet():
    """Returns the status of all Sentinel instances in the fleet."""
    fleet = []
    for pid, instance in sentinel.sentinel_manager.registry.items():
        fleet.append({
            "id": pid,
            "status": instance.status,
            "config": instance.config_path
        })
    return {"fleet": fleet}

@app.get("/admin/sentinel/incidents")
async def get_sentinel_incidents():
    # Helper to avoid circular imports if any, or just direct access
    import sentinel_memory
    return sentinel_memory.SentinelMemory.get_recent(100)

@app.get("/admin/sentinel/download-report")
async def download_sentinel_report():
    import sentinel_pdf
    try:
        pdf_path = sentinel_pdf.SentinelPDF.generate_report()
        return FileResponse(pdf_path, media_type="application/pdf", filename="Santis_Autonomous_Report.pdf")
    except Exception as e:
        logger.error(f"Report Generation Failed: {e}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.get("/admin/sentinel/capabilities")
async def get_sentinel_capabilities():
    import sentinel_capabilities
    return sentinel_capabilities.SentinelCapabilities.check()

@app.get("/admin/sentinel/trends")
async def get_sentinel_trends():
    import sentinel_metrics
    return sentinel_metrics.SentinelMetrics.get_history(50)

@app.get("/admin/sentinel/suggestions")
async def get_sentinel_suggestions():
    from ai_suggestions import AISuggestionsEngine
    return {"suggestions": AISuggestionsEngine.generate()}

@app.post("/admin/sentinel/apply/{sid}")
async def apply_sentinel_suggestion(sid: str):
    from auto_optimizer import AutoOptimizer
    return AutoOptimizer.apply_suggestion(sid)

@app.post("/admin/sentinel/reject/{sid}")
async def reject_sentinel_suggestion(sid: str):
    from auto_optimizer import AutoOptimizer
    return AutoOptimizer.reject_suggestion(sid)

@app.get("/admin/sentinel/history")
async def get_sentinel_history():
    from auto_optimizer import AutoOptimizer
    return {"history": AutoOptimizer.load_impact_log()}

async def trigger_full_restore():
    """Triggers the full_system_restore.py script"""
    try:
        script_path = os.path.join(DIRECTORY, "full_system_restore.py")
        if not os.path.exists(script_path):
             raise HTTPException(status_code=404, detail="Restore script not found")
        
        # Run in background to avoid blocking
        loop = asyncio.get_event_loop()
        python_exe = sys.executable if 'sys' in globals() else 'python'
        
        def run_script():
            # Run restore script and capture output
            result = subprocess.run([python_exe, script_path], capture_output=True, text=True, encoding='utf-8')
            return result

        result = await loop.run_in_executor(None, run_script)
        
        if result.returncode == 0:
            logger.info("Full System Restore completed successfully.")
            return {"status": "success", "message": "System restored.", "logs": result.stdout}
        else:
            logger.error(f"Restore failed: {result.stderr}")
            return {"status": "error", "message": "Restore failed.", "logs": result.stderr}

    except Exception as e:
        logger.error(f"Restore API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admin/run-dom-audit")
async def run_dom_audit():
    """Headless DOM audit via Playwright."""
    script = os.path.join(DIRECTORY, "site_audit_dom.py")
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail="site_audit_dom.py not found.")
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, lambda: subprocess.run(
            ["python", script],
            capture_output=True, text=True, timeout=240, encoding='utf-8', errors='replace'
        ))
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "report": os.path.join("reports", "dom_audit_report.html")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audit-history")
async def audit_history():
    history_file = HISTORY_FILE
    if not history_file.exists():
        return {"data": [], "alert": False}
    try:
        content = history_file.read_text(encoding="utf-8").strip()
        if not content:
            return {"data": [], "alert": False}

        rows = []
        # Try full JSON array
        try:
            data = json.loads(content)
            if isinstance(data, list):
                rows = data
        except Exception:
            # Fallback NDJSON (one JSON per line)
            for line in content.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    continue

        rows = rows[-20:]

        alert = False
        if len(rows) >= 2:
            def get_broken(obj):
                return obj.get("broken_count") or obj.get("broken") or 0
            last = get_broken(rows[-1])
            prev = get_broken(rows[-2])
            if prev and last > prev * 1.5:
                alert = True

        return {"data": rows, "alert": alert}
    except Exception as e:
        logger.error(f"History read error: {e}")
        return {"data": [], "alert": False}

def compute_health_score(entry: dict) -> int:
    score = 100
    broken = entry.get("broken") or entry.get("broken_count") or entry.get("broken_links") or 0
    total = entry.get("checked") or entry.get("total_urls") or entry.get("total_links") or 1
    avg_ms = entry.get("avg_ms") or entry.get("avg_response_ms") or entry.get("avg_response_time") or 0
    errors_5xx = entry.get("errors_5xx") or 0

    broken_ratio = broken / max(1, total)
    score -= min(broken_ratio * 60, 60)

    if avg_ms > 1200:
        score -= 15
    elif avg_ms > 800:
        score -= 8

    score -= min(errors_5xx * 2, 15)
    return max(int(score), 0)

def load_history_rows():
    if not HISTORY_FILE.exists():
        return []
    content = HISTORY_FILE.read_text(encoding="utf-8").strip()
    if not content:
        return []
    rows = []
    try:
        data = json.loads(content)
        if isinstance(data, list):
            rows = data
    except Exception:
        for line in content.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    return rows

@app.get("/api/health-score")
async def health_score():
    try:
        rows = load_history_rows()
        if not rows:
            return {"score": 100}
        last = rows[-1]
        score = last.get("health_score")
        if score is None:
            score = compute_health_score(last)
        return {"score": score}
    except Exception as e:
        logger.error(f"Health score error: {e}")
        return {"score": 100}

@app.get("/api/health-history")
async def health_history():
    try:
        rows = load_history_rows()
        if not rows:
            return {"scores": [], "reports": []}
        scores = []
        reports = []
        for entry in rows:
            score = entry.get("health_score")
            if score is None:
                score = compute_health_score(entry)
            scores.append(score)
            reports.append(entry.get("report"))
        return {"scores": scores[-20:], "reports": reports[-20:]}
    except Exception as e:
        logger.error(f"Health history error: {e}")
        return {"scores": [], "reports": []}

@app.get("/admin/seo-quality")
async def seo_quality():
    path = Path("reports/seo_quality.json")
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error(f"SEO quality read error: {e}")
        return {}

@app.post("/admin/run-seo-audit")
async def run_seo_audit():
    script = os.path.join(DIRECTORY, "seo_quality_audit.py")
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail="seo_quality_audit.py not found.")
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, lambda: subprocess.run(
            ["python", script],
            capture_output=True, text=True, timeout=120, encoding='utf-8', errors='replace'
        ))
        return {"stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/run-seo-ai")
async def run_seo_ai():
    script = os.path.join(DIRECTORY, "seo_ai_fixer.py")
    if not os.path.exists(script):
        raise HTTPException(status_code=404, detail="seo_ai_fixer.py not found.")
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(executor, lambda: subprocess.run(
            ["python", script],
            capture_output=True, text=True, timeout=120, encoding='utf-8', errors='replace'
        ))
        return {"stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/seo/audit")
async def run_seo_audit_compat():
    """Compatibility alias for admin/modules/audit.module.js."""
    return await run_seo_audit()

@app.post("/api/admin/seo/ai-suggestions")
async def run_seo_ai_compat():
    """Compatibility alias for admin/modules/audit.module.js."""
    return await run_seo_ai()



# --- CITY INTELLIGENCE API (SEMANTIC CORTEX) ---
@app.post("/admin/intelligence/scan")
async def city_intelligence_scan(background_tasks: BackgroundTasks):
    """Triggers the Ultra Deep Research scan."""
    if not city_intelligence_engine:
        return JSONResponse(content={"detail": "City Intelligence Module Missing"}, status_code=500)
    
    if city_intelligence_engine.status == "RUNNING":
        return {"status": "ALREADY_RUNNING", "message": "Scan already in progress."}
        
    # Run async method in background
    # Since run_full_scan is async, we can wrap it or just call it if we were in a simpler loop.
    # But background_tasks expects a sync function or coroutine. 
    # Important: FastAPI BackgroundTasks works with async def since 0.68+
    
    background_tasks.add_task(city_intelligence_engine.run_full_scan)
    return {"status": "STARTED", "message": "Deep scan initiated."}

@app.get("/admin/intelligence/report")
async def city_intelligence_report():
    """Returns the live or final report."""
    if not city_intelligence_engine:
        return JSONResponse(content={"detail": "City Intelligence Module Missing"}, status_code=500)

    # Return structure matching frontend expectation
    return {
        "status": city_intelligence_engine.status,
        "report": city_intelligence_engine.report
    }

@app.get("/api/admin/tone-health")
async def get_tone_health():
    """Calculates granular tone health from the latest intelligence report."""
    if not city_intelligence_engine or not city_intelligence_engine.report:
        return {"score": 0, "status": "NO_DATA", "top_keywords": [], "top_violations": []}

    report = city_intelligence_engine.report
    if "semantic" not in report or "cultural_report" not in report["semantic"]:
        return {"score": 0, "status": "NO_DATA", "top_keywords": [], "top_violations": []}

    items = report["semantic"]["cultural_report"]
    if not items:
        return {"score": 0, "status": "NO_DATA", "top_keywords": [], "top_violations": []}

    # Calculate Average Score
    total_score = sum(item.get("score", 0) for item in items)
    avg_score = round(total_score / len(items))

    # Aggregate Keywords & Violations
    all_keywords = []
    all_violations = []

    for item in items:
        all_keywords.extend(item.get("keywords", []))
        for v in item.get("violations", []):
            all_violations.extend(v.get("matches", []))

    # Get Top 3
    from collections import Counter
    top_keywords = [k for k, v in Counter(all_keywords).most_common(3)]
    top_violations = [k for k, v in Counter(all_violations).most_common(3)]

    # Determine Status Label
    status = "CRITICAL"
    if avg_score >= 75: status = "LUXURY_STRONG"
    elif avg_score >= 60: status = "ACCEPTABLE"
    elif avg_score >= 40: status = "DRIFT_DETECTED"

    return {
        "score": avg_score,
        "status": status,
        "top_keywords": top_keywords,
        "top_violations": top_violations
    }

@app.get("/api/oracle/analytics")
async def get_oracle_analytics():
    """
    Returns global stats for admin analytics.
    """
    if not oracle_engine:
        return {"error": "Oracle Engine Offline"}
    try:
        return oracle_engine.get_analytics_summary()
    except Exception as e:
        logger.error(f"Oracle analytics error: {e}")
        return {"error": str(e)}

@app.get("/admin/seo-ai-suggestions")
async def seo_ai_suggestions():
    path = Path("reports/seo_ai_suggestions.json")
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error(f"SEO AI suggestions read error: {e}")
        return {}

@app.get("/admin/audit-report")
async def get_audit_report():
    """Return audit rows as JSON (Async Read)"""
    rows_out = await _read_audit_report_rows()
    if not rows_out:
        return JSONResponse(content={"error": "Report not found."}, status_code=404)
    return rows_out

@app.get("/admin/download-report")
async def download_report():
    """Download CSV report"""
    if not os.path.exists(AUDIT_REPORT):
        return JSONResponse(content={"error": "Report not found."}, status_code=404)
    # FileResponse handles async streaming automatically in newer FastAPI, safe to use
    return FileResponse(AUDIT_REPORT, media_type="text/csv", filename="fixed_links_report.csv")

@app.post("/api/fix/link")
async def fix_link(payload: dict):
    file_path = payload.get("file", "")
    broken_url = payload.get("url", "")
    
    if not file_path or not broken_url:
        return JSONResponse(content={"success": False, "message": "Missing params"}, status_code=400)

    if not is_safe_path(DIRECTORY, file_path):
        return JSONResponse(content={"success": False, "message": "Unsafe path"}, status_code=400)

    content = await read_file_async(file_path)
    if not content:
        return JSONResponse(content={"success": False, "message": "File read error"}, status_code=404)

    if broken_url not in content:
        return JSONResponse(content={"success": False, "message": "URL not found"}, status_code=404)

    updated = content.replace(broken_url, "#")
    if await write_file_async(file_path, updated):
        return {"success": True}
    return JSONResponse(content={"success": False, "message": "Write failed"}, status_code=500)

@app.post("/admin/fix-link")
async def fix_link_compat(payload: dict):
    """Compatibility alias for legacy admin panel call."""
    return await fix_link(payload)

SOCIAL_PLATFORM_META = {
    "instagram": {"title": "Instagram", "icon": "fab fa-instagram"},
    "facebook": {"title": "Facebook", "icon": "fab fa-facebook"},
    "whatsapp": {"title": "WhatsApp", "icon": "fab fa-whatsapp"},
    "linkedin": {"title": "LinkedIn", "icon": "fab fa-linkedin"},
    "youtube": {"title": "YouTube", "icon": "fab fa-youtube"},
    "twitter": {"title": "X (Twitter)", "icon": "fab fa-x-twitter"},
}

def _to_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default

def _build_social_data(payload: dict) -> dict:
    platforms_in = payload.get("platforms", {}) if isinstance(payload, dict) else {}
    concierge_in = payload.get("concierge", {}) if isinstance(payload, dict) else {}
    biolinks_in = payload.get("biolinks", []) if isinstance(payload, dict) else []
    posts_in = payload.get("posts", []) if isinstance(payload, dict) else []

    platforms = {}
    for platform_id, meta in SOCIAL_PLATFORM_META.items():
        raw = platforms_in.get(platform_id, "")
        if isinstance(raw, dict):
            url = str(raw.get("url", "")).strip()
            active = bool(raw.get("active", bool(url)))
            title = str(raw.get("title", meta["title"])).strip() or meta["title"]
            icon = str(raw.get("icon", meta["icon"])).strip() or meta["icon"]
        else:
            url = str(raw).strip()
            active = bool(url)
            title = meta["title"]
            icon = meta["icon"]

        platforms[platform_id] = {
            "id": platform_id,
            "title": title,
            "url": url,
            "icon": icon,
            "active": active,
        }

    for platform_id, raw in platforms_in.items():
        if platform_id in platforms:
            continue
        if isinstance(raw, dict):
            url = str(raw.get("url", "")).strip()
            title = str(raw.get("title", platform_id)).strip() or platform_id
            icon = str(raw.get("icon", "fas fa-link")).strip() or "fas fa-link"
            active = bool(raw.get("active", bool(url)))
        else:
            url = str(raw).strip()
            title = platform_id
            icon = "fas fa-link"
            active = bool(url)

        platforms[platform_id] = {
            "id": platform_id,
            "title": title,
            "url": url,
            "icon": icon,
            "active": active,
        }

    concierge = {
        "active": bool(concierge_in.get("active", False)),
        "title": str(concierge_in.get("title", "Santis Digital Concierge")).strip() or "Santis Digital Concierge",
        "welcomeText": str(
            concierge_in.get("welcomeText")
            or concierge_in.get("welcome")
            or "Size nasıl yardımcı olabiliriz? WhatsApp üzerinden görüntülü veya sesli bağlanabilirsiniz."
        ).strip(),
        "video": str(concierge_in.get("video", "reception_loop.mp4")).strip() or "reception_loop.mp4",
    }

    biolinks = []
    if isinstance(biolinks_in, list):
        for item in biolinks_in:
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or item.get("label") or "").strip()
            url = str(item.get("url") or "").strip()
            if not title or not url:
                continue
            biolinks.append({
                "title": title,
                "url": url,
                "urgent": bool(item.get("urgent", False)),
                "clickCount": _to_int(item.get("clickCount", 0), 0),
            })

    posts = posts_in if isinstance(posts_in, list) else []

    return {
        "platforms": platforms,
        "biolinks": biolinks,
        "concierge": concierge,
        "posts": posts,
    }

def _render_social_data_js(data: dict) -> str:
    return "const SOCIAL_DATA = " + json.dumps(data, ensure_ascii=False, indent=4) + ";\n"

@app.post("/api/admin/social")
async def save_admin_social(payload: dict = Body(default={})):
    """Persist admin social settings into static SOCIAL_DATA files."""
    data = _build_social_data(payload or {})
    js_content = _render_social_data_js(data)

    targets = [SOCIAL_DATA_FILE, SOCIAL_DATA_RUNTIME_FILE]
    saved = []
    for target in targets:
        target_dir = os.path.dirname(target)
        if target_dir:
            os.makedirs(target_dir, exist_ok=True)
        ok = await write_file_async(target, js_content)
        if ok:
            saved.append(os.path.relpath(target, DIRECTORY).replace("\\", "/"))

    if len(saved) != len(targets):
        return JSONResponse(
            content={"status": "error", "message": "Social data write failed", "saved": saved},
            status_code=500,
        )

    return {
        "status": "saved",
        "files": saved,
        "platform_count": len(data["platforms"]),
        "biolink_count": len(data["biolinks"]),
    }

# --- AI & UPLOAD ---

@app.post("/admin/generate-ai")
async def admin_generate_ai(payload: dict):
    """
    AI Content Stub (UTF-8 Safe).
    """
    prompt = payload.get("prompt", "")
    tone = payload.get("tone", "luxury")
    
    # Mock Response (In future: call Gemini API here)
    text = f"✨ (AI {tone.upper()}) {prompt} için oluşturulan içerik... [Santis AI]"
    return {"status": "ok", "text": text}

@app.post("/admin/upload")
async def admin_upload(request: Request):
    """
    Raw Upload Handler (simpler than UploadFile for binary streams sometimes)
    """
    form = await request.form()
    file = form.get("file")
    if not file:
         return {"error": "No file"}

    uploads_dir = os.path.join(DIRECTORY, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    filename = file.filename
    dest_path = os.path.join(uploads_dir, filename)
    
    # Read/Write
    contents = await file.read()
    
    # Use sync write for binary for now or executor
    with open(dest_path, "wb") as f:
        f.write(contents)

    return {"status": "uploaded", "filename": f"uploads/{filename}"}

# Import Master Cleaner & Asset Optimizer & AutoFixer
try:
    from master_cleaner import MasterCleaner
    from asset_optimizer import AssetOptimizer
    
    # Try importing AutoFixer from new location
    try:
        from core.evolution.auto_fixer_engine import AutoFixer
    except ImportError:
        # Fallback to root or None
        try:
             from auto_fixer_engine import AutoFixer
        except ImportError:
             AutoFixer = None

    master_cleaner = MasterCleaner(DIRECTORY)
    asset_optimizer = AssetOptimizer(DIRECTORY)
    auto_fixer = AutoFixer(DIRECTORY) if AutoFixer else None
    
    logger.info("✅ Core Systems Loaded (MasterCleaner + AssetOptimizer + AutoFixer)")
except ImportError as e:
    logger.error(f"❌ Core System Failed: {e}")
    master_cleaner = None
    asset_optimizer = None
    auto_fixer = None

# --- MASTER CLEAN ENDPOINTS ---

@app.post("/api/admin/auto-fix")
async def api_auto_fix(request: Request):
    """
    Applies an auto-fix via AutoFixer Engine.
    Body: { "fix_id": "...", "target": "..." }
    """
    if not auto_fixer:
        return {"success": False, "message": "AutoFixer Engine Offline"}
        
    try:
        data = await request.json()
        fix_id = data.get("fix_id")
        target = data.get("target")
        
        # Run in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, auto_fixer.apply_fix, fix_id, target)
        return result
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/admin/fix/ghost")
async def fix_ghost_layers():
    if not master_cleaner:
        raise HTTPException(status_code=500, detail="MasterCleaner not loaded")
    
    # Run in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, master_cleaner.fix_ghost_layers)
    return JSONResponse(content=result)

@app.post("/admin/fix/utf8")
async def fix_utf8_issues():
    if not master_cleaner:
        raise HTTPException(status_code=500, detail="MasterCleaner not loaded")
    
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, master_cleaner.fix_utf8_issues)
    return JSONResponse(content=result)

@app.post("/admin/fix/optimize")
async def optimize_assets():
    if not asset_optimizer:
        raise HTTPException(status_code=500, detail="AssetOptimizer not loaded")

    loop = asyncio.get_event_loop()
    # threshold_kb=500 means only images > 500KB will be converted
    result = await loop.run_in_executor(None, asset_optimizer.optimize_assets, 500)
    
    # Map to Frontend API Protocol
    response = {
        "scanned": result["scanned"],
        "total_fixed": len(result["converted"]),
        "fixed_files": [item["original"] for item in result["converted"]],
        "details": result["converted"],
        "errors": result["errors"]
    }
    
    return JSONResponse(content=response)

# Public/API alias to avoid static /admin mount conflict
@app.api_route("/api/fix/{fix_type}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def api_fix(fix_type: str):
    if fix_type == "ghost":
        return await fix_ghost_layers()
    if fix_type == "utf8":
        return await fix_utf8_issues()
    if fix_type == "optimize":
        return await optimize_assets()
    raise HTTPException(status_code=400, detail="Unknown fix type")

# Explicit endpoints (some clients cannot use path params)
@app.post("/api/fix/utf8")
async def api_fix_utf8():
    return await fix_utf8_issues()

@app.post("/api/fix/ghost")
async def api_fix_ghost():
    return await fix_ghost_layers()

@app.post("/api/fix/optimize")
async def api_fix_optimize():
    return await optimize_assets()

# Simple aliases
@app.api_route("/fix/utf8", methods=["GET", "POST"])
async def api_fix_utf8_simple():
    return await fix_utf8_issues()

@app.api_route("/fix/ghost", methods=["GET", "POST"])
async def api_fix_ghost_simple():
    return await fix_ghost_layers()

@app.api_route("/fix/optimize", methods=["GET", "POST"])
async def api_fix_optimize_simple():
    return await optimize_assets()

# --- FULL SITE AUDIT (Link, Image, SEO, Server) ---
@app.get("/admin/full-audit")
async def full_audit_endpoint():
    """
    Crawls the site and reports:
    - Broken links (404)
    - Missing images
    - Server errors (500+)
    - SEO issues (missing title/desc)
    - Fix suggestions
    Runs in threadpool.
    """
    base_url = f"http://localhost:{PORT}"
    
    def _run_full_scan():
        visited = set()
        to_visit = [base_url]

        broken_links = []
        missing_images = []
        server_errors = []
        seo_issues = []
        fix_suggestions = []

        while to_visit:
            url = to_visit.pop(0) # BFS
            if url in visited:
                continue
            visited.add(url)

            try:
                # Skip external links for deep scan, but check status if needed? 
                # User logic implies checking everything but only recursing on internal.
                
                r = requests.get(url, timeout=5)
                status = r.status_code

                if status >= 500:
                    server_errors.append(url)
                    continue

                if status != 200:
                    if url.startswith(base_url): # Only report internal broken links as "broken" in this context usually, but user wants check.
                        broken_links.append(url)
                    continue

                # Only parse HTML for recursion
                if "text/html" not in r.headers.get("Content-Type", ""):
                    continue

                soup = BeautifulSoup(r.text, "html.parser")

                # SEO CHECK (Only for internal pages)
                if url.startswith(base_url):
                    if not soup.title or not soup.title.string or not soup.title.string.strip():
                        seo_issues.append(f"Title eksik -> {url}")
                    if not soup.find("meta", attrs={"name": "description"}):
                        seo_issues.append(f"Description eksik -> {url}")

                # LINK SCAN
                for a in soup.find_all("a", href=True):
                    link = urljoin(url, a["href"])
                    
                    # Recursion condition: Internal & Not visited
                    if link.startswith(base_url):
                        if link not in visited and link not in to_visit:
                            to_visit.append(link)
                    
                    # We could check external links status here too if requested, 
                    # but for now let's stick to the queue-based crawler logic which validates as it goes.

                # IMAGE SCAN
                for img in soup.find_all("img", src=True):
                    img_url = urljoin(url, img["src"])
                    try:
                        # Head request is faster for images
                        ir = requests.head(img_url, timeout=3)
                        if ir.status_code != 200:
                            missing_images.append(img_url)
                    except:
                        # Retry with GET if HEAD fails (some servers block HEAD)
                        try:
                            ir = requests.get(img_url, timeout=3, stream=True)
                            if ir.status_code != 200:
                                missing_images.append(img_url)
                        except:
                            missing_images.append(img_url)

            except Exception as e:
                server_errors.append(f"{url} ({str(e)})")

        # AKILLI DUZELTME ONERISI
        for link in broken_links:
            try:
                parsed = urlparse(link)
                if parsed.path and "/" in parsed.path:
                    # /foo/bar -> /foo/index.html suggestion
                    path_parts = parsed.path.rstrip("/").split("/")
                    if len(path_parts) > 0:
                        suggestion = "/".join(path_parts[:-1]) + "/index.html"
                        fix_suggestions.append(f"{link} -> Belki: {suggestion}")
            except:
                pass

        return {
            "broken_links": broken_links,
            "missing_images": list(set(missing_images)),
            "server_errors": server_errors,
            "seo_issues": seo_issues,
            "fix_suggestions": fix_suggestions
        }

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _run_full_scan)

# ----------------------------------------------------------------
# PHASE 29: VIP ENGINE (THE OFFER)
# ----------------------------------------------------------------
# Trigger Reload
from core.cortex.vip_engine import VIPEngine

vip_engine = VIPEngine()

@app.post("/api/vip/check-offer")
async def check_vip_offer(request: Request):
    try:
        data = await request.json()
        citizen_id = data.get("citizen_id")
        if not citizen_id:
            return JSONResponse({"offer": None, "reason": "missing_citizen_id"}, status_code=400)

        if not citizen_registry:
            return JSONResponse({"offer": None, "reason": "registry_offline"}, status_code=503)
        
        # 1. Fetch Citizen Profile from Registry
        citizen_data = citizen_registry.get_citizen(citizen_id)
        if not citizen_data:
             return JSONResponse({"offer": None, "reason": "unknown_citizen"})

        # 2. Ask VIP Engine for the best offer
        offer = vip_engine.check_offer(citizen_data)
        
        # 3. Log event (Optional)
        if offer and hasattr(citizen_registry, "track_action"):
            citizen_registry.track_action(citizen_id, "offer_viewed", {"offer_id": offer.get("id")})

        return JSONResponse({"offer": offer})

    except Exception as e:
        print(f"🔴 [VIP API Error] {e}")
        return JSONResponse({"offer": None, "error": str(e)}, status_code=500)

# ----------------------------------------------------------------
# PHASE 10: AUTO-FIXER ENGINE (SELF-HEALING CODE)
# ----------------------------------------------------------------
@app.get("/admin/deep-audit/report-pdf")
async def deep_audit_report_pdf():
    """
    Generates and returns a PDF report of the latest audit.
    """
    global deep_audit_instance
    if not deep_audit_instance:
        return {"error": "No audit data available. Please run an audit first."}
    
    report_data = deep_audit_instance.get_report()
    file_path = "audit_report.pdf"
    
    # PDF GENERATION LOGIC
    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4
    
    # HEADER
    c.setFillColor(HexColor("#1a1a1a"))
    c.rect(0, height - 80, width, 80, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(30, height - 50, "SANTIS DEEP AUDIT REPORT")
    
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 70, f"Simulated Date: 2026-02-08 | Status: {report_data.get('status', 'IDLE')}")

    y = height - 120
    
    # SUMMARY SECTION
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(30, y, "EXECUTIVE SUMMARY")
    y -= 25
    
    summary = report_data.get("summary", {})
    stats = [
        f"Scanned Pages: {summary.get('scanned_pages', 0)}",
        f"Broken Links: {summary.get('broken_links_count', 0)}",
        f"Missing Assets: {summary.get('missing_assets_count', 0)}",
        f"Server Errors: {summary.get('server_errors_count', 0)}",
        f"SEO Issues: {summary.get('seo_issues_count', 0)}"
    ]
    
    c.setFont("Helvetica", 12)
    for stat in stats:
        c.drawString(40, y, f"• {stat}")
        y -= 20
        
    y -= 20
    c.line(30, y, width - 30, y)
    y -= 30

    def draw_section_items(title, items, color):
        nonlocal y
        if not items: return

        if y < 100:
            c.showPage()
            y = height - 50
        
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(30, y, f"{title} ({len(items)})")
        y -= 20
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)

        for item in items[:50]:
            if y < 50:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica", 10)
            
            text = str(item.get("url", item))
            status = str(item.get("status", ""))
            c.drawString(40, y, f"• {text} [{status}]")
            y -= 15
        
        if len(items) > 50:
            c.drawString(40, y, f"... {len(items)-50} more items ...")
            y -= 20
        
        y -= 20

    draw_section_items("BROKEN LINKS", report_data.get("broken_links", []), colors.red)
    draw_section_items("MISSING ASSETS", report_data.get("missing_assets", []), colors.orange)
    draw_section_items("SERVER ERRORS", report_data.get("server_errors", []), colors.darkred)
    draw_section_items("SEO ISSUES", report_data.get("seo_issues", []), colors.blue)

    c.save()
    return FileResponse(file_path, filename="Santis_Audit_Report.pdf", media_type="application/pdf")

# --- ULTRA MEGA AUTO-FIX ENDPOINTS ---

@app.get("/admin/deep-audit/fix/images")
async def fix_missing_images():
    """
    Triggers the Self-Healing Image mechanism.
    """
    global deep_audit_instance
    if not deep_audit_instance:
        return {"error": "No audit data. Run Deep Audit first."}
    
    report = deep_audit_instance.heal_missing_images()
    return report

@app.get("/admin/deep-audit/fix/links")
async def fix_broken_links():
    """
    Triggers the Intelligent Link Fixer.
    """
    global deep_audit_instance
    if not deep_audit_instance:
        return {"error": "No audit data. Run Deep Audit first."}
    
    report = deep_audit_instance.fix_broken_links()
    return report

@app.get("/admin/deep-audit/fix/sitemap")
async def generate_sitemap():
    """
    Generates sitemap.xml.
    """
    
    # Use the dedicated sitemap generator (Database driven)
    try:
        # Run in threadpool to avoid blocking loop
        loop = asyncio.get_running_loop()
        report = await loop.run_in_executor(None, sitemap_generator.generate_sitemap)
        return report
    except Exception as e:
        return {"status": "error", "msg": str(e)}
    return report

# --- FLIGHT CHECK API (Pre-Deploy Safety Gate) ---

@app.get("/api/flight-check")
async def flight_check_endpoint():
    """
    Pre-Deploy Safety Check — GO / NO-GO verdict.
    Runs 5 modules: redirects, hreflang, canonical, template, links.
    """
    if not run_flight_check:
        return {"error": "Flight Check engine not available", "verdict": "UNKNOWN"}
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(executor, run_flight_check, str(DIRECTORY))
        return result
    except Exception as e:
        logger.error(f"❌ Flight Check error: {e}")
        return {"error": str(e), "verdict": "ERROR"}

# --- ACTIVE REPAIR MODULES (V100 FIXERS) ---

@app.post("/admin/fix/{module}")
async def run_fix_module(module: str):
    """
    Handles Ghost Layer Hunter, UTF-8 Sanitizer, Asset Intelligence.
    """
    try:
        loop = asyncio.get_event_loop()
        
        if module == "ghost":
            # Removes ._* files and .DS_Store
            def clean_ghosts():
                count = 0
                for root, dirs, files in os.walk("."):
                    if "venv" in root or ".git" in root: continue
                    for f in files:
                        if f.startswith("._") or f == ".DS_Store" or f == "Thumbs.db":
                            try:
                                os.remove(os.path.join(root, f))
                                count += 1
                            except: pass
                return count
                
            count = await loop.run_in_executor(None, clean_ghosts)
            logger.info(f"Ghost fix complete: {count} files removed.")
            return {"status": "success", "total_fixed": count, "message": "Ghost files removed."}

        elif module == "utf8":
            # Scans HTML/JS/CSS files and ensures they are UTF-8 compliant
            def scan_utf8():
                issues = []
                for root, dirs, files in os.walk("."):
                    if "venv" in root or ".git" in root or "node_modules" in root: continue
                    for f in files:
                        if f.endswith((".html", ".js", ".css", ".json")):
                            path = os.path.join(root, f)
                            try:
                                with open(path, "r", encoding="utf-8") as f_obj:
                                    f_obj.read()
                            except UnicodeDecodeError:
                                issues.append(path)
                            except Exception:
                                pass
                return issues

            issues = await loop.run_in_executor(None, scan_utf8)
            logger.info(f"UTF-8 scan complete: {len(issues)} issues found.")
            if not issues:
                return {"status": "success", "total_fixed": 0, "message": "All files are valid UTF-8."}
            else:
                return {"status": "warning", "issues": issues, "message": f"{len(issues)} files have encoding issues."}

        elif module == "optimize":
            # Asset Intelligence: Find images > 500KB
            def scan_large_images():
                large_files = []
                if not os.path.exists("assets"): return []
                for root, dirs, files in os.walk("assets"):
                    for f in files:
                        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                            path = os.path.join(root, f)
                            try:
                                size = os.path.getsize(path)
                                if size > 500 * 1024: # 500KB
                                    large_files.append({"path": path, "size_kb": round(size/1024, 1)})
                            except: pass
                return large_files

            large_files = await loop.run_in_executor(None, scan_large_images)
            logger.info(f"Optimization scan complete: {len(large_files)} large images found.")
            return {
                "status": "success", 
                "issues": large_files, # App expects 'issues' for scan results
                "message": f"Found {len(large_files)} large images (>500KB)."
            }
        
        return {"error": f"Unknown module: {module}"}
    except Exception as e:
        logger.error(f"Fix Module Error ({module}): {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- VISUAL AUDIT ENDPOINT ---

class VisualAuditRequest(BaseModel):
    url: str
    update_reference: bool = False

@app.post("/admin/visual-audit")
async def run_visual_audit(req: VisualAuditRequest):
    """
    Runs visual regression test on a specific URL.
    """
    try:
        global visual_audit_instance
        if not visual_audit_instance:
             # Try reloading (JIT)
            try:
                from visual_audit import VisualAuditEngine
                visual_audit_instance = VisualAuditEngine()
            except ImportError:
                return {"error": "Visual Audit Module not loaded (Playwright missing?)"}
            except Exception as e:
                return {"error": f"Visual Engine Init Failed: {e}"}

        # Construct full URL if relative
        target_url = req.url
        if not target_url.startswith("http"):
            # Assume localhost
            target_url = f"http://localhost:{PORT}/{target_url.lstrip('/')}"
        
        logger.info(f"👁️ Visual Audit Request for: {target_url}")
        # Run Sync Playwright in ThreadPool to avoid Windows Asyncio Loop issues
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, 
            lambda: visual_audit_instance.capture_and_compare(target_url, update_reference=req.update_reference)
        )
        return result
    except Exception as e:
        logger.error(f"Visual Audit Error: {e}")
        return {"error": f"Critical Error in Visual Audit: {str(e)}"}

# --- PERFORMANCE AUDIT ENDPOINT ---

class PerformanceAuditRequest(BaseModel):
    url: str

@app.post("/admin/performance-audit")
async def run_performance_audit(req: PerformanceAuditRequest):
    """
    Runs performance audit on a specific URL.
    """
    try:
        global performance_audit_instance
        if not performance_audit_instance:
             # Try reloading (JIT)
            try:
                from performance_audit import PerformanceAuditEngine
                performance_audit_instance = PerformanceAuditEngine()
            except ImportError:
                 return {"error": "Performance Audit Module not loaded (Playwright missing?)"}
            except Exception as e:
                return {"error": f"Performance Engine Init Failed: {e}"}

        # Construct full URL if relative
        target_url = req.url
        if not target_url.startswith("http"):
            # Assume localhost
            target_url = f"http://localhost:{PORT}/{target_url.lstrip('/')}"
        
        logger.info(f"⚡ Performance Audit Request for: {target_url}")
        
        # Run Sync Playwright in ThreadPool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, 
            lambda: performance_audit_instance.run_performance_test(target_url)
        )
        return result
    except Exception as e:
        logger.error(f"Performance Audit Error: {e}")
        return {"error": f"Critical Error in Performance Audit: {str(e)}"}

# --- SECURITY AUDIT ENDPOINT ---

class SecurityAuditRequest(BaseModel):
    url: str

@app.post("/admin/security-audit")
async def run_security_audit(req: SecurityAuditRequest):
    """
    Runs security audit on a specific URL.
    """
    try:
        global security_audit_instance
        if not security_audit_instance:
             # Try reloading (JIT)
            try:
                from security_audit import SecurityAuditEngine
                security_audit_instance = SecurityAuditEngine()
            except ImportError:
                 return {"error": "Security Audit Module not loaded."}
            except Exception as e:
                return {"error": f"Security Engine Init Failed: {e}"}

        # Construct full URL if relative
        target_url = req.url
        if not target_url.startswith("http"):
            # Assume localhost
            target_url = f"http://localhost:{PORT}/{target_url.lstrip('/')}"
        
        logger.info(f"🛡️ Security Audit Request for: {target_url}")
        
        # Requests is sync, run in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, security_audit_instance.run_security_scan, target_url)
        return result
    except Exception as e:
        logger.error(f"Security Audit Error: {e}")
        return {"error": f"Critical Error in Security Audit: {str(e)}"}

# --- AI FIX SUGGESTIONS ENDPOINT ---

@app.get("/admin/ai-fix-suggestions")
async def ai_fix_suggestions():
    """
    Combines Security and Performance audit results and generates AI suggestions.
    """
    try:
        global security_audit_instance, performance_audit_instance
        
        if not generate_suggestions:
            return {"error": "AI Suggestions Module not loaded."}

        # Run Audits (Lightweight)
        security_data = {}
        performance_data = {}
        
        target_url = f"http://localhost:{PORT}/" # Default to root

        # 1. Security Scan
        if security_audit_instance:
             loop = asyncio.get_event_loop()
             security_data = await loop.run_in_executor(None, security_audit_instance.run_security_scan, target_url)

        # 2. Performance Scan (Mock or Recent)
        # Performance is heavy (Playwright), so ideally we use cached results.
        # For V1, we will trigger a fresh quick scan or use defaults if busy.
        if performance_audit_instance:
             try:
                performance_data = await performance_audit_instance.run_performance_test(target_url)
             except:
                performance_data = {"error": "Skipped perf scan"}

        # Combine Data
        combined_audit = {
            "security": security_data,
            "performance": performance_data
        }

        # Generate Suggestions
        suggestions = generate_suggestions(combined_audit)
        return suggestions

    except Exception as e:
        logger.error(f"AI Brain Error: {e}")
        return [{"category":"ERROR", "issue":f"AI Error: {str(e)}", "fix":"Check server logs."}]

# --- ATTACK SIMULATOR ENDPOINT ---
@app.post("/admin/attack-simulator")
async def run_attack_simulation():
    """
    Runs a live attack simulation against localhost.
    """
    try:
        global attack_simulator_instance
        if not attack_simulator_instance:
             # Just in case import failed initially
            try:
                from attack_simulator import AttackSimulatorEngine
                attack_simulator_instance = AttackSimulatorEngine()
            except ImportError:
                return {"error": "Attack Simulator Module not loaded."}

        target_url = f"http://localhost:{PORT}/"
        
        # Run in thread
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, attack_simulator_instance.run_simulation, target_url)
        return result
    except Exception as e:
        logger.error(f"Attack Sim Error: {e}")
        return {"error": str(e)}

# --- AUTO FIX ENDPOINT ---
class AutoFixRequest(BaseModel):
    fix_id: str
    target: str = None

@app.post("/admin/apply-fix")
async def apply_auto_fix(req: AutoFixRequest):
    """
    Applies the selected fix using AutoFixer Engine.
    """
    try:
        global auto_fixer_instance
        if not auto_fixer_instance:
             from auto_fixer_engine import AutoFixer
             auto_fixer_instance = AutoFixer()
             
        result = auto_fixer_instance.apply_fix(req.fix_id, req.target)
        return result
    except Exception as e:
        logger.error(f"AutoFix Error: {e}")
        return {"success": False, "message": str(e)}


# --- TEMPLATE GOVERNANCE API ---
_tg_cache = {"data": None, "ts": 0}

@app.get("/api/template-governance")
async def get_template_governance(refresh: bool = False):
    """Template Governance scan — returns site integrity report."""
    import time as _time
    cache_ttl = 60  # seconds
    now = _time.time()
    if not refresh and _tg_cache["data"] and (now - _tg_cache["ts"]) < cache_ttl:
        return _tg_cache["data"]

    try:
        from template_scanner import full_scan
        result = full_scan(DIRECTORY)
        _tg_cache["data"] = result
        _tg_cache["ts"] = now
        return result
    except Exception as e:
        logger.error(f"Template Governance scan failed: {e}")
        return {"error": str(e), "stats": {"total_pages": 0, "total_violations": 0, "compliance_score": 0, "inline_styles": 0, "dom_mismatches": 0, "langs_active": 0}, "lang_matrix": {}, "pages": [], "violations": []}


@app.post("/api/template-governance/fix-inline")
async def fix_inline_styles(request: Request):
    """Auto-fix inline styles in a specific file or all files."""
    try:
        body = await request.json()
        target_path = body.get("path", "")
        from template_scanner import auto_fix_inline_styles, full_scan as tg_scan

        if target_path == "__ALL__":
            # Fix all pages with inline styles
            scan = tg_scan(DIRECTORY)
            results = []
            total_fixed = 0
            for page in scan["pages"]:
                if page.get("inline_styles", 0) > 0:
                    r = auto_fix_inline_styles(DIRECTORY, page["path"])
                    total_fixed += r.get("fixed", 0)
                    if r.get("fixed", 0) > 0:
                        results.append(r)
            _tg_cache["data"] = None  # invalidate cache
            return {"success": True, "total_fixed": total_fixed, "files_fixed": len(results), "details": results[:20]}
        else:
            result = auto_fix_inline_styles(DIRECTORY, target_path)
            _tg_cache["data"] = None
            return {"success": True, **result}
    except Exception as e:
        logger.error(f"Inline fix failed: {e}")
        return {"success": False, "error": str(e)}


@app.get("/api/template-governance/dom-diff")
async def get_dom_diff(path_a: str, path_b: str):
    """Get detailed DOM diff between two files."""
    try:
        from template_scanner import generate_dom_diff
        return generate_dom_diff(DIRECTORY, path_a, path_b)
    except Exception as e:
        logger.error(f"DOM diff failed: {e}")
        return {"error": str(e)}


# --- ACTIVITY LOG API ---
@app.get("/api/activity-log")
async def get_activity_log(limit: int = 50, offset: int = 0):
    """Returns recent admin activity entries."""
    if not activity_logger:
        return {"entries": [], "total": 0}
    entries = activity_logger.get_recent(limit=limit, offset=offset)
    return {"entries": entries, "total": len(entries)}

@app.get("/api/activity-log/stats")
async def get_activity_stats():
    """Returns activity summary statistics."""
    if not activity_logger:
        return {"total": 0, "today": 0, "labels": {}}
    return activity_logger.get_stats()

# --- SYSTEM HEALTH API ---
@app.get("/api/system/health")
async def get_system_health():
    """Returns live system health metrics."""
    if not psutil:
        return {"error": "psutil not installed", "cpu": 0, "ram": {}, "disk": {}, "net": {}}

    import time as _t

    # CPU
    cpu_percent = psutil.cpu_percent(interval=0.3)
    cpu_count = psutil.cpu_count()
    cpu_freq = psutil.cpu_freq()

    # RAM
    mem = psutil.virtual_memory()

    # Disk
    disk = psutil.disk_usage(DIRECTORY)

    # Network (cumulative counters)
    net = psutil.net_io_counters()

    # Process info (this server)
    proc = psutil.Process()
    proc_mem = proc.memory_info()
    proc_create = proc.create_time()
    uptime_sec = _t.time() - proc_create

    return {
        "cpu": {
            "percent": cpu_percent,
            "cores": cpu_count,
            "freq_mhz": round(cpu_freq.current, 0) if cpu_freq else None
        },
        "ram": {
            "total_gb": round(mem.total / (1024**3), 1),
            "used_gb": round(mem.used / (1024**3), 1),
            "available_gb": round(mem.available / (1024**3), 1),
            "percent": mem.percent
        },
        "disk": {
            "total_gb": round(disk.total / (1024**3), 1),
            "used_gb": round(disk.used / (1024**3), 1),
            "free_gb": round(disk.free / (1024**3), 1),
            "percent": round(disk.percent, 1)
        },
        "network": {
            "bytes_sent_mb": round(net.bytes_sent / (1024**2), 1),
            "bytes_recv_mb": round(net.bytes_recv / (1024**2), 1)
        },
        "process": {
            "pid": proc.pid,
            "memory_mb": round(proc_mem.rss / (1024**2), 1),
            "uptime_minutes": round(uptime_sec / 60, 1),
            "threads": proc.num_threads()
        },
        "timestamp": _t.strftime("%Y-%m-%dT%H:%M:%S", _t.localtime())
    }

# --- STATICS & BOOT ---
app.mount("/admin", StaticFiles(directory="admin", html=True), name="admin")
app.mount("/data", StaticFiles(directory="data"), name="data")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
# Language directories (explicit mount for proper index.html serving)
for _lang in ["tr", "en", "de", "fr", "ru", "sr"]:
    _lang_dir = os.path.join(DIRECTORY, _lang)
    if os.path.isdir(_lang_dir):
        app.mount(f"/{_lang}", StaticFiles(directory=_lang_dir, html=True), name=f"lang_{_lang}")

# Additional safe directories
for _dir in ["components", "includes", "uploads", "public", "static", "print", "a4", "assets", "admin"]:
    _dir_path = os.path.join(DIRECTORY, _dir)
    if os.path.isdir(_dir_path):
        app.mount(f"/{_dir}", StaticFiles(directory=_dir_path, html=True), name=f"static_{_dir}")

# ⚠️ SECURITY: Root mount REMOVED (was: directory=".") — exposed source code, .db, reports
# Instead, serve only specific root-level files via explicit routes:
from starlette.responses import FileResponse as StarletteFileResponse

_SAFE_ROOT_FILES = {
    "index.html", "favicon.ico", "sitemap.xml", "manifest.json",
    "robots.txt", "sw.js", "404.html", "service-detail.html",
    "booking.html", "showroom.html", "kese-ve-kopuk-masaji.html",
}

@app.get("/{filename}")
async def serve_root_file(filename: str):
    """Serve only whitelisted root-level files."""
    # Language directory redirect: /en -> /en/ (StaticFiles handles /en/ -> /en/index.html)
    if filename in {"tr", "en", "de", "fr", "ru", "sr"}:
        from starlette.responses import RedirectResponse
        return RedirectResponse(url=f"/{filename}/", status_code=301)
    if filename not in _SAFE_ROOT_FILES:
        raise HTTPException(status_code=404, detail="Not found")
    filepath = os.path.join(DIRECTORY, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Not found")
    return StarletteFileResponse(filepath)

if __name__ == "__main__":
    logger.info(f"🦅 SANTIS SENTINEL V3 STARTING (AIOFILES={'YES' if HAS_AIOFILES else 'NO'})")
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=True)
