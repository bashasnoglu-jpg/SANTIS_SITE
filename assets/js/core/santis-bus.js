// Santis OS — Global Event Bus (Sovereign Core)

class SantisEventBus extends EventTarget {
  emit(event, data = {}) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  on(event, callback) {
    this.addEventListener(event, (e) => callback(e.detail));
  }

  off(event, callback) {
    this.removeEventListener(event, callback);
  }
}

export const SantisBus = new SantisEventBus();

// Channels Namespace
export const CHANNELS = {
  AURELIA_STATUS: "aurelia:status",
  AURELIA_INTENT: "aurelia:intent",
  AURELIA_HEARD: "aurelia:heard",
  METRICS_UPDATE: "metrics:update",
  SYSTEM_ALERT: "system:alert"
};

// Global debug hook
window.SantisBus = SantisBus;
