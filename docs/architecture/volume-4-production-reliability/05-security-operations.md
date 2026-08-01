# Security Operations

**Document:** Santis OS Architecture Book  
**Volume:** 4 – Production Reliability Foundations  
**Version:** 0.9-RC2  
**Status:** Normative Draft  
**Production Authority:** No

---

# Purpose

This document defines operational security controls for identities, secrets, privileged access, dependencies and emergency actions.

---

# Least Privilege

Human and machine identities MUST receive the minimum permissions required.

Production application roles MUST NOT be superusers, table owners or `BYPASSRLS` roles.

Migration, application, audit-reader and break-glass roles MUST be separated.

---

# Secret Management

Secrets MUST:

- be stored in an approved secret manager,
- never be committed to source control,
- be scoped by environment,
- have an owner,
- support rotation,
- be revoked immediately after suspected compromise.

Secret values MUST NOT appear in logs, screenshots, issue comments or audit payloads.

---

# Rotation

Rotation procedures MUST exist for:

- database credentials,
- API keys,
- signing keys,
- encryption keys,
- webhook secrets,
- service-account tokens.

Rotation MUST be tested without requiring unsafe production downtime where practical.

---

# Privileged Access

Privileged production access MUST be:

- time bounded,
- individually attributable,
- approved,
- logged,
- reviewed after use.

Shared administrator accounts are prohibited.

---

# Break-Glass Procedure

Break-glass access MAY be used only for declared incidents or approved recovery exercises.

It MUST require:

- explicit incident/change identifier,
- named approver,
- short expiry,
- complete audit evidence,
- post-use credential rotation or revocation,
- review of every action taken.

Break-glass access MUST NOT become routine operational access.

---

# Dependency Security

Dependencies MUST be inventoried and scanned for known vulnerabilities.

Critical vulnerabilities require documented triage, mitigation and owner assignment.

Unmaintained or unverified packages SHOULD NOT be introduced into security-sensitive paths.

---

# Key Management

Encryption and signing keys MUST have documented purpose, scope, rotation and recovery rules.

Tenant-sensitive encryption designs MUST consider backup recovery and data-deletion obligations.

Keys MUST NOT be stored in the same unrestricted location as encrypted data.

---

# Security Monitoring

Alerts SHOULD cover:

- repeated authorization denial,
- RLS context failures,
- cross-tenant anomaly,
- unusual privileged access,
- secret-use anomalies,
- bulk export or deletion attempts,
- audit-chain verification failure,
- AI tool-policy violations.

---

# Production Acceptance Gate

Production security operations require tested secret rotation, role separation, break-glass evidence, vulnerability triage and audit verification procedures.

---

End of Document
