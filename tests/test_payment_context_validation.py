from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints import payment_context as endpoint


PAYMENT_ID = "recAAAAAAAAAAAAAA"


class URLConstructionSentinel:
    def __format__(self, _format_spec: str) -> str:
        raise AssertionError("Airtable URL must not be constructed")

    def __str__(self) -> str:
        raise AssertionError("Airtable URL must not be constructed")


def _forbid_request(*_args, **_kwargs):
    raise AssertionError("Request/header construction must not occur")


def _forbid_network(*_args, **_kwargs):
    raise AssertionError("Airtable network call must not occur")


def _install_pre_network_guards(monkeypatch) -> None:
    monkeypatch.setattr(endpoint, "AIRTABLE_API_URL", URLConstructionSentinel())
    monkeypatch.setattr(endpoint, "Request", _forbid_request)
    monkeypatch.setattr(endpoint, "urlopen", _forbid_network)


@pytest.mark.parametrize(
    "invalid_token",
    [
        "pat",
        "patInvalid-Token",
        "pat invalid",
        "BearerSomething",
    ],
)
def test_invalid_token_fails_closed_before_url_header_or_network(
    monkeypatch,
    invalid_token,
):
    monkeypatch.setenv("AIRTABLE_BASE_ID", "appSyntheticBase")
    monkeypatch.delenv("AIRTABLE_SANTIS_BASE_ID", raising=False)
    monkeypatch.setenv(
        "AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN",
        invalid_token,
    )

    _install_pre_network_guards(monkeypatch)

    with pytest.raises(HTTPException) as raised:
        endpoint._airtable_get_record_or_none(
            endpoint.PAYMENTS_TABLE_ID,
            PAYMENT_ID,
        )

    assert raised.value.status_code == 503
    assert raised.value.headers == endpoint.NO_STORE_HEADERS
    assert raised.value.detail == {
        "code": "AIRTABLE_TOKEN_NOT_CONFIGURED"
    }
    assert invalid_token not in repr(raised.value.detail)


@pytest.mark.parametrize(
    "invalid_base_id",
    [
        "app",
        "appInvalid-Base",
        "app invalid",
        "tblNotABase",
    ],
)
def test_invalid_base_fails_closed_before_url_header_or_network(
    monkeypatch,
    invalid_base_id,
):
    monkeypatch.setenv("AIRTABLE_BASE_ID", invalid_base_id)
    monkeypatch.delenv("AIRTABLE_SANTIS_BASE_ID", raising=False)
    monkeypatch.setenv(
        "AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN",
        "patSyntheticReadOnlyNeverReal",
    )

    _install_pre_network_guards(monkeypatch)

    with pytest.raises(HTTPException) as raised:
        endpoint._airtable_get_record_or_none(
            endpoint.PAYMENTS_TABLE_ID,
            PAYMENT_ID,
        )

    assert raised.value.status_code == 503
    assert raised.value.headers == endpoint.NO_STORE_HEADERS
    assert raised.value.detail == {
        "code": "AIRTABLE_BASE_NOT_CONFIGURED"
    }
    assert invalid_base_id not in repr(raised.value.detail)
