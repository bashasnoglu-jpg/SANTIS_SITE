"""Pure idempotency builders for Santis OS.

This package must remain side-effect free: no Airtable writes, no network I/O,
and no comparator/claim mutations.
"""

from .commission_builder import (
    CONTRACT_VERSION,
    KEY_SCHEMA_VERSION,
    CommissionBuildResult,
    CommissionIdentityError,
    CommissionIdentityInput,
    build_commission_dry_run,
    build_commission_idempotency_key,
    build_input_fingerprint,
    normalize_commission_state,
)

__all__ = [
    "CONTRACT_VERSION",
    "KEY_SCHEMA_VERSION",
    "CommissionBuildResult",
    "CommissionIdentityError",
    "CommissionIdentityInput",
    "build_commission_dry_run",
    "build_commission_idempotency_key",
    "build_input_fingerprint",
    "normalize_commission_state",
]
