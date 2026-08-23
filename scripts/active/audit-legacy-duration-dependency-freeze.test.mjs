import assert from "node:assert/strict";
import test from "node:test";

import {
  findForbiddenLegacyDurationReferences,
  LEGACY_DURATION_DEPENDENCY_FORBIDDEN,
  LEGACY_DURATION_DENY_LIST,
} from "./audit-legacy-duration-dependency-freeze.mjs";

const forbiddenReference = LEGACY_DURATION_DENY_LIST[0];

test("rejects a new code dependency on the legacy duration field", () => {
  const violations = findForbiddenLegacyDurationReferences([
    {
      path: "src/new-duration-consumer.ts",
      content: `const durationField = ${JSON.stringify(forbiddenReference)};`,
    },
  ]);

  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, LEGACY_DURATION_DEPENDENCY_FORBIDDEN);
});

test("rejects a new formula configuration dependency on the legacy duration field", () => {
  const violations = findForbiddenLegacyDurationReferences([
    {
      path: "config/airtable-duration-formula.json",
      content: JSON.stringify({
        formula: `IF({${forbiddenReference}}>0,{${forbiddenReference}},BLANK())`,
      }),
    },
  ]);

  assert.equal(violations.length, 2);
  assert.ok(
    violations.every(
      (violation) => violation.code === LEGACY_DURATION_DEPENDENCY_FORBIDDEN,
    ),
  );
});

test("allows VNext duration authority references", () => {
  const violations = findForbiddenLegacyDurationReferences([
    {
      path: "src/vnext-duration-consumer.ts",
      content: 'const durationField = "VNext Shadow Operational Duration";',
    },
  ]);

  assert.deepEqual(violations, []);
});

test("allows an explicitly grandfathered repository baseline path", () => {
  const baselinePath = "legacy/live-archive-duration-adapter.ts";
  const violations = findForbiddenLegacyDurationReferences(
    [
      {
        path: baselinePath,
        content: `const legacyField = ${JSON.stringify(forbiddenReference)};`,
      },
    ],
    { baselineAllowlist: new Set([baselinePath]) },
  );

  assert.deepEqual(violations, []);
});
