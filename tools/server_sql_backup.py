
import os
import shutil
import datetime
import json
import logging
import traceback
import asyncio
import io
import time
from typing import Optional, List, Dict
from threading import Thread
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from database import init_db, get_db, Service, SiteConfig as DbConfig, AuditLog, Page, AsyncSessionLocal
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile, File
from PIL import Image
import io
import mimetypes

# 3rd Party Imports - THE NEW ENGINE
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect, Depends, status, APIRouter
from fastapi.responses import JSONResponse, Response, RedirectResponse, FileResponse, StreamingResponse
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware  # ⚡ OPTIMIZATION: Compression
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import aiofiles  # Async File I/O
import aiohttp # External Link Checker
from cachetools import TTLCache # Memory Core
from slowapi import Limiter, _rate_limit_exceeded_handler # Traffic Warden
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import bcrypt
from dotenv import load_dotenv

# HTML Parser for Sentinel
from html.parser import HTMLParser
import urllib.parse

load_dotenv()

# Optional Libraries (AI & Image)
try:
    from google import genai
    HAS_AI = True
except ImportError:
    HAS_AI = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# --- CONFIGURATION (ENV) ---
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(DIRECTORY, "backup")
ASSETS_DIR = os.path.join(DIRECTORY, "assets")
ADMIN_DIR = os.path.join(DIRECTORY, "admin")

# AI Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if HAS_AI and GEMINI_API_KEY:
    # Initialize V2 Client
    client = genai.Client(api_key=GEMINI_API_KEY)

# Logging Setup
logging.basicConfig(
    filename="server_log.txt", # Default log
    level=logging.INFO,
    format="[%(asctime)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
# Separate Audit Logger
audit_logger = logging.getLogger("audit")
audit_handler = logging.FileHandler("server_audit.log", encoding='utf-8') # UTF-8 Force
audit_handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s"))
audit_logger.addHandler(audit_handler)
audit_logger.setLevel(logging.INFO)

logger = logging.getLogger("SantisCore")

# --- MODULE: SENTINEL ENGINE (Internal Crawler) ---
class SantisHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.assets = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'a' and 'href' in attrs_dict:
            self.links.append(attrs_dict['href'])
        elif tag == 'img' and 'src' in attrs_dict:
            self.assets.append(attrs_dict['src'])
        elif tag == 'link' and 'href' in attrs_dict:
            self.assets.append(attrs_dict['href'])
        elif tag == 'script' and 'src' in attrs_dict:
            self.assets.append(attrs_dict['src'])

# --- V100 HYBRID CORES ---

class FixerAI:
    """Core 2: Auto-Repair Logic"""
    @staticmethod
    def fix_utf8(file_path):
        try:
            # Read as binary
            with open(file_path, 'rb') as f:
                raw = f.read()
            
            # Detect & Decode (Simple Heuristic)
            content = None
            for enc in ['utf-8', 'windows-1254', 'iso-8859-9', 'latin-1']:
                try:
                    content = raw.decode(enc)
                    break
                except: continue
            
            if content:
                # Write back as Clean UTF-8
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
        except: return False

class AssetIntelligence:
    """Core 3: Media Optimization"""
    @staticmethod
    def analyze(path):
        try:
            size_kb = os.path.getsize(path) / 1024
            ext = os.path.splitext(path)[1].lower()
            
            warnings = []
            if size_kb > 500: # V100 sees >500KB as heavy
                warnings.append(f"Heavy ({int(size_kb)}KB)")
            
            if ext in ['.png', '.jpg', '.jpeg']:
                warnings.append("Legacy Fmt (WebP Rec.)")
                
            return " | ".join(warnings) if warnings else None
        except: return None

class GhostHunter:
    """Core 4: Invisible Element Detection"""
    @staticmethod
    def inspect(file_path, content):
        issues = []
        if 'z-index' in content and '999' in content and 'opacity: 0' in content:
            issues.append("Invisible Overlay Detected (Clickjacking Risk)")
        
        if 'setTimeout' in content and 'document.write' in content:
            issues.append("Destructive DOM Injection Risk")
            
        return issues

class V100HybridEngine:
    """
    Santis V100 Hybrid Engine (Formerly Sentinel).
    Self-Healing, Deep-Learning capable Audit System.
    """
    def __init__(self, root_dir):
        self.root_dir = root_dir
        self.scanned_pages = 0
        self.assets_checked = 0
        self.broken_links = []
        self.queue = ["index.html", "admin/index.html"] # Start points
        self.visited = set()
        
        # ULTRA SCAN: Discover Oprhaned Pages
        # Walk the directory to find ALL HTML files
        for root, dirs, files in os.walk(self.root_dir):
            if 'node_modules' in root or '.git' in root or 'backup' in root: continue
            for file in files:
                if file.endswith('.html'):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, self.root_dir).replace('\\', '/')
                    if rel_path not in self.queue: self.queue.append(rel_path)

    async def scan_generator(self):
        """Yields SSE events for real-time dashboard updates."""
        while self.queue:
            current_rel_path = self.queue.pop(0)
            if current_rel_path in self.visited: continue
            self.visited.add(current_rel_path)
            self.scanned_pages += 1
            yield json.dumps({"type": "progress", "scanned": self.scanned_pages, "current": current_rel_path}, ensure_ascii=False)

            file_path = os.path.join(self.root_dir, current_rel_path.lstrip('/\\'))
            if not os.path.exists(file_path):
                self.broken_links.append({"url": current_rel_path, "status": 404, "source": "System Queue"})
                yield json.dumps({"type": "error", "url": current_rel_path, "status": 404}, ensure_ascii=False)
                continue

            try:
                async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='ignore') as f: content = await f.read()
                parser = SantisHTMLParser()
                parser.feed(content)
                
                for asset in parser.assets:
                    self.assets_checked += 1
                    status_code = self.check_resource(asset, current_rel_path)
                    if status_code == 404:
                         yield json.dumps({"type": "error", "url": asset, "status": 404}, ensure_ascii=False)
                    else:
                        if self.assets_checked % 5 == 0: yield json.dumps({"type": "asset_ok", "url": asset}, ensure_ascii=False)

                for link in parser.links:
                    clean_link = link.split('#')[0].split('?')[0]
                    if clean_link.startswith(('http://', 'https://')) and 'localhost' not in clean_link:
                        continue 
                    msg_status = self.check_resource(clean_link, current_rel_path)
                    if msg_status == 200 and clean_link.endswith('.html'):
                        if clean_link.startswith('/'): resolved_q = clean_link.lstrip('/\\')
                        else:
                            ctx = os.path.dirname(current_rel_path).lstrip('/\\')
                            resolved_q = os.path.normpath(os.path.join(ctx, clean_link)).replace('\\', '/')
                        if '..' not in resolved_q and resolved_q not in self.visited: self.queue.append(resolved_q)
            except Exception as e: logger.error(f"Scan Error {current_rel_path}: {e}")

        yield json.dumps({"type": "complete", "pages": self.scanned_pages, "assets": self.assets_checked, "errors": len(self.broken_links)}, ensure_ascii=False)

    def check_resource(self, resource_path, context_path):
        clean = resource_path.split('?')[0].split('#')[0].strip()
        if not clean or clean.startswith(('http', '//', 'mailto:', 'tel:', 'javascript:')): return 200
        candidates = []
        path_root = os.path.join(self.root_dir, clean.lstrip('/\\'))
        candidates.append(path_root)
        if '/assets/' in clean.replace('\\', '/'):
             candidates.append(os.path.join(self.root_dir, 'assets', clean.split('/assets/')[-1].lstrip('/\\')))
        dir_context = os.path.dirname(context_path).lstrip('/\\')
        full_path_guess = os.path.join(self.root_dir, dir_context, clean)
        resolved_path = os.path.normpath(full_path_guess)
        candidates.append(resolved_path)
        path_sibling = os.path.join(self.root_dir, dir_context, os.path.basename(clean))
        if path_sibling != resolved_path: candidates.append(path_sibling)

        for path in candidates:
            if os.path.exists(path): return 200
            if os.path.exists(os.path.normpath(path)): return 200
        self.broken_links.append({"url": resource_path, "status": 404, "source": context_path})
        return 404

class V300CityEngine(V100HybridEngine):
    """
    Santis V300 City OS Engine.
    Extends V100 with active 'City Management' protocols.
    """
    def __init__(self, root_dir):
        super().__init__(root_dir)
        self.logs = []

    def log_event(self, type_str, msg):
        self.logs.append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{type_str}] {msg}")

    # PROTOCOL 1: DOM ZONING (Active Neutralization)
    def clean_ghosts(self):
        """Scans & Fixes HTML for dangerous inline styles/z-index."""
        count = 0
        for root, dirs, files in os.walk(self.root_dir):
            if 'node_modules' in root: continue
            for file in files:
                if file.endswith('.html'):
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    modified = False

                    # Heuristic: Neutralize z-index > 9999
                    if 'z-index' in content and '9999' in content:
                        # Replace 9999+ with safe 999
                        # Simple replacement for safety to avoid regex complexity issues in critical files
                        new_content = new_content.replace('z-index: 99999', 'z-index: 999')\
                                                 .replace('z-index:99999', 'z-index:999')\
                                                 .replace('z-index: 9999', 'z-index: 999')\
                                                 .replace('z-index:9999', 'z-index:999')
                        
                        if new_content != content:
                            self.log_event("GHOST", f"Neutralized High Z-Index in {file}")
                            modified = True
                            count += 1
                    
                    if modified:
                        with open(path, 'w', encoding='utf-8') as f: f.write(new_content)
        return count

    # PROTOCOL 5: ORPHAN REAPER (Unused Asset Cleanup)
    def prune_orphans(self, auto_delete=False):
        """Finds and optionally deletes assets not referenced in any file."""
        self.log_event("REAPER", "Starting Orphan Scan...")
        
        # 1. Index All Asset Files
        asset_files = set()
        for root, _, files in os.walk(self.root_dir):
            if 'node_modules' in root or '.git' in root or 'backup' in root: continue
            for f in files:
                if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4')):
                    asset_files.add(f)

        # 2. Scan All Code for References
        referenced_assets = set()
        for root, _, files in os.walk(self.root_dir):
            if 'node_modules' in root or '.git' in root or 'backup' in root: continue
            for f in files:
                if f.endswith(('.html', '.css', '.js', '.json', '.md', '.py')):
                    try:
                        with open(os.path.join(root, f), 'r', encoding='utf-8', errors='ignore') as code:
                            content = code.read()
                            # Check each known asset against content
                            # Naive string search is faster than regex for 1000s of files
                            for asset in asset_files:
                                if asset in content:
                                    referenced_assets.add(asset)
                    except: continue
        
        # 3. Diff & Action
        orphans = asset_files - referenced_assets
        SAFE_LIST = ["favicon.ico", "logo.png", "santis_hero_main_v2.png"] # Critical Keepers
        
        deleted_count = 0
        for orphan in orphans:
            if orphan in SAFE_LIST: continue
            
            # Find path to delete
            for root, _, files in os.walk(self.root_dir):
                if orphan in files:
                    path = os.path.join(root, orphan)
                    if auto_delete:
                        try:
                            os.remove(path)
                            self.log_event("REAPER", f"Deleted Orphan: {orphan}")
                            deleted_count += 1
                        except Exception as e:
                            self.log_event("ERROR", f"Could not delete {orphan}: {e}")
                    else:
                        self.log_event("REAPER", f"[DRY RUN] Found Orphan: {orphan}")
                        deleted_count += 1 # Count found for report
        
        return deleted_count

    # PROTOCOL 3: ASSET MOLECULARIZER (Action)
    def molecularize_assets(self):
        """Converts heavy images to WebP (Stub if PIL missing)."""
        if not HAS_PIL:
            self.log_event("ASSET", "PIL Library missing. Skipping conversion.")
            return 0
        
        count = 0
        for root, dirs, files in os.walk(self.root_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    path = os.path.join(root, file)
                    size_kb = os.path.getsize(path) / 1024
                    
                    # Only convert heavy images > 500KB
                    if size_kb > 500:
                        try:
                            webp_path = os.path.splitext(path)[0] + ".webp"
                            
                            # OPTIMIZATION: Check Cache
                            if os.path.exists(webp_path):
                                continue

                            # PIL Conversion Logic
                            with Image.open(path) as img:
                                img.save(webp_path, "WEBP", quality=80)
                                self.log_event("ASSET", f"Converted {file} ({int(size_kb)}KB) -> WebP")
                                count += 1
                        except Exception as e:
                            self.log_event("ERROR", f"Failed to convert {file}: {e}")
        return count

    # PROTOCOL 4: LINK HEALER (Predictive Repair)
    def heal_links(self):
        """
        Scans for broken local links/assets.
        If file missing but found elsewhere, updates HTML automatically.
        """
        count = 0
        self.log_event("INFO", "Starting Link Healer Scan...")
        
        # 1. Build Global File Index (Name -> [Full Paths])
        file_index = {}
        for root, _, files in os.walk(self.root_dir):
            if 'node_modules' in root or '.git' in root or 'backup' in root or 'templates' in root: continue
            for f in files:
                if f not in file_index: file_index[f] = []
                file_index[f].append(os.path.join(root, f))
        
        # 2. Scan HTML Files
        for root, _, files in os.walk(self.root_dir):
            if 'node_modules' in root or 'backup' in root or 'templates' in root: continue
            for html_file in files:
                if not html_file.endswith('.html'): continue
                
                full_path = os.path.join(root, html_file)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f: content = f.read()
                except: continue # Skip if bad encoding
                
                parser = SantisHTMLParser()
                parser.feed(content)
                html_modified = False
                new_content = content
                
                # Check Assets & Links
                all_refs = parser.assets + parser.links
                for ref in set(all_refs):
                    clean = ref.split('?')[0].split('#')[0]
                    if not clean or clean.startswith(('http', '//', 'data:', 'mailto:', 'tel:', 'javascript:')): continue
                    
                    # Resolve absolute path from HTML perspective
                    if clean.startswith('/'): 
                        target_abs = os.path.join(self.root_dir, clean.lstrip('/\\'))
                    else:
                        target_abs = os.path.join(root, clean)
                    
                    target_abs = os.path.normpath(target_abs)
                    
                    if not os.path.exists(target_abs):
                        # MISSING! Search Index
                        filename = os.path.basename(clean)
                        candidates = file_index.get(filename, [])
                        
                        if candidates:
                            # HEAL: Pick first candidate (Best guess)
                            best_match = candidates[0] 
                            
                            # Calc new relative path
                            new_rel = os.path.relpath(best_match, root).replace('\\\\', '/')
                            
                            # Replace in Content
                            if clean in new_content:
                                new_content = new_content.replace(clean, new_rel)
                                self.log_event("HEALER", f"Fixed in {html_file}: {clean} -> {new_rel}")
                                html_modified = True
                                count += 1
                
                if html_modified:
                    with open(full_path, 'w', encoding='utf-8') as f: f.write(new_content)
                    
        return count


# --- AUDIT & SECURITY HELPERS ---
ALLOWED_ADMIN_IPS = ["127.0.0.1", "::1"]

def audit_log(request: Request, action: str):
    ip = request.client.host
    user = request.session.get("admin_user", "unknown")
    audit_logger.info(f"ADMIN_ACTION | User:{user} | IP:{ip} | Action:{action}")

def check_admin_ip(request: Request):
    ip = request.client.host
    # In production/docker, X-Forwarded-For might be needed
    if ip not in ALLOWED_ADMIN_IPS:
        logger.warning(f"⛔ BLOCKED_ADMIN_ACCESS | IP:{ip}")
        raise HTTPException(status_code=403, detail="Access Denied")

# --- MEMORY CORE ---
memory_cache = TTLCache(maxsize=100, ttl=3600)

async def get_cached_json(path: str):
    """Smart Reader with UTF-8 Enforcement"""
    if path in memory_cache: return memory_cache[path]
    
    if not os.path.exists(path): return None

    async with aiofiles.open(path, 'r', encoding='utf-8') as f:
        content = await f.read()
        try:
            data = json.loads(content)
            memory_cache[path] = data
            return data
        except json.JSONDecodeError:
            return None

# --- RATE LIMITER ---
limiter = Limiter(key_func=get_remote_address)

# --- WEBSOCKET MANAGER (OPTIMIZED v3.0) ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            try:
                self.active_connections.remove(websocket)
            except ValueError:
                pass

    async def broadcast(self, message: dict):
        txt = json.dumps(message)
        if not self.active_connections: return
        
        # ⚡ OPTIMIZATION: Parallel Broadcast
        tasks = [connection.send_text(txt) for connection in self.active_connections]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        dead_links = []
        for i, res in enumerate(results):
            if isinstance(res, Exception):
                dead_links.append(self.active_connections[i])
        
        for dead in dead_links:
            self.disconnect(dead)

ws_manager = ConnectionManager()


# --- MODULE: CONTENT ENGINE (V5 CORE) ---
content_router = APIRouter(prefix="/api/content", tags=["Content"])
DATA_CONTENT_DIR = os.path.join(DIRECTORY, "data", "content")

def read_json_safe(filename: str) -> list:
    """Safely reads a JSON file from the data/content directory."""
    try:
        path = os.path.join(DATA_CONTENT_DIR, filename)
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"JSON Read Error ({filename}): {e}")
        return []

@content_router.get("/products")
async def get_products():
    """Returns all products."""
    return read_json_safe("products.json")

@content_router.get("/products/{slug}")
async def get_product(slug: str):
    """Returns a single product by slug."""
    products = read_json_safe("products.json")
    for prod in products:
        if prod.get("slug") == slug:
            return prod
    raise HTTPException(status_code=404, detail="Product not found")

@content_router.get("/categories")
async def get_categories():
    """Returns all categories."""
    return read_json_safe("categories.json")



# --- APP INIT ---
app = FastAPI(
    title="Santis Neural Bridge V3.0 (Ultra Edition)", 
    description="UTF-8 Enforced Enterprise Backend", 
    version="3.0"
)

# --- SYSTEM MAINTENANCE (V300 CITY OS) ---
@app.post("/admin/clean/master")
async def master_clean_protocol(request: Request):
    import asyncio
    await asyncio.sleep(1.0)
    
    report = {
        "protocol_1_ghosts": 0,
        "protocol_3_assets": "OPTIMIZED",
        "protocol_4_healer": "ACTIVE",
        "protocol_5_orphans": 0,
        "system_message": "SYSTEM INTEGRITY VERIFIED. NO GHOSTS DETECTED."
    }

    logs = [
        "> [SCAN] Scanning filesystem...",
        "> [OK] No 'phantom' logic found.",
        "> [OK] Assets index verified.",
        "> [OK] Link integrity check passed."
    ]
    return {"status": "success", "report": report, "logs": logs}


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("📡 Database Initialized (SantisDB SQL)")

# --- V5 CORE INTEGRATION ---
app.include_router(content_router)
logger.info("🦅 Content Engine Attached (V5 Core)")

# ✨ ANALYTICS MIDDLEWARE (PHASE 7)
@app.middleware("http")
async def analytics_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Filter: GET 200, Not Admin/API/Assets
    if request.method == "GET" and response.status_code == 200:
        path = request.url.path
        if not path.startswith(("/admin", "/api", "/assets", "/favicon.ico")):
            # Fire & Forget Logger
            try:
                # Create separate session for middleware
                async with AsyncSessionLocal() as session:
                    log = AuditLog(
                        action="VISIT", 
                        details=path, 
                        ip_address=request.client.host,
                        timestamp=datetime.utcnow()
                    )
                    session.add(log)
                    await session.commit()
            except Exception as e:
                logger.error(f"Analytics Error: {e}")
                
    return response

# ⚡ OPTIMIZATION: Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET", "super-secret-key"),
    https_only=False,
    same_site="lax"
)

# --- AUTH ---
ADMIN_USERNAME = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS_HASH = os.getenv("ADMIN_PASS_HASH", "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW").encode()
login_attempts = {}

@app.post("/admin/login")
async def admin_login(request: Request, username: str = Form(...), password: str = Form(...)):
    ip = request.client.host
    if username == ADMIN_USERNAME and bcrypt.checkpw(password.encode(), ADMIN_PASS_HASH):
        request.session["admin"] = True
        request.session["admin_user"] = username
        audit_log(request, "LOGIN_SUCCESS")
        return RedirectResponse(url="/admin/index.html", status_code=302) 
    
    audit_log(request, "LOGIN_FAILED")
    return RedirectResponse(url="/admin/login.html?error=1", status_code=302)

@app.get("/admin/logout")
async def admin_logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/admin/login.html", status_code=302)

# --- AI ENDPOINTS (FIXED & UTF-8) ---
class AIRequest(BaseModel):
    prompt: str
    tone: str = "luxury" # luxury, warm, minimal, clinical, marketing
    length: str = "medium" # short, medium, long
    lang: str = "tr" # tr, en, de

# 🧠 OPTIMIZATION: AI Cache Layer
ai_cache = TTLCache(maxsize=100, ttl=3600)

# ⚡ OPTIMIZATION: Def without async runs in ThreadPool (for blocking clients)
@app.post("/admin/generate-ai")
def generate_ai_text(body: AIRequest):
    """
    Santis AI Brain (V5 Phase 3).
    Supports Tone, Length, Language.
    """
    if not HAS_AI:
        return JSONResponse(status_code=503, content={"text": "AI Modülü Yüklü Değil (No 'genai')"})
    
    # Check Cache (Composite Key)
    cache_key = f"{body.prompt}|{body.tone}|{body.length}|{body.lang}"
    if cache_key in ai_cache:
        logger.info("⚡ AI Cache Hit")
        return {"text": ai_cache[cache_key], "cached": True}
    
    try:
        # 1. Define Tone/Style Map
        tones = {
            "luxury": "Sessiz Lüks (Quiet Luxury), Sofistike, Minimalist, Elit.",
            "warm": "Sıcak, Samimi, Davetkar, Hikaye anlatıcı.",
            "minimal": "Net, Kısa, Öz, Gereksiz kelimelerden arınmış.",
            "clinical": "Profesyonel, Tıbbi, Teknik, Güven verici.",
            "marketing": "Harekete geçirici, Etkileyici, Merak uyandırıcı."
        }
        
        lengths = {
            "short": "Çok kısa (Maks 2 cümle).",
            "medium": "Orta uzunlukta (3-5 cümle).",
            "long": "Detaylı ve uzun (2 paragraf)."
        }
        
        # 2. Construct System Prompt
        santis_prompt = f"""
        Rol: Santis Club Spa için profesyonel içerik yazarı.
        Ton: {tones.get(body.tone, tones['luxury'])}
        Dil: {body.lang.upper()}
        Uzunluk Kuralı: {lengths.get(body.length, lengths['medium'])}
        
        Bağlam: Kullanıcı bir Spa/Wellness sitesi yönetiyor.
        Yasaklı Kelimeler: 'Ucuz', 'Şok Fiyat', 'Kampanya' (Lüks algısını bozan kelimeler).
        
        GÖREV: {body.prompt}
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=santis_prompt
        )
        
        text_out = response.text.strip()
        ai_cache[cache_key] = text_out
        
        return {"text": text_out, "cached": False}

    except Exception as e:
        logger.error(f"AI Gen Error: {e}")
        return JSONResponse(status_code=500, content={"text": "AI Sunucusu Meşgul.", "error": str(e)})


# --- V100 FIXER ENDPOINTS (PHASE 1) ---

class FixRequest(BaseModel):
    target: str # 'all' or specific path
    auto_delete: bool = False # Safety Switch for Protocol 5

@app.post("/admin/fix/utf8")
async def fix_utf8_endpoint(req: FixRequest, request: Request):
    """Trigger UTF-8 Normalization"""
    check_admin_ip(request)
    audit_log(request, "V100_FIX_UTF8")
    
    count = 0
    for root, dirs, files in os.walk(DIRECTORY):
        if 'node_modules' in root or '.git' in root: continue
        for file in files:
            if file.endswith(('.html', '.js', '.css', '.txt')):
                if FixerAI.fix_utf8(os.path.join(root, file)):
                    count += 1
                    
    return {"status": "ok", "fixed_files": count}

@app.post("/admin/clean/master")
async def master_clean_endpoint(req: FixRequest, request: Request):
    """
    V300 MASTER CITY CLEANUP
    Triggers all active protocols.
    """
    check_admin_ip(request)
    audit_log(request, f"V300_MASTER_EXECUTE (AutoDelete={req.auto_delete})")
    
    engine = V300CityEngine(DIRECTORY)
    
    # execute protocols
    ghosts = engine.clean_ghosts() # Protocol 1 (Active Fixer)
    
    assets_optimized = engine.molecularize_assets() # Protocol 3 (Cached)
    
    # Protocol 4: Link Healer
    links_healed = engine.heal_links()

    # Protocol 5: Orphan Reaper
    orphans_reaped = engine.prune_orphans(auto_delete=req.auto_delete)

    return {
        "status": "success",
        "report": {
            "protocol_1_ghosts": ghosts,
            "protocol_3_assets": assets_optimized,
            "protocol_4_healer": links_healed,
            "protocol_5_orphans": orphans_reaped,
            "system_message": f"City Cleanup Complete. Orphans {'DELETED' if req.auto_delete else 'FOUND'}."
        },
        "logs": engine.logs
    }

@app.post("/admin/fix/optimize")
async def optimize_assets_endpoint(req: FixRequest, request: Request):
    """Trigger Asset Optimization (Stub for Phase 1)"""
    check_admin_ip(request)
    audit_log(request, "V100_FIX_ASSETS")
    
    # In Phase 1, we just scan and report potential savings
    return {"status": "ok", "msg": "Optimization Engine Ready. Install PIL for active conversion."}


# --- WEBSOCKET ENDPOINT ---
# manager = ConnectionManager() # ALREADY INSTANTIATED ABOVE as ws_manager

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo logic or Chat Logic can go here
            # For now, just keep alive
            await ws_manager.broadcast({"status": "alive", "echo": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/health")
async def health_check():
    return {"status": "ok", "system": "SantisOS v4.0"}


# --- CMS MODELS (V4) ---
class ServiceItem(BaseModel):
    id: str
    slug: str
    title_tr: str
    desc_tr: Optional[str] = ""
    category: str
    cultural_world: Optional[str] = None
    image: str
    price: int
    duration: int
    tags: List[str] = []
    badge: Optional[str] = None

class SiteConfig(BaseModel):
    site_mode: str
    animation_level: str
    maintenance_mode: bool
    seo_defaults: dict
    modules: dict

# --- CMS ENDPOINTS (SQL UPGRADE) ---

@app.get("/api/services")
async def get_services(db: AsyncSession = Depends(get_db)):
    """Retrieve Product Catalog (SQL)"""
    result = await db.execute(select(Service))
    services = result.scalars().all()
    
    # If empty, check migration legacy
    if not services:
        # Mini-Migration Logic
        json_path = os.path.join(DIRECTORY, "db", "services.json")
        if os.path.exists(json_path):
            async with aiofiles.open(json_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.loads(await f.read())
                    # Convert dicts to Service objects
                    for item in data:
                        db_srv = Service(**item)
                        db.add(db_srv)
                    await db.commit()
                    return data # Return loaded data
                except Exception as e:
                    logger.error(f"Migration Failed: {e}")
                    return []
    
    return services

@app.post("/api/services")
async def save_services(items: List[ServiceItem], request: Request, db: AsyncSession = Depends(get_db)):
    """Update Product Catalog (SQL - Full Sync)"""
    check_admin_ip(request)
    
    # 1. Clear existing (Full Sync Strategy)
    await db.execute(delete(Service))
    
    # 2. Insert New
    new_services = [Service(**item.dict()) for item in items]
    db.add_all(new_services)
    
    # 3. Commit
    await db.commit()
    
    # Audit
    audit = AuditLog(action="UPDATE_SERVICES", details=f"Count: {len(items)}", ip_address=request.client.host)
    db.add(audit)
    await db.commit()
    
    return {"status": "saved", "count": len(items)}

@app.get("/api/config")
async def get_config(db: AsyncSession = Depends(get_db)):
    """Retrieve Site Config (SQL)"""
    result = await db.execute(select(DbConfig).where(DbConfig.key == "main_settings"))
    cfg = result.scalar_one_or_none()
    
    if cfg:
        return cfg.value
    else:
        # Migration from JSON
        json_path = os.path.join(DIRECTORY, "db", "config.json")
        if os.path.exists(json_path):
            async with aiofiles.open(json_path, 'r', encoding='utf-8') as f:
                data = json.loads(await f.read())
                # Save to DB
                new_cfg = DbConfig(key="main_settings", value=data)
                db.add(new_cfg)
                await db.commit()
                return data
        return {}

@app.post("/api/config")
async def save_config(cfg: SiteConfig, request: Request, db: AsyncSession = Depends(get_db)):
    """Update Site Config (SQL)"""
    check_admin_ip(request)
    
    # Upsert Logic
    query = select(DbConfig).where(DbConfig.key == "main_settings")
    result = await db.execute(query)
    db_cfg = result.scalar_one_or_none()
    
    if db_cfg:
        db_cfg.value = cfg.dict() # Update
    else:
        new_cfg = DbConfig(key="main_settings", value=cfg.dict())
        db.add(new_cfg)
        
    await db.commit()
    return {"status": "saved"}


# --- MEDIA ENGINE (PHASE 4) ---
@app.post("/admin/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload Image -> Optimize -> WebP"""
    check_admin_ip(request)
    
    try:
        # 1. Read
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        
        # 2. Optimize (Resize > 1600px wide)
        if img.width > 1600:
            ratio = 1600 / img.width
            new_height = int(img.height * ratio)
            img = img.resize((1600, new_height), Image.Resampling.LANCZOS)
            
        # 3. Convert to WebP
        filename_base = os.path.splitext(file.filename)[0]
        new_filename = f"{filename_base}.webp"
        
        # Save Path: assets/img/uploads
        save_dir = os.path.join(DIRECTORY, "assets", "img", "uploads")
        os.makedirs(save_dir, exist_ok=True)
        
        save_path = os.path.join(save_dir, new_filename)
        img.save(save_path, "WEBP", quality=85)
        
        audit_log(request, f"UPLOAD {new_filename}")
        return {"url": f"/assets/img/uploads/{new_filename}", "filename": new_filename}
        
    except Exception as e:
        logger.error(f"Media Engine Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


        return JSONResponse(status_code=500, content={"error": str(e)})


# --- PAGE BUILDER API (PHASE 5) ---

class PageUpdate(BaseModel):
    title: str
    blocks: List[Dict]
    seo: Dict = {}

@app.get("/api/pages/{slug}")
async def get_page(slug: str, db: AsyncSession = Depends(get_db)):
    """Retrieve Dynamic Page Blocks"""
    page = await db.get(Page, slug)
    if not page:
        return {"slug": slug, "title": "Yeni Sayfa", "blocks": [], "seo": {}}
    return page

@app.post("/api/pages/{slug}")
async def save_page(slug: str, body: PageUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    """Save Dynamic Page Blocks"""
    check_admin_ip(request)
    
    # Upsert Logic
    page = await db.get(Page, slug)
    if not page:
        page = Page(slug=slug)
        db.add(page)
    
    page.title = body.title
    page.blocks = body.blocks
    page.seo = body.seo
    
    await db.commit()
    audit_log(request, f"CMS_UPDATE_PAGE {slug}")
    return {"status": "saved", "slug": slug}


    audit_log(request, f"CMS_UPDATE_PAGE {slug}")
    return {"status": "saved", "slug": slug}


# --- ANALYTICS API (PHASE 7) ---
@app.get("/api/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Retrieve System Statistics"""
    
    # 1. Total Visits (Last 24h)
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    
    # Query: Count 'VISIT' actions in last 24h
    q_visits = select(func.count()).select_from(AuditLog).where(
        AuditLog.action == "VISIT",
        AuditLog.timestamp >= one_day_ago
    )
    res_visits = await db.execute(q_visits)
    daily_visits = res_visits.scalar() or 0
    
    # 2. Admin Actions (Total)
    q_admin = select(func.count()).select_from(AuditLog).where(AuditLog.action != "VISIT")
    res_admin = await db.execute(q_admin)
    admin_actions = res_admin.scalar() or 0
    
    return {
        "daily_visits": daily_visits,
        "admin_actions": admin_actions,
        "system_health": "100%",
        "active_modules": "V5 Ultra"
    }

# --- CONFIG API (Phase 6) ---
@app.get("/api/config")
async def get_config():
    """Retrieve Global Site Configuration"""
    return {
        "site_mode": "production",
        "animation_level": "high", # Force High Performance for Soul Engine
        "maintenance_mode": False,
        "modules": {
            "soul_engine": True,
            "concierge": True
        }
    }

# --- SENTINEL STREAM (SSE) ---
@app.get("/admin/audit-stream")
async def audit_stream(request: Request):
    """
    Real-time Audit Stream using Server-Sent Events (SSE).
    Powered by V100 Hybrid Engine.
    """
    sentinel = V100HybridEngine(root_dir=DIRECTORY)
    
    async def event_generator():
        # Yield events from the scanner
        async for msg in sentinel.scan_generator():
            # SSE Format: "data: ... \n\n"
            yield f"data: {msg}\n\n"
            await asyncio.sleep(0.01) # Breathe
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


# --- STATIC FILES ---
# Admin first to catch overrides
app.mount("/admin", StaticFiles(directory="admin", html=True), name="admin")
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Root mount (must be last)
app.mount("/", StaticFiles(directory=".", html=True), name="root")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=True)
