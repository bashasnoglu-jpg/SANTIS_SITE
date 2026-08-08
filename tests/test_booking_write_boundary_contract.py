from __future__ import annotations

import ast
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = REPO_ROOT / "app"
RECEPTION_PATH = APP_ROOT / "api" / "v1" / "endpoints" / "reception.py"
CANONICAL_ADAPTER = "_airtable_json_request"
WRITE_METHODS = {"POST", "PATCH", "PUT"}


def _python_sources() -> list[Path]:
    return sorted(APP_ROOT.rglob("*.py"))


def _tree(path: Path) -> ast.Module:
    return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


def _function(tree: ast.Module, name: str) -> ast.FunctionDef:
    matches = [
        node
        for node in ast.walk(tree)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name
    ]
    assert len(matches) == 1, f"expected exactly one {name}, found {len(matches)}"
    node = matches[0]
    assert isinstance(node, ast.FunctionDef)
    return node


def _call_name(call: ast.Call) -> str:
    target = call.func
    if isinstance(target, ast.Name):
        return target.id
    if isinstance(target, ast.Attribute):
        return target.attr
    return ""


def _string_literals(node: ast.AST) -> set[str]:
    return {
        value.value
        for value in ast.walk(node)
        if isinstance(value, ast.Constant) and isinstance(value.value, str)
    }


def test_canonical_booking_write_guard_precedes_airtable_io() -> None:
    tree = _tree(RECEPTION_PATH)
    adapter = _function(tree, CANONICAL_ADAPTER)

    guard_calls = [
        node
        for node in ast.walk(adapter)
        if isinstance(node, ast.Call)
        and _call_name(node) == "assert_no_legacy_booking_write_payload"
    ]
    request_calls = [
        node
        for node in ast.walk(adapter)
        if isinstance(node, ast.Call) and _call_name(node) == "Request"
    ]
    network_calls = [
        node
        for node in ast.walk(adapter)
        if isinstance(node, ast.Call) and _call_name(node) == "urlopen"
    ]

    assert len(guard_calls) == 1
    assert len(request_calls) == 1
    assert len(network_calls) == 1
    assert guard_calls[0].lineno < request_calls[0].lineno < network_calls[0].lineno

    guarded_if = next(
        (
            node
            for node in ast.walk(adapter)
            if isinstance(node, ast.If) and guard_calls[0] in list(ast.walk(node))
        ),
        None,
    )
    assert guarded_if is not None, "legacy guard must remain conditional on the Bookings write boundary"

    condition_names = {
        node.id for node in ast.walk(guarded_if.test) if isinstance(node, ast.Name)
    }
    assert {"table_id", "BOOKINGS_TABLE_ID", "method"}.issubset(condition_names)
    assert WRITE_METHODS.issubset(_string_literals(guarded_if.test))

    guard_args = guard_calls[0].args
    assert len(guard_args) == 1
    assert isinstance(guard_args[0], ast.Name) and guard_args[0].id == "payload"


def test_booking_write_wrappers_delegate_to_the_guarded_adapter() -> None:
    tree = _tree(RECEPTION_PATH)
    expected = {
        "_airtable_create_record": "POST",
        "_airtable_update_record": "PATCH",
    }

    for wrapper_name, method in expected.items():
        wrapper = _function(tree, wrapper_name)
        adapter_calls = [
            node
            for node in ast.walk(wrapper)
            if isinstance(node, ast.Call) and _call_name(node) == CANONICAL_ADAPTER
        ]
        assert len(adapter_calls) == 1, (
            f"{wrapper_name} must delegate exactly once to {CANONICAL_ADAPTER}"
        )
        assert method in _string_literals(adapter_calls[0])
        assert not any(
            isinstance(node, ast.Call) and _call_name(node) in {"Request", "urlopen"}
            for node in ast.walk(wrapper)
        ), f"{wrapper_name} must not perform Airtable I/O directly"


def test_no_alternative_booking_airtable_write_transport() -> None:
    violations: list[str] = []

    for path in _python_sources():
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(path))
        relative = path.relative_to(REPO_ROOT)

        for function in (
            node
            for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        ):
            calls = [node for node in ast.walk(function) if isinstance(node, ast.Call)]
            call_names = {_call_name(call) for call in calls}
            literals = _string_literals(function)
            booking_relevant = (
                "BOOKINGS_TABLE_ID" in {
                    node.id for node in ast.walk(function) if isinstance(node, ast.Name)
                }
                or "Bookings" in literals
            )
            if not booking_relevant or function.name == CANONICAL_ADAPTER:
                continue

            if {"Request", "urlopen"}.issubset(call_names) and WRITE_METHODS.intersection(literals):
                violations.append(f"{relative}:{function.name}: direct urllib write")

            for call in calls:
                name = _call_name(call)
                if name.lower() not in {"post", "patch", "put", "request"}:
                    continue
                if name.lower() == "request" and not WRITE_METHODS.intersection(
                    value.upper() for value in _string_literals(call)
                ):
                    continue
                violations.append(f"{relative}:{function.name}: direct HTTP write helper {name}")

    assert not violations, (
        "Bookings writes must use the single guarded Airtable adapter; "
        + "; ".join(violations)
    )
