from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    tv: Optional[int] = None
    type: Optional[str] = None

class RefreshToken(BaseModel):
    refresh_token: str

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    token_version: int = 0

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    is_superuser: bool
    role: Optional[str] = None
    tenant_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
