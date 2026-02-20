from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import Response
import os
import logging

logger = logging.getLogger("SantisSecurity")

class SecurityShield:
    def __init__(self):
        print("🛡️ Security Shield: Cerebellum Online")

    async def block_sensitive_paths(self, request: Request, call_next):
        # Specific filenames to block
        blocked_files = [
            "server.py", "sentinel.py", "deep_audit.py", "ai_suggestions.py", 
            "security_audit.py", "city_os.py", "sitemap_generator.py",
            "requirements.txt", "package.json", "docker-compose.yml",
            "config.json", "session_manager.py", "admin_lock.py",
            "security_shield.py", "template_scanner.py", "build.mjs",
            "admin_audit.py", "sentinel_config.json",
            "_PROMPT_WORKBENCH.json", "package-lock.json",
        ]
        # Sensitive extensions to block completely
        blocked_extensions = [
            ".env", ".git", ".vscode", ".idea", ".bak", ".log", ".sql", 
            ".sh", ".bat", ".py", ".db", ".mjs", ".toml", ".cfg", ".ini",
        ]
        # Sensitive directory paths to block
        blocked_dirs = [
            "/core/", "/db/", "/reports/", "/scripts/", "/logs/",
            "/_tools/", "/venv/", "/node_modules/", "/_archive/",
            "/_backup/", "/_build/", "/_dev_archives/", "/_legacy",
            "/backup/", "/generator/", "/tools/", "/templates/",
            "/trends/", "/visual_checkpoints/", "/__pycache__/",
        ]
        
        path = request.url.path.lower()
        filename = os.path.basename(path)

        # Check 1: Exact filename match against blocked list
        if filename in blocked_files:
            logger.warning(f"🚫 [SECURITY] Blocked access to source code: {path}")
            return Response(content="Forbidden: Source Code Protected", status_code=403)

        # Check 2: Extension match
        if any(path.endswith(ext) or f"/{ext}" in path for ext in blocked_extensions):
            logger.warning(f"🚫 [SECURITY] Blocked access to sensitive extension: {path}")
            return Response(content="Forbidden: Sensitive File Protected", status_code=403)
        
        # Check 3: Sensitive directory paths
        if any(blocked_dir in path for blocked_dir in blocked_dirs):
            logger.warning(f"🚫 [SECURITY] Blocked access to sensitive directory: {path}")
            return Response(content="Forbidden: Protected Directory", status_code=403)
        
        # Check 4: Directory Traversal Protection
        if ".." in path or "//" in path:
             logger.warning(f"🚫 [SECURITY] Blocked traversal attempt: {path}")
             return Response(content="Forbidden: Invalid Path", status_code=403)

        return await call_next(request)

# Singleton
security_shield = SecurityShield()
