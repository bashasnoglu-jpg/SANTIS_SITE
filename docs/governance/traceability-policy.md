# Cross-System Traceability Policy

Action: ACT-P0-TRACE-001  
Contract: SANTIS-AUTHORITY-TRACEABILITY-0.1 — PROPOSED

1. Every implementation issue and PR carries one Airtable Action ID.
2. Every implementation action links to an authoritative Google Docs URL and versioned contract ID.
3. Google Docs owns normative decisions; Airtable owns action/gate state; GitHub owns code and workflow facts.
4. Status is never copied between systems.
5. CI captures the actual `GITHUB_SHA`; manual expected or verified SHA input is invalid.
6. Verified Head SHA, CI Run URL and Runtime Evidence URL live only in Airtable Action_Evidence.
7. Evidence from a stale or different head is invalid.
8. CI PASS does not approve a contract or pass an independent gate.
9. Zero-tolerance risks cannot be waived.
10. Immutable baselines require all mandatory gates and authorized review.
