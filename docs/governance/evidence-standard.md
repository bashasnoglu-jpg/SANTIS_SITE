# Evidence Standard

Action: ACT-P0-TRACE-001  
Status: PROPOSED

A technical evidence package must identify:

- Airtable Action ID
- authoritative normative document URL
- contract ID and version
- actual workflow-produced commit SHA
- GitHub workflow run URL
- runtime evidence URL when runtime behavior is claimed
- tenant/location/environment scope
- positive, negative and concurrency/replay results as applicable
- containment or rollback procedure
- independent reviewer decision

Evidence is incomplete when the SHA is manually supplied, the workflow ran on another head, environment is unknown, or runtime claims lack runtime evidence. An incomplete package cannot pass a gate.
