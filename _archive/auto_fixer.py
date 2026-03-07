
import os
import shutil
import datetime
import logging
from typing import Dict, Any, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SantisAutoFixer")

BACKUP_DIR = "backups"

def backup_file(file_path: str) -> Optional[str]:
    """
    Creates a timestamped backup of the given file.
    Returns the backup path or None if failed.
    """
    try:
        if not os.path.exists(file_path):
            return None
        
        os.makedirs(BACKUP_DIR, exist_ok=True)
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(file_path)
        backup_path = os.path.join(BACKUP_DIR, f"{filename}.{ts}.bak")
        
        shutil.copy2(file_path, backup_path)
        logger.info(f"Backup created: {backup_path}")
        return backup_path
    except Exception as e:
        logger.error(f"Backup failed for {file_path}: {e}")
        return None

def apply_fix(action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry point for applying fixes.
    """
    logger.info(f"Applying fix: {action} with params: {params}")
    
    if action == "add_security_header":
        return _fix_security_header(params)
    
    return {"status": "error", "message": f"Unknown action: {action}"}

def _fix_security_header(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Injects a security header into server.py middleware.
    """
    target_file = "server.py"
    header_key = params.get("header")
    header_val = params.get("value")
    
    if not header_key or not header_val:
        return {"status": "error", "message": "Missing header key or value"}

    # 1. Backup
    backup_path = backup_file(target_file)
    if not backup_path:
        return {"status": "error", "message": "Backup failed, aborting fix."}

    try:
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Check if SecurityMiddleware exists
        if "class SecurityHeadersMiddleware" in content:
            # Inject into existing middleware
            # We look for the dispatch method and insert before return response
            # efficient but slightly brittle regex/string manipulation
             # Safety check: is header already there?
            if f'response.headers["{header_key}"]' in content:
                 return {"status": "skipped", "message": "Header already present in code."}

            marker = "response = await call_next(request)"
            injection = f'\n        response.headers["{header_key}"] = "{header_val}"'
            
            if marker in content:
                 new_content = content.replace(marker, marker + injection, 1)
            else:
                 return {"status": "error", "message": "Could not find insertion point in existing middleware."}
                 
        else:
            # Create Middleware from scratch
            # We need to add import and the class
            
            # 1. Add Import if missing
            import_monitor = "from starlette.middleware.base import BaseHTTPMiddleware"
            if import_monitor not in content:
                content = import_monitor + "\n" + content
            
            # 2. Define Class
            middleware_code = f'''
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["{header_key}"] = "{header_val}"
        return response
'''
            # 3. Add to App
            # Find where to insert class (checked after imports usually)
            # Find where to add_middleware (usually after app = FastAPI())
            
            if "app = FastAPI(" in content:
                 content = content.replace("app = FastAPI(", f"{middleware_code}\napp = FastAPI(")
                 content += "\napp.add_middleware(SecurityHeadersMiddleware)\n"
            else:
                 return {"status": "error", "message": "Could not find app definition."}
            
            new_content = content

        with open(target_file, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        return {"status": "success", "message": f"Added {header_key}", "backup": backup_path}

    except Exception as e:
        # Restore backup? For now, manual restore instructions in error
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    # Test
    pass
