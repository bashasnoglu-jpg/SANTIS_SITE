type SseClient = {
  id: string;
  tenantId: string;
  send: (payload: string) => void;
};

export class FallbackSseRegistry {
  private readonly clients = new Map<string, SseClient>();

  addClient(client: SseClient): () => void {
    this.clients.set(client.id, client);

    return () => {
      this.clients.delete(client.id);
    };
  }

  broadcastSnapshot(params: {
    tenantId: string;
    traceId: string | null;
    snapshot: unknown;
    type?: "fallback.snapshot.initial" | "fallback.snapshot.updated";
  }): void {
    const eventType = params.type ?? "fallback.snapshot.updated";

    for (const client of this.clients.values()) {
      if (client.tenantId !== params.tenantId) continue;

      client.send(
        `event: ${eventType}\n` +
          `data: ${JSON.stringify({
            type: eventType,
            tenantId: params.tenantId,
            traceId: params.traceId,
            data: params.snapshot,
          })}\n\n`
      );
    }
  }
}
