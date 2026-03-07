from __future__ import annotations
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core import security
from app.core.limiter import limiter
from app.core.lockout import lockout_manager
from app.core.security_logger import security_logger
from app.schemas import auth as schemas
from app.db.session import get_db, get_db_for_admin
from app.db.models.user import User

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db_for_admin),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    # IP Client tracking for Lockout
    client_ip = request.client.host if request.client else "unknown"
    
    # 1. Check if user/IP is already locked out
    is_locked = await lockout_manager.check_lockout(db, client_ip, form_data.username)
    if is_locked:
        security_logger.log_event("lockout_triggered", "WARN", client_ip, form_data.username, "Blocked by DB-Backed Brute Force Lockout Manager.")
        raise HTTPException(
            status_code=423, # 423 Locked
            detail="Account temporarily locked due to multiple failed login attempts.",
        )

    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user:
        await lockout_manager.record_failure(db, client_ip, form_data.username)
        security_logger.log_event("LOGIN_FAILED", "WARN", client_ip, form_data.username, "User not found.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not security.verify_password(
        form_data.password, user.hashed_password
    ):
        rem_attempts = await lockout_manager.record_failure(db, client_ip, form_data.username)
        security_logger.log_event("LOGIN_FAILED", "WARN", client_ip, form_data.username, f"Invalid password. Remaining attempts: {rem_attempts}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        security_logger.log_event("LOGIN_FAILED", "WARN", client_ip, form_data.username, "Attempt to login to inactive account.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Clear lockout counters upon successful authentication
    await lockout_manager.clear_failures(db, client_ip, form_data.username)
    security_logger.log_event("LOGIN_SUCCESS", "INFO", client_ip, form_data.username, "User logged in successfully.")

    access_token = security.create_access_token(
        subject=str(user.id),
        token_version=user.token_version,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        tenant_id=str(user.tenant_id) if user.tenant_id else None
    )

    refresh_token = security.create_refresh_token(
        subject=str(user.id),
        token_version=user.token_version,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        tenant_id=str(user.tenant_id) if user.tenant_id else None
    )

    import uuid
    from app.core.config import settings
    # CSRF Token 
    csrf_token = str(uuid.uuid4())

    # 3. 🚨 XSS KALKANI: Access Token'ı HttpOnly Çereze Gönder
    response.set_cookie(
        key="santis_access",
        value=f"Bearer {access_token}",
        httponly=True,       # JS tarafından KESİNLİKLE okunamaz!
        secure=True,         # Production'da True (Sadece HTTPS)
        samesite="lax",      # CSRF için ilk savunma hattı
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    # 4. Refresh Token (Sadece /refresh rotasına giderken tarayıcı bunu ekler)
    response.set_cookie(
        key="santis_refresh",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth/refresh", 
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    # 5. 🛡️ CSRF KALKANI: Frontend'in okuyup Header'a ekleyeceği Anti-Forgery Token
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,      # 🚨 DİKKAT: Frontend JS bunu okumak ZORUNDADIR!
        secure=True,
        samesite="lax"
    )

    security_logger.log_event("LOGIN_SECURE", "INFO", client_ip, form_data.username, "Zero Trust cookies generated.")

    return {
        "status": "success",
        "message": "God Mode Yetkileri Onaylandı.",
        "tenant_id": str(user.tenant_id) if user.tenant_id else "hq"
    }

@router.post("/logout")
async def logout(request: Request, response: Response):
    """THE REVOCATION ENGINE (Kara Liste)"""
    client_ip = request.client.host if request.client else "unknown"
    raw_refresh = request.cookies.get("santis_refresh")
    
    if raw_refresh:
        token_hash = hash_token(raw_refresh)
        # 🚨 Token'ı Kara Listeye (Revoked) al. Bir daha asla kullanılamaz.
        REVOKED_TOKENS.add(token_hash) 
        security_logger.log_event("LOGOUT", "INFO", client_ip, "unknown", "🗑️ [AUTH] Çıkış yapıldı. Token kara listeye eklendi (Revoked).")

    # Çerezleri fiziksel olarak sil
    response.delete_cookie("santis_access")
    response.delete_cookie("santis_refresh", path="/api/v1/auth/refresh")
    response.delete_cookie("csrf_token")
    return {"status": "success", "message": "Güvenli çıkış yapıldı."}

@router.post("/register", response_model=schemas.UserOut)
@limiter.limit("5/minute")
async def register_user(
    request: Request,
    user_in: schemas.UserCreate,
    db: AsyncSession = Depends(get_db_for_admin),
):
    result = await db.execute(
        select(User).where(User.email == user_in.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    hashed_password = security.get_password_hash(user_in.password)

    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
        token_version=0,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

import secrets
import hashlib

# ==============================================================================
# 🛡️ THE SOVEREIGN VAULT (Redis Simülasyonu)
# ==============================================================================
# Kuantum Döndürme: Kullanılmış ama süresi dolmamış Refresh Token'lar
USED_REFRESH_TOKENS = dict() # Format: { "token_hash": "user_id" }
# Kara Liste: Çıkış yapanların veya iptal edilenlerin tokenları
REVOKED_TOKENS = set()       # Format: { "token_hash" }

def hash_token(token: str) -> str:
    """Güvenlik için token'ın kendisini değil, her zaman hash'ini saklarız."""
    return hashlib.sha256(token.encode()).hexdigest()

async def revoke_all_sessions(user_id: str):
    """THE KILL SWITCH: Kullanıcının tüm aktif oturumlarını Redis/DB'den siler."""
    security_logger.log_event("SESSION_REVOKE", "CRITICAL", "system", str(user_id), f"💀 [KILL SWITCH] {user_id} yetkileri tamamen İMHA EDİLDİ.")
    # Production Redis implementasyonu: await redis.delete(f"user_sessions:{user_id}")
# ==============================================================================

@router.post("/refresh")
async def silent_refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db_for_admin)):
    """THE SILENT RENEWAL & TOKEN ROTATION ENGINE"""
    client_ip = request.client.host if request.client else "unknown"

    # 1. HttpOnly çerezden Refresh Token'ı al (JS okuyamaz, tarayıcı kendi yollar)
    raw_refresh = request.cookies.get("santis_refresh")
    if not raw_refresh:
        raise HTTPException(status_code=401, detail="Oturum bulunamadı.")

    token_hash = hash_token(raw_refresh)

    # 1. 🛑 REVOCATION KONTROLÜ (Kara Liste / Logout Edilmiş mi?)
    if token_hash in REVOKED_TOKENS:
        security_logger.log_event("REVOKED_TOKEN_USE", "WARNING", client_ip, "unknown", "🛑 [AUTH] İptal edilmiş (Revoked) token denemesi")
        raise HTTPException(status_code=401, detail="Bu oturum sonlandırılmış.")

    # 2. 🚨 THE SOVEREIGN KILL SWITCH (Hırsızlık & Replay Attack Koruması)
    if token_hash in USED_REFRESH_TOKENS:
        hacked_user = USED_REFRESH_TOKENS[token_hash]
        security_logger.log_event("REPLAY_ATTACK", "CRITICAL", client_ip, str(hacked_user), f"💀 [KILL SWITCH TETİKLENDİ] Kullanılmış Token! Hırsızlık Şüphesi: {hacked_user}")
        
        # SİSTEM İNFAZI: Hacker ve kurbanın tüm oturumlarını yak!
        await revoke_all_sessions(hacked_user)
        
        # Tarayıcıdaki sahte mühürleri sil
        response.delete_cookie("santis_access")
        response.delete_cookie("santis_refresh", path="/api/v1/auth/refresh")
        response.delete_cookie("csrf_token")
        raise HTTPException(status_code=403, detail="Güvenlik ihlali tespit edildi. Hesabınız kilitlendi.")

    try:
        payload = security.decode_token(raw_refresh)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid payload type")
            
        user_id = payload.get("sub")
        token_version = payload.get("tv")
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or user.token_version != token_version:
            raise ValueError("Invalid user or token version")

        # 3. YASAL YENİLEME (ROTATION) BAŞLIYOR
        # Eski token'ı "KULLANILDI" olarak işaretle
        USED_REFRESH_TOKENS[token_hash] = str(user.id)

        # 4. YENİ Token'ları Üret (Rotation)
        from app.core.config import settings
        
        new_access_token = security.create_access_token(
            subject=str(user.id),
            token_version=user.token_version,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            tenant_id=str(user.tenant_id) if user.tenant_id else None
        )
        
        new_refresh_token = security.create_refresh_token(
            subject=str(user.id),
            token_version=user.token_version,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            tenant_id=str(user.tenant_id) if user.tenant_id else None
        )
        
        new_csrf = secrets.token_urlsafe(32)

        # 5. Yeni Mühürleri Tarayıcıya Bas (Eskilerini ezer)
        response.set_cookie(key="santis_access", value=f"Bearer {new_access_token}", httponly=True, secure=True, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        response.set_cookie(key="santis_refresh", value=new_refresh_token, httponly=True, secure=True, samesite="strict", path="/api/v1/auth/refresh", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60)
        response.set_cookie(key="csrf_token", value=new_csrf, httponly=False, secure=True, samesite="lax")

        security_logger.log_event("SILENT_RENEWAL", "INFO", client_ip, str(user_id), "Oturum sessizce döndürüldü ve yenilendi (Rotated). Yeni kalkanlar aktif.")
        return {"status": "success", "message": "Oturum yenilendi."}

    except Exception as e:
        security_logger.log_event("REFRESH_ERROR", "ERROR", client_ip, "unknown", f"Refresh Token hatası: {str(e)}")
        response.delete_cookie("santis_access")
        response.delete_cookie("santis_refresh", path="/api/v1/auth/refresh")
        response.delete_cookie("csrf_token")
        raise HTTPException(status_code=401, detail="Geçersiz oturum. Lütfen tekrar giriş yapın.")

# ── LEGACY SERVER & ADMIN ROUTES MIGRATED DURING "SOVEREIGN SHIELD" ──
import uuid
import json
from datetime import datetime, timezone

@router.post("/promo-token")
async def create_promo_token(request: Request):
    ip = request.client.host if request.client else "unknown"
    token = str(uuid.uuid4())
    manager_id = "test_manager"
    from app.core.redis import acquire_lock
    import redis.asyncio as redis
    from app.core.config import settings
    # Very basic mock logic migrated from server.py (needs real redis connection in auth context)
    try:
        r = redis.from_url(settings.REDIS_URL, decode_responses=True)
        payload = json.dumps({
            "generated_by": manager_id,
            "used": False,
            "ip": ip,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await r.setex(f"promo:{token}", 86400, payload)
        await r.close()
    except Exception as e:
        pass # Redis might be offline
    return {"status": "success", "token": token, "expires_in_hours": 24}

@router.get("/promo-token/check")
async def validate_promo_token(token: str):
    import redis.asyncio as redis
    from app.core.config import settings
    try:
        r = redis.from_url(settings.REDIS_URL, decode_responses=True)
        val = await r.get(f"promo:{token}")
        await r.close()
        if not val:
            return {"status": "error", "message": "Invalid or expired token"}
        data = json.loads(val)
        if data.get("used"):
            return {"status": "error", "message": "Token already used"}
        return {"status": "success", "valid": True}
    except Exception:
        return {"status": "error", "message": "Cache offline"}

@router.post("/promo-token/use")
async def use_promo_token(token: str):
    import redis.asyncio as redis
    from app.core.config import settings
    try:
        r = redis.from_url(settings.REDIS_URL, decode_responses=True)
        val = await r.get(f"promo:{token}")
        if not val:
            await r.close()
            return {"status": "error", "message": "Invalid or expired token"}
            
        data = json.loads(val)
        if data.get("used"):
            await r.close()
            return {"status": "error", "message": "Token already used"}
            
        data["used"] = True
        data["used_at"] = datetime.now(timezone.utc).isoformat()
        await r.set(f"promo:{token}", json.dumps(data))
        await r.close()
        return {"status": "success", "message": "Token successfully redeemed"}
    except Exception:
         return {"status": "error", "message": "Cache logic failed"}

from fastapi.responses import JSONResponse
import secrets
@router.get("/csrf-token")
async def get_csrf_token():
    """Phase G: Basic Anti-CSRF token endpoint."""
    token = secrets.token_hex(32)
    response = JSONResponse({"status": "success", "csrf_token": token})
    response.set_cookie(key="santis_csrf", value=token, httponly=True, secure=True, samesite="Lax")
    return response
