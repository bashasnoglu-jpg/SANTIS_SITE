from __future__ import annotations

import json
import os
import sys
from typing import Any

from fastapi import FastAPI
from fastapi.testclient import TestClient

SHIFT_ID = "recM6KGAwAje9Nopj"
THERAPIST1_ID = "recjcknHE0T70Ldm0"
THERAPIST2_ID = "recFQE7i08tUxhCEt"
EXPECTED_BOOKING_IDS = {
    "recZXZxciP4rgZ6ik",  # #175
    "recPwTnjUAhQ8cIUc",  # #266
    "recAssjwdeUujUuwq",  # #267
}
BOUNDARY_PATH = "/api/v1/reception/identity/shift-owner/write-through"
SHARED_SECRET = os.environ.get("IDENTITY_BOUNDARY_SHARED_SECRET", "")
RUN_ID = os.environ.get("GITHUB_RUN_ID", "LOCAL")


def require_environment() -> None:
    token = os.environ.get("AIRTABLE_PAT") or os.environ.get("AIRTABLE_API_KEY")
    required = {
        "AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID": (
            os.environ.get("AIRTABLE_BASE_ID") or os.environ.get("AIRTABLE_SANTIS_BASE_ID")
        ),
        "AIRTABLE_PAT or AIRTABLE_API_KEY": token,
        "IDENTITY_BOUNDARY_SHARED_SECRET": SHARED_SECRET,
        "IDENTITY_RECON_CONTROL_RECORD_ID": os.environ.get("IDENTITY_RECON_CONTROL_RECORD_ID"),
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"Missing required acceptance configuration: {missing}")


def build_client() -> TestClient:
    # Import only after runtime environment is validated because the boundary module
    # snapshots environment variables at import time.
    from app.api.v1.endpoints.identity_boundary import router

    app = FastAPI(title="Santis OS Identity Boundary Acceptance")
    app.include_router(router, prefix="/api/v1")
    return TestClient(app)


def call_boundary(
    client: TestClient,
    *,
    correlation_id: str,
    expected_staff_id: str,
    new_staff_id: str,
) -> dict[str, Any]:
    response = client.post(
        BOUNDARY_PATH,
        headers={"x-santis-identity-boundary-secret": SHARED_SECRET},
        json={
            "correlation_id": correlation_id,
            "shift_record_id": SHIFT_ID,
            "expected_current_staff_record_ids": [expected_staff_id],
            "new_staff_record_ids": [new_staff_id],
        },
    )
    payload = response.json()
    if response.status_code != 200:
        raise RuntimeError(
            f"Boundary request failed status={response.status_code} payload={json.dumps(payload, ensure_ascii=True)}"
        )
    return payload


def assert_success_transition(
    payload: dict[str, Any],
    *,
    expected_guard: str,
) -> None:
    if payload.get("status") != "SUCCESS":
        raise AssertionError(payload)
    if payload.get("impact_count") != 3:
        raise AssertionError(f"impact_count != 3: {payload}")
    if set(payload.get("impacted_booking_ids") or []) != EXPECTED_BOOKING_IDS:
        raise AssertionError(f"impacted set mismatch: {payload}")
    if payload.get("boundary_order_proven") is not True:
        raise AssertionError(f"boundary order not proven: {payload}")
    if payload.get("invalidated_at") > payload.get("shift_mutated_at"):
        raise AssertionError(f"shift mutation preceded invalidation: {payload}")

    results = payload.get("booking_results") or []
    if {item.get("booking_record_id") for item in results} != EXPECTED_BOOKING_IDS:
        raise AssertionError(f"booking result set mismatch: {payload}")
    for item in results:
        if item.get("freshness") != "FRESH - SOURCE_MATCH":
            raise AssertionError(f"booking not FRESH after reconcile: {item}")
        if item.get("identity_guard") != expected_guard:
            raise AssertionError(f"unexpected identity guard: {item}")


def main() -> int:
    require_environment()
    client = build_client()

    forward_correlation = f"A3G-PAT-{RUN_ID}-T1-TO-T2"
    restore_correlation = f"A3G-PAT-{RUN_ID}-T2-TO-T1"
    forward_completed = False

    try:
        forward = call_boundary(
            client,
            correlation_id=forward_correlation,
            expected_staff_id=THERAPIST1_ID,
            new_staff_id=THERAPIST2_ID,
        )
        assert_success_transition(
            forward,
            expected_guard="BLOCK - SHIFT_STAFF_IDENTITY_MISMATCH",
        )
        forward_completed = True
        print(
            json.dumps(
                {
                    "phase": "T1_TO_T2",
                    "status": forward.get("status"),
                    "run_id": forward.get("run_id"),
                    "impact_count": forward.get("impact_count"),
                    "boundary_order_proven": forward.get("boundary_order_proven"),
                    "impacted_booking_ids": sorted(forward.get("impacted_booking_ids") or []),
                },
                sort_keys=True,
            )
        )

        duplicate = call_boundary(
            client,
            correlation_id=forward_correlation,
            expected_staff_id=THERAPIST1_ID,
            new_staff_id=THERAPIST2_ID,
        )
        if duplicate.get("status") != "NOOP":
            raise AssertionError(f"duplicate request did not NOOP: {duplicate}")
        print(
            json.dumps(
                {
                    "phase": "DUPLICATE",
                    "status": duplicate.get("status"),
                    "existing_run_id": duplicate.get("existing_run_id"),
                },
                sort_keys=True,
            )
        )

        restore = call_boundary(
            client,
            correlation_id=restore_correlation,
            expected_staff_id=THERAPIST2_ID,
            new_staff_id=THERAPIST1_ID,
        )
        assert_success_transition(
            restore,
            expected_guard="PASS - SHIFT_STAFF_IDENTITY_MATCH",
        )
        forward_completed = False
        print(
            json.dumps(
                {
                    "phase": "RESTORE",
                    "status": restore.get("status"),
                    "run_id": restore.get("run_id"),
                    "impact_count": restore.get("impact_count"),
                    "boundary_order_proven": restore.get("boundary_order_proven"),
                    "impacted_booking_ids": sorted(restore.get("impacted_booking_ids") or []),
                },
                sort_keys=True,
            )
        )
        return 0

    except Exception as exc:
        print(f"A3G PAT E2E acceptance failed: {exc}", file=sys.stderr)
        if forward_completed:
            try:
                cleanup = call_boundary(
                    client,
                    correlation_id=f"A3G-PAT-{RUN_ID}-EMERGENCY-RESTORE",
                    expected_staff_id=THERAPIST2_ID,
                    new_staff_id=THERAPIST1_ID,
                )
                print(
                    json.dumps(
                        {
                            "phase": "EMERGENCY_RESTORE",
                            "status": cleanup.get("status"),
                            "run_id": cleanup.get("run_id"),
                        },
                        sort_keys=True,
                    ),
                    file=sys.stderr,
                )
            except Exception as cleanup_exc:
                print(
                    f"Emergency restore failed; fixture must remain fail-closed and requires operator review: {cleanup_exc}",
                    file=sys.stderr,
                )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
