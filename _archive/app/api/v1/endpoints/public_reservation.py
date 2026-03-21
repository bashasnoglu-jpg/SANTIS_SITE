"""
╔══════════════════════════════════════════════════════════════╗
║  🌐 SANTIS PUBLIC RESERVATION ENDPOINT v1.0                ║
║  Auth-free · BullMQ entegreli · Rate-limited (5/saat/IP)   ║
║  POST /api/v1/public/reservation                           ║
╚══════════════════════════════════════════════════════════════╝

Akış:
  Web Form → Pydantic doğrulama → rate-limit kontrolü
  → BullMQ: reservation-queue + email-queue
  → ref_id döner (DB'ye doğrudan yazmaz)

Neden BullMQ ile kuyruk?
  - Public endpoint → DDoS riski yüksek
  - Ağır DB işlemi main thread'i bloklamasın
  - Email gönderimi async olsun
  - Hata durumunda retry mekanizması
"""
from __future__ import annotations

import uuid
import hashlib
import time
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel, Field, field_validator, model_validator
import re

# ── Redis (BullMQ köprüsü için) ───────────────────────────────────────────────
try:
    import redis.asyncio as redis_async
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

router = APIRouter()

# ── Rate Limiter (in-memory, lightweight) ────────────────────────────────────
# Üretimde slowapi + Redis kullanın, burada hafif bir fallback:
_rate_store: dict[str, list[float]] = {}
RATE_LIMIT  = 5    # max istek
RATE_WINDOW = 3600  # saniye (1 saat)


def _check_rate(ip: str) -> bool:
    """True = izin ver, False = rate limit aşıldı."""
    now   = time.time()
    calls = [t for t in _rate_store.get(ip, []) if now - t < RATE_WINDOW]
    _rate_store[ip] = calls
    if len(calls) >= RATE_LIMIT:
        return False
    _rate_store[ip].append(now)
    return True


# ── Pydantic Schema ───────────────────────────────────────────────────────────
class PublicReservationRequest(BaseModel):
    guest_name:     str = Field(..., min_length=2, max_length=80)
    guest_phone:    str = Field(..., min_length=7, max_length=20)
    guest_email:    Optional[str] = Field(None, max_length=120)
    service_name:   str = Field(..., min_length=2, max_length=100)
    preferred_date: str = Field(..., description="YYYY-MM-DD formatında")
    preferred_time: Optional[str] = Field(None, description="HH:MM formatında")
    notes:          Optional[str] = Field(None, max_length=500)
    source_page:    Optional[str] = Field(
        None, max_length=100,
        description="Hangi sayfadan gönderildi (debug + analytics)"
    )

    @field_validator("guest_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
        if not cleaned.isdigit():
            raise ValueError("Telefon numarası yalnızca rakam içermelidir.")
        return cleaned

    @field_validator("guest_email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v and "@" not in v:
            raise ValueError("Geçerli bir e-posta adresi giriniz.")
        return v

    @field_validator("preferred_date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            d = date.fromisoformat(v)
        except ValueError:
            raise ValueError("Tarih YYYY-AA-GG formatında olmalıdır.")
        if d < date.today():
            raise ValueError("Geçmiş tarih için rezervasyon yapılamaz.")
        return v

    @field_validator("preferred_time")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v:
            if not re.match(r"^\d{2}:\d{2}$", v):
                raise ValueError("Saat HH:MM formatında olmalıdır.")
        return v

    @model_validator(mode="before")
    @classmethod
    def sanitize_strings(cls, values: dict) -> dict:
        """Temel XSS önleme: HTML etiketlerini temizle."""
        for k, val in values.items():
            if isinstance(val, str):
                values[k] = re.sub(r"<[^>]+>", "", val).strip()
        return values


class PublicReservationResponse(BaseModel):
    status:  str
    ref_id:  str
    message: str
    queue:   Optional[str] = None


# ── BullMQ Redis Payload ───────────────────────────────────────────────────────
async def _push_to_bullmq(queue_name: str, job_data: dict, redis_url: str) -> bool:
    """
    BullMQ formatında Redis'e job ekle.
    BullMQ key formatı: bull:<queue>:jobs

    Not: Tam BullMQ protokolü için Node.js Worker'ı Queue.add() çağırmalı.
    Burada basitleştirilmiş bir Redis push — job-queue.js aynı key'i dinliyor.
    """
    try:
        r = redis_async.from_url(redis_url, decode_responses=True)
        job_id  = str(uuid.uuid4())
        payload = {
            "id":        job_id,
            "data":      str(job_data),
            "timestamp": datetime.utcnow().isoformat(),
            "priority":  "normal",
        }
        # BullMQ list key: bull:{queue}:wait
        await r.rpush(f"bull:{queue_name}:wait", str(payload))
        await r.close()
        return True
    except Exception as exc:
        print(f"[PublicReservation] BullMQ push hatası ({queue_name}): {exc}")
        return False


# ── Ana Endpoint ───────────────────────────────────────────────────────────────
@router.post(
    "/",
    response_model=PublicReservationResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Herkese Açık Rezervasyon Formu",
    description=(
        "Kimlik doğrulaması gerektirmeyen, web formundan gelen "
        "rezervasyon taleplerini BullMQ kuyruğuna atar."
    ),
    tags=["Public"],
)
async def create_public_reservation(
    payload: PublicReservationRequest,
    request: Request,
) -> PublicReservationResponse:
    # ── 1. IP Rate Limit ──────────────────────────────────────────────────────
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"{RATE_LIMIT} rezervasyon talebini {RATE_WINDOW // 60} dakika içinde "
                "kullandınız. Lütfen daha sonra tekrar deneyin veya bizi arayın."
            ),
        )

    # ── 2. Referans ID Oluştur ────────────────────────────────────────────────
    fingerprint = f"{payload.guest_phone}-{payload.preferred_date}-{time.time()}"
    ref_id      = "BK-" + hashlib.sha256(fingerprint.encode()).hexdigest()[:8].upper()

    # ── 3. Job payload ────────────────────────────────────────────────────────
    job_data = {
        "ref_id":         ref_id,
        "guest_name":     payload.guest_name,
        "guest_phone":    payload.guest_phone,
        "guest_email":    payload.guest_email,
        "service_name":   payload.service_name,
        "preferred_date": payload.preferred_date,
        "preferred_time": payload.preferred_time or "10:00",
        "notes":          payload.notes or "",
        "source_page":    payload.source_page or "web",
        "ip":             client_ip,
        "submitted_at":   datetime.utcnow().isoformat(),
    }

    # ── 4. BullMQ Kuyruğuna At ───────────────────────────────────────────────
    import os
    redis_url = os.getenv("REDIS_URL", "redis://cache:6379/1")

    # Rezervasyon kuyruğu (job-queue.js → reservation handler)
    enqueued = await _push_to_bullmq("reservation", job_data, redis_url)

    # E-posta kuyruğu (email varsa)
    if payload.guest_email:
        email_job = {
            "ref_id":      ref_id,
            "to":          payload.guest_email,
            "guest_name":  payload.guest_name,
            "service":     payload.service_name,
            "date":        payload.preferred_date,
            "time":        payload.preferred_time or "10:00",
            "template":    "reservation_confirmation",
        }
        await _push_to_bullmq("email", email_job, redis_url)

    # ── 5. Konsola log (Docker logs'da görünür) ───────────────────────────────
    queue_status = "queued" if enqueued else "fallback_whatsapp"
    print(
        f"[PublicReservation] {ref_id} | "
        f"{payload.guest_name} | {payload.service_name} | "
        f"{payload.preferred_date} | status={queue_status}"
    )

    # ── 6. Yanıt ─────────────────────────────────────────────────────────────
    return PublicReservationResponse(
        status  = queue_status,
        ref_id  = ref_id,
        message = (
            f"Rezervasyonunuz alındı. Referans: {ref_id}. "
            f"En kısa sürede WhatsApp üzerinden teyit edeceğiz."
        ),
        queue   = "reservation" if enqueued else None,
    )


# ── Health Check (Docker healthcheck için) ────────────────────────────────────
@router.get(
    "/health",
    include_in_schema=False,
    tags=["Public"],
)
async def public_health() -> dict:
    return {"status": "ok", "service": "public-reservation", "version": "1.0"}
