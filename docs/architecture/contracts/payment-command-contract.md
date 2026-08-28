# Payment Command Contract

**Document:** Santis OS Architecture Book  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

## Purpose

This contract defines authoritative payment, refund, reversal and reconciliation command behaviour.

## PCC-01 — Ownership

The Payments bounded context owns payment attempts, payment records, refunds and provider references. Accounting owns journal and ledger entries. Neither context MAY mutate the other's private tables directly.

## PCC-02 — Canonical Entry Point

All payment mutations MUST enter through published commands. UI, Airtable, AI and provider adapters MUST NOT directly update canonical payment or ledger tables.

## PCC-03 — Required Command Envelope

Externally retriable payment commands MUST include:

- `command_id`
- `command_type`
- `contract_version`
- `idempotency_key`
- `actor_id` and `actor_type`
- trusted tenant/location scope
- `trace_id` and `correlation_id`
- amount and currency
- payment method or provider type
- referenced booking, invoice or settlement identity where applicable

Amounts MUST use a defined minor-unit or precise decimal representation. Floating-point monetary values are prohibited.

## PCC-04 — Supported Commands

Commands MAY include:

- `RecordPayment`
- `AuthorizePayment`
- `CapturePayment`
- `RefundPayment`
- `ReversePayment`
- `MarkPaymentFailed`
- `ReconcilePayment`

Each command MUST declare authorization, valid source state, expected aggregate version and provider semantics.

## PCC-05 — Idempotency

Provider webhooks, reception submissions and worker replays MUST preserve a durable idempotency identity.

Same key plus same fingerprint MUST return the original outcome. Same key plus different amount, currency, provider reference or target resource MUST return `IDEMPOTENCY_CONFLICT`.

## PCC-06 — Financial Integrity

Payment history MUST NOT be silently edited or deleted. Corrections MUST be expressed as explicit reversals, refunds or reconciliation decisions.

Automatic repair of financial discrepancies is prohibited.

## PCC-07 — Atomic Boundary

The payment state transition, durable command claim, audit evidence and outbox event MUST commit atomically.

Where synchronous accounting posting is required by policy, the interface and transaction boundary MUST be explicitly approved. Otherwise, accounting posting SHOULD be driven by a committed event with reconciliation evidence.

External provider network calls MUST NOT be hidden inside long-held database transactions.

## PCC-08 — Authorization and Scope

The Payments owner MUST validate actor permission, tenant ownership, location scope and referenced booking/invoice ownership.

Cross-tenant provider references MUST fail closed and generate security audit evidence.

## PCC-09 — Outcomes and Errors

Stable outcomes include:

- `RECORDED`
- `AUTHORIZED`
- `CAPTURED`
- `REFUNDED`
- `REVERSED`
- `REPLAYED`
- `DECLINED`
- `RECONCILIATION_REQUIRED`

Stable errors SHOULD include:

- `PAYMENT_DECLINED`
- `PAYMENT_ALREADY_CAPTURED`
- `REFUND_EXCEEDS_AVAILABLE_AMOUNT`
- `CURRENCY_MISMATCH`
- `PROVIDER_REFERENCE_CONFLICT`
- `STALE_AGGREGATE_VERSION`
- `IDEMPOTENCY_CONFLICT`
- `AUTHORIZATION_DENIED`
- `TENANT_SCOPE_MISMATCH`

## PCC-10 — Events

Committed facts MAY include:

- `payment.recorded`
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `payment.refunded`
- `payment.reversed`
- `payment.reconciliation_required`

## Human Approval

Refunds, manual financial adjustments and high-value reversals MUST follow the configured approval policy. AI-originated financial commands MUST NOT self-approve.

## Acceptance Tests

Tests MUST cover duplicate provider webhook, concurrent capture, partial failure, wrong tenant, currency mismatch, over-refund, replay, reversal, reconciliation drift and zero partial write.

## References

- ADR-004 — Durable PostgreSQL Idempotency
- ADR-005 — Transactional Outbox
- ADR-009 — Tamper-Evident Audit
- ADR-010 — No Direct AI Database Access

---

End of Document
