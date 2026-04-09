export class IntentSseRegistry {
  private clients = new Map<string, Set<any>>();

  /**
   * Yeni bir SSE istemcisini (God Mode Admin vs.) specific bir sessionId için kaydeder.
   */
  addClient(sessionId: string, res: any) {
    if (!this.clients.has(sessionId)) {
      this.clients.set(sessionId, new Set());
    }
    this.clients.get(sessionId)!.add(res);
  }

  /**
   * İstemci koptuğunda temizlik yapar. Aksi takdirde memory leak oluşur.
   */
  removeClient(sessionId: string, res: any) {
    const sessionClients = this.clients.get(sessionId);
    if (sessionClients) {
      sessionClients.delete(res);
      if (sessionClients.size === 0) {
        this.clients.delete(sessionId);
      }
    }
  }

  /**
   * Projection Update olduğunda (Read Model olgunlaştığında)
   * sadece o session id'yi dinleyen istemcilere taze Canonical Snapshot'ı pushlar.
   */
  broadcastSnapshot(sessionId: string, traceId: string, snapshotData: any) {
    const sessionClients = this.clients.get(sessionId);
    if (!sessionClients || sessionClients.size === 0) return;

    const payload = JSON.stringify({
      type: "intent.snapshot.updated",
      sessionId,
      traceId,
      data: {
        moodAffinity: snapshotData.moodAffinity,
        updatedAt: snapshotData.updatedAt
      }
    });

    sessionClients.forEach(res => {
      res.write(`data: ${payload}\n\n`);
    });
  }
}

// Singleton registry for the API ingestion layer
export const intentSseRegistry = new IntentSseRegistry();
