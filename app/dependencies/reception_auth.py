from __future__ import annotations

import os
import secrets
from typing import Final

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict

RECEPTION_WRITE_TOKEN_ENV: Final = "SANTIS_RECEPTION_WRITE_TOKEN"
RECEPTION_ACTOR_ID_ENV: Final = "SANTIS_RECEPTION_ACTOR_ID"
RECEPTION_ROLE_ENV: Final = "SANTIS_RECEPTION_ROLE"
RECEPTION_TENANT_ID_ENV: Final = "SANTIS_RECEPTION_TENANT_ID"
RECEPTION_LOCATION_IDS_ENV: Final = "SANTIS_RECEPTION_ALLOWED_LOCATION_IDS"
RECEPTION_FORCE_LIVE_ENV: Final = "SANTIS_RECEPTION_CAN_FORCE_LIVE"
RECEPTION_OVERRIDE_UNPAID_ENV: Final = "SANTIS_RECEPTION_CAN_OVERRIDE_UNPAID"

_ALLOWED_WRITE_ROLES: Final = frozenset({"reception", "reception_admin", "manager", "service"})
_SECURITY = HTTPBearer(auto_error=False)


class ReceptionActor(BaseModel):
    """Fail-closed actor context for the reception write surface.

    This is intentionally an MVP service actor. A later JWT/OAuth provider can
    replace the dependency without changing endpoint authorization checks.
    """

    model_config = ConfigDict(frozen=True)

    actor_id: str
    role: str
    tenant_id: str
    allowed_location_ids: tuple[str, ...]
    can_force_live: bool = False
    can_override_unpaid: bool = False


def _env_flag(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "on"}


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reception write authentication is not configured.",
        )
    return value


def _record_ids_from_env(name: str) -> tuple[str, ...]:
    raw = _required_env(name)
    values = tuple(dict.fromkeys(part.strip() for part in raw.split(",") if part.strip()))
    if not values or any(not value.startswith("rec") for value in values):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reception write actor context is not configured correctly.",
        )
    return values


async def require_reception_write_actor(
    credentials: HTTPAuthorizationCredentials | None = Security(_SECURITY),
) -> ReceptionActor:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expected_token = _required_env(RECEPTION_WRITE_TOKEN_ENV)
    if not secrets.compare_digest(credentials.credentials, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = os.getenv(RECEPTION_ROLE_ENV, "reception").strip().lower()
    if role not in _ALLOWED_WRITE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reception write permission required.",
        )

    actor_id = os.getenv(RECEPTION_ACTOR_ID_ENV, "reception-service").strip() or "reception-service"
    tenant_id = _required_env(RECEPTION_TENANT_ID_ENV)
    if not tenant_id.startswith("rec"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reception write actor context is not configured correctly.",
        )

    return ReceptionActor(
        actor_id=actor_id,
        role=role,
        tenant_id=tenant_id,
        allowed_location_ids=_record_ids_from_env(RECEPTION_LOCATION_IDS_ENV),
        can_force_live=_env_flag(RECEPTION_FORCE_LIVE_ENV),
        can_override_unpaid=_env_flag(RECEPTION_OVERRIDE_UNPAID_ENV),
    )
