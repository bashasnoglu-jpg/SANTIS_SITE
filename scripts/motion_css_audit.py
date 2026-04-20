#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SANTIS - Motion CSS Audit & Guided Replace
Version: 1.0.0

Amaç:
- CSS/HTML/JS içindeki motion debt kalıntılarını tarar
- Güvenli transition: all kullanımlarını transform/opacity disiplinine çevirir
- Riskli alanları manual_review.log'a bırakır
- Çalışmanın özetini risk_report.json olarak üretir

Çıktılar:
- safe_replacements.log
- manual_review.log
- risk_report.json

Varsayılan davranış:
- CSS dosyalarında güvenli replace uygular
- HTML/JS içinde sadece audit yapar
- inline style ve karmaşık blokları manuel review'a bırakır

Kullanım:
    python motion_css_audit.py .
    python motion_css_audit.py ./src --write
    python motion_css_audit.py ./src ./admin ./tr --write --backup
    python motion_css_audit.py . --ext .css .scss .html .js

Not:
- --write verilmezse sadece audit yapılır
- --backup verilirse değişen dosyalar için .bak kopyası alınır
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

DEFAULT_EXTENSIONS = [".css", ".scss", ".html", ".js", ".jsx", ".ts", ".tsx"]

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

SAFE_TRANSITION_REPLACEMENT = (
    "transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s linear;"
)

SAFE_TRANSITION_PROPERTY_REPLACEMENT = "transition-property: transform, opacity;"

# ---------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------


@dataclass
class Finding:
    file: str
    line: int
    category: str
    severity: str
    snippet: str
    action: str
    reason: str


@dataclass
class Replacement:
    file: str
    line: int
    category: str
    before: str
    after: str
    reason: str


# ---------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------

RE_TRANSITION_ALL = re.compile(r"transition\s*:\s*all\b[^;]*;", re.IGNORECASE)

RE_TRANSITION_PROPERTY_ALL = re.compile(
    r"transition-property\s*:\s*all\b[^;]*;", re.IGNORECASE
)

RE_TRANSITION_DECL = re.compile(r"transition\s*:\s*([^;]+);", re.IGNORECASE)

RE_TRANSITION_PROPERTY_DECL = re.compile(
    r"transition-property\s*:\s*([^;]+);", re.IGNORECASE
)

RE_DANGEROUS_PROPS = re.compile(
    r"\b(width|height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|top|left|right|bottom)\b",
    re.IGNORECASE,
)

RE_VISUAL_HEAVY_PROPS = re.compile(
    r"\b(box-shadow|filter|backdrop-filter)\b", re.IGNORECASE
)

RE_COLORISH_PROPS = re.compile(
    r"\b(color|background|background-color|border|border-color|fill|stroke)\b",
    re.IGNORECASE,
)

RE_INLINE_STYLE_ALL = re.compile(
    r'style\s*=\s*["\'][^"\']*transition\s*:\s*all\b[^"\']*["\']', re.IGNORECASE
)

RE_HOVER_BLOCK = re.compile(
    r"([^{]+:(?:hover|focus|focus-visible|active)[^{]*)\{([^}]*)\}",
    re.IGNORECASE | re.DOTALL,
)

RE_ANIMATION_DECL = re.compile(r"animation(?:-[a-z]+)?\s*:\s*[^;]+;", re.IGNORECASE)

RE_WILL_CHANGE = re.compile(r"will-change\s*:\s*([^;]+);", re.IGNORECASE)

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")


def iter_files(roots: Iterable[Path], exts: List[str]) -> Iterable[Path]:
    normalized_exts = {e.lower() for e in exts}
    for root in roots:
        if root.is_file():
            if root.suffix.lower() in normalized_exts:
                yield root
            continue

        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if any(part in IGNORED_DIRS for part in path.parts):
                continue
            if path.suffix.lower() in normalized_exts:
                yield path


def line_number_from_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def make_snippet(text: str, start: int, end: int, max_len: int = 220) -> str:
    raw = text[start:end].strip().replace("\n", " ")
    raw = re.sub(r"\s+", " ", raw)
    return raw[:max_len]


def backup_file(path: Path) -> None:
    backup_path = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup_path)


def is_css_file(path: Path) -> bool:
    return path.suffix.lower() in {".css", ".scss"}


def is_html_like(path: Path) -> bool:
    return path.suffix.lower() in {".html"}


def is_js_like(path: Path) -> bool:
    return path.suffix.lower() in {".js", ".jsx", ".ts", ".tsx"}


def contains_colorish_transition(value: str) -> bool:
    return bool(RE_COLORISH_PROPS.search(value))


def contains_dangerous_transition(value: str) -> bool:
    return bool(RE_DANGEROUS_PROPS.search(value))


def contains_visual_heavy(value: str) -> bool:
    return bool(RE_VISUAL_HEAVY_PROPS.search(value))


# ---------------------------------------------------------------------
# Core analysis
# ---------------------------------------------------------------------


def analyze_hover_blocks(path: Path, content: str, findings: List[Finding]) -> None:
    return


def analyze_inline_styles(path: Path, content: str, findings: List[Finding]) -> None:
    for match in RE_INLINE_STYLE_ALL.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, match.start()),
                category="inline-transition-all",
                severity="high",
                snippet=make_snippet(content, match.start(), match.end()),
                action="manual-review",
                reason="Inline style içinde transition: all bulundu; otomatik düzeltme güvenli değil.",
            )
        )


def analyze_animation_decls(path: Path, content: str, findings: List[Finding]) -> None:
    for match in RE_ANIMATION_DECL.finditer(content):
        snippet = match.group(0)
        if RE_VISUAL_HEAVY_PROPS.search(snippet) or RE_DANGEROUS_PROPS.search(snippet):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, match.start()),
                    category="animation-risk",
                    severity="medium",
                    snippet=make_snippet(content, match.start(), match.end()),
                    action="manual-review",
                    reason="Animation deklarasyonu riskli property kombinasyonlarıyla ilişkili olabilir.",
                )
            )


def analyze_will_change(path: Path, content: str, findings: List[Finding]) -> None:
    for match in RE_WILL_CHANGE.finditer(content):
        value = match.group(1)
        if contains_dangerous_transition(value) or contains_visual_heavy(value):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, match.start()),
                    category="will-change-risk",
                    severity="medium",
                    snippet=make_snippet(content, match.start(), match.end()),
                    action="manual-review",
                    reason="will-change maliyetli bir property'e işaret ediyor.",
                )
            )


def analyze_transition_all(path: Path, content: str, findings: List[Finding]) -> None:
    for match in RE_TRANSITION_ALL.finditer(content):
        snippet = match.group(0)
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, match.start()),
                category="transition-all",
                severity="high",
                snippet=snippet.strip(),
                action="safe-replace-candidate"
                if is_css_file(path)
                else "manual-review",
                reason="transition: all composite-only motion disiplinini ihlal ediyor.",
            )
        )

    for match in RE_TRANSITION_PROPERTY_ALL.finditer(content):
        snippet = match.group(0)
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, match.start()),
                category="transition-property-all",
                severity="high",
                snippet=snippet.strip(),
                action="safe-replace-candidate"
                if is_css_file(path)
                else "manual-review",
                reason="transition-property: all açıkça yasaklı.",
            )
        )


def analyze_transition_values(
    path: Path, content: str, findings: List[Finding]
) -> None:
    for match in RE_TRANSITION_DECL.finditer(content):
        value = match.group(1)
        start = match.start()

        if contains_dangerous_transition(value):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, start),
                    category="transition-layout-prop",
                    severity="high",
                    snippet=make_snippet(content, match.start(), match.end()),
                    action="manual-review",
                    reason="Transition içinde layout-affecting property tespit edildi.",
                )
            )

        if contains_visual_heavy(value):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, start),
                    category="transition-heavy-visual",
                    severity="medium",
                    snippet=make_snippet(content, match.start(), match.end()),
                    action="manual-review",
                    reason="Transition içinde box-shadow/filter/backdrop-filter tespit edildi.",
                )
            )

    for match in RE_TRANSITION_PROPERTY_DECL.finditer(content):
        value = match.group(1)
        start = match.start()

        if contains_dangerous_transition(value):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, start),
                    category="transition-property-layout-prop",
                    severity="high",
                    snippet=make_snippet(content, match.start(), match.end()),
                    action="manual-review",
                    reason="transition-property layout-affecting property içeriyor.",
                )
            )

        if contains_visual_heavy(value):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, start),
                    category="transition-property-heavy-visual",
                    severity="medium",
                    snippet=make_snippet(content, match.start(), match.end()),
                    action="manual-review",
                    reason="transition-property box-shadow/filter/backdrop-filter içeriyor.",
                )
            )


# ---------------------------------------------------------------------
# Guided replace
# ---------------------------------------------------------------------


def replace_safe_transition_all(
    path: Path,
    content: str,
    replacements: List[Replacement],
) -> Tuple[str, int]:
    count = 0

    def repl(match: re.Match) -> str:
        nonlocal count
        before = match.group(0)
        line = line_number_from_offset(content, match.start())

        replacements.append(
            Replacement(
                file=str(path),
                line=line,
                category="transition-all",
                before=before.strip(),
                after=SAFE_TRANSITION_REPLACEMENT,
                reason="Güvenli guided replace: transition: all -> transform + opacity",
            )
        )
        count += 1
        return SAFE_TRANSITION_REPLACEMENT

    new_content = RE_TRANSITION_ALL.sub(repl, content)
    return new_content, count


def replace_safe_transition_property_all(
    path: Path,
    content: str,
    replacements: List[Replacement],
) -> Tuple[str, int]:
    count = 0

    def repl(match: re.Match) -> str:
        nonlocal count
        before = match.group(0)
        line = line_number_from_offset(content, match.start())

        replacements.append(
            Replacement(
                file=str(path),
                line=line,
                category="transition-property-all",
                before=before.strip(),
                after=SAFE_TRANSITION_PROPERTY_REPLACEMENT,
                reason="Güvenli guided replace: transition-property: all -> transform, opacity",
            )
        )
        count += 1
        return SAFE_TRANSITION_PROPERTY_REPLACEMENT

    new_content = RE_TRANSITION_PROPERTY_ALL.sub(repl, content)
    return new_content, count


# ---------------------------------------------------------------------
# Logging & reporting
# ---------------------------------------------------------------------


def write_safe_log(path: Path, replacements: List[Replacement]) -> None:
    lines = []
    lines.append("=== SANTIS SAFE REPLACEMENTS LOG ===\n")
    if not replacements:
        lines.append("No safe replacements were applied.\n")
    else:
        for item in replacements:
            lines.append(f"[FILE] {item.file}")
            lines.append(f"[LINE] {item.line}")
            lines.append(f"[CATEGORY] {item.category}")
            lines.append(f"[REASON] {item.reason}")
            lines.append(f"[BEFORE] {item.before}")
            lines.append(f"[AFTER ] {item.after}")
            lines.append("-" * 72)
    write_text(path, "\n".join(lines))


def write_manual_log(path: Path, findings: List[Finding]) -> None:
    lines = []
    lines.append("=== SANTIS MANUAL REVIEW LOG ===\n")
    if not findings:
        lines.append("No manual review findings.\n")
    else:
        for item in findings:
            lines.append(f"[FILE] {item.file}")
            lines.append(f"[LINE] {item.line}")
            lines.append(f"[CATEGORY] {item.category}")
            lines.append(f"[SEVERITY] {item.severity}")
            lines.append(f"[ACTION] {item.action}")
            lines.append(f"[REASON] {item.reason}")
            lines.append(f"[SNIPPET] {item.snippet}")
            lines.append("-" * 72)
    write_text(path, "\n".join(lines))


def write_risk_report(
    path: Path,
    scanned_files: int,
    changed_files: int,
    findings: List[Finding],
    replacements: List[Replacement],
) -> None:
    by_category: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    for f in findings:
        by_category[f.category] = by_category.get(f.category, 0) + 1
        by_severity[f.severity] = by_severity.get(f.severity, 0) + 1

    report = {
        "engine": "SANTIS Motion CSS Audit",
        "version": "1.0.0",
        "scanned_files": scanned_files,
        "changed_files": changed_files,
        "safe_replacements_count": len(replacements),
        "manual_review_count": len(findings),
        "findings_by_category": by_category,
        "findings_by_severity": by_severity,
        "summary": {
            "status": (
                "clean"
                if not findings and not replacements
                else "needs_review"
                if findings
                else "safe_replacements_applied"
            )
        },
        "safe_replacements": [asdict(r) for r in replacements],
        "manual_review_items": [asdict(f) for f in findings],
    }
    write_text(path, json.dumps(report, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------
# Main process
# ---------------------------------------------------------------------


def process_file(
    path: Path,
    write: bool,
    backup: bool,
    findings: List[Finding],
    replacements: List[Replacement],
) -> bool:
    original = read_text(path)
    content = original

    analyze_transition_all(path, content, findings)
    analyze_transition_values(path, content, findings)
    analyze_hover_blocks(path, content, findings)
    analyze_animation_decls(path, content, findings)
    analyze_will_change(path, content, findings)

    if is_html_like(path) or is_js_like(path):
        analyze_inline_styles(path, content, findings)

    changed = False

    if write and is_css_file(path):
        content, count1 = replace_safe_transition_all(path, content, replacements)
        content, count2 = replace_safe_transition_property_all(
            path, content, replacements
        )

        if (count1 + count2) > 0 and content != original:
            if backup:
                backup_file(path)
            write_text(path, content)
            changed = True

    return changed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="SANTIS Motion CSS Audit & Guided Replace"
    )
    parser.add_argument("paths", nargs="+", help="Taranacak dosya veya klasör yolları")
    parser.add_argument(
        "--write", action="store_true", help="Güvenli replace işlemlerini uygular"
    )
    parser.add_argument(
        "--backup", action="store_true", help="Değişen dosyaların .bak kopyasını alır"
    )
    parser.add_argument(
        "--ext",
        nargs="*",
        default=DEFAULT_EXTENSIONS,
        help="Taranacak uzantılar. Örn: --ext .css .scss .html",
    )
    parser.add_argument(
        "--out-dir", default=".motion-audit", help="Log ve raporların yazılacağı klasör"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    roots = [Path(p).resolve() for p in args.paths]
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    findings: List[Finding] = []
    replacements: List[Replacement] = []

    files = list(iter_files(roots, args.ext))
    changed_files = 0

    for path in files:
        try:
            changed = process_file(
                path=path,
                write=args.write,
                backup=args.backup,
                findings=findings,
                replacements=replacements,
            )
            if changed:
                changed_files += 1
        except Exception as exc:
            findings.append(
                Finding(
                    file=str(path),
                    line=1,
                    category="processing-error",
                    severity="high",
                    snippet=str(exc),
                    action="manual-review",
                    reason="Dosya işlenirken hata oluştu.",
                )
            )

    safe_log = out_dir / "safe_replacements.log"
    manual_log = out_dir / "manual_review.log"
    risk_report = out_dir / "risk_report.json"

    write_safe_log(safe_log, replacements)
    write_manual_log(manual_log, findings)
    write_risk_report(
        risk_report,
        scanned_files=len(files),
        changed_files=changed_files,
        findings=findings,
        replacements=replacements,
    )

    print("🛡️ SANTIS Motion Audit tamamlandı.")
    print(f"Scanned files : {len(files)}")
    print(f"Changed files : {changed_files}")
    print(f"Safe replaces : {len(replacements)}")
    print(f"Manual review : {len(findings)}")
    print(f"Logs          : {out_dir}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
