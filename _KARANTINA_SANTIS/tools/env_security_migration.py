#!/usr/bin/env python3
"""
Validate admin/security env migration and fail on weak/missing critical settings.

Usage:
  python tools/env_security_migration.py .env
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

WEAK_VALUES = {
    "",
    "admin",
    "password",
    "123456",
    "changeme",
    "santis2026",
    "santis-super-operator-key",
}


def parse_env(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    if not path.exists():
        return data
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            data[key] = value
    return data


def is_git_tracked(path: Path) -> bool:
    try:
        result = subprocess.run(
            ["git", "ls-files", "--error-unmatch", str(path)],
            capture_output=True,
            text=True,
            check=False,
        )
        return result.returncode == 0
    except Exception:
        return False


def main() -> int:
    env_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".env")
    env = parse_env(env_path)

    errors: list[str] = []
    warnings: list[str] = []
    oks: list[str] = []

    if not env:
        errors.append(f"{env_path} missing or empty")
    else:
        oks.append(f"Loaded {env_path}")

    if env_path.exists():
        if is_git_tracked(env_path):
            errors.append(f"{env_path} is git-tracked. Remove from index and rotate secrets.")
        else:
            oks.append(f"{env_path} is not tracked by git index")

    admin_token = env.get("ADMIN_SECRET_TOKEN", "")
    if not admin_token:
        if env.get("SESSION_SECRET"):
            warnings.append("ADMIN_SECRET_TOKEN missing; using legacy SESSION_SECRET fallback.")
            admin_token = env.get("SESSION_SECRET", "")
        else:
            errors.append("Missing ADMIN_SECRET_TOKEN")
    if admin_token:
        if admin_token in WEAK_VALUES or len(admin_token) < 24:
            errors.append("Admin token is weak (min 24 chars random value required)")
        else:
            oks.append("Admin token length/strength check passed")

    username = env.get("ADMIN_USERNAME", "")
    if not username:
        if env.get("ADMIN_USER"):
            warnings.append("Using legacy ADMIN_USER key; migrate to ADMIN_USERNAME.")
            username = env.get("ADMIN_USER", "")
        else:
            errors.append("Missing ADMIN_USERNAME")
    if username:
        if username.lower() in WEAK_VALUES:
            warnings.append("Admin username is weak/common; consider a non-default username.")
        else:
            oks.append("Admin username provided")

    pw_hash = env.get("ADMIN_PASSWORD_HASH", "")
    if not pw_hash and env.get("ADMIN_PASS_HASH"):
        warnings.append("Using legacy ADMIN_PASS_HASH key; migrate to ADMIN_PASSWORD_HASH.")
        pw_hash = env.get("ADMIN_PASS_HASH", "")
    pw_plain = env.get("ADMIN_PASSWORD", "")
    salt = env.get("ADMIN_SALT", "")

    if not pw_hash and not pw_plain:
        errors.append("Missing ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD)")
    elif pw_hash:
        if pw_hash.startswith("$2"):
            oks.append("Password hash format: bcrypt")
        elif re.fullmatch(r"[A-Fa-f0-9]{64}", pw_hash):
            if not salt:
                errors.append("ADMIN_SALT required for SHA-256 password hash mode")
            else:
                oks.append("Password hash format: SHA-256 with salt")
        else:
            errors.append("Unsupported ADMIN_PASSWORD_HASH format (use bcrypt or 64-char SHA-256)")
    else:
        if pw_plain in WEAK_VALUES:
            errors.append("ADMIN_PASSWORD is weak")
        if not salt:
            errors.append("ADMIN_SALT required when ADMIN_PASSWORD is used")
        else:
            warnings.append("Plain ADMIN_PASSWORD in env; prefer ADMIN_PASSWORD_HASH (bcrypt).")

    for item in oks:
        print(f"[OK] {item}")
    for item in warnings:
        print(f"[WARN] {item}")
    for item in errors:
        print(f"[ERROR] {item}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
