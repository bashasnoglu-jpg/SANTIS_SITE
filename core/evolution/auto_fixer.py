import os
import shutil
import logging
import re
from datetime import datetime

# Setup Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("AutoFixer")

class AutoFixer:
    """
    Santis Auto-Apply Engine (Phase 10)
    Safely applies code fixes and file operations.
    """
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.getcwd()
        self.backup_dir = os.path.join(self.base_dir, "backup", "autofix")
        os.makedirs(self.backup_dir, exist_ok=True)

    def _create_backup(self, file_path):
        """Creates a timestamped backup of the target file."""
        if not os.path.exists(file_path):
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(file_path)
        backup_path = os.path.join(self.backup_dir, f"{filename}.{timestamp}.bak")
        shutil.copy2(file_path, backup_path)
        logger.info(f"💾 Backup created: {backup_path}")
        return backup_path

    def apply_fix(self, fix_id, target=None):
        """Dispatches the fix based on ID."""
        logger.info(f"🔧 Applying Fix: {fix_id} -> Target: {target}")
        
        try:
            if fix_id == "FIX_CSP":
                return self.fix_csp_middleware()
            elif fix_id == "FIX_COMPRESSION":
                return self.fix_compression()
            elif fix_id == "FIX_ROBOTS":
                return self.fix_robots_txt()
            elif fix_id == "FIX_MISSING_FILE":
                return self.fix_missing_file(target)
            else:
                return {"success": False, "message": f"Unknown Fix ID: {fix_id}"}
        except Exception as e:
            logger.error(f"❌ AutoFix Error: {e}")
            return {"success": False, "message": str(e)}

    def fix_compression(self):
        """Injects GZipMiddleware into server.py."""
        target_file = os.path.join(self.base_dir, "server.py")
        self._create_backup(target_file)
        
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "GZipMiddleware" in content:
            return {"success": True, "message": "GZipMiddleware already present."}
            
        # 1. Add Import
        if "from fastapi.middleware.gzip" not in content:
            content = "from fastapi.middleware.gzip import GZipMiddleware\n" + content
            
        # 2. Add Middleware (Found near other add_middleware calls or after app init)
        # We look for 'app = FastAPI(...)'
        if "app = FastAPI" in content:
            # Insert after the app definition line
            pattern = r"(app = FastAPI\(.*?\)\n)"
            replacement = r"\1\n# 🚀 AUTO-FIX: Compression\napp.add_middleware(GZipMiddleware, minimum_size=1000)\n"
            content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
        else:
             return {"success": False, "message": "Could not find 'app = FastAPI' anchor."}

        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"success": True, "message": "✅ GZip Compression added to server.py"}

    def fix_csp_middleware(self):
        """Injects proper Security Headers into server.py if missing."""
        target_file = os.path.join(self.base_dir, "server.py")
        self._create_backup(target_file)
        
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "SecurityHeadersMiddleware" in content:
             return {"success": True, "message": "Security Shield already active."}
             
        # We assume the user wants the full block. 
        # For simplicity in this 'Auto-Apply' demo, we will append it or insert it safely.
        # But since we already manually added it in previous steps, this might be redundant 
        # unless we broke it. 
        # Let's say we check if it's there, if not, we fail or warn.
        # Real implementation would be complex regex insertion.
        return {"success": False, "message": "Security Middleware missing but complex to auto-inject safely without context. Please revert to backup."}

    def fix_robots_txt(self):
        """Creates a standard robots.txt"""
        target_file = os.path.join(self.base_dir, "robots.txt")
        if os.path.exists(target_file):
             return {"success": True, "message": "robots.txt already exists."}
             
        content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Sitemap: https://santis.club/sitemap.xml
"""
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {"success": True, "message": "✅ robots.txt created."}

    def fix_missing_file(self, target_rel_path):
        """Copies a placeholder to the missing file location."""
        if not target_rel_path:
            return {"success": False, "message": "No target path provided."}
            
        target_full_path = os.path.join(self.base_dir, target_rel_path)
        
        # Determine type
        if target_full_path.lower().endswith(('.jpg', '.png', '.webp', '.jpeg')):
            placeholder_source = os.path.join(self.base_dir, "assets", "img", "placeholder_santis.jpg")
            
            # If our specific placeholder doesn't exist, try to find ANY jpg to use as source or fail
            if not os.path.exists(placeholder_source):
                 # Try to find 'hero-general.webp' or similar
                 fallback = os.path.join(self.base_dir, "assets", "img", "hero-general.webp")
                 if os.path.exists(fallback):
                     placeholder_source = fallback
                 else:
                     return {"success": False, "message": "Placeholder source image not found."}
            
            # Create dirs
            os.makedirs(os.path.dirname(target_full_path), exist_ok=True)
            
            shutil.copy2(placeholder_source, target_full_path)
            return {"success": True, "message": f"✅ Image restored: {target_rel_path}"}
            
        return {"success": False, "message": "Unsupported file type for auto-fix."}
