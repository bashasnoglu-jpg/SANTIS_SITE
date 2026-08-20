import assert from "node:assert/strict";
import test from "node:test";

import {
  BaseCommandSchema,
  BaseEventSchema,
  RegionSchema,
} from "../src/index.ts";

test("event contract entrypoint exposes validation-only schemas", () => {
  assert.equal(RegionSchema.safeParse("EU").success, true);
  assert.equal(BaseEventSchema.safeParse({}).success, false);
  assert.equal(BaseCommandSchema.safeParse({}).success, false);
});
