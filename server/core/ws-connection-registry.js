class WsConnectionRegistry {
  constructor() {
    this.byConnectionId = new Map();
    this.byVisitorId = new Map();
    this.bySessionId = new Map();
  }

  register(meta) {
    const {
      connectionId,
      visitorId,
      sessionId,
      socket,
      ip,
      namespace,
      userAgent,
      pathname,
    } = meta;

    const record = {
      connectionId,
      visitorId,
      sessionId,
      socket,
      ip,
      namespace,
      userAgent,
      pathname,
      connectedAt: Date.now(),
      lastSeenAt: Date.now(),
      closeCode: null,
      closeReason: null,
      wasClean: null,
      status: 'OPEN',
    };

    if (connectionId) {
        this.byConnectionId.set(connectionId, record);
    }

    if (visitorId && connectionId) {
      if (!this.byVisitorId.has(visitorId)) {
        this.byVisitorId.set(visitorId, new Set());
      }
      this.byVisitorId.get(visitorId).add(connectionId);
    }

    if (sessionId && connectionId) {
      if (!this.bySessionId.has(sessionId)) {
        this.bySessionId.set(sessionId, new Set());
      }
      this.bySessionId.get(sessionId).add(connectionId);
    }

    return record;
  }

  touch(connectionId, patch = {}) {
    if (!connectionId) return null;
    const record = this.byConnectionId.get(connectionId);
    if (!record) return null;

    Object.assign(record, patch, { lastSeenAt: Date.now() });
    return record;
  }

  close(connectionId, { code, reason, wasClean } = {}) {
    if (!connectionId) return null;
    const record = this.byConnectionId.get(connectionId);
    if (!record) return null;

    record.status = 'CLOSED';
    record.closeCode = code ?? null;
    record.closeReason = reason ?? null;
    record.wasClean = wasClean ?? null;
    record.closedAt = Date.now();
    record.lastSeenAt = Date.now();

    return record;
  }

  unregister(connectionId) {
    if (!connectionId) return null;
    const record = this.byConnectionId.get(connectionId);
    if (!record) return null;

    this.byConnectionId.delete(connectionId);

    if (record.visitorId && this.byVisitorId.has(record.visitorId)) {
      const set = this.byVisitorId.get(record.visitorId);
      set.delete(connectionId);
      if (set.size === 0) this.byVisitorId.delete(record.visitorId);
    }

    if (record.sessionId && this.bySessionId.has(record.sessionId)) {
      const set = this.bySessionId.get(record.sessionId);
      set.delete(connectionId);
      if (set.size === 0) this.bySessionId.delete(record.sessionId);
    }

    return record;
  }

  getByConnectionId(connectionId) {
    if (!connectionId) return null;
    return this.byConnectionId.get(connectionId) || null;
  }

  getActiveConnectionsByVisitorId(visitorId) {
    const ids = this.byVisitorId.get(visitorId);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.byConnectionId.get(id))
      .filter(Boolean)
      .filter((r) => r.status === 'OPEN');
  }

  getActiveConnectionsBySessionId(sessionId) {
    const ids = this.bySessionId.get(sessionId);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.byConnectionId.get(id))
      .filter(Boolean)
      .filter((r) => r.status === 'OPEN');
  }

  countActive() {
    let count = 0;
    for (const record of this.byConnectionId.values()) {
      if (record.status === 'OPEN') count += 1;
    }
    return count;
  }
}

export { WsConnectionRegistry };
