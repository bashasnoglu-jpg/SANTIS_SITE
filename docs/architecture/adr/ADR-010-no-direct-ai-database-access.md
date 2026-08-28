# ADR-010 — No Direct AI Database Access

**Status:** Proposed  
**Decision Type:** AI and Security Architecture  
**Version:** 0.9-RC2  
**Production Authority:** No

## Context

Santis OS will use AI for summaries, recommendations, draft creation and eventually controlled operational actions. AI models are probabilistic and may be influenced by prompt injection, malicious content, stale context or tool misuse. Giving an AI agent direct SQL, broad database credentials or tenant-independent search would bypass the platform's authorization, domain validation, idempotency and audit controls.

## Decision

AI systems MUST NOT receive direct database credentials, execute arbitrary SQL, mutate canonical tables, bypass published application interfaces or perform tenant-independent searches.

AI Orchestration SHALL interact with Santis OS only through approved, typed query and command interfaces.

The owning bounded context MUST perform final authentication-context validation, authorization, LOCK-59 scope enforcement, domain validation, idempotency and audit processing. AI output is never authoritative by itself.

## Permitted AI Capabilities

AI MAY:

- read authorized projections through scoped query interfaces,
- generate summaries from data already authorized for the actor,
- propose structured commands,
- create drafts or controlled requests,
- submit approved low-risk commands within explicit scope,
- request human approval for high-risk actions.

## Prohibited AI Capabilities

AI MUST NOT:

- connect directly to PostgreSQL or Airtable canonical mutation paths,
- hold reusable production database credentials,
- execute generated SQL,
- select or change tenant scope autonomously,
- disable authorization or policy checks,
- perform bulk export, deletion, refund or privilege escalation without required approval,
- repair financial or canonical data automatically,
- treat external text as trusted operational instruction.

## Risk Classes

| Class | Example | Required behavior |
|---|---|---|
| Read-only | Authorized operational summary | Scoped query and audit where required |
| Advisory | Suggested schedule or action | Recommendation only |
| Draft mutation | Booking draft/request | No canonical finalization |
| Controlled mutation | Approved low-risk command | Full policy and domain pipeline |
| High risk | Refund, bulk export, role change | Human approval, possibly dual approval |
| Destructive/systemic | Bulk delete, credential change | Prohibited or exceptional break-glass process |

## Normative Requirements

- Every AI-originated command MUST identify the agent, model/service context, human principal where applicable, tenant scope, trace ID and approval evidence when required.
- Tool access MUST be allow-listed and least-privileged.
- Query results MUST be tenant- and location-scoped before they reach the model.
- Sensitive fields MUST be minimized or redacted according to data classification.
- Prompt content MUST NOT alter system authorization policy.
- High-risk commands MUST fail closed if approval evidence is missing or unverifiable.
- AI tool calls and decisions MUST be auditable.
- The system MUST support disabling an AI tool or agent without disabling canonical operations.
- AI failure MUST degrade safely to human operation.

## Alternatives Considered

### Direct read-only database access

Rejected because read-only SQL can still cause cross-tenant disclosure, data exfiltration and uncontrolled query load.

### Direct write access with database role restrictions

Rejected because it bypasses domain commands, idempotency and human approval logic.

### Unstructured natural-language tools

Rejected for mutations. Mutation tools must use typed schemas and stable command contracts.

### Fully autonomous operator

Deferred until explicit policies, evidence, legal review and production maturity justify narrowly bounded autonomy.

## Consequences

### Positive

- Preserves the same security and business rules for AI and human actors.
- Reduces prompt-injection blast radius.
- Keeps canonical authority in domain modules.
- Enables controlled expansion of AI capability by risk class.

### Negative

- Limits rapid experimentation with broad agent tools.
- Requires typed tools, approval workflows and policy integration.
- Some AI workflows may require additional query projections.
- Operational latency may be higher for approval-gated actions.

## Evidence Required

Production acceptance for an AI capability requires:

- documented tool allow-list,
- tenant and location isolation tests,
- prompt-injection and data-exfiltration tests,
- owner-side authorization tests,
- audit evidence,
- high-risk approval tests,
- credential inspection proving no direct database secret exposure,
- safe-degradation and kill-switch test,
- security and product-owner approval.

## Related Documents

- `volume-1-architecture-principles/06-bounded-context-map.md`
- `volume-2-technical-architecture/01-lock-59-isolation-contract.md`
- `volume-2-technical-architecture/08-module-communication.md`
- ADR-006 — LOCK-59 Defense-in-Depth Isolation
- ADR-008 — Authorization Engine Evaluation
- ADR-009 — Tamper-Evident Audit

## Current Decision Status

**Normative Design / AI Production Mutation Authority Not Approved**
