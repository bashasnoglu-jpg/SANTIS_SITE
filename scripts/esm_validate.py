#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SANTIS - ESM Validator
Version: 1.0.0

Amaç:
- Repo içinde ESM geçişi sonrası kalan CJS sızıntılarını bulmak
- CI/CD veya local preflight kontrolü olarak çalışmak
- Güvenli otomatik düzeltme yapmaz; yalnızca doğrulama ve raporlama yapar

Çıktılar:
- esm_validation.log
- esm_validation_report.json

Exit code:
- 0 -> Kritik sorun yok
- 1 -> Hata / yüksek risk bulundu

Kullanım:
    python scripts/esm_validate.py .
    python scripts/esm_validate.py ./apps ./packages ./server
    python scripts/esm_validate.py . --strict
    python scripts/esm_validate.py . --ext .js .mjs .ts
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List

DEFAULT_EXTENSIONS = [".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]

IGNORED_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".turbo",
    ".cache",
    "coverage",
    ".vercel",
    "__pycache__",
}

# ---------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------


@dataclass
class Issue:
    file: str
    line: int
    severity: str
    category: str
    snippet: str
    reason: str


# ---------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------

RE_REQUIRE = re.compile(r"""\brequire\(\s*['"][^'"]+['"]\s*\)""")
RE_REQUIRE_DYNAMIC = re.compile(r"""\brequire\(\s*[^'"][^)]+\)""")

RE_MODULE_EXPORTS = re.compile(r"""\bmodule\.exports\b""")
RE_EXPORTS_PROP = re.compile(r"""\bexports\.[A-Za-z_$][\w$]*\b""")

RE_IMPORT_EQUALS_REQUIRE = re.compile(
    r"""(?m)^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*require\("""
)
RE_TS_IMPORT_REQUIRE = re.compile(
    r"""(?m)^\s*import\s+[A-Za-z_$][\w$]*\s*=\s*require\("""
)

RE_DIRNAME = re.compile(r"""\b__dirname\b""")
RE_FILENAME = re.compile(r"""\b__filename\b""")
RE_IMPORT_META_URL = re.compile(r"""\bimport\.meta\.url\b""")
RE_FILEURLTOPATH = re.compile(r"""\bfileURLToPath\b""")

RE_IMPORT_FROM = re.compile(
    r"""(?m)^\s*import\s+.+?\s+from\s+["'](?P<spec>[^"']+)["']\s*;?\s*$"""
)
RE_SIDE_EFFECT_IMPORT = re.compile(
    r"""(?m)^\s*import\s+["'](?P<spec>[^"']+)["']\s*;?\s*$"""
)

RE_JSON_IMPORT = re.compile(
    r"""(?m)^\s*import\s+.+?\s+from\s+["'](?P<spec>[^"']+\.json)["'](?!\s+assert\s*\{\s*type\s*:\s*["']json["']\s*\})\s*;?\s*$"""
)

RE_CJS_EXTENSION_IMPORT = re.compile(
    r"""(?m)^\s*import\s+.+?\s+from\s+["'](?P<spec>[^"']+\.cjs)["']\s*;?\s*$"""
)

RE_RELATIVE_SPEC = re.compile(r"""^\.{1,2}/""")
RE_HAS_EXTENSION = re.compile(r"""\.(js|mjs|cjs|json|ts|tsx|jsx)$""")

RE_COMMONJS_HINT = re.compile(r"""\b(require\(|module\.exports|exports\.)""")

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")


def iter_files(roots: Iterable[Path], exts: List[str]) -> Iterable[Path]:
    extset = {e.lower() for e in exts}
    for root in roots:
        if root.is_file():
            if root.suffix.lower() in extset:
                yield root
            continue

        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if any(part in IGNORED_DIRS for part in path.parts):
                continue
            if path.suffix.lower() in extset:
                yield path


def line_number_from_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def make_snippet(text: str, start: int, end: int, max_len: int = 220) -> str:
    raw = text[start:end].strip().replace("\n", " ")
    raw = re.sub(r"\s+", " ", raw)
    return raw[:max_len]


def is_relative(spec: str) -> bool:
    return bool(RE_RELATIVE_SPEC.match(spec))


def has_extension(spec: str) -> bool:
    return bool(RE_HAS_EXTENSION.search(spec))


# ---------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------


def validate_file(path: Path, content: str, issues: List[Issue], strict: bool) -> None:
    # Raw CJS markers
    for m in RE_REQUIRE.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="high",
                category="require-call",
                snippet=make_snippet(content, m.start(), m.end()),
                reason="ESM dosyasında require() kalmış.",
            )
        )

    for m in RE_REQUIRE_DYNAMIC.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="critical",
                category="dynamic-require",
                snippet=make_snippet(content, m.start(), m.end()),
                reason="Dynamic require kalmış; ESM geçişinde en riskli kalıntı.",
            )
        )

    for m in RE_MODULE_EXPORTS.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="high",
                category="module-exports",
                snippet=make_snippet(content, m.start(), m.end()),
                reason="module.exports kalmış.",
            )
        )

    for m in RE_EXPORTS_PROP.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="high",
                category="exports-prop",
                snippet=make_snippet(content, m.start(), m.end()),
                reason="exports.foo kalmış.",
            )
        )

    for m in RE_IMPORT_EQUALS_REQUIRE.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="high",
                category="require-assignment",
                snippet=make_snippet(content, m.start(), m.end()),
                reason="require assignment kalmış.",
            )
        )

    for m in RE_TS_IMPORT_REQUIRE.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="high",
                category="ts-import-require",
                snippet=make_snippet(content, m.start(), m.end()),
                reason="import = require(...) hibrit kalıntısı var.",
            )
        )

    # __dirname / __filename bridge kontrolü
    uses_dir = bool(RE_DIRNAME.search(content) or RE_FILENAME.search(content))
    has_bridge = bool(
        RE_IMPORT_META_URL.search(content) or RE_FILEURLTOPATH.search(content)
    )

    if uses_dir and not has_bridge:
        issues.append(
            Issue(
                file=str(path),
                line=1,
                severity="medium",
                category="dirname-filename-bridge-missing",
                snippet="__dirname/__filename",
                reason="__dirname veya __filename kullanılıyor ama ESM bridge görünmüyor.",
            )
        )

    # Missing extension on relative imports
    for m in RE_IMPORT_FROM.finditer(content):
        spec = m.group("spec")
        if is_relative(spec) and not has_extension(spec):
            issues.append(
                Issue(
                    file=str(path),
                    line=line_number_from_offset(content, m.start()),
                    severity="high",
                    category="missing-import-extension",
                    snippet=make_snippet(content, m.start(), m.end()),
                    reason="Relative import uzantısız; ESM runtime kırılabilir.",
                )
            )

    for m in RE_SIDE_EFFECT_IMPORT.finditer(content):
        spec = m.group("spec")
        if is_relative(spec) and not has_extension(spec):
            issues.append(
                Issue(
                    file=str(path),
                    line=line_number_from_offset(content, m.start()),
                    severity="high",
                    category="missing-side-effect-import-extension",
                    snippet=make_snippet(content, m.start(), m.end()),
                    reason="Side-effect relative import uzantısız.",
                )
            )

    # JSON import without assertion
    for m in RE_JSON_IMPORT.finditer(content):
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity="medium",
                category="json-import-missing-assertion",
                snippet=make_snippet(content, m.start(), m.end()),
                reason='JSON import var ama `assert { type: "json" }` yok.',
            )
        )

    # .cjs imported from ESM
    for m in RE_CJS_EXTENSION_IMPORT.finditer(content):
        sev = "medium" if not strict else "high"
        issues.append(
            Issue(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                severity=sev,
                category="cjs-imported-into-esm",
                snippet=make_snippet(content, m.start(), m.end()),
                reason=".cjs modül ESM içinden import ediliyor; geçiş tamamlanmamış olabilir.",
            )
        )

    # File itself still .cjs
    if path.suffix.lower() == ".cjs":
        sev = "medium" if not strict else "high"
        issues.append(
            Issue(
                file=str(path),
                line=1,
                severity=sev,
                category="cjs-file-present",
                snippet=path.name,
                reason=".cjs dosya hâlâ repo içinde mevcut.",
            )
        )

    # Strict mode: flag any CommonJS hint, even if missed above
    if strict:
        for m in RE_COMMONJS_HINT.finditer(content):
            issues.append(
                Issue(
                    file=str(path),
                    line=line_number_from_offset(content, m.start()),
                    severity="medium",
                    category="strict-commonjs-hint",
                    snippet=make_snippet(content, m.start(), m.end()),
                    reason="Strict mode CommonJS izi tespit etti.",
                )
            )


# ---------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------


def write_log(path: Path, issues: List[Issue]) -> None:
    lines = ["=== SANTIS ESM VALIDATION LOG ===\n"]
    if not issues:
        lines.append("No ESM validation issues found.\n")
    else:
        for item in issues:
            lines.append(f"[FILE] {item.file}")
            lines.append(f"[LINE] {item.line}")
            lines.append(f"[SEVERITY] {item.severity}")
            lines.append(f"[CATEGORY] {item.category}")
            lines.append(f"[REASON] {item.reason}")
            lines.append(f"[SNIPPET] {item.snippet}")
            lines.append("-" * 72)
    write_text(path, "\n".join(lines))


def write_report(
    path: Path, scanned_files: int, issues: List[Issue], strict: bool
) -> None:
    by_category: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}

    for issue in issues:
        by_category[issue.category] = by_category.get(issue.category, 0) + 1
        by_severity[issue.severity] = by_severity.get(issue.severity, 0) + 1

    critical_count = by_severity.get("critical", 0)
    high_count = by_severity.get("high", 0)

    report = {
        "engine": "SANTIS ESM Validator",
        "version": "1.0.0",
        "strict_mode": strict,
        "scanned_files": scanned_files,
        "issues_count": len(issues),
        "issues_by_category": by_category,
        "issues_by_severity": by_severity,
        "status": "pass" if (critical_count == 0 and high_count == 0) else "fail",
        "issues": [asdict(issue) for issue in issues],
    }

    write_text(path, json.dumps(report, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SANTIS ESM Validator")
    parser.add_argument("paths", nargs="+", help="Taranacak dosya veya klasörler")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Daha agresif denetim uygular; .cjs varlığını ve CommonJS izlerini daha sert ele alır",
    )
    parser.add_argument(
        "--ext",
        nargs="*",
        default=DEFAULT_EXTENSIONS,
        help="Taranacak uzantılar. Örn: --ext .js .mjs .ts",
    )
    parser.add_argument(
        "--out-dir", default=".esm-validate", help="Raporların yazılacağı klasör"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    roots = [Path(p).resolve() for p in args.paths]
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    issues: List[Issue] = []
    files = list(iter_files(roots, args.ext))

    for path in files:
        try:
            content = read_text(path)
            validate_file(path, content, issues, args.strict)
        except Exception as exc:
            issues.append(
                Issue(
                    file=str(path),
                    line=1,
                    severity="high",
                    category="processing-error",
                    snippet=str(exc),
                    reason="Dosya doğrulanırken hata oluştu.",
                )
            )

    write_log(out_dir / "esm_validation.log", issues)
    write_report(
        out_dir / "esm_validation_report.json", len(files), issues, args.strict
    )

    critical_count = sum(1 for x in issues if x.severity == "critical")
    high_count = sum(1 for x in issues if x.severity == "high")

    print("🛡️ SANTIS ESM Validator tamamlandı.")
    print(f"Scanned files : {len(files)}")
    print(f"Issues        : {len(issues)}")
    print(f"Critical      : {critical_count}")
    print(f"High          : {high_count}")
    print(f"Logs          : {out_dir}")

    return 1 if (critical_count > 0 or high_count > 0) else 0


if __name__ == "__main__":
    sys.exit(main())
