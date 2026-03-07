from fastapi import APIRouter, Request, Body, Path, Depends
import asyncio
router = APIRouter()

# --- GLOBALS FOR AUDIT & FIX ENGINES ---
visual_audit_instance = None
performance_audit_instance = None
security_audit_instance = None
attack_simulator_instance = None
auto_fixer_instance = None
deep_audit_instance = None
generate_suggestions = None
PORT = 8000
import os
from pydantic import BaseModel
from fastapi import HTTPException
from fastapi.responses import FileResponse
import logging
logger = logging.getLogger(__name__)

# --- VISUAL AUDIT ENDPOINT ---

class VisualAuditRequest(BaseModel):
    url: str
    update_reference: bool = False

@router.post("/admin/visual-audit")
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

@router.post("/admin/performance-audit")
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

@router.post("/admin/security-audit")
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

@router.get("/admin/ai-fix-suggestions")
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
@router.post("/admin/attack-simulator")
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

@router.post("/admin/apply-fix")
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

@router.get("/api/template-governance")
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


@router.post("/api/template-governance/fix-inline")
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


@router.get("/api/template-governance/dom-diff")
async def get_dom_diff(path_a: str, path_b: str):
    """Get detailed DOM diff between two files."""
    try:
        from template_scanner import generate_dom_diff
        return generate_dom_diff(DIRECTORY, path_a, path_b)
    except Exception as e:
        logger.error(f"DOM diff failed: {e}")
        return {"error": str(e)}


# --- ACTIVITY LOG API ---
@router.get("/api/activity-log")
async def get_activity_log(limit: int = 50, offset: int = 0):
    """Returns recent admin activity entries."""
    if not activity_logger:
        return {"entries": [], "total": 0}
    entries = activity_logger.get_recent(limit=limit, offset=offset)
    return {"entries": entries, "total": len(entries)}

@router.get("/api/activity-log/stats")
async def get_activity_stats():
    """Returns activity summary statistics."""
    if not activity_logger:
        return {"total": 0, "today": 0, "labels": {}}
    return activity_logger.get_stats()

# --- SYSTEM HEALTH API ---
@router.get("/api/system/health")
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

