"""
app/core/db_indexes.py
Production D: SQLite Index Migration
--------------------------------------
Ensures all critical query paths are indexed.
Safe to call on every startup — uses CREATE INDEX IF NOT EXISTS.
"""
from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

logger = logging.getLogger("DBIndexMigration")


# ── Index definitions ────────────────────────────────────────────
INDEXES = [
    # revenue_scores — most queried table
    ("idx_rs_session_id",   "revenue_scores", "session_id"),
    ("idx_rs_tenant_id",    "revenue_scores", "tenant_id"),
    ("idx_rs_conv_status",  "revenue_scores", "conversion_status"),
    ("idx_rs_churn_reason", "revenue_scores", "churn_reason"),

    # Composite: whale leaderboard query
    (
        "idx_rs_whale_score",
        "revenue_scores",
        "is_whale DESC, composite_score DESC",
        True,   # is_composite
    ),
    # Composite: time-range funnel queries
    (
        "idx_rs_scored_at_tenant",
        "revenue_scores",
        "tenant_id, scored_at DESC",
        True,
    ),

    # bookings
    ("idx_bk_customer_id", "bookings", "customer_id"),
    ("idx_bk_created_at",  "bookings", "created_at DESC"),
    ("idx_bk_tenant_id",   "bookings", "tenant_id"),

    # tenants
    ("idx_tn_name",         "tenants",  "name"),
    ("idx_tn_active",       "tenants",  "is_active"),
    ("idx_tn_not_deleted",  "tenants",  "is_deleted, is_active"),
]


def ensure_indexes(db_path: str | Path) -> dict:
    """
    Create SQLite indexes if they don't exist.
    Returns summary: {created: int, skipped: int, failed: list}.
    """
    db_path = str(db_path)
    created = 0
    skipped = 0
    failed  = []

    try:
        con = sqlite3.connect(db_path, check_same_thread=False)
        con.row_factory = sqlite3.Row

        # Get existing tables to skip indexes on non-existent tables
        existing_tables = {
            row[0] for row in
            con.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        # Get existing indexes
        existing_indexes = {
            row[0] for row in
            con.execute("SELECT name FROM sqlite_master WHERE type='index'")
        }

        for entry in INDEXES:
            idx_name  = entry[0]
            table     = entry[1]
            columns   = entry[2]

            if table not in existing_tables:
                logger.debug(f"[DBIndex] Skipping {idx_name} — table '{table}' not found")
                skipped += 1
                continue

            if idx_name in existing_indexes:
                skipped += 1
                continue

            try:
                con.execute(
                    f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({columns})"
                )
                created += 1
                logger.info(f"[DBIndex] Created: {idx_name} ON {table}({columns})")
            except sqlite3.OperationalError as e:
                failed.append({"index": idx_name, "error": str(e)})
                logger.warning(f"[DBIndex] Failed: {idx_name} — {e}")

        con.commit()
        con.close()

    except Exception as e:
        logger.error(f"[DBIndex] Migration failed: {e}")
        failed.append({"index": "*", "error": str(e)})

    summary = {"created": created, "skipped": skipped, "failed": failed}
    logger.info(
        f"[DBIndex] Migration complete — created={created} skipped={skipped} failed={len(failed)}"
    )
    return summary
