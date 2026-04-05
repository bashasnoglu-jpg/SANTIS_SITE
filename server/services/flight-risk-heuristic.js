const projectionService = require('./projection-service');

class FlightRiskHeuristic {
  constructor({ gracePeriodMs = 10000 } = {}) {
    this.gracePeriodMs = gracePeriodMs;
    this.pending = new Map();
  }

  _key({ visitorId, sessionId }) {
    return `${visitorId || 'NO_VISITOR'}::${sessionId || 'NO_SESSION'}`;
  }

  onConnectionOpen(meta) {
    const key = this._key(meta);
    const existing = this.pending.get(key);

    if (existing) {
      clearTimeout(existing.timeoutId);
      this.pending.delete(key);

      console.log('🛡️ [FLIGHT RISK HEURISTIC] Reconnect detected. Pending alarm cancelled.', {
        key,
        visitorId: meta.visitorId,
        sessionId: meta.sessionId,
        connectionId: meta.connectionId,
      });
    }
  }

  onExplicitPageExit(meta) {
    const key = this._key(meta);
    const pending = this.pending.get(key);

    if (pending) {
      pending.explicitPageExit = true;
      this.pending.set(key, pending);
    } else {
      this.pending.set(key, {
        ...meta,
        explicitPageExit: true,
        createdAt: Date.now(),
        timeoutId: null,
      });
    }
  }

  onConnectionClosed(meta) {
    const key = this._key(meta);

    const timeoutId = setTimeout(() => {
      const current = this.pending.get(key);
      if (!current) return;

      console.warn("⚠️ [GOD'S EYE: SOFT FLIGHT RISK]", {
        visitorId: current.visitorId,
        sessionId: current.sessionId,
        connectionId: current.connectionId,
        pathname: current.pathname,
        explicitPageExit: current.explicitPageExit,
        closeCode: current.closeCode,
        closeReason: current.closeReason,
        gracePeriodMs: this.gracePeriodMs,
      });

      this.emitSoftFlightRisk(current);
      this.pending.delete(key);
    }, this.gracePeriodMs);

    this.pending.set(key, {
      ...meta,
      createdAt: Date.now(),
      timeoutId,
    });

    console.log('⏳ [FLIGHT RISK HEURISTIC] Close captured. Waiting grace period.', {
      key,
      visitorId: meta.visitorId,
      sessionId: meta.sessionId,
      connectionId: meta.connectionId,
      gracePeriodMs: this.gracePeriodMs,
    });
  }

  emitSoftFlightRisk(meta) {
    projectionService.projectEvent({
        type: "intent.flight_risk.soft",
        version: 1,
        visitorId: meta.visitorId,
        sessionId: meta.sessionId,
        page: meta.pathname,
        source: 'ws_heuristic',
        data: {
          connectionId: meta.connectionId,
          pathname: meta.pathname,
          closeCode: meta.closeCode,
          closeReason: meta.closeReason,
          explicitPageExit: meta.explicitPageExit,
          confidence: meta.explicitPageExit ? 0.65 : 0.25
        },
        timestamp: new Date().toISOString()
    })
    .catch(err => {
        console.error('⚠️ [FLIGHT RISK HEURISTIC] emitSoftFlightRisk error mapping to projection:', err.message);
    });
  }
}

module.exports = { FlightRiskHeuristic };
