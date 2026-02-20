from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core import security
from app.core.limiter import limiter
from app.core.lockout import lockout_manager
from app.core.security_logger import security_logger
from app.schemas import auth as schemas
from app.db.session import get_db
from app.db.models.user import User

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    # IP Client tracking for Lockout
    client_ip = request.client.host if request.client else "unknown"
    
    # 1. Check if user/IP is already locked out
    is_locked = await lockout_manager.check_lockout(client_ip, form_data.username)
    if is_locked:
        security_logger.log_event("LOCKOUT", "WARN", client_ip, form_data.username, "Blocked by Brute Force Lockout Manager.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked due to multiple failed login attempts.",
        )

    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user:
        await lockout_manager.record_failure(client_ip, form_data.username)
        security_logger.log_event("LOGIN_FAILED", "WARN", client_ip, form_data.username, "User not found.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not security.verify_password(
        form_data.password, user.hashed_password
    ):
        rem_attempts = await lockout_manager.record_failure(client_ip, form_data.username)
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
    await lockout_manager.clear_failures(client_ip, form_data.username)
    security_logger.log_event("LOGIN_SUCCESS", "INFO", client_ip, form_data.username, "User logged in successfully.")

    access_token = security.create_access_token(
        subject=str(user.id),
        token_version=user.token_version,
    )

    refresh_token = security.create_refresh_token(
        subject=str(user.id),
        token_version=user.token_version,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/register", response_model=schemas.UserOut)
@limiter.limit("5/minute")
async def register_user(
    request: Request,
    user_in: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
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

@router.post("/refresh", response_model=schemas.Token)
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    refresh_token: schemas.RefreshToken,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    payload = security.decode_token(refresh_token.refresh_token)

    if not payload or payload.get("type") != "refresh":
        security_logger.log_event("INVALID_JWT", "CRITICAL", client_ip, "unknown", "Attempt to use invalid or manipulated refresh token.")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    token_version = payload.get("tv")

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user or user.token_version != token_version:
        security_logger.log_event("INVALID_JWT", "CRITICAL", client_ip, str(user_id), "Token version mismatch or revoked token structure.")
        raise HTTPException(status_code=401, detail="Invalid token")

    new_access_token = security.create_access_token(
        subject=str(user.id),
        token_version=user.token_version,
    )

    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token.refresh_token,
        "token_type": "bearer",
    }
