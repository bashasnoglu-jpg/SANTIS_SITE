import { describe, it, expect } from "vitest";
import { SovereignBus } from "../../packages/sovereign-bus/src/index.js";
import { CommandIngressService } from "../../apps/ingestion-api/src/services/command-ingress.js";
import { makeRawSelectMoodCommand } from "../helpers/fixtures.js";

describe("guest.select_mood - validation fail", () => {
  it("should reject malformed command before bus dispatch", async () => {
    const bus = new SovereignBus();
    const ingress = new CommandIngressService(bus.commands);

    const badCommand = makeRawSelectMoodCommand({
      payload: {},
    });

    const result = await ingress.ingest(badCommand);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.status).toBe(400);
    expect(result.error.code).toBe("validation_failed");
  });
});
