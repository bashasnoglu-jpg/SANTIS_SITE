# Santis OS Bounded Context Map

**Document:** Santis OS Architecture Book  
**Volume:** 1 – Architecture Principles  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines the ownership, communication, consistency, failure and data-classification boundaries of the Santis OS domain.

It establishes which bounded context owns each category of canonical state and how other contexts MAY interact with that state.

This document is normative. Implementations MUST NOT create hidden cross-context ownership or direct table dependencies that contradict this map.

---

# Core Rules

## BC-01 — Single Ownership

Every canonical entity MUST have exactly one owning bounded context.

Two contexts MUST NOT independently mutate the same canonical record.

## BC-02 — No Direct Foreign Mutation

A bounded context MUST NOT mutate another context's canonical tables directly.

Cross-context changes MUST occur through:

- a published synchronous application interface,
- an accepted command,
- or a consumed domain event.

## BC-03 — Communication Types

Cross-context communication SHALL use one of three explicit models:

1. **Synchronous command** — an immediate state-changing request with a defined result.
2. **Synchronous query** — a read-only request required to make a current decision.
3. **Asynchronous event** — an immutable fact published after an authoritative state transition.

Asynchronous events MUST NOT be used where strong consistency is required before a command can succeed.

## BC-04 — No Shared Hidden Database Model

Physical co-location in one PostgreSQL database does not imply shared ownership.

Schemas, repositories and application interfaces SHOULD reflect bounded-context ownership.

## BC-05 — Explicit Consistency

Every cross-context workflow MUST declare whether it requires:

- strong consistency,
- eventual consistency,
- or a controlled reconciliation process.

## BC-06 — Failure Isolation

A non-critical downstream failure MUST NOT invalidate a successfully committed upstream canonical transaction.

Critical preconditions MUST fail closed before commit.

## BC-07 — Event Semantics

Commands describe intentions. Events describe facts.

An event MUST NOT be published before the corresponding canonical state is committed.

## BC-08 — Data Minimization

Each context MUST access only the fields required for its responsibility.

Sensitive personal, financial or security data MUST NOT be copied into unrelated contexts or events.

---

# Context Ownership Matrix

| Context | Primary responsibility | Canonical entities | Consistency default | Failure mode | Data class |
|---|---|---|---|---|---|
| Identity & Access | Authentication context, memberships, roles and authorization attributes | User, Actor, TenantMembership, LocationAccess, RoleAssignment, SessionReference | Strong | Fail closed | Security, PII |
| Tenant & Configuration | Tenant, location and operational configuration | Tenant, Location, BranchConfiguration, FeatureConfiguration | Strong | Fail closed | Operational, commercial |
| Guest & CRM | Guest identity, contact details, preferences and relationship memory | Guest, GuestContact, GuestPreference, Consent, CRMProfile | Strong for identity; eventual for derived profile | Restricted degraded mode | PII, sensitive preference data |
| Service Catalogue | Sellable services, durations, requirements and pricing references | Service, ServiceVersion, ServiceRequirement, AddOn | Strong for active contract version | Fail closed for booking dependency | Commercial, operational |
| Staff & Workforce | Staff identity projection, shifts and service authorization | StaffProfile, StaffShift, StaffCapability, TherapistServiceAuthorization | Strong for active shift and capability | Fail closed for assignment | PII, operational |
| Availability | Resource occupancy, holds, conflicts and release decisions | ResourceClaim, AvailabilityHold, OccupancyInterval, ConflictDecision | Strong | Fail closed | Operational |
| Booking | Booking aggregate and lifecycle | Booking, BookingGuest, BookingAssignmentReference, BookingLifecycle | Strong | Fail closed | PII, operational |
| Visit & Service Execution | Check-in, preparation, service segments and completion | Visit, ServiceSegment, GuestPreparation, LockerAssignment | Strong for active execution | Fail closed or controlled degraded mode | PII, operational |
| Payments | Payment intent, attempt, authorization and settlement-facing state | PaymentIntent, PaymentAttempt, PaymentAllocation, RefundRequest | Strong | Fail closed | Financial, PII |
| Accounting | Journals, ledger entries, adjustments and reconciliation | Journal, LedgerEntry, AccountingPeriod, ReconciliationCase | Strong and append-only | Fail closed; manual reconciliation | Financial, regulated |
| Entitlements | Packages, memberships, gift cards and consumable rights | EntitlementAccount, EntitlementGrant, EntitlementReservation, EntitlementConsumption | Strong | Fail closed | Financial, operational |
| Commission | Rules, accruals, reversals and beneficiary statements | CommissionRuleVersion, CommissionAccrual, CommissionReversal | Strong for posting; eventual for reporting | Reconciliation required | Financial, payroll-sensitive |
| Inventory | Stock identity, movements and consumption | InventoryItem, StockMovement, ConsumptionRule, StockBalanceProjection | Strong for movement; derived balance | Fail closed for negative-stock policy | Financial, operational |
| Workflow & Tasks | Operational tasks, approvals and action-state transitions | Task, ApprovalRequest, ActionCard, WorkflowInstance | Strong for approvals; eventual for generated tasks | Controlled degraded mode | Operational |
| Notifications | Delivery requests, templates and channel attempts | NotificationRequest, DeliveryAttempt, TemplateVersion | Eventual | Degraded; retry allowed | PII, operational |
| Analytics & Reporting | Aggregated, read-optimized reporting state | AnalyticsProjection, MetricSnapshot, ReportDataset | Eventual | Degraded; rebuildable | Aggregated operational/financial |
| AI Orchestration | Authorized AI queries, proposals, tool calls and approval handoffs | AgentRun, ToolInvocation, AIProposal, AIApprovalReference | Strong for authorization; eventual for analysis | Fail closed for mutation | Security, PII, derived data |
| Audit & Compliance | Tamper-evident evidence of security and business actions | AuditEvent, AuditCheckpoint, EvidenceReference | Strong append-only | Fail closed for critical mutation evidence | Security, regulated metadata |
| Integration | External-system commands, webhooks, mappings and delivery state | IntegrationEndpoint, ExternalMapping, WebhookDelivery, ImportJob | Eventual unless explicitly synchronous | Quarantine and retry | Operational, external identifiers |
| Projection & Governance | Airtable and other rebuildable operational projections | ProjectionCursor, ProjectionStatus, GovernanceRegister | Eventual | Degraded; canonical state unchanged | Derived operational metadata |

---

# Context Definitions

## 1. Identity & Access

### Owner

Identity and Security engineering responsibility.

### Accepted Commands

- AuthenticateActor
- GrantTenantMembership
- RevokeTenantMembership
- GrantLocationAccess
- RevokeLocationAccess
- AssignRole
- RevokeRole

### Published Events

- actor.authenticated
- tenant_membership.granted
- tenant_membership.revoked
- location_access.changed
- role_assignment.changed

### Synchronous Dependencies

None for core authorization decisions beyond its own canonical state.

### Forbidden Access

Identity MUST NOT mutate Booking, Payment, Accounting or Guest domain records.

### Normative Rules

- Client-supplied tenant or location identifiers MUST NOT establish authorization.
- Authorization context MUST be derived from authenticated actor state and verified memberships.
- Unknown or stale authorization context MUST fail closed.

---

## 2. Tenant & Configuration

### Accepted Commands

- CreateTenant
- CreateLocation
- UpdateBranchConfiguration
- ActivateFeature
- SuspendLocation

### Published Events

- tenant.created
- location.created
- branch_configuration.changed
- feature_configuration.changed

### Consumed Events

- subscription.changed, where subscription capabilities are implemented externally.

### Forbidden Access

This context MUST NOT create operational bookings, payments or staff shifts.

### Normative Rules

- Tenant and location records define scope but do not independently grant user access.
- A branch configuration used for canonical booking MUST resolve to exactly one active record.

---

## 3. Guest & CRM

### Accepted Commands

- CreateGuest
- UpdateGuestContact
- RecordConsent
- RecordGuestPreference
- MergeGuestIdentity

### Published Events

- guest.created
- guest.contact_changed
- guest.preference_changed
- guest.consent_changed
- guest.identity_merged

### Consumed Events

- booking.completed
- booking.cancelled
- payment.recorded
- entitlement.changed

### Forbidden Access

CRM MUST NOT determine payment truth, booking confirmation or entitlement balances.

### Normative Rules

- Contact, health, allergy and preference data MUST be minimized by consumer.
- Analytics events SHOULD use references or approved classifications rather than raw PII.

---

## 4. Service Catalogue

### Accepted Commands

- CreateService
- PublishServiceVersion
- RetireServiceVersion
- UpdateServiceRequirement

### Published Events

- service.created
- service.version_published
- service.retired
- service.requirement_changed

### Forbidden Access

The catalogue MUST NOT rewrite historical booking snapshots when a service definition changes.

### Normative Rules

- Booking creation MUST snapshot the applicable service contract version, duration and price basis.
- Historical bookings MUST retain their accepted service version.

---

## 5. Staff & Workforce

### Accepted Commands

- CreateStaffProfile
- PublishShift
- CancelShift
- GrantServiceCapability
- RevokeServiceCapability

### Published Events

- staff.created
- staff_shift.published
- staff_shift.cancelled
- staff_capability.changed

### Synchronous Queries

- GetAuthorizedStaffContext
- CheckStaffShift
- CheckStaffCapability

### Forbidden Access

Staff & Workforce MUST NOT reserve resources or confirm bookings.

### Normative Rules

- Display names MUST NOT be used as identity proof.
- Exact immutable staff identifiers MUST be used for assignment and authorization.

---

## 6. Availability

### Accepted Commands

- ReserveResources
- HoldResources
- ReleaseResources
- ReplaceResourceClaim

### Published Events

- resource.held
- resource.reserved
- resource.released
- resource_conflict.detected

### Synchronous Dependencies

- Staff & Workforce for active shift and capability.
- Tenant & Configuration for active location scope.

### Forbidden Access

Availability MUST NOT confirm a booking lifecycle independently.

### Normative Rules

- Resource claims required for booking confirmation MUST be established before booking commit.
- Overlapping therapist or room claims MUST be rejected unless an explicit approved overlap policy applies.
- Claim enforcement MUST be concurrency-safe at database level.

---

## 7. Booking

### Accepted Commands

- CreateBooking
- ConfirmBooking
- RescheduleBooking
- CancelBooking
- CheckInBooking
- CompleteBooking
- MarkNoShow

### Published Events

- booking.created
- booking.confirmed
- booking.rescheduled
- booking.cancelled
- booking.checked_in
- booking.completed
- booking.no_show_recorded

### Synchronous Dependencies

- Identity & Access for actor authorization.
- Tenant & Configuration for active branch context.
- Guest & CRM for guest reference validation.
- Service Catalogue for active service contract.
- Availability for required resource claims.

### Forbidden Access

Booking MUST NOT:

- write payment ledger entries,
- consume package balances directly,
- calculate canonical commissions,
- send notifications directly,
- mutate foreign context tables.

### Normative Rules

- Externally retriable booking commands MUST use durable idempotency.
- Booking and required resource claims MUST commit atomically where strong consistency is required.
- A booking event MUST be published only after canonical commit through the transactional outbox.

---

## 8. Visit & Service Execution

### Accepted Commands

- StartVisit
- AssignLocker
- CompletePreparation
- StartServiceSegment
- CompleteServiceSegment
- CompleteVisit

### Published Events

- visit.started
- locker.assigned
- guest_preparation.completed
- service_segment.started
- service_segment.completed
- visit.completed

### Consumed Events

- booking.confirmed
- booking.checked_in
- booking.cancelled

### Forbidden Access

This context MUST NOT independently alter payment settlement, commission posting or entitlement balances.

---

## 9. Payments

### Accepted Commands

- CreatePaymentIntent
- RecordPayment
- AuthorizePayment
- CapturePayment
- FailPayment
- RequestRefund
- RecordRefund

### Published Events

- payment.intent_created
- payment.authorized
- payment.recorded
- payment.failed
- refund.requested
- refund.recorded

### Synchronous Dependencies

- Identity & Access for authorization.
- Booking or Entitlements for allocation target validation.

### Forbidden Access

Payments MUST NOT create accounting ledger entries by direct foreign-table mutation.

### Normative Rules

- Payment commands MUST be idempotent.
- Payment status shown on Booking is a projection and MUST NOT override canonical payment state.
- Financial ambiguity MUST enter reconciliation rather than automatic repair.

---

## 10. Accounting

### Accepted Commands

- PostJournal
- ReverseJournal
- OpenAccountingPeriod
- CloseAccountingPeriod
- RecordAdjustmentApproval
- ReconcileSettlement

### Published Events

- journal.posted
- journal.reversed
- accounting_period.closed
- settlement.reconciled
- reconciliation.required

### Consumed Events

- payment.recorded
- refund.recorded
- commission.accrued
- commission.reversed
- entitlement.sold

### Forbidden Access

Accounting MUST NOT change the business lifecycle of Booking, Payment or Entitlement aggregates.

### Normative Rules

- Ledger entries MUST be append-only.
- Corrections MUST use reversal or adjustment records.
- Unbalanced journals MUST fail closed.

---

## 11. Entitlements

### Accepted Commands

- GrantEntitlement
- ReserveEntitlement
- ConsumeEntitlement
- ReleaseEntitlement
- ExpireEntitlement
- ReverseEntitlementConsumption

### Published Events

- entitlement.granted
- entitlement.reserved
- entitlement.consumed
- entitlement.released
- entitlement.expired
- entitlement.consumption_reversed

### Synchronous Dependencies

- Booking or Service Catalogue for consumption eligibility.

### Forbidden Access

Entitlements MUST NOT infer payment completion or post accounting entries directly.

### Normative Rules

- Entitlement consumption MUST be concurrency-safe.
- Duplicate consumption for the same business identity MUST be prevented by a durable constraint.

---

## 12. Commission

### Accepted Commands

- EvaluateCommission
- AccrueCommission
- ReverseCommission
- ApproveCommissionAdjustment

### Published Events

- commission.evaluated
- commission.accrued
- commission.reversed
- commission.adjustment_approved

### Consumed Events

- booking.completed
- payment.recorded
- refund.recorded
- entitlement.consumed

### Accounting Policy Dependency

The event that creates commission entitlement MUST be defined by an approved accounting policy decision.

Until that decision exists, Commission MUST NOT assume that booking confirmation, service completion or payment receipt independently creates an earned commission.

### Forbidden Access

Commission MUST NOT mutate Payment, Booking or Accounting canonical tables directly.

---

## 13. Inventory

### Accepted Commands

- ReceiveStock
- AdjustStock
- ConsumeStock
- ReverseStockMovement
- TransferStock

### Published Events

- stock.received
- stock.consumed
- stock.adjusted
- stock.transferred
- stock_movement.reversed

### Consumed Events

- service_segment.completed, where approved consumption rules exist.

### Forbidden Access

Inventory MUST NOT mark a booking or visit complete.

### Normative Rules

- Stock balance is a projection of canonical stock movements.
- Manual balance edits MUST NOT replace missing movement records.

---

## 14. Workflow & Tasks

### Accepted Commands

- CreateTask
- AssignTask
- CompleteTask
- RequestApproval
- ApproveAction
- RejectAction

### Published Events

- task.created
- task.completed
- approval.requested
- approval.approved
- approval.rejected

### Consumed Events

Operational events from other contexts MAY generate tasks through approved rules.

### Forbidden Access

Workflow completion MUST NOT substitute for canonical completion in Booking, Payment, Accounting or Entitlements.

---

## 15. Notifications

### Accepted Commands

- QueueNotification
- CancelNotification
- RetryDelivery

### Published Events

- notification.queued
- notification.delivered
- notification.failed

### Consumed Events

- booking.confirmed
- booking.cancelled
- payment.recorded
- entitlement.expiring

### Failure Mode

Notification failure MAY degrade independently and MUST NOT roll back a committed booking or payment.

### Normative Rules

- Retry MUST be bounded.
- Delivery attempts MUST be auditable.
- Template rendering MUST NOT expose unauthorized tenant or guest data.

---

## 16. Analytics & Reporting

### Accepted Commands

- RebuildProjection
- RefreshMetricSnapshot
- ExportAuthorizedReport

### Consumed Events

Authorized events and projections from all relevant contexts.

### Published Events

- analytics_projection.rebuilt
- report.generated
- report_exported

### Forbidden Access

Analytics MUST NOT mutate source canonical state.

### Normative Rules

- Analytics projections are disposable and rebuildable.
- Reports MUST preserve tenant and location scope.
- PII access MUST be purpose-limited and auditable.

---

## 17. AI Orchestration

### Accepted Commands

- StartAgentRun
- RequestAuthorizedContext
- ProposeCommand
- SubmitApprovedCommand
- CancelAgentRun

### Published Events

- ai_run.started
- ai_proposal.created
- ai_command.submitted
- ai_action.blocked
- ai_run.completed

### Synchronous Dependencies

- Identity & Access for tool authorization.
- Published query interfaces for authorized context.
- Workflow & Tasks for required human approval.

### Forbidden Access

AI Orchestration MUST NOT:

- execute direct SQL,
- hold general database credentials,
- bypass tenant scope,
- mutate canonical tables directly,
- approve its own high-risk proposal.

### Normative Rules

- AI-originated actions MUST pass the same command, authorization, validation and audit pipeline as human-originated actions.
- High-risk AI actions MUST require explicit human approval.

---

## 18. Audit & Compliance

### Accepted Commands

- RecordAuditEvent
- CreateAuditCheckpoint
- VerifyAuditChain
- RegisterEvidence

### Published Events

- audit_event.recorded
- audit_checkpoint.created
- audit_integrity.failed

### Forbidden Access

Audit MUST NOT become a secondary business-state authority.

### Normative Rules

- Critical mutation evidence MUST be written in the same transaction or through a failure-safe mechanism defined by contract.
- Audit records MUST minimize PII.
- Audit records SHOULD be tamper-evident and append-only.

---

## 19. Integration

### Accepted Commands

- RegisterIntegration
- ImportExternalRecord
- DeliverWebhook
- RetryWebhook
- ReconcileExternalMapping

### Published Events

- external_record.imported
- webhook.delivered
- webhook.failed
- integration_mapping.changed

### Forbidden Access

Integration adapters MUST NOT bypass application commands by writing canonical tables directly.

### Normative Rules

- External identifiers MUST be mapped explicitly to internal immutable identifiers.
- Imports MUST be idempotent or quarantined when identity cannot be proven.
- Untrusted external payloads MUST be validated before reaching domain handlers.

---

## 20. Projection & Governance

### Accepted Commands

- ProjectCanonicalChange
- ReconcileProjection
- QuarantineProjection
- RegisterArchitectureEvidence

### Canonical Entities

Only projection-control and governance metadata are canonical in this context. Business data copied into Airtable or reporting stores remains derived.

### Published Events

- projection.updated
- projection.failed
- projection.reconciled
- projection.quarantined

### Consumed Events

Approved domain events required to maintain operational projections.

### Forbidden Access

Projection workers and Airtable automations MUST NOT become business authorities or write back canonical business state without an approved command path.

### Normative Rules

- Projection failure MUST NOT alter canonical state.
- Every projected record SHOULD carry source record ID, source version, projection contract version and projected timestamp.
- Projection reconciliation MUST detect missing, stale and divergent copies.

---

# Cross-Context Interaction Matrix

| From | To | Interaction | Consistency | Rule |
|---|---|---|---|---|
| Booking | Identity & Access | Query authorized context | Strong | MUST complete before mutation |
| Booking | Availability | Reserve resources | Strong | MUST complete before confirmed booking commit |
| Booking | Guest & CRM | Validate guest reference | Strong for identity | MUST NOT copy unnecessary PII |
| Booking | Service Catalogue | Resolve service contract | Strong | MUST snapshot accepted version |
| Booking | Notifications | booking.confirmed event | Eventual | Notification failure MUST NOT roll back booking |
| Booking | Analytics | Domain events | Eventual | Projection is rebuildable |
| Visit | Commission | service completion event | Eventual, policy-dependent | Accrual requires approved policy |
| Payments | Accounting | payment.recorded event or approved synchronous posting contract | Defined by accounting contract | MUST prevent duplicate posting |
| Payments | Booking | Payment-status projection | Eventual | Booking MUST NOT own payment truth |
| Entitlements | Booking | Eligibility/consumption result | Strong when required for confirmation | Duplicate consumption prohibited |
| Inventory | Visit | Consumption from completed segment | Eventual or strong by service policy | Must use movement ledger |
| AI Orchestration | All command contexts | Structured command | Same as human command | No bypass permitted |
| All canonical contexts | Audit | Audit evidence | Strong for critical mutations | Evidence loss may block commit |
| All canonical contexts | Projection & Governance | Domain event | Eventual | Projection cannot become authority |

---

# Forbidden Architecture Patterns

The following patterns are prohibited unless an approved ADR explicitly provides a temporary migration exception:

1. A module directly updating another module's canonical table.
2. React, Airtable or an integration adapter deciding canonical business truth.
3. A projection feeding back into canonical state without an approved command.
4. A domain event being emitted before its transaction commits.
5. A downstream notification or analytics failure rolling back a committed booking.
6. A payment-status field on Booking overriding Payments canonical state.
7. A stock-balance field being manually repaired without a movement record.
8. An AI agent executing direct SQL or using general database credentials.
9. Sharing raw PII through events when a reference or classified subset is sufficient.
10. Assuming eventual consistency where the command requires a strong precondition.

---

# Ownership Change Procedure

Canonical ownership MAY change only through an approved ADR.

The ADR MUST define:

- current owner,
- future owner,
- migration sequence,
- dual-read or dual-write restrictions,
- reconciliation method,
- rollback procedure,
- production acceptance evidence.

Dual canonical ownership is prohibited.

---

# Compliance and Verification

Each bounded context MUST maintain:

- a list of canonical entities,
- accepted commands,
- published events,
- consumed events,
- synchronous dependencies,
- forbidden direct access,
- consistency model,
- failure mode,
- data classification,
- named technical owner.

Architecture tests SHOULD verify forbidden dependencies at build time.

Database permissions SHOULD prevent cross-schema writes wherever practical.

Production approval MUST NOT be granted to a context whose ownership boundaries are undefined.

---

# Current Architecture Status

This document defines the normative target boundary model.

It does not claim that all listed contexts are fully implemented or production approved.

Component maturity MUST be read together with `docs/architecture/STATUS.md`.

---

End of Document
