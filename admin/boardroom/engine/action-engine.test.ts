import { describe, expect, it } from "vitest";
import {
  createDangerAlertGuard,
  deriveConciergeActions,
  shouldPlayDangerAlert,
  transitionActionStatus,
} from "./action-engine";
import {
  SNAPSHOT_CRITICAL_ALERT,
  SNAPSHOT_HIGH_ALERT,
  SNAPSHOT_LOW_NO_ALERT,
  SNAPSHOT_PREMIUM_WEAK,
  SNAPSHOT_Q2_FRICTION_ONLY,
} from "./action-engine.fixtures";

function deterministicDeps() {
  let seq = 0;

  return {
    now: () => "2026-04-16T18:00:00.000Z",
    idFactory: (prefix: string) => `${prefix}_${++seq}`,
  };
}

describe("deriveConciergeActions", () => {
  it("produces high ALERT, OPTIMIZATION and RECOVERY for high-drop q2 case", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_HIGH_ALERT,
      deterministicDeps()
    );

    expect(actions).toHaveLength(3);

    expect(actions.map((a) => a.type)).toEqual([
      "ALERT",
      "OPTIMIZATION",
      "RECOVERY",
    ]);

    expect(actions[0]).toMatchObject({
      type: "ALERT",
      severity: "high",
      metric: "dropRate",
      threshold: 10,
      requiresApproval: false,
      status: "new",
    });

    expect(actions[1]).toMatchObject({
      type: "OPTIMIZATION",
      severity: "high",
      requiresApproval: true,
      status: "new",
    });

    expect(actions[2]).toMatchObject({
      type: "RECOVERY",
      severity: "high",
      metric: "conciergeRate",
      threshold: 5,
      requiresApproval: true,
      status: "new",
    });
  });

  it("produces critical ALERT when dropRate exceeds 18", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_CRITICAL_ALERT,
      deterministicDeps()
    );

    const alert = actions.find((a) => a.type === "ALERT");
    expect(alert).toBeDefined();
    expect(alert?.severity).toBe("critical");
  });

  it("produces no ALERT when dropRate is below threshold", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_LOW_NO_ALERT,
      deterministicDeps()
    );

    const hasAlert = actions.some((a) => a.type === "ALERT");
    expect(hasAlert).toBe(false);
  });

  it("produces only premium advisory when premium interest is weak but completion is healthy", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_PREMIUM_WEAK,
      deterministicDeps()
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: "ADVISORY",
      severity: "medium",
      metric: "premiumInterestRate",
      threshold: 3,
      requiresApproval: true,
      status: "new",
    });
  });

  it("produces q2 optimization without recovery when concierge rate is healthy", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_Q2_FRICTION_ONLY,
      deterministicDeps()
    );

    expect(actions.map((a) => a.type)).toEqual(["ALERT", "OPTIMIZATION"]);
    expect(actions.some((a) => a.type === "RECOVERY")).toBe(false);
  });
});

describe("transitionActionStatus", () => {
  it("allows new -> acknowledged -> approved -> applied", () => {
    const [action] = deriveConciergeActions(
      SNAPSHOT_PREMIUM_WEAK,
      deterministicDeps()
    );

    const acknowledged = transitionActionStatus(action, "acknowledged");
    expect(acknowledged.status).toBe("acknowledged");

    const approved = transitionActionStatus(acknowledged, "approved");
    expect(approved.status).toBe("approved");

    const applied = transitionActionStatus(approved, "applied");
    expect(applied.status).toBe("applied");
  });

  it("allows direct new -> approved when operator approves immediately", () => {
    const [action] = deriveConciergeActions(
      SNAPSHOT_PREMIUM_WEAK,
      deterministicDeps()
    );

    const approved = transitionActionStatus(action, "approved");
    expect(approved.status).toBe("approved");
  });

  it("rejects invalid lifecycle jumps", () => {
    const [action] = deriveConciergeActions(
      SNAPSHOT_PREMIUM_WEAK,
      deterministicDeps()
    );

    expect(() => transitionActionStatus(action, "applied")).toThrow(
      /Invalid action status transition/
    );
  });
});

describe("shouldPlayDangerAlert", () => {
  it("returns true for high or critical ALERT presence", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_HIGH_ALERT,
      deterministicDeps()
    );

    expect(shouldPlayDangerAlert(actions)).toBe(true);
  });

  it("returns false when no high/critical ALERT exists", () => {
    const actions = deriveConciergeActions(
      SNAPSHOT_PREMIUM_WEAK,
      deterministicDeps()
    );

    expect(shouldPlayDangerAlert(actions)).toBe(false);
  });
});

describe("createDangerAlertGuard", () => {
  it("allows first alert, blocks rapid repeat, allows after cooldown", () => {
    const guard = createDangerAlertGuard(30000);

    expect(guard.canTrigger(1000)).toBe(true);
    expect(guard.canTrigger(15000)).toBe(false);
    expect(guard.canTrigger(32001)).toBe(true);
  });
});
