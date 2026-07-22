from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/admin/automation-control", tags=["admin-automation-control"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")
AUTOMATION_CONTROL_TABLE_ID = os.getenv(
    "AIRTABLE_AUTOMATION_CONTROL_TABLE_ID",
    "tblbms0l1rOzM7U5L",
)
READ_ENABLED_ENV = "SANTIS_AUTOMATION_CONTROL_READ_ENABLED"

AUTOMATION_CONTROL_FIELDS = [
    "Automation Name",
    "Automation Group",
    "Source Table",
    "Target Table",
    "Environment",
    "Airtable Status",
    "Santis OS Status",
    "Risk Level",
    "Can Activate?",
    "Activation Order",
    "Tenant_Link",
    "Location_Link",
    "Trigger_Type",
    "Last_Run_At",
    "Last_Result",
    "Error_Log",
    "Run_Request",
    "Can_Run",
]


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _flag_enabled(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "on"}


def _airtable_token() -> str:
    token = _first_env(AIRTABLE_TOKEN_ENV_KEYS)
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Airtable token is not configured on the backend.",
        )
    return token


def _airtable_base_id() -> str:
    base_id = _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
    if not base_id:
        raise HTTPException(
            status_code=503,
            detail="Airtable base is not configured on the backend.",
        )
    return base_id


def _airtable_get(params: list[tuple[str, str]]) -> dict[str, Any]:
    base_id = _airtable_base_id()
    token = _airtable_token()
    url = (
        f"{AIRTABLE_API_URL}/{base_id}/{AUTOMATION_CONTROL_TABLE_ID}"
        f"?{urlencode(params)}"
    )
    request = Request(url, headers={"Authorization": f"Bearer {token}"})

    try:
        with urlopen(request, timeout=15) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=502,
            detail=f"Automation control read failed: {body[:500]}",
        ) from exc
    except URLError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Automation control network error: {exc.reason}",
        ) from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="Automation control source returned invalid JSON.",
        ) from exc


def _list_records() -> list[dict[str, Any]]:
    params: list[tuple[str, str]] = [
        ("pageSize", "100"),
        ("cellFormat", "string"),
        ("timeZone", "Europe/Podgorica"),
        ("userLocale", "en-us"),
    ]
    for field_name in AUTOMATION_CONTROL_FIELDS:
        params.append(("fields[]", field_name))

    records: list[dict[str, Any]] = []
    offset: str | None = None

    while True:
        page_params = list(params)
        if offset:
            page_params.append(("offset", offset))

        payload = _airtable_get(page_params)
        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            return records


def _parse_number(value: Any) -> float | int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            return None
        try:
            return float(normalized) if "." in normalized else int(normalized)
        except ValueError:
            return None
    return None


def _parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value in (1, 1.0)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "1.0", "true", "yes", "on", "checked"}:
            return True
        if normalized in {"0", "0.0", "false", "no", "off", "unchecked", ""}:
            return False
        try:
            return float(normalized) == 1.0
        except ValueError:
            return False
    return False


def _normalize_item(record: dict[str, Any]) -> dict[str, Any]:
    fields = record.get("fields") or {}

    return {
        "id": record.get("id"),
        "name": fields.get("Automation Name", "Unnamed automation"),
        "group": fields.get("Automation Group"),
        "sourceTable": fields.get("Source Table"),
        "targetTable": fields.get("Target Table"),
        "environment": fields.get("Environment"),
        "airtableStatus": fields.get("Airtable Status"),
        "santisStatus": fields.get("Santis OS Status"),
        "riskLevel": fields.get("Risk Level"),
        "canActivate": _parse_bool(fields.get("Can Activate?")),
        "activationOrder": _parse_number(fields.get("Activation Order")),
        "tenant": fields.get("Tenant_Link"),
        "location": fields.get("Location_Link"),
        "triggerType": fields.get("Trigger_Type"),
        "lastRunAt": fields.get("Last_Run_At"),
        "lastResult": fields.get("Last_Result"),
        "errorLog": fields.get("Error_Log"),
        "runRequested": _parse_bool(fields.get("Run_Request")),
        "canRun": _parse_bool(fields.get("Can_Run")),
    }


@router.get("")
def get_automation_control_registry() -> dict[str, Any]:
    """Read-only Santis OS automation governance registry.

    This endpoint deliberately exposes no mutation action. It reads the existing
    Airtable Automation_Control table and returns a normalized admin-panel view.
    """
    if not _flag_enabled(READ_ENABLED_ENV):
        raise HTTPException(
            status_code=503,
            detail=(
                "Automation Control read surface is disabled. "
                f"Set {READ_ENABLED_ENV}=true only for an approved preview/pilot."
            ),
        )

    items = [_normalize_item(record) for record in _list_records()]
    items.sort(
        key=lambda item: (
            item["activationOrder"] is None,
            item["activationOrder"] if item["activationOrder"] is not None else 999999,
            str(item["name"]).lower(),
        )
    )

    return {
        "ok": True,
        "mode": "read-only",
        "source": "Automation_Control",
        "count": len(items),
        "observedAt": datetime.now(timezone.utc).isoformat(),
        "items": items,
    }
