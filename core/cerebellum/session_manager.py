"""
SANTIS OS — Session Manager v1.0
Phase 3: Security Hardening

Features:
- Server-side session storage (in-memory dict)
- Secure cookie: HttpOnly, SameSite=Strict
- CSRF token per session
- 4-hour hard expiry, 30-min idle timeout
- Max 3 concurrent sessions
- Password hashing (SHA-256 + salt)
"""

import os
import time
import secrets
import hashlib
import logging
import hmac
import re
from typing import Optional

logger = logging.getLogger("SantisSecurity")

try:
    import bcrypt
except Exception:
    bcrypt = None


class SessionManager:
    def __init__(self):
        # Session store: {token: {user, created, last_active, expires, ip, csrf_token}}
        self.sessions = {}

        # Config
        self.SESSION_EXPIRY = 4 * 3600      # 4 hours
        self.IDLE_TIMEOUT = 30 * 60          # 30 minutes
        self.MAX_SESSIONS = 3
        self.COOKIE_NAME = "santis_admin_session"

        # Fail-fast credential loading:
        #  - preferred keys: ADMIN_USERNAME + ADMIN_PASSWORD_HASH / ADMIN_PASSWORD
        #  - legacy support: ADMIN_USER + ADMIN_PASS_HASH
        self._admin_user = (
            os.getenv("ADMIN_USERNAME")
            or os.getenv("ADMIN_USER")
            or ""
        ).strip()
        if not self._admin_user:
            raise RuntimeError(
                "Missing admin username env. Set ADMIN_USERNAME (preferred) or ADMIN_USER (legacy)."
            )

        if os.getenv("ADMIN_USER") and not os.getenv("ADMIN_USERNAME"):
            logger.warning("⚠️ [SessionManager] Using legacy ADMIN_USER key. Migrate to ADMIN_USERNAME.")

        self._password_mode = None
        self._admin_salt = os.getenv("ADMIN_SALT", "").strip()
        raw_hash = (
            os.getenv("ADMIN_PASSWORD_HASH")
            or os.getenv("ADMIN_PASS_HASH")
            or ""
        ).strip()
        raw_password = os.getenv("ADMIN_PASSWORD", "").strip()

        if raw_hash:
            if os.getenv("ADMIN_PASS_HASH") and not os.getenv("ADMIN_PASSWORD_HASH"):
                logger.warning("⚠️ [SessionManager] Using legacy ADMIN_PASS_HASH key. Migrate to ADMIN_PASSWORD_HASH.")

            if raw_hash.startswith("$2"):
                if bcrypt is None:
                    raise RuntimeError(
                        "ADMIN_PASSWORD_HASH appears bcrypt but 'bcrypt' package is unavailable."
                    )
                self._password_mode = "bcrypt"
                self._admin_password_hash = raw_hash
            elif re.fullmatch(r"[A-Fa-f0-9]{64}", raw_hash):
                if not self._admin_salt:
                    raise RuntimeError("ADMIN_SALT is required for SHA-256 admin password hash mode.")
                self._password_mode = "sha256"
                self._admin_password_hash = raw_hash.lower()
            else:
                raise RuntimeError(
                    "Unsupported admin hash format. Use bcrypt ($2*) or 64-char SHA-256 hex."
                )
        else:
            if not raw_password:
                raise RuntimeError(
                    "Missing admin password env. Set ADMIN_PASSWORD_HASH (preferred) or ADMIN_PASSWORD."
                )
            if raw_password in ("admin", "santis2026", "password", "123456"):
                raise RuntimeError("Weak ADMIN_PASSWORD detected. Refusing insecure default password.")
            if not self._admin_salt:
                raise RuntimeError("ADMIN_SALT is required when ADMIN_PASSWORD is used.")
            self._password_mode = "sha256"
            self._admin_password_hash = self._hash_password(raw_password)

        logger.info("🔐 [SessionManager] Initialized")

    def _hash_password(self, password: str) -> str:
        """SHA-256 hash with salt."""
        salted = f"{self._admin_salt}:{password}"
        return hashlib.sha256(salted.encode("utf-8")).hexdigest()

    def verify_credentials(self, username: str, password: str) -> bool:
        """Check username/password against stored credentials."""
        if username != self._admin_user:
            return False
        if self._password_mode == "bcrypt":
            try:
                return bcrypt.checkpw(
                    password.encode("utf-8"),
                    self._admin_password_hash.encode("utf-8"),
                )
            except Exception:
                return False
        candidate = self._hash_password(password)
        return hmac.compare_digest(candidate, self._admin_password_hash)

    def create_session(self, username: str, ip: str) -> str:
        """Create a new session and return the token."""
        # Enforce max sessions (evict oldest)
        self._cleanup_expired()
        while len(self.sessions) >= self.MAX_SESSIONS:
            oldest_key = min(self.sessions, key=lambda k: self.sessions[k]["created"])
            del self.sessions[oldest_key]
            logger.info(f"🔐 [Session] Evicted oldest session (max {self.MAX_SESSIONS})")

        token = secrets.token_urlsafe(32)
        csrf_token = secrets.token_urlsafe(24)
        now = time.time()

        self.sessions[token] = {
            "user": username,
            "created": now,
            "last_active": now,
            "expires": now + self.SESSION_EXPIRY,
            "ip": ip,
            "csrf_token": csrf_token,
        }

        logger.info(f"🔐 [Session] Created for {username} from {ip}")
        return token

    def validate_session(self, token: str) -> Optional[dict]:
        """Validate a session token. Returns session data or None."""
        if not token or token not in self.sessions:
            return None

        session = self.sessions[token]
        now = time.time()

        # Check hard expiry
        if now > session["expires"]:
            del self.sessions[token]
            logger.info("🔐 [Session] Expired (hard limit)")
            return None

        # Check idle timeout
        if now - session["last_active"] > self.IDLE_TIMEOUT:
            del self.sessions[token]
            logger.info("🔐 [Session] Expired (idle timeout)")
            return None

        # Update last active
        session["last_active"] = now
        return session

    def validate_csrf(self, token: str, csrf_token: str) -> bool:
        """Validate CSRF token against session."""
        session = self.validate_session(token)
        if not session:
            return False
        return session["csrf_token"] == csrf_token

    def destroy_session(self, token: str):
        """Destroy a session (logout)."""
        if token in self.sessions:
            del self.sessions[token]
            logger.info("🔐 [Session] Destroyed (logout)")

    def get_csrf_token(self, session_token: str) -> Optional[str]:
        """Get CSRF token for a valid session."""
        session = self.validate_session(session_token)
        if session:
            return session["csrf_token"]
        return None

    def _cleanup_expired(self):
        """Remove all expired sessions."""
        now = time.time()
        expired = [
            k for k, v in self.sessions.items()
            if now > v["expires"] or (now - v["last_active"]) > self.IDLE_TIMEOUT
        ]
        for k in expired:
            del self.sessions[k]
        if expired:
            logger.info(f"🔐 [Session] Cleaned {len(expired)} expired sessions")


# Singleton
session_manager = SessionManager()
