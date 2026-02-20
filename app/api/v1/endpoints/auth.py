from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core import security
from app.core.limiter import limiter
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
    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not security.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

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
    payload = security.decode_token(refresh_token.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    token_version = payload.get("tv")

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user or user.token_version != token_version:
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
