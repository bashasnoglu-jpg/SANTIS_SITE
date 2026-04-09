import { sovereignStore } from "../../core/state/sovereignStore.js";

class SovereignFallbackPanel extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur font-mono">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-[0.22em] text-white/50">
              Fallback Incidents
            </div>
            <div class="text-lg font-semibold text-white">
              Runtime Degradation Radar
            </div>
          </div>
          <div data-role="status" class="text-xs text-yellow-300 animate-pulse">
            Connecting…
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80">
          <div class="rounded-xl bg-white/5 p-3">
            <div class="text-white/40 mb-1 text-xs uppercase">Total Degraded</div>
            <div data-role="totalCount" class="mt-1 text-2xl font-bold text-red-400">—</div>
          </div>

          <div class="rounded-xl bg-white/5 p-3">
            <div class="text-white/40 mb-1 text-xs uppercase">Last Trace</div>
            <div data-role="traceId" class="mt-1 truncate text-xs text-emerald-400">—</div>
          </div>
        </div>

        <div class="mt-4 border-t border-gray-800 pt-3">
          <div class="mb-2 text-xs uppercase tracking-[0.18em] text-white/40">
            By Reason
          </div>
          <div class="space-y-2 text-sm text-white/80">
            <div class="flex justify-between"><span>WebGPU Mute:</span> <span data-role="r-webgpu_unavailable" class="font-bold">0</span></div>
            <div class="flex justify-between"><span>Module Drop:</span> <span data-role="r-module_load_failed" class="font-bold">0</span></div>
            <div class="flex justify-between"><span>Worker Hang:</span> <span data-role="r-worker_timeout" class="font-bold">0</span></div>
            <div class="flex justify-between"><span>API Timeout:</span> <span data-role="r-api_timeout" class="font-bold">0</span></div>
            <div class="flex justify-between"><span>Device Lock:</span> <span data-role="r-device_constraint" class="font-bold">0</span></div>
          </div>
        </div>

        <div class="mt-4 text-xs text-white/40 uppercase tracking-wider text-right">
          Refresh: <span data-role="updatedAt" class="text-gray-300">—</span>
        </div>
      </section>
    `;

    this.$status = this.querySelector('[data-role="status"]');
    this.$totalCount = this.querySelector('[data-role="totalCount"]');
    this.$traceId = this.querySelector('[data-role="traceId"]');
    this.$updatedAt = this.querySelector('[data-role="updatedAt"]');

    this.$reasons = {
      webgpu_unavailable: this.querySelector('[data-role="r-webgpu_unavailable"]'),
      module_load_failed: this.querySelector('[data-role="r-module_load_failed"]'),
      worker_timeout: this.querySelector('[data-role="r-worker_timeout"]'),
      api_timeout: this.querySelector('[data-role="r-api_timeout"]'),
      device_constraint: this.querySelector('[data-role="r-device_constraint"]'),
    };

    // Store Slice Subscription
    this.unsubscribe = sovereignStore.subscribe(
      'liveFallbackIncidents',
      (slice) => this.renderSlice(slice)
    );

    this.renderSlice(sovereignStore.getState('liveFallbackIncidents'));
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  renderSlice(slice) {
    if (slice.connectionStatus === "connecting") {
      this.$status.textContent = "Connecting…";
      this.$status.className = "text-xs text-yellow-300 animate-pulse";
    } else if (slice.connectionStatus === "live") {
      this.$status.textContent = "Live Radar";
      this.$status.className = "text-xs text-emerald-400 font-bold";
    } else {
       this.$status.textContent = "Disconnected";
       this.$status.className = "text-xs text-red-500 font-bold";
    }

    const snapshot = slice.snapshot;
    if (!snapshot) {
      this.$totalCount.textContent = "—";
      this.$traceId.textContent = "—";
      this.$updatedAt.textContent = "—";
      Object.values(this.$reasons).forEach((el) => (el.textContent = "0"));
      return;
    }

    this.$totalCount.textContent = String(snapshot.totalCount ?? 0);
    this.$traceId.textContent = slice.lastTraceId ? slice.lastTraceId.split('-')[0] : "—";
    
    if (snapshot.updatedAt) {
        this.$updatedAt.textContent = new Date(snapshot.updatedAt).toLocaleTimeString();
    }

    const byReason = snapshot.byReason ?? {};
    this.$reasons.webgpu_unavailable.textContent = String(byReason.webgpu_unavailable ?? 0);
    this.$reasons.module_load_failed.textContent = String(byReason.module_load_failed ?? 0);
    this.$reasons.worker_timeout.textContent = String(byReason.worker_timeout ?? 0);
    this.$reasons.api_timeout.textContent = String(byReason.api_timeout ?? 0);
    this.$reasons.device_constraint.textContent = String(byReason.device_constraint ?? 0);
  }
}

customElements.define("sovereign-fallback-panel", SovereignFallbackPanel);
