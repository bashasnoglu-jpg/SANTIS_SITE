/**
 * Phase 84 — Live Oracle Stream
 *
 * oracle-delta.broadcaster.ts
 *
 * Boardroom kararı alındığında CognitiveDecisionEnvelope'u
 * SSE üzerinden tüm bağlı Boardroom operatörlerine iletir.
 *
 * Akış: Governor Decision → deriveCognitiveEnvelope() → broadcastOracleDelta()
 */

import { sseManager } from "../services/sse-manager.js";
import { deriveCognitiveEnvelope } from "./oracle-cognitive-decision.engine.js";

interface AuditEntryMinimal {
  id: string;
  actionId?: string;
  type: string;
  occurredAt: string;
  reason?: string;
  payload?: Record<string, unknown>;
}

interface SnapshotMinimal {
  snapshotId?: string;
  timestamp: string;
  revenue?: number;
  activeSessionsCount?: number;
  confidence?: number;
  reasoning?: string;
  resolutionType?: string;
  resolvedActionId?: string;
}

/**
 * broadcastOracleDelta — Yeni bir Boardroom kararı oluştuğunda çağrılır.
 *
 * Bu fonksiyon:
 * 1. CognitiveDecisionEnvelope türetir
 * 2. SSE üzerinden `oracle_delta` event'i yayınlar
 * 3. Tüm bağlı CognitiveOverlay instance'larını gerçek zamanlı günceller
 *
 * @param audit - Yeni oluşan audit log kaydı
 * @param snapshot - Kararın alındığı andaki snapshot
 * @param previousSnapshot - Delta hesabı için önceki snapshot
 */
export function broadcastOracleDelta(
  audit: AuditEntryMinimal,
  snapshot: SnapshotMinimal,
  previousSnapshot?: SnapshotMinimal
): void {
  try {
    const envelope = deriveCognitiveEnvelope(
      audit as Parameters<typeof deriveCognitiveEnvelope>[0],
      snapshot as Parameters<typeof deriveCognitiveEnvelope>[1],
      previousSnapshot as Parameters<typeof deriveCognitiveEnvelope>[2]
    );

    sseManager.broadcastPatch(
      "oracle_delta",
      {
        actionId: audit.actionId ?? audit.id,
        envelope,
      },
      "oracle_delta"
    );

    console.log(
      `[Oracle Delta] Broadcast: actionId=${audit.actionId ?? audit.id} ` +
      `confidence=${Math.round((envelope.confidence) * 100)}% ` +
      `significance=${envelope.significance.level}`
    );
  } catch (err) {
    // Oracle broadcast hatası asla ana akışı kesmemeli
    console.error("[Oracle Delta] Broadcast failed (non-fatal):", err);
  }
}
