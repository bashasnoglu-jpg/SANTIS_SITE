from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db

from app.core import security
from app.core.limiter import limiter
from app.core.lockout import lockout_manager
from app.core.security_logger import security_logger
from app.db.models.user import User

from app.core.session import session_manager
from app.core.risk_engine import risk_engine
from app.schemas import auth as schemas
import json

router = APIRouter()

@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    ip = request.client.host if request.client else "unknown"
    
    target_email = form_data.username
    if target_email.lower() == "admin":
        target_email = "admin@santis.com"
    
    # 1. Check Brute Force Lockout
    if await lockout_manager.check_lockout(db, ip, target_email):
        raise HTTPException(status_code=423, detail="Account locked.")
        
    result = await db.execute(select(User).where(User.email == target_email))
    user = result.scalar_one_or_none()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        await lockout_manager.record_failure(db, ip, target_email)
        raise HTTPException(status_code=400, detail="Invalid credentials.")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user.")
        
    # 2. Sovereign Risk Engine Check (Phase Omega)
    headers = dict(request.headers)
    risk_assessment = await risk_engine.evaluate_login_risk(
        db, str(user.id), ip, headers, user.trusted_devices
    )
    
    if risk_assessment["risk_level"] == "CRITICAL":
        raise HTTPException(status_code=403, detail="Login blocked by Risk Engine. Verification required.")
        
    # 3. Create Redis Session
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    session_id = await session_manager.create_session(
        user_id=str(user.id),
        tenant_id=str(user.tenant_id) if user.tenant_id else "hq",
        role=role_str,
        ip=ip,
        user_agent=headers.get("user-agent", "unknown"),
        fingerprint=risk_assessment["device_hash"]
    )
    
    # 4. Set HttpOnly Cookie (Strict zero-trust for browsers)
    response.set_cookie(
        key="santis_session",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="Strict", # Or Lax if cross-site redirection is needed
        max_age=7 * 24 * 60 * 60
    )
    
    # If a new device, add to trusted (simplified for demo. Normally user must verify it first)
    if risk_assessment["device_hash"] not in (user.trusted_devices or []):
        trusted = list(user.trusted_devices) if user.trusted_devices else []
        trusted.append(risk_assessment["device_hash"])
        user.trusted_devices = trusted
        await db.commit()

    return {"status": "success", "message": "Logged in securely."}

@router.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("santis_session")
    if session_id:
        await session_manager.revoke_session(session_id)
        
    response.delete_cookie("santis_session")
    return {"status": "success", "message": "Logged out successfully."}

@router.get("/sessions")
async def list_active_sessions(request: Request):
    """Sovereign Cyber Dashboard: List all active devices for the current user."""
    session_id = request.cookies.get("santis_session")
    if not session_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    session_data = await session_manager.verify_session(session_id)
    if not session_data:
        raise HTTPException(status_code=401, detail="Session expired")
        
    user_id = session_data["sub"]
    active = await session_manager.get_active_sessions(user_id)
    return {"status": "success", "active_sessions": active}

@router.post("/sessions/revoke-all")
async def revoke_all_sessions(request: Request, response: Response):
    session_id = request.cookies.get("santis_session")
    if not session_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    session_data = await session_manager.verify_session(session_id)
    if not session_data:
        raise HTTPException(status_code=401, detail="Session expired")
        
    user_id = session_data["sub"]
    await session_manager.revoke_all_user_sessions(user_id)
    response.delete_cookie("santis_session")
    return {"status": "success", "message": "All devices have been logged out."}
