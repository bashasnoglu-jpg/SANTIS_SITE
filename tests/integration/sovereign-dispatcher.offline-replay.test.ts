import { describe, it, expect } from "vitest";
import { makeRawSelectMoodCommand } from "../helpers/fixtures.js";

type CommandLifecycleState =
  | "idle"
  | "submitting"
  | "ack_success"
  | "nack_error"
  | "queued_offline";

class FakeStore {
  public state = {
    commandLifecycle: "idle" as CommandLifecycleState,
    lastResult: null as unknown,
  };

  setLifecycle(next: CommandLifecycleState) {
    this.state.commandLifecycle = next;
  }

  setResult(result: unknown) {
    this.state.lastResult = result;
  }
}

class InMemoryOfflineQueue {
  public items: any[] = [];

  enqueue(command: any) {
    // Aynı commandId iki kez queue'ya düşmesin
    if (!this.items.find((i) => i.commandId === command.commandId)) {
      this.items.push(command);
    }
  }

  drain() {
    const drained = [...this.items];
    this.items = [];
    return drained;
  }
}

describe("sovereignDispatcher - offline replay", () => {
  it("should queue offline, replay once, and avoid duplicate materialization", async () => {
    const store = new FakeStore();
    const queue = new InMemoryOfflineQueue();

    let online = false;
    let dispatchCount = 0;
    const receivedCommandIds = new Set<string>();

    async function fakeHttpDispatch(command: any) {
      dispatchCount += 1;

      // idempotent server simulation
      if (receivedCommandIds.has(command.commandId)) {
        return {
          status: "ack",
          commandId: command.commandId,
          traceId: command.traceId,
          acceptedAt: new Date().toISOString(),
          mode: "sync_completed",
          message: "Duplicate safely ignored",
          resultingEventTypes: ["experience.interaction.mood_selected"],
        };
      }

      receivedCommandIds.add(command.commandId);

      return {
        status: "ack",
        commandId: command.commandId,
        traceId: command.traceId,
        acceptedAt: new Date().toISOString(),
        mode: "sync_completed",
        message: "Processed",
        resultingEventTypes: ["experience.interaction.mood_selected"],
      };
    }

    async function dispatch(command: any) {
      if (!online) {
        queue.enqueue(command);
        store.setLifecycle("queued_offline");
        return { queued: true };
      }

      store.setLifecycle("submitting");
      const result = await fakeHttpDispatch(command);
      store.setResult(result);

      if (result.status === "ack") {
        store.setLifecycle("ack_success");
      } else {
        store.setLifecycle("nack_error");
      }

      return result;
    }

    const command = makeRawSelectMoodCommand();

    // Offline dispatch
    const offlineResult = await dispatch(command);
    expect(offlineResult).toEqual({ queued: true });
    expect(store.state.commandLifecycle).toBe("queued_offline");
    expect(queue.items).toHaveLength(1);

    // Aynı command tekrar tıklansa bile queue duplicate üretmesin
    await dispatch(command);
    expect(queue.items).toHaveLength(1);

    // Reconnect
    online = true;
    const drained = queue.drain();
    expect(drained).toHaveLength(1);

    for (const queuedCommand of drained) {
      await dispatch(queuedCommand);
    }

    expect(store.state.commandLifecycle).toBe("ack_success");
    expect(dispatchCount).toBe(1);
    expect(receivedCommandIds.size).toBe(1);

    // Aynı commandId ile tekrar replay denenirse server-side idempotency korumalı
    await dispatch(command);
    expect(dispatchCount).toBe(2);
    expect(receivedCommandIds.size).toBe(1);
  });
});
