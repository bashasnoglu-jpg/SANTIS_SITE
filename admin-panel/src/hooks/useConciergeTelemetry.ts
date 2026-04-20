import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { sendTelemetryBeacon } from '../lib/telemetry/concierge-telemetry';
import {
  createEmptyTelemetryContext,
  type ConciergeTelemetryContext,
} from '../lib/telemetry/telemetry-context';
import { createSessionId, getOrCreateVisitorId } from '../lib/telemetry/identity';

type SnapshotShape = {
  requestId?: string;
  warnings?: Array<{ code: string }>;
  services?: unknown[];
  nextAvailableSlots?: unknown[];
};

export function useConciergeTelemetry(input: {
  tenantId: string;
  source?: 'direct' | 'hotel' | 'concierge' | 'campaign';
}) {
  const [context, setContext] = useState<ConciergeTelemetryContext>(() =>
    createEmptyTelemetryContext({
      tenantId: input.tenantId,
      sessionId: createSessionId(),
      visitorId: getOrCreateVisitorId(),
      source: input.source,
    })
  );

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    return () => {
      const latestContext = contextRef.current;
      if (!latestContext.intentId) {
        sendTelemetryBeacon({
          event: 'FLOW_ABANDONED',
          context: {
            tenantId: latestContext.tenantId,
            sessionId: latestContext.sessionId,
            visitorId: latestContext.visitorId,
            requestId: latestContext.requestId,
            quoteId: latestContext.quoteId,
            intentId: latestContext.intentId,
            degraded: latestContext.degraded,
            warningCodes: latestContext.warningCodes,
            source: latestContext.source,
          },
          meta: {
            lastEvent: latestContext.lastEvent,
          },
        });
      }
    };
  }, []);

  const [quoteStartedAt, setQuoteStartedAt] = useState<number | null>(null);

  const startQuoteTimer = useCallback(() => {
    setQuoteStartedAt(performance.now());
  }, []);

  const endQuoteTimer = useCallback(() => {
    return quoteStartedAt ? Math.round(performance.now() - quoteStartedAt) : null;
  }, [quoteStartedAt]);


  const updateFromSnapshotResponse = useCallback(
    (params: {
      snapshot: SnapshotShape;
      headerRequestId?: string | null;
      headerDegraded?: string | null;
      responseTimeMs?: number;
    }) => {
      const bodyRequestId = params.snapshot.requestId;
      const requestId = params.headerRequestId || bodyRequestId;
      const degraded = params.headerDegraded === '1';
      const warningCodes = (params.snapshot.warnings ?? []).map((w) => w.code);

      if (
        params.headerRequestId &&
        bodyRequestId &&
        params.headerRequestId !== bodyRequestId
      ) {
        console.warn('[telemetry] requestId mismatch', {
          headerRequestId: params.headerRequestId,
          bodyRequestId,
          tenantId: input.tenantId,
          sessionId: context.sessionId
        });
      }

      setContext((prev) => ({
        ...prev,
        requestId,
        degraded,
        warningCodes,
        responseTimeMs: params.responseTimeMs,
      }));
    },
    []
  );

  const emit = useCallback(
    async (event: string, meta?: Record<string, unknown>) => {
      // Create a snapshot of current context to avoid stale closures
      setContext((currentContext) => {
        const nextContext = {
          tenantId: currentContext.tenantId,
          sessionId: currentContext.sessionId,
          visitorId: currentContext.visitorId,
          requestId: currentContext.requestId,
          quoteId: currentContext.quoteId,
          intentId: currentContext.intentId,
          degraded: currentContext.degraded,
          warningCodes: currentContext.warningCodes,
          source: currentContext.source,
        };

        // Fire and forget, don't wait for it
        sendTelemetryBeacon({
          event,
          context: nextContext,
          meta,
        });

        return {
          ...currentContext,
          lastEvent: event,
        };
      });
    },
    []
  );

  const setQuoteId = useCallback((quoteId?: string) => {
    setContext((prev) => ({ ...prev, quoteId }));
  }, []);

  const setIntentId = useCallback((intentId?: string) => {
    setContext((prev) => ({ ...prev, intentId }));
  }, []);

  return useMemo(
    () => ({
      telemetryContext: context,
      updateFromSnapshotResponse,
      emit,
      setQuoteId,
      setIntentId,
      startQuoteTimer,
      endQuoteTimer,
    }),
    [context, updateFromSnapshotResponse, emit, setQuoteId, setIntentId, startQuoteTimer, endQuoteTimer]
  );
}
