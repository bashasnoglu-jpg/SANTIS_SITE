from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
import uuid


class TenantBase(BaseModel):
    name: str
    country: Optional[str] = None
    is_active: Optional[bool] = True


class TenantCreate(TenantBase):
    pass


class TenantUpdate(TenantBase):
    pass


class TenantRegister(BaseModel):
    """
    SaaS Onboarding — Yeni işletme kaydı.
    Hem Tenant hem de OWNER kullanıcı oluşturur.
    """
    # İşletme bilgileri
    spa_name: str                          # "Santis Hamam İstanbul"
    country: Optional[str] = "TR"
    subdomain: str                         # "santis-istanbul" → santis-istanbul.santis.com
    spa_type: Literal[
        "luxury_spa", "hammam", "massage_center",
        "beauty_clinic", "wellness_retreat"
    ] = "luxury_spa"

    # Owner (İşletme Sahibi) bilgileri
    owner_email: EmailStr
    owner_password: str
    owner_full_name: str

    @field_validator("subdomain")
    @classmethod
    def subdomain_clean(cls, v: str) -> str:
        import re
        v = v.lower().strip()
        v = re.sub(r'[^a-z0-9\-]', '-', v)
        v = re.sub(r'-+', '-', v).strip('-')
        if len(v) < 3:
            raise ValueError("Subdomain en az 3 karakter olmalı")
        return v

    @field_validator("owner_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalı")
        return v


class TenantRegisterResponse(BaseModel):
    """Onboarding başarıyla tamamlandığında dönen yanıt."""
    tenant_id: uuid.UUID
    tenant_name: str
    subdomain: str
    owner_email: str
    access_token: str
    token_type: str = "bearer"
    message: str = "Kayıt başarıyla tamamlandı."


class TenantInDBBase(TenantBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class Tenant(TenantInDBBase):
    pass
