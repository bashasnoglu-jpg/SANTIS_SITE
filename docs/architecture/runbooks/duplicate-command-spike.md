# Runbook — Duplicate Command Spike

**Status:** Normative Draft  
**Production Authority:** No

## Trigger

Use when replay, conflict or repeated idempotency-key rates rise above baseline.

## Immediate Actions

1. Determine whether duplicates originate from UI, worker, integration or network retry.
2. Confirm no duplicate canonical resources were created.
3. Preserve command IDs, fingerprints, keys and trace chains.
4. Rate-limit or disable the offending client path when necessary.

## Diagnosis

Check canonical serialization changes, client key generation, retry ownership, timeout settings, worker redelivery and claim uniqueness.

## Recovery

Correct the producer while preserving existing idempotency identity. Quarantine incomplete or ambiguous claims. Do not delete durable claims merely to allow reprocessing.

## Verification

- same key/same payload returns original result,
- same key/different payload returns conflict,
- concurrent execution creates one canonical result,
- replay metrics return to baseline.

## Forbidden

- Generating new keys to bypass conflicts.
- Manually deleting claims without approved recovery evidence.
