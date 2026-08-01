# Santis OS Architecture Book

- **Version:** 0.9-RC2
- **Status:** Normative Draft
- **Approval:** Pending Architecture Review
- **Production Authority:** No
- **Canonical Repository:** `bashasnoglu-jpg/SANTIS_SITE`
- **Canonical Path:** `docs/architecture/`

## Purpose

Santis OS Architecture Book defines the normative architecture, technical contracts, decision records, production reliability requirements, and evidence gates for the controlled transition from the Airtable-first operational model to a modular backend with PostgreSQL as canonical authority.

The book distinguishes clearly between:

- current production reality,
- partially verified prototypes,
- normative target architecture,
- acceptance-pending components,
- production-approved capabilities.

## Canonical Source Policy

This GitHub directory is the only editable canonical source for the Architecture Book.

- Google Drive copies are signed publication snapshots.
- Airtable stores architecture governance metadata, approvals, owners, evidence links, and GitHub paths.
- GitHub Issues track missing sections, decisions, reviews, and acceptance work.
- Architecture changes MUST be proposed through a branch and pull request.
- Direct changes to `develop` MUST NOT be used for architecture-book revisions.

## Volumes

1. **Volume 1 — Architecture Principles**
2. **Volume 2 — Technical Architecture**
3. **Volume 3 — Platform Evolution**
4. **Volume 4 — Production Reliability Foundations**

## Supporting Records

- Architecture Decision Records: `adr/`
- Normative contracts: `contracts/`
- Operational runbooks: `runbooks/`
- Acceptance evidence: `evidence/`
- Primary and supporting references: `references/`

## Normative Language

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative and will be defined in the Architecture Book appendices.

## Current Release Work

The current release candidate is focused on:

- corrected engineering principles,
- module communication contracts,
- canonical data-contract classification,
- production/non-production physical separation,
- event envelope and versioning,
- Availability and Resource Claim Contract,
- PostgreSQL RLS and transaction-context examples,
- architecture status classification,
- production reliability requirements.
