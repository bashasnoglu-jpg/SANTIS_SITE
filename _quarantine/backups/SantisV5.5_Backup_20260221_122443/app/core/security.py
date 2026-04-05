from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError
from fastapi import HTTPException
from app.core.security_logger import security_logger
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import uuid

def create_access_token(
    subject: Union[str, Any], 
    token_version: int, 
    role: str = "admin",
    region: str = "tr",
    expires_delta: timedelta = None
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode = {
        "jti": str(uuid.uuid4()),        # Unique Token ID
        "iat": now,                      # Issued At
        "nbf": now,                      # Not Before
        "exp": expire,                   # Expiration Time
        "sub": str(subject),             # Subject (User ID/Email)
        "role": role,                    # RBAC
        "region": region,                # Regional Scope
        "tv": token_version,             
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any], 
    token_version: int, 
    role: str = "admin",
    region: str = "tr",
    expires_delta: timedelta = None
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)
    
    to_encode = {
        "jti": str(uuid.uuid4()),
        "iat": now,
        "nbf": now,
        "exp": expire, 
        "sub": str(subject),
        "role": role,
        "region": region,
        "tv": token_version,
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        decoded_token = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=["HS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iat": True,
                "require_exp": True,
                "require_iat": True,
                "require_nbf": True,
                "require_sub": True
            }
        )
        # Check custom required claims manually
        required_custom_claims = ["jti", "role", "region"]
        for claim in required_custom_claims:
            if claim not in decoded_token:
                raise HTTPException(status_code=401, detail=f"Missing required claim: {claim}")
        # Check if iat or nbf are from the future
        now_ts = datetime.now(timezone.utc).timestamp()
        if decoded_token.get("iat") > now_ts + 2: # 2 sec tolerance max
             raise HTTPException(status_code=401, detail="Token issued in the future")
        if decoded_token.get("nbf") > now_ts + 2:
             raise HTTPException(status_code=401, detail="Token not active yet")
             
        # Optional: Check whitelist of roles
        allowed_roles = ["admin", "super_admin", "editor"]
        if decoded_token.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Invalid role context")
            
        return decoded_token
        
    except JWTError as e:
        security_logger.log_event(
            event_type="INTRUSION_ATTEMPT",
            severity="CRITICAL",
            ip="unknown",
            username="unknown",
            description=f"JWT parsing failed: {str(e)}"
        )
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
