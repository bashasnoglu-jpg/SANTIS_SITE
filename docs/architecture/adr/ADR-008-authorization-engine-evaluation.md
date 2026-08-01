# ADR-008 — Authorization Engine Evaluation

**Status:** Proposed  
**Decision Type:** Security Architecture  
**Version:** 0.9-RC2  
**Production Authority:** No

## Context

Santis OS requires contextual authorization across tenant, location, role, employment status, active shift, resource ownership, action type and risk level. Static RBAC alone may lead to role explosion as the platform grows. At the same time, introducing an external policy engine too early can add latency, operational burden and a second source of authorization truth.

Cedar, OPA/Rego and a typed in-process policy module are plausible implementation options. The platform does not yet have enough measured policy complexity or production load to justify a final technology choice.

## Decision

Santis OS SHALL define its authorization model independently of any specific policy engine before selecting implementation technology.

The initial production implementation MAY use a typed in-process authorization module if it satisfies the normative policy contract, testability and observability requirements.

Cedar SHALL remain an evaluation candidate, not an approved production dependency, until a formal comparison is completed.

No authorization engine MAY replace authentication, tenant membership resolution, RLS or domain validation.

## Evaluation Scope

The evaluation MUST include at least 15–20 real Santis OS policies covering:

- tenant membership,
- location scope,
- role and action permissions,
- active employee state,
- active shift or operational window,
- payment and refund thresholds,
- data export restrictions,
- privilege changes,
- AI-originated commands,
- emergency or break-glass access.

## Evaluation Criteria

Each candidate MUST be measured against:

- correctness and default-deny behavior,
- policy readability,
- schema validation,
- testability,
- latency and tail latency,
- deployment and rollback complexity,
- auditability and decision explanation,
- versioning and migration support,
- failure behavior when the engine is unavailable,
- team maintainability,
- compatibility with tenant/location context,
- support for human and AI actor types.

## Normative Requirements

- Owner modules MUST enforce authorization for protected actions.
- A caller's prior check MUST NOT replace owner-side enforcement.
- Authorization uncertainty or policy-engine failure MUST fail closed for protected mutations.
- Authorization decisions MUST produce stable reason codes and traceable evidence.
- Policy changes MUST be versioned, reviewed and contract-tested.
- Production policies MUST NOT depend on mutable UI state.
- AI and automation MUST use the same authorization path as human actors.
- Emergency bypasses MUST be explicit, time-bounded and audited.

## Alternatives Considered

### Static RBAC only

Insufficient for contextual location, shift, risk and resource attributes at scale.

### Cedar immediately

Deferred until real policies, operational cost and performance are measured.

### OPA/Rego immediately

Deferred for the same reason; flexibility alone does not justify early operational complexity.

### Authorization embedded across handlers

Rejected because duplicated `if/else` logic is difficult to audit, test and evolve consistently.

## Consequences

### Positive

- Prevents premature vendor or language lock-in.
- Makes policy semantics explicit before implementation.
- Allows the simplest compliant implementation for the pilot stage.
- Creates evidence for a later Cedar or other engine decision.

### Negative

- Final engine selection remains open.
- A temporary in-process implementation may later require migration.
- Policy catalog and test harness must be maintained independently.

## Evidence Required

ADR acceptance requires:

- technology-independent authorization model,
- 15–20 policy scenarios,
- candidate comparison report,
- latency and failure-mode measurements,
- default-deny tests,
- owner-side enforcement tests,
- policy versioning and audit examples,
- architecture and security reviewer approval.

## Related Documents

- `volume-2-technical-architecture/01-lock-59-isolation-contract.md`
- `volume-2-technical-architecture/02-transaction-context-and-rls.md`
- `volume-2-technical-architecture/08-module-communication.md`
- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- ADR-010 — No Direct AI Database Access

## Current Decision Status

**Evaluation Candidate / Production Technology Not Selected**
