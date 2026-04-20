#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SANTIS - ESM Smoke Runner
Version: 1.0.0

Amaç:
- Seçilmiş entrypoint'leri gerçek Node runtime ile çalıştırıp ESM geçişi sonrası runtime kırıklarını yakalamak
- CI/CD ve local preflight smoke testi olarak kullanılmak
- Her hedef için stdout/stderr/toplam durum raporu üretmek

Çıktılar:
- esm_smoke.log
- esm_smoke_report.json

Exit code:
- 0 -> Tüm hedefler başarılı
- 1 -> En az bir hedef başarısız

Örnek kullanım:
    python scripts/esm_smoke_runner.py --targets ./server/index.js ./scripts/build.js
    python scripts/esm_smoke_runner.py --config scripts/esm_smoke_targets.json
    python scripts/esm_smoke_runner.py --config scripts/esm_smoke_targets.json --timeout 20
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional

# ---------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------


@dataclass
class SmokeTarget:
    path: str
    args: List[str]
    cwd: Optional[str]
    timeout_seconds: int
    env: Dict[str, str]
    expect_exit_code: int
    mode: str  # "run" | "import"


@dataclass
class SmokeResult:
    path: str
    mode: str
    cwd: str
    command: List[str]
    exit_code: Optional[int]
    expected_exit_code: int
    timed_out: bool
    passed: bool
    duration_ms: int
    stdout: str
    stderr: str
    detected_errors: List[str]


# ---------------------------------------------------------------------
# Error fingerprints
# ---------------------------------------------------------------------

ERROR_PATTERNS = [
    "ERR_MODULE_NOT_FOUND",
    "ERR_REQUIRE_ESM",
    "Cannot use import statement outside a module",
    "require is not defined in ES module scope",
    "does not provide an export named",
    "__dirname is not defined",
    "__filename is not defined",
    "Unexpected token 'export'",
    "Cannot find module",
    "ERR_UNKNOWN_FILE_EXTENSION",
    "ERR_IMPORT_ASSERTION_TYPE_MISSING",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")


def detect_error_fingerprints(stdout: str, stderr: str) -> List[str]:
    haystack = f"{stdout}\n{stderr}"
    found: List[str] = []
    for pattern in ERROR_PATTERNS:
        if pattern in haystack:
            found.append(pattern)
    return found


def resolve_node_binary() -> str:
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js binary not found in PATH.")
    return node


def default_env() -> Dict[str, str]:
    env = dict(os.environ)
    env.setdefault("NODE_ENV", "test")
    env.setdefault("CI", "1")
    env.setdefault("FORCE_COLOR", "0")
    return env


def make_import_probe(entry: Path) -> str:
    # ESM import smoke probe
    normalized = entry.resolve().as_posix()
    return (
        "import(pathToFileURL(process.argv[1]).href)"
        ".then(() => { console.log('[esm-smoke] import-ok'); process.exit(0); })"
        ".catch((err) => { console.error(err && err.stack ? err.stack : String(err)); process.exit(1); });"
    )


def target_from_raw(path_str: str, timeout: int) -> SmokeTarget:
    return SmokeTarget(
        path=path_str,
        args=[],
        cwd=None,
        timeout_seconds=timeout,
        env={},
        expect_exit_code=0,
        mode="run",
    )


# ---------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------


def load_targets_from_config(
    config_path: Path, default_timeout: int
) -> List[SmokeTarget]:
    payload = json.loads(read_text(config_path))
    raw_targets = payload.get("targets", [])
    out: List[SmokeTarget] = []

    for raw in raw_targets:
        out.append(
            SmokeTarget(
                path=raw["path"],
                args=raw.get("args", []),
                cwd=raw.get("cwd"),
                timeout_seconds=int(raw.get("timeout_seconds", default_timeout)),
                env=raw.get("env", {}),
                expect_exit_code=int(raw.get("expect_exit_code", 0)),
                mode=raw.get("mode", "run"),
            )
        )

    return out


# ---------------------------------------------------------------------
# Core execution
# ---------------------------------------------------------------------


def build_command(node_bin: str, target: SmokeTarget, repo_root: Path) -> List[str]:
    entry = Path(target.path)
    if not entry.is_absolute():
        entry = (repo_root / entry).resolve()

    if target.mode == "run":
        return [node_bin, str(entry), *target.args]

    if target.mode == "import":
        # Use a small -e program to import the entry and then exit.
        probe = (
            "import { pathToFileURL } from 'url';"
            "import(pathToFileURL(process.argv[1]).href)"
            ".then(() => { console.log('[esm-smoke] import-ok'); process.exit(0); })"
            ".catch((err) => { console.error(err && err.stack ? err.stack : String(err)); process.exit(1); });"
        )
        return [node_bin, "--input-type=module", "-e", probe, str(entry)]

    raise ValueError(f"Unsupported mode: {target.mode}")


def run_target(node_bin: str, target: SmokeTarget, repo_root: Path) -> SmokeResult:
    entry = Path(target.path)
    if not entry.is_absolute():
        entry = (repo_root / entry).resolve()

    cwd = Path(target.cwd).resolve() if target.cwd else repo_root.resolve()
    env = default_env()
    env.update(target.env)

    command = build_command(node_bin, target, repo_root)

    started = time.perf_counter()
    timed_out = False
    exit_code: Optional[int] = None
    stdout = ""
    stderr = ""

    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            env=env,
            capture_output=True,
            text=True,
            timeout=target.timeout_seconds,
        )
        exit_code = completed.returncode
        stdout = completed.stdout or ""
        stderr = completed.stderr or ""
    except subprocess.TimeoutExpired as exc:
        timed_out = True
        exit_code = None
        stdout = exc.stdout or ""
        stderr = exc.stderr or ""
    except Exception as exc:
        exit_code = None
        stderr = str(exc)

    duration_ms = int((time.perf_counter() - started) * 1000)
    detected = detect_error_fingerprints(stdout, stderr)

    passed = (
        (not timed_out)
        and (exit_code == target.expect_exit_code)
        and (
            len(detected) == 0
            or (target.expect_exit_code != 0 and exit_code == target.expect_exit_code)
        )
    )

    return SmokeResult(
        path=str(entry),
        mode=target.mode,
        cwd=str(cwd),
        command=command,
        exit_code=exit_code,
        expected_exit_code=target.expect_exit_code,
        timed_out=timed_out,
        passed=passed,
        duration_ms=duration_ms,
        stdout=stdout,
        stderr=stderr,
        detected_errors=detected,
    )


# ---------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------


def write_log(path: Path, results: List[SmokeResult]) -> None:
    lines: List[str] = []
    lines.append("=== SANTIS ESM SMOKE RUNNER LOG ===\n")

    if not results:
        lines.append("No targets executed.\n")
    else:
        for item in results:
            lines.append(f"[TARGET] {item.path}")
            lines.append(f"[MODE] {item.mode}")
            lines.append(f"[CWD] {item.cwd}")
            lines.append(f"[COMMAND] {' '.join(item.command)}")
            lines.append(f"[EXIT_CODE] {item.exit_code}")
            lines.append(f"[EXPECTED] {item.expected_exit_code}")
            lines.append(f"[TIMED_OUT] {item.timed_out}")
            lines.append(f"[PASSED] {item.passed}")
            lines.append(f"[DURATION_MS] {item.duration_ms}")
            if item.detected_errors:
                lines.append(f"[DETECTED_ERRORS] {', '.join(item.detected_errors)}")
            if item.stdout.strip():
                lines.append("[STDOUT]")
                lines.append(item.stdout.rstrip())
            if item.stderr.strip():
                lines.append("[STDERR]")
                lines.append(item.stderr.rstrip())
            lines.append("-" * 88)

    write_text(path, "\n".join(lines))


def write_report(path: Path, results: List[SmokeResult]) -> None:
    passed = sum(1 for x in results if x.passed)
    failed = sum(1 for x in results if not x.passed)
    timed_out = sum(1 for x in results if x.timed_out)

    report = {
        "engine": "SANTIS ESM Smoke Runner",
        "version": "1.0.0",
        "targets_total": len(results),
        "targets_passed": passed,
        "targets_failed": failed,
        "targets_timed_out": timed_out,
        "status": "pass" if failed == 0 else "fail",
        "results": [asdict(x) for x in results],
    }

    write_text(path, json.dumps(report, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SANTIS ESM Smoke Runner")
    parser.add_argument(
        "--targets",
        nargs="*",
        default=[],
        help="Doğrudan çalıştırılacak entrypoint listesi",
    )
    parser.add_argument(
        "--config", help="JSON config dosyası. Örn: scripts/esm_smoke_targets.json"
    )
    parser.add_argument(
        "--timeout", type=int, default=15, help="Varsayılan timeout (saniye)"
    )
    parser.add_argument("--out-dir", default=".esm-smoke", help="Log ve rapor klasörü")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    repo_root = Path.cwd().resolve()
    out_dir = (repo_root / args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    node_bin = resolve_node_binary()

    targets: List[SmokeTarget] = []

    if args.config:
        config_path = (repo_root / args.config).resolve()
        targets.extend(load_targets_from_config(config_path, args.timeout))

    for raw in args.targets:
        targets.append(target_from_raw(raw, args.timeout))

    if not targets:
        print("No smoke targets provided. Use --targets or --config.")
        return 1

    results: List[SmokeResult] = []
    for target in targets:
        results.append(run_target(node_bin, target, repo_root))

    write_log(out_dir / "esm_smoke.log", results)
    write_report(out_dir / "esm_smoke_report.json", results)

    passed = sum(1 for x in results if x.passed)
    failed = sum(1 for x in results if not x.passed)

    print("🛡️ SANTIS ESM Smoke Runner tamamlandı.")
    print(f"Targets total : {len(results)}")
    print(f"Passed        : {passed}")
    print(f"Failed        : {failed}")
    print(f"Logs          : {out_dir}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
