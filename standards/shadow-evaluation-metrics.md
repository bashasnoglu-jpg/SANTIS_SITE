---
title: Santis OS Shadow Evaluation Metrics
version: 1.0
status: FROZEN
authority: Santis OS Architecture Authority
effective_date: 2026-07-13
scope: Global
change_policy: RFC + Architecture Review + Version Increment
---

# Shadow Evaluation Metrics v1.0

## Objective

Measure guard-engine accuracy, safety and operational value before user-facing activation or enforcement.

## Phase constraints

During Shadow Evaluation:

- engine output is not shown to reception users;
- no booking is moved, blocked or modified because of shadow output;
- no guard enforcement or automatic remediation is enabled;
- evaluation records are versioned, timestamped and linked to canonical booking input;
- personally identifying information is minimized in analytical exports.

## Accuracy metrics

| Metric | Definition | Target |
|---|---|---:|
| P0/P1 recall | `TP / (TP + FN)` for real P0/P1 issues | `≥95%` |
| False positive rate | `FP / (FP + TN)` for P0/P1 classification | `<3%` |
| False negative rate | `FN / (TP + FN)` for P0/P1 issues | `<2%` |

The recall and false-negative targets are related but both are retained as explicit release gates. Metrics must include confidence intervals and sample size; a percentage without sufficient observed cases is not a pilot PASS.

## Operational-value metrics

| Metric | Target against agreed baseline |
|---|---:|
| Mean P0/P1 resolution time | At least 20% improvement |
| Reception interaction count for targeted workflows | At least 30% reduction |
| Median calendar interpretation time in controlled task test | At least 40% reduction |

Operational-value targets are evaluated during read-only preview or Budva pilot, not inferred solely from invisible shadow execution.

## Required evaluation record

Each evaluation records:

- booking, tenant, location and environment references;
- canonical input fingerprint;
- guard and resolver versions;
- guard results, VisualState and ActionPriority projections;
- evaluation timestamp;
- later adjudicated outcome: `TP | FP | TN | FN | UNRESOLVED`;
- adjudicator role, evidence level and timestamp;
- real operator action and resolution time when applicable.

## Evaluation process

1. Freeze evaluation rules and version identifiers.
2. Run silently on the defined booking cohort.
3. Collect real outcomes independently of engine classification.
4. Adjudicate disagreements using documented evidence.
5. Calculate metrics by guard, location, service family and severity.
6. Review failure modes and amend rules only through a new rule version.
7. Re-run a fresh validation window after material rule changes.

## Budva release gate

Read-only Visual Language may begin only when:

- required accuracy targets are met on an adequate sample;
- no unresolved safety-critical false-negative pattern remains;
- evaluation data completeness is acceptable;
- Architecture Authority records a signed phase decision.

Multi-location rollout additionally requires a successful Budva pilot and explicit review of location-specific drift.

## No unsupported guarantee

Targets are release gates, not advance claims. Santis OS must not state that it achieves 95% detection or a sub-3% false-alarm rate until measured evidence supports those figures.