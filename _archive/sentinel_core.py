import asyncio
import json
import os
import datetime
import logging
import time
from typing import Dict, Any, Optional

# Import Helpers (We will need to make these context-aware later)
import sentinel_memory
from sentinel_memory import SentinelMemory
import sentinel_notifier
from sentinel_notifier import SentinelNotifier
import sentinel_metrics
from sentinel_metrics import SentinelMetrics
import sentinel_analytics
from sentinel_analytics import SentinelAnalytics

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SentinelCore")

class SentinelCore:
    """
    Sentinel Operational Stability Manager (Core)
    Supports running multiple isolated instances for different projects.
    """
    def __init__(self, project_id: str, project_root: str, config_path: str = None):
        self.project_id = project_id
        self.project_root = os.path.abspath(project_root)
        
        # Paths
        self.report_dir = os.path.join(self.project_root, "reports")
        self.status_file = os.path.join(self.report_dir, f"sentinel_status_{self.project_id}.json")
        self.audit_script = os.path.join(self.project_root, "site_audit.py")
        self.audit_result = os.path.join(self.report_dir, "audit_result.json")
        
        # Config
        self.config_path = config_path or os.path.join(self.project_root, "sentinel_config.json")
        self.config = self._load_config()
        
        # State
        self.running = False
        self.lock = asyncio.Lock()
        self.status = {
            "project_id": self.project_id,
            "state": "IDLE",
            "last_scan": None,
            "next_scan": None,
            "actions_today": [],
            "health": "UNKNOWN"
        }
        self._load_status()

    def _load_config(self) -> Dict[str, Any]:
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"[{self.project_id}] Config Load Error: {e}")
        return {}

    def _load_status(self):
        if os.path.exists(self.status_file):
            try:
                with open(self.status_file, "r", encoding="utf-8") as f:
                    self.status = json.load(f)
            except Exception:
                pass  # Start fresh if corrupted

    def _save_status(self):
        os.makedirs(self.report_dir, exist_ok=True)
        try:
            with open(self.status_file, "w", encoding="utf-8") as f:
                json.dump(self.status, f, indent=2)
        except Exception as e:
            logger.error(f"[{self.project_id}] Failed to save status: {e}")

    async def start(self):
        if self.running:
            return
        self.running = True
        logger.info(f"🤖 Sentinel Core Started [{self.project_id}]. Watching {self.project_root}...")
        asyncio.create_task(self._loop())

    async def stop(self):
        self.running = False
        logger.info(f"🛑 Sentinel Core Stopped [{self.project_id}].")

    async def _loop(self):
        scan_interval = self.config.get("scan_interval_seconds", 600)
        
        while self.running:
            try:
                # Calculate next scan time
                next_run = datetime.datetime.now() + datetime.timedelta(seconds=scan_interval)
                self.status["next_scan"] = next_run.isoformat()
                self.status["state"] = "IDLE"
                self._save_status()

                # Wait
                await asyncio.sleep(scan_interval)

                # --- PHASE 20: MULTI-SITE TODO ---
                # Creating isolated instances of helpers (AISuggestions, etc.) 
                # will be done in the next step. For now, we rely on the 
                # scripts running with the correct CWD or global imports.
                
                # REFACTOR NOTE: 
                # This logic is currently simplified. In a full multi-site deployment,
                # we'd need to mock/stub the Singletons in ai_suggestions 
                # to respect self.project_root.
                
                # Run Cycle
                if self.running:
                    await self.run_cycle()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[{self.project_id}] Loop Error: {e}")
                await asyncio.sleep(60) # Retry delay

    async def run_cycle(self):
        """
        Main Sentinel Operation: Audit -> Analyze -> Fix -> Report
        """
        start_time = time.time()
        async with self.lock:
            self.status["state"] = "SCANNING"
            logger.info(f"[{self.project_id}] 🔍 Sentinel Scan Initiated...")
            self._save_status()

            try:
                # 1. RUN AUDIT
                # We execute the audit script inside the project root to ensure it picks up local files
                proc = await asyncio.create_subprocess_exec(
                    "python", self.audit_script,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=self.project_root, # CRITICAL for Multi-Site
                    env=os.environ.copy()
                )
                stdout, stderr = await proc.communicate()

                if proc.returncode != 0:
                    err_msg = stderr.decode()
                    logger.error(f"[{self.project_id}] Audit failed: {err_msg}")
                    self.status["state"] = "ERROR"
                    self._save_status()
                    
                    # Log System Error
                    # TODO: Make SentinelMemory instance-based
                    SentinelMemory.record_incident({
                        "category": "SYSTEM",
                        "issue": "Audit Failed",
                        "priority": "CRITICAL",
                        "fix": err_msg
                    }, "FAILED")
                    
                    return

                # 2. ANALYZE (Read JSON)
                if not os.path.exists(self.audit_result):
                    logger.error(f"[{self.project_id}] Audit result not found at {self.audit_result}")
                    return

                async with asyncio.Lock(): # simple file read
                    with open(self.audit_result, "r", encoding="utf-8") as f:
                        audit_data = json.load(f)

                # 3. AI SUGGESTIONS (Dynamic Import to avoid caching issues across instances?)
                import ai_suggestions
                suggestions = ai_suggestions.generate_suggestions(audit_data)
                
                # Check Health Score
                health_score = audit_data.get("summary", {}).get("health_score", 0)
                self.status["health"] = f"{health_score}/100"

                # 4. AUTO-FIX DECISION
                import auto_fixer
                fixed_count = 0
                for s in suggestions:
                    # Record Detection
                    if s.get("priority") in ["HIGH", "CRITICAL"]:
                         SentinelMemory.record_incident(s, status="DETECTED")

                    # Criteria: Safe + Valid Action
                    # GOVERNANCE CHECK: Level 1 Authority
                    if s.get("auto_fix_safe") is True and s.get("fix_action"):
                        # Apply Fix
                        logger.info(f"[{self.project_id}] 🛠️ Applying Fix: {s['issue']}")
                        
                        # Fixer needs to know where to apply fixes!
                        # Currently auto_fixer might assume CWD. 
                        # We temporarily change CWD or pass root? 
                        # Ideally pass root to apply_fix.
                        result = auto_fixer.apply_fix(s["fix_action"]["action"], s["fix_action"]["params"])
                        
                        status_code = result.get("status")
                        if status_code in ["success", "skipped"]:
                            # Log Success
                            SentinelMemory.record_incident(s, status="FIXED", details=result.get("message"))
                            
                            action_log = {
                                "time": datetime.datetime.now().isoformat(),
                                "issue": s["issue"],
                                "action": s["fix_action"]["action"],
                                "result": status_code
                            }
                            self.status["actions_today"].insert(0, action_log)
                            self.status["actions_today"] = self.status["actions_today"][:50]
                            fixed_count += 1
                        else:
                            # Log Failure
                            fail_msg = result.get("message")
                            SentinelMemory.record_incident(s, status="FAILED", details=fail_msg)
                
                # 5. FINALIZE
                duration_ms = (time.time() - start_time) * 1000
                
                # Record Pulse
                try: current_health_val = int(health_score)
                except: current_health_val = 0

                # TODO: SentinelMetrics needs instance awareness
                SentinelMetrics.record({
                    "response_time_ms": duration_ms,
                    "error_count": len([i for i in suggestions if i.get("priority") == "CRITICAL"]),
                    "health_score": current_health_val
                })
                
                self.status["last_scan"] = datetime.datetime.now().isoformat()
                self.status["state"] = "IDLE"
                self._save_status()
                logger.info(f"[{self.project_id}] ✅ Cycle Complete. Fixed: {fixed_count}. Duration: {int(duration_ms)}ms")

            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                logger.error(f"[{self.project_id}] Cycle Failure: {e}\n{error_trace}")
                self.status["state"] = "ERROR"
                self._save_status()
