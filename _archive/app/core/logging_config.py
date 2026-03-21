"""
app/core/logging_config.py
Production C: Rotating File Logging Setup
------------------------------------------
10 MB per file, 5 backup files.
Separate log streams: app, security, revenue.
"""
from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path


LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"

FORMATTERS = {
    "standard": logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    ),
    "security": logging.Formatter(
        "%(asctime)s | SECURITY | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    ),
}


def _rotating_handler(filename: str, max_bytes: int = 10_000_000, backup_count: int = 5) -> RotatingFileHandler:
    """Create a RotatingFileHandler for the given log filename."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(
        LOGS_DIR / filename,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding="utf-8",
    )
    return handler


def setup_logging(level: int = logging.INFO) -> None:
    """
    Production C: Configure rotating file + console logging.
    Call once from server.py lifespan startup.
    """
    root = logging.getLogger()
    if root.handlers:
        # Avoid double-init (e.g., uvicorn --reload)
        return

    root.setLevel(level)

    # ── Console handler ──────────────────────────────────────────
    console = logging.StreamHandler()
    console.setLevel(level)
    console.setFormatter(FORMATTERS["standard"])
    root.addHandler(console)

    # ── App log (all modules) ────────────────────────────────────
    app_handler = _rotating_handler("santis_app.log")
    app_handler.setFormatter(FORMATTERS["standard"])
    root.addHandler(app_handler)

    # ── Security log (security_logger stream) ────────────────────
    sec_handler = _rotating_handler("santis_security.log")
    sec_handler.setFormatter(FORMATTERS["security"])
    sec_logger = logging.getLogger("SecurityLogger")
    sec_logger.addHandler(sec_handler)
    sec_logger.propagate = False        # Don't bubble up to root

    # ── Revenue / Oracle dedicated log ───────────────────────────
    rev_handler = _rotating_handler("santis_revenue.log")
    rev_handler.setFormatter(FORMATTERS["standard"])
    for name in ("RevenueOracle", "SalesCloser", "RecoveryOffer", "ProfitGuard", "IntelligenceWorker"):
        lg = logging.getLogger(name)
        lg.addHandler(rev_handler)

    # Suppress noisy third-party loggers
    for noisy in ("httpx", "httpcore", "uvicorn.access", "sqlalchemy.engine"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.info("[Production C] Rotating log handlers initialized. Log dir: %s", LOGS_DIR)
