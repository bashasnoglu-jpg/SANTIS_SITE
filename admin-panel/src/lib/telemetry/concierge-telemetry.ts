type BeaconInput = {
  event: string;
  context: {
    tenantId: string;
    sessionId: string;
    visitorId?: string;
    requestId?: string;
    quoteId?: string;
    intentId?: string;
    degraded?: boolean;
    warningCodes?: string[];
    source?: string;
  };
  meta?: Record<string, unknown>;
};

export async function sendTelemetryBeacon(input: BeaconInput): Promise<void> {
  try {
    await fetch('/api/v1/telemetry/beacon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: input.event,
        ts: new Date().toISOString(),
        context: input.context,
        meta: input.meta ?? {},
      }),
      keepalive: true,
    });
  } catch (error) {
    console.warn('[telemetry.beacon] failed', error);
  }
}
