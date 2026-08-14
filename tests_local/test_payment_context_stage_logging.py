from __future__ import annotations

import json
import os
import unittest
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError, URLError


from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api.v1.endpoints import payment_context as endpoint


PAYMENT_ID = "recAAAAAAAAAAAAAA"
BOOKING_ID = "recBBBBBBBBBBBBBB"
SYNTHETIC_TOKEN = "patSyntheticReadOnlyNeverReal"
SYNTHETIC_PII = "synthetic.person@example.invalid"
SYNTHETIC_SIGNATURE = "SYNTHETIC-SIGNATURE-MUST-NOT-LEAK"
LOGGER_NAME = "santis.payment_context.diagnostics"

app = FastAPI()
app.include_router(endpoint.router, prefix="/api/v1")
client = TestClient(app, raise_server_exceptions=False)


class PaymentContextStageLoggingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.environment = patch.dict(
            os.environ,
            {
                "AIRTABLE_BASE_ID": "appSyntheticBase",
                "AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN": SYNTHETIC_TOKEN,
            },
        )
        self.environment.start()
        self.addCleanup(self.environment.stop)

    @staticmethod
    def _events(records) -> list[dict[str, object]]:
        return [
            json.loads(record.getMessage())
            for record in records
            if record.name == LOGGER_NAME
        ]

    def _assert_no_sensitive_log_material(self, records) -> None:
        log_text = "\n".join(record.getMessage() for record in records)
        self.assertNotIn(SYNTHETIC_TOKEN, log_text)
        self.assertNotIn(SYNTHETIC_PII, log_text)
        self.assertNotIn(SYNTHETIC_SIGNATURE, log_text)
        self.assertNotIn("Authorization", log_text)

    def _assert_http_exception(
        self,
        context,
        expected_status: int,
        expected_detail: dict[str, str],
    ) -> None:
        exc = context.exception
        self.assertIsInstance(exc, HTTPException)
        self.assertEqual(exc.status_code, expected_status)
        self.assertEqual(exc.detail, expected_detail)
        self.assertEqual(exc.headers, endpoint.NO_STORE_HEADERS)

    @staticmethod
    def _payment_record(*, with_booking: bool = False) -> dict[str, object]:
        fields: dict[str, object] = {
            "Customer_Email": SYNTHETIC_PII,
            "Payment Context Current Source Signature": SYNTHETIC_SIGNATURE,
        }
        if with_booking:
            fields["Booking_Link"] = [BOOKING_ID]
        return {"id": PAYMENT_ID, "fields": fields}

    def test_airtable_401_maps_to_502_and_logs_safe_payment_stage(self):
        secret_body = b'{"error":"synthetic upstream secret"}'

        def unauthorized(*_args, **_kwargs):
            raise HTTPError(
                url="https://api.airtable.com/synthetic",
                code=401,
                msg="synthetic authorization failure",
                hdrs=None,
                fp=BytesIO(secret_body),
            )

        with patch.object(endpoint, "urlopen", side_effect=unauthorized):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as raised:
                    endpoint.validate_payment_context(PAYMENT_ID)

        self._assert_http_exception(raised, 502, {"code": "AIRTABLE_READ_FAILED"})
        events = self._events(captured.records)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["exception_class"], "HTTPError")
        self.assertEqual(events[0]["stage"], "payment_read")
        self.assertEqual(events[0]["status_code"], 502)
        self.assertNotIn("synthetic upstream secret", captured.output)
        self._assert_no_sensitive_log_material(captured.records)

    def test_url_error_maps_to_502_without_exception_message(self):
        with patch.object(endpoint, "urlopen", side_effect=URLError(SYNTHETIC_PII)):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as raised:
                    endpoint.validate_payment_context(PAYMENT_ID)

        self._assert_http_exception(raised, 502, {"code": "AIRTABLE_NETWORK_ERROR"})
        events = self._events(captured.records)
        self.assertEqual(events[0]["exception_class"], "URLError")
        self.assertEqual(events[0]["stage"], "payment_read")
        self._assert_no_sensitive_log_material(captured.records)

    def test_invalid_json_maps_to_502(self):
        self._assert_invalid_encoded_response(b"not-json", "JSONDecodeError")

    def test_unicode_decode_error_maps_to_502(self):
        self._assert_invalid_encoded_response(b"\xff", "UnicodeDecodeError")

    def test_malformed_json_envelope_maps_to_502_without_raw_body(self):
        self._assert_invalid_encoded_response(b"null", "InvalidRecordEnvelope")

    def _assert_invalid_encoded_response(self, body: bytes, exception_class: str) -> None:
        class SyntheticResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                return body

        with patch.object(endpoint, "urlopen", return_value=SyntheticResponse()):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as raised:
                    endpoint.validate_payment_context(PAYMENT_ID)

        self._assert_http_exception(raised, 502, {"code": "AIRTABLE_INVALID_RESPONSE"})
        events = self._events(captured.records)
        self.assertEqual(events[0]["exception_class"], exception_class)
        self.assertEqual(events[0]["stage"], "payment_read")
        self._assert_no_sensitive_log_material(captured.records)

    def test_malformed_payment_envelope_fails_closed_with_structural_log(self):
        with patch.object(
            endpoint,
            "_airtable_get_record_or_none",
            return_value=[SYNTHETIC_PII],
        ):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as raised:
                    endpoint.validate_payment_context(PAYMENT_ID)

        self._assert_http_exception(raised, 502, {"code": "AIRTABLE_INVALID_RESPONSE"})
        event = self._events(captured.records)[0]
        self.assertEqual(event["stage"], "payment_mapping")
        self.assertEqual(event["exception_class"], "InvalidRecordEnvelope")
        self.assertEqual(event["response_type"], "list")
        self.assertIs(event["has_id"], False)
        self.assertIs(event["has_fields"], False)
        self.assertEqual(event["fields_type"], "absent")
        self._assert_no_sensitive_log_material(captured.records)

    def test_malformed_booking_envelope_fails_closed_with_structural_log(self):
        def fake_get(table_id, _record_id):
            if table_id == endpoint.PAYMENTS_TABLE_ID:
                return self._payment_record(with_booking=True)
            return {"id": BOOKING_ID, "fields": [SYNTHETIC_PII]}

        with patch.object(endpoint, "_airtable_get_record_or_none", side_effect=fake_get):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as raised:
                    endpoint.validate_payment_context(PAYMENT_ID)

        self._assert_http_exception(raised, 502, {"code": "AIRTABLE_INVALID_RESPONSE"})
        event = self._events(captured.records)[0]
        self.assertEqual(event["stage"], "booking_mapping")
        self.assertEqual(event["exception_class"], "InvalidRecordEnvelope")
        self.assertEqual(event["response_type"], "dict")
        self.assertIs(event["has_id"], True)
        self.assertIs(event["has_fields"], True)
        self.assertEqual(event["fields_type"], "list")
        self._assert_no_sensitive_log_material(captured.records)

    def test_unexpected_exception_records_stage_without_message_or_traceback(self):
        def unexpected_failure(*_args, **_kwargs):
            raise RuntimeError(f"{SYNTHETIC_PII} {SYNTHETIC_SIGNATURE}")

        with patch.object(
            endpoint,
            "_airtable_get_record_or_none",
            return_value=self._payment_record(),
        ), patch.object(
            endpoint,
            "evaluate_payment_context",
            side_effect=unexpected_failure,
        ):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                with self.assertRaises(HTTPException) as raised:
                    endpoint.validate_payment_context(PAYMENT_ID)

        self._assert_http_exception(
            raised,
            500,
            {"code": "PAYMENT_CONTEXT_INTERNAL_ERROR"},
        )
        event = self._events(captured.records)[0]
        self.assertEqual(event["stage"], "contract_evaluation")
        self.assertEqual(event["exception_class"], "RuntimeError")
        self.assertEqual(event["status_code"], 500)
        self.assertEqual(len(str(event["correlation_id"])), 32)
        self._assert_no_sensitive_log_material(captured.records)

    def test_real_asgi_401_path_returns_502_and_no_store(self):
        upstream_error = HTTPError(
            url="https://api.airtable.com/synthetic",
            code=401,
            msg=SYNTHETIC_PII,
            hdrs=None,
            fp=BytesIO(SYNTHETIC_SIGNATURE.encode("utf-8")),
        )

        with patch.object(endpoint, "urlopen", side_effect=upstream_error):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                response = client.get(
                    f"/api/v1/payment-context/{PAYMENT_ID}/validate"
                )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.headers.get("cache-control"), "no-store")
        self.assertEqual(response.json()["detail"], {"code": "AIRTABLE_READ_FAILED"})
        self.assertEqual(self._events(captured.records)[0]["stage"], "payment_read")
        self._assert_no_sensitive_log_material(captured.records)

    def test_real_asgi_unexpected_exception_returns_redacted_500(self):
        def unexpected_failure(*_args, **_kwargs):
            raise RuntimeError(f"{SYNTHETIC_PII} {SYNTHETIC_SIGNATURE}")

        with patch.object(
            endpoint,
            "_airtable_get_record_or_none",
            return_value=self._payment_record(),
        ), patch.object(
            endpoint,
            "evaluate_payment_context",
            side_effect=unexpected_failure,
        ):
            with self.assertLogs(LOGGER_NAME, level="WARNING") as captured:
                response = client.get(
                    f"/api/v1/payment-context/{PAYMENT_ID}/validate"
                )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.headers.get("cache-control"), "no-store")
        self.assertEqual(
            response.json()["detail"],
            {"code": "PAYMENT_CONTEXT_INTERNAL_ERROR"},
        )
        self.assertEqual(
            self._events(captured.records)[0]["stage"],
            "contract_evaluation",
        )
        self._assert_no_sensitive_log_material(captured.records)


if __name__ == "__main__":
    unittest.main()
