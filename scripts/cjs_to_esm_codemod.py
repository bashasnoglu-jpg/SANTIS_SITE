#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SANTIS - CJS -> ESM Codemod
Version: 1.0.0

Amaç:
- CommonJS dosyalarını ESM'e dönüştürmek için audit + guided replace yapmak
- require(), module.exports, exports.foo, __dirname/__filename, JSON require vb. kalıpları dönüştürmek
- güvenli dönüşümleri otomatik uygulamak
- riskli alanları manual review'a bırakmak

Çıktılar:
- esm_safe_replacements.log
- esm_manual_review.log
- esm_risk_report.json

Kullanım:
    python cjs_to_esm_codemod.py ./server ./scripts
    python cjs_to_esm_codemod.py . --write --backup
    python cjs_to_esm_codemod.py . --write --backup --ext .js .cjs

Notlar:
- Varsayılan olarak .js ve .cjs dosyalarını tarar
- .mjs dosyalar audit edilir ama dönüştürülmez
- package.json değiştirmez
- Dosya uzantısı yeniden adlandırma yapmaz
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List

DEFAULT_EXTENSIONS = [".js", ".cjs", ".mjs"]

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

NODE_BUILTINS = {
    "assert",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "diagnostics_channel",
    "dns",
    "domain",
    "events",
    "fs",
    "fs/promises",
    "http",
    "http2",
    "https",
    "inspector",
    "module",
    "net",
    "os",
    "path",
    "path/posix",
    "path/win32",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "readline/promises",
    "repl",
    "stream",
    "stream/consumers",
    "stream/promises",
    "stream/web",
    "string_decoder",
    "sys",
    "timers",
    "timers/promises",
    "tls",
    "trace_events",
    "tty",
    "url",
    "util",
    "util/types",
    "v8",
    "vm",
    "wasi",
    "worker_threads",
    "zlib",
}

# ----------------------------------------------------------------------
# Data models
# ----------------------------------------------------------------------


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


# ----------------------------------------------------------------------
# Regex patterns
# ----------------------------------------------------------------------

RE_REQUIRE_ASSIGN = re.compile(
    r"""(?m)^(?P<indent>\s*)(?:const|let|var)\s+(?P<lhs>[A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"](?P<mod>[^'"]+)['"]\s*\)\s*;?\s*$"""
)

RE_REQUIRE_DESTRUCTURED = re.compile(
    r"""(?m)^(?P<indent>\s*)(?:const|let|var)\s+\{(?P<lhs>[^}]+)\}\s*=\s*require\(\s*['"](?P<mod>[^'"]+)['"]\s*\)\s*;?\s*$"""
)

RE_REQUIRE_SIDE_EFFECT = re.compile(
    r"""(?m)^(?P<indent>\s*)require\(\s*['"](?P<mod>[^'"]+)['"]\s*\)\s*;?\s*$"""
)

RE_REQUIRE_DYNAMIC = re.compile(r"""require\(\s*[^'"][^)]+\)""")

RE_MODULE_EXPORTS_OBJ = re.compile(
    r"""(?ms)^\s*module\.exports\s*=\s*\{(?P<body>.*?)\}\s*;?\s*$"""
)

RE_MODULE_EXPORTS_DEFAULT = re.compile(
    r"""(?m)^\s*module\.exports\s*=\s*(?P<expr>.+?)\s*;?\s*$"""
)

RE_EXPORTS_PROP = re.compile(
    r"""(?m)^\s*exports\.(?P<name>[A-Za-z_$][\w$]*)\s*=\s*(?P<expr>.+?)\s*;?\s*$"""
)

RE_MODULE_EXPORTS_PROP = re.compile(
    r"""(?m)^\s*module\.exports\.(?P<name>[A-Za-z_$][\w$]*)\s*=\s*(?P<expr>.+?)\s*;?\s*$"""
)

RE_DIRNAME = re.compile(r"""\b__dirname\b""")
RE_FILENAME = re.compile(r"""\b__filename\b""")

RE_JSON_REQUIRE_ASSIGN = re.compile(
    r"""(?m)^(?P<indent>\s*)(?:const|let|var)\s+(?P<lhs>[A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"](?P<mod>[^'"]+\.json)['"]\s*\)\s*;?\s*$"""
)

RE_IMPORT_STATEMENT = re.compile(r"""(?m)^\s*import\s+.+?$""")
RE_EXPORT_STATEMENT = re.compile(r"""(?m)^\s*export\s+.+?$""")

RE_REQUIRE_ANY = re.compile(r"""\brequire\(\s*['"][^'"]+['"]\s*\)""")
RE_MODULE_EXPORTS_ANY = re.compile(r"""\bmodule\.exports\b""")
RE_EXPORTS_ANY = re.compile(r"""\bexports\.[A-Za-z_$][\w$]*\b""")

RE_RELATIVE_IMPORT_MISSING_EXT = re.compile(
    r"""(?m)^\s*import\s+.+?\s+from\s+['"](?P<path>\.{1,2}/[^'"]+)['"]\s*;?\s*$"""
)

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8", newline="\n")


def backup_file(path: Path) -> None:
    backup_path = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup_path)


def iter_files(roots: Iterable[Path], exts: List[str]) -> Iterable[Path]:
    exts = {e.lower() for e in exts}
    for root in roots:
        if root.is_file():
            if root.suffix.lower() in exts:
                yield root
            continue

        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if any(part in IGNORED_DIRS for part in path.parts):
                continue
            if path.suffix.lower() in exts:
                yield path


def line_number_from_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def snippet_from_match(text: str, start: int, end: int, max_len: int = 240) -> str:
    raw = text[start:end].strip().replace("\n", " ")
    raw = re.sub(r"\s+", " ", raw)
    return raw[:max_len]


def is_relative(spec: str) -> bool:
    return spec.startswith("./") or spec.startswith("../")


def is_json(spec: str) -> bool:
    return spec.endswith(".json")


def is_builtin(spec: str) -> bool:
    return spec in NODE_BUILTINS or spec.startswith("node:")


def needs_js_extension(spec: str) -> bool:
    if not is_relative(spec):
        return False
    if spec.endswith((".js", ".mjs", ".cjs", ".json")):
        return False
    return True


def resolve_relative_import(path: Path, spec: str) -> str:
    """
    ESM için relative import extension düzeltmesi.
    Basit ve güvenli strateji:
    - aynı klasörde .js varsa -> .js
    - .mjs varsa -> .mjs
    - index.js varsa -> /index.js
    - bulunamazsa olduğu gibi bırak
    """
    base = (path.parent / spec).resolve()

    candidates = [
        Path(str(base) + ".js"),
        Path(str(base) + ".mjs"),
        Path(str(base) + ".cjs"),
        base / "index.js",
        base / "index.mjs",
        base / "index.cjs",
    ]

    for candidate in candidates:
        if candidate.exists():
            rel = candidate.relative_to(path.parent.resolve())
            out = rel.as_posix()
            if not out.startswith("."):
                out = "./" + out
            return out

    return spec


def normalize_import_spec(path: Path, spec: str) -> str:
    if is_relative(spec) and needs_js_extension(spec):
        return resolve_relative_import(path, spec)
    return spec


# ----------------------------------------------------------------------
# Audit
# ----------------------------------------------------------------------


def audit_file(path: Path, content: str, findings: List[Finding]) -> None:
    for m in RE_REQUIRE_DYNAMIC.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="dynamic-require",
                severity="high",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="manual-review",
                reason="Dynamic require ESM'e güvenli şekilde otomatik çevrilemez.",
            )
        )

    if RE_DIRNAME.search(content):
        findings.append(
            Finding(
                file=str(path),
                line=1,
                category="dirname-usage",
                severity="medium",
                snippet="__dirname",
                action="safe-replace-candidate",
                reason="__dirname ESM'de doğrudan yok.",
            )
        )

    if RE_FILENAME.search(content):
        findings.append(
            Finding(
                file=str(path),
                line=1,
                category="filename-usage",
                severity="medium",
                snippet="__filename",
                action="safe-replace-candidate",
                reason="__filename ESM'de doğrudan yok.",
            )
        )

    for m in RE_MODULE_EXPORTS_OBJ.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="module-exports-object",
                severity="medium",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="module.exports object literal export'a çevrilebilir.",
            )
        )

    for m in RE_MODULE_EXPORTS_DEFAULT.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="module-exports-default",
                severity="medium",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="module.exports default export'a çevrilebilir.",
            )
        )

    for m in RE_EXPORTS_PROP.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="exports-prop",
                severity="medium",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="exports.foo named export'a çevrilebilir.",
            )
        )

    for m in RE_MODULE_EXPORTS_PROP.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="module-exports-prop",
                severity="medium",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="module.exports.foo named export'a çevrilebilir.",
            )
        )

    for m in RE_JSON_REQUIRE_ASSIGN.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="json-require",
                severity="medium",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="JSON require ESM import assertion ile çevrilebilir.",
            )
        )

    for m in RE_REQUIRE_ASSIGN.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="require-assign",
                severity="low",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="Tekil require import'a çevrilebilir.",
            )
        )

    for m in RE_REQUIRE_DESTRUCTURED.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="require-destructured",
                severity="low",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="Destructured require named import'a çevrilebilir.",
            )
        )

    for m in RE_REQUIRE_SIDE_EFFECT.finditer(content):
        findings.append(
            Finding(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="require-side-effect",
                severity="low",
                snippet=snippet_from_match(content, m.start(), m.end()),
                action="safe-replace-candidate",
                reason="Side-effect require bare import'a çevrilebilir.",
            )
        )

    for m in RE_RELATIVE_IMPORT_MISSING_EXT.finditer(content):
        spec = m.group("path")
        if needs_js_extension(spec):
            findings.append(
                Finding(
                    file=str(path),
                    line=line_number_from_offset(content, m.start()),
                    category="missing-import-extension",
                    severity="high",
                    snippet=snippet_from_match(content, m.start(), m.end()),
                    action="safe-replace-candidate",
                    reason="Relative import ESM'de uzantı gerektirir.",
                )
            )


# ----------------------------------------------------------------------
# Transform helpers
# ----------------------------------------------------------------------


def inject_esm_bridge(content: str) -> str:
    lines = content.splitlines()
    header = [
        'import { fileURLToPath } from "url";',
        'import path from "path";',
        "",
        "const __filename = fileURLToPath(import.meta.url);",
        "const __dirname = path.dirname(__filename);",
        "",
    ]

    if "fileURLToPath" in content or "import.meta.url" in content:
        return content

    insert_at = 0
    while insert_at < len(lines):
        stripped = lines[insert_at].strip()
        if stripped.startswith("#!"):
            insert_at += 1
            continue
        if stripped == "" or stripped.startswith("//"):
            insert_at += 1
            continue
        break

    new_lines = lines[:insert_at] + header + lines[insert_at:]
    return "\n".join(new_lines) + ("\n" if content.endswith("\n") else "")


def replace_json_require(
    path: Path, content: str, replacements: List[Replacement]
) -> str:
    def repl(m: re.Match) -> str:
        indent = m.group("indent")
        lhs = m.group("lhs")
        mod = m.group("mod")
        spec = normalize_import_spec(path, mod)
        after = f'{indent}import {lhs} from "{spec}" assert {{ type: "json" }};'
        replacements.append(
            Replacement(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="json-require",
                before=m.group(0).strip(),
                after=after.strip(),
                reason="JSON require -> ESM import assertion",
            )
        )
        return after

    return RE_JSON_REQUIRE_ASSIGN.sub(repl, content)


def replace_require_assign(
    path: Path, content: str, replacements: List[Replacement]
) -> str:
    def repl(m: re.Match) -> str:
        indent = m.group("indent")
        lhs = m.group("lhs")
        mod = m.group("mod")
        spec = normalize_import_spec(path, mod)

        if is_builtin(spec) and not spec.startswith("node:"):
            spec = f"node:{spec}"

        after = f'{indent}import {lhs} from "{spec}";'
        replacements.append(
            Replacement(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="require-assign",
                before=m.group(0).strip(),
                after=after.strip(),
                reason="require assign -> default import",
            )
        )
        return after

    return RE_REQUIRE_ASSIGN.sub(repl, content)


def replace_require_destructured(
    path: Path, content: str, replacements: List[Replacement]
) -> str:
    def repl(m: re.Match) -> str:
        indent = m.group("indent")
        lhs = re.sub(r"\s+", " ", m.group("lhs").strip())
        mod = m.group("mod")
        spec = normalize_import_spec(path, mod)

        if is_builtin(spec) and not spec.startswith("node:"):
            spec = f"node:{spec}"

        after = f'{indent}import {{ {lhs} }} from "{spec}";'
        replacements.append(
            Replacement(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="require-destructured",
                before=m.group(0).strip(),
                after=after.strip(),
                reason="destructured require -> named import",
            )
        )
        return after

    return RE_REQUIRE_DESTRUCTURED.sub(repl, content)


def replace_require_side_effect(
    path: Path, content: str, replacements: List[Replacement]
) -> str:
    def repl(m: re.Match) -> str:
        indent = m.group("indent")
        mod = m.group("mod")
        spec = normalize_import_spec(path, mod)
        if is_builtin(spec) and not spec.startswith("node:"):
            spec = f"node:{spec}"

        after = f'{indent}import "{spec}";'
        replacements.append(
            Replacement(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="require-side-effect",
                before=m.group(0).strip(),
                after=after.strip(),
                reason="side-effect require -> bare import",
            )
        )
        return after

    return RE_REQUIRE_SIDE_EFFECT.sub(repl, content)


def replace_exports_props(
    content: str, replacements: List[Replacement], path: Path
) -> str:
    def repl_exports(m: re.Match) -> str:
        name = m.group("name")
        expr = m.group("expr").strip()
        after = f"export const {name} = {expr};"
        replacements.append(
            Replacement(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="exports-prop",
                before=m.group(0).strip(),
                after=after,
                reason="exports.foo -> named export",
            )
        )
        return after

    content = RE_EXPORTS_PROP.sub(repl_exports, content)

    def repl_module_exports(m: re.Match) -> str:
        name = m.group("name")
        expr = m.group("expr").strip()
        after = f"export const {name} = {expr};"
        replacements.append(
            Replacement(
                file=str(path),
                line=line_number_from_offset(content, m.start()),
                category="module-exports-prop",
                before=m.group(0).strip(),
                after=after,
                reason="module.exports.foo -> named export",
            )
        )
        return after

    content = RE_MODULE_EXPORTS_PROP.sub(repl_module_exports, content)
    return content


def replace_module_exports_object(
    content: str, replacements: List[Replacement], path: Path
) -> str:
    m = RE_MODULE_EXPORTS_OBJ.search(content)
    if not m:
        return content

    body = m.group("body").strip()
    props = [p.strip() for p in body.split(",") if p.strip()]
    lines = []
    for prop in props:
        # foo
        # foo: foo
        # foo: bar
        if ":" in prop:
            left, right = [x.strip() for x in prop.split(":", 1)]
            if re.match(r"^[A-Za-z_$][\w$]*$", left) and re.match(
                r"^[A-Za-z_$][\w$]*$", right
            ):
                if left == right:
                    lines.append(f"export {{ {left} }};")
                else:
                    lines.append(f"export const {left} = {right};")
            else:
                lines.append(f"// TODO(manual-review): export mapping -> {prop}")
        else:
            if re.match(r"^[A-Za-z_$][\w$]*$", prop):
                lines.append(f"export {{ {prop} }};")
            else:
                lines.append(f"// TODO(manual-review): export token -> {prop}")

    after = "\n".join(lines)
    replacements.append(
        Replacement(
            file=str(path),
            line=line_number_from_offset(content, m.start()),
            category="module-exports-object",
            before=snippet_from_match(content, m.start(), m.end()),
            after=after,
            reason="module.exports object literal -> named exports",
        )
    )
    return content[: m.start()] + after + content[m.end() :]


def replace_module_exports_default(
    content: str, replacements: List[Replacement], path: Path
) -> str:
    m = RE_MODULE_EXPORTS_DEFAULT.search(content)
    if not m:
        return content

    expr = m.group("expr").strip()
    after = f"export default {expr};"
    replacements.append(
        Replacement(
            file=str(path),
            line=line_number_from_offset(content, m.start()),
            category="module-exports-default",
            before=m.group(0).strip(),
            after=after,
            reason="module.exports = expr -> export default expr",
        )
    )
    return content[: m.start()] + after + content[m.end() :]


def fix_relative_import_extensions(
    path: Path, content: str, replacements: List[Replacement]
) -> str:
    lines = content.splitlines()
    changed = False
    out = []

    import_line_re = re.compile(
        r"""^(?P<prefix>\s*import\s+.+?\s+from\s+["'])(?P<spec>\.{1,2}/[^"']+)(?P<suffix>["']\s*;?\s*)$"""
    )

    for idx, line in enumerate(lines, start=1):
        m = import_line_re.match(line)
        if not m:
            out.append(line)
            continue

        spec = m.group("spec")
        normalized = normalize_import_spec(path, spec)
        if normalized != spec:
            new_line = f"{m.group('prefix')}{normalized}{m.group('suffix')}"
            replacements.append(
                Replacement(
                    file=str(path),
                    line=idx,
                    category="missing-import-extension",
                    before=line.strip(),
                    after=new_line.strip(),
                    reason="relative import extension normalized",
                )
            )
            out.append(new_line)
            changed = True
        else:
            out.append(line)

    if changed:
        return "\n".join(out) + ("\n" if content.endswith("\n") else "")
    return content


# ----------------------------------------------------------------------
# Main transform pipeline
# ----------------------------------------------------------------------


def transform_file(
    path: Path, content: str, findings: List[Finding], replacements: List[Replacement]
) -> str:
    original = content

    # Dynamic require remains manual.
    if RE_REQUIRE_DYNAMIC.search(content):
        pass

    content = replace_json_require(path, content, replacements)
    content = replace_require_destructured(path, content, replacements)
    content = replace_require_assign(path, content, replacements)
    content = replace_require_side_effect(path, content, replacements)
    content = replace_exports_props(content, replacements, path)
    content = replace_module_exports_object(content, replacements, path)

    # default export only if object literal pattern wasn't consumed
    content = replace_module_exports_default(content, replacements, path)

    uses_dir = "__dirname" in content or "__filename" in content
    if uses_dir and ("import.meta.url" not in content):
        before = "[inject ESM dirname bridge]"
        content = inject_esm_bridge(content)
        after = "[fileURLToPath/import.meta.url bridge injected]"
        replacements.append(
            Replacement(
                file=str(path),
                line=1,
                category="dirname-filename-bridge",
                before=before,
                after=after,
                reason="__dirname/__filename usage requires ESM bridge",
            )
        )

    content = fix_relative_import_extensions(path, content, replacements)
    return content


# ----------------------------------------------------------------------
# Reporting
# ----------------------------------------------------------------------


def write_safe_log(path: Path, replacements: List[Replacement]) -> None:
    lines = ["=== SANTIS ESM SAFE REPLACEMENTS LOG ===\n"]
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
    lines = ["=== SANTIS ESM MANUAL REVIEW LOG ===\n"]
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
        "engine": "SANTIS CJS -> ESM Codemod",
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


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SANTIS CJS -> ESM Codemod")
    parser.add_argument("paths", nargs="+", help="Taranacak dosya veya klasörler")
    parser.add_argument(
        "--write", action="store_true", help="Güvenli dönüşümleri dosyalara uygular"
    )
    parser.add_argument(
        "--backup", action="store_true", help="Değişen dosyaların .bak kopyasını alır"
    )
    parser.add_argument(
        "--ext", nargs="*", default=DEFAULT_EXTENSIONS, help="Taranacak uzantılar"
    )
    parser.add_argument("--out-dir", default=".esm-audit", help="Log klasörü")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    roots = [Path(p).resolve() for p in args.paths]
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    files = list(iter_files(roots, args.ext))
    findings: List[Finding] = []
    replacements: List[Replacement] = []
    changed_files = 0

    for path in files:
        try:
            original = read_text(path)
            audit_file(path, original, findings)

            if args.write and path.suffix.lower() in {".js", ".cjs"}:
                transformed = transform_file(path, original, findings, replacements)
                if transformed != original:
                    if args.backup:
                        backup_file(path)
                    write_text(path, transformed)
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

    write_safe_log(out_dir / "esm_safe_replacements.log", replacements)
    write_manual_log(out_dir / "esm_manual_review.log", findings)
    write_risk_report(
        out_dir / "esm_risk_report.json",
        scanned_files=len(files),
        changed_files=changed_files,
        findings=findings,
        replacements=replacements,
    )

    print("🛡️ SANTIS CJS -> ESM Codemod tamamlandı.")
    print(f"Scanned files : {len(files)}")
    print(f"Changed files : {changed_files}")
    print(f"Safe replaces : {len(replacements)}")
    print(f"Manual review : {len(findings)}")
    print(f"Logs          : {out_dir}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
