# Runbook — Payment Reconciliation Drift

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when payment attempts, provider results, canonical payments, journals or settlements do not reconcile.

## Immediate Actions

1. Stop automated financial repair and affected settlement posting.
2. Preserve provider references, payment IDs, command IDs, ledger references and trace IDs.
3. Classify scope by tenant, location, provider and time range.
4. Keep booking operations separate unless payment state affects safety or authorization.

## Diagnosis

Compare:

- payment attempt and provider outcome,
- canonical payment state,
- journal/ledger entries,
- refunds and reversals,
- outbox and consumer status,
- Airtable projection status.

## Recovery

Use explicit reconciliation, reversal or corrective journal commands. Corrections MUST be append-only where financial policy requires it and MUST retain linkage to the original record.

## Verification

Amounts, currency, status, settlement, refund and journal totals reconcile; audit evidence and owner approval are present.

## Forbidden

- Silent field edits.
- Deleting financial history.
- Using projection state as financial authority.
