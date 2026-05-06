import type {
  AuditLogEntry,
  BoardroomSnapshot,
  ReconstructedBoardroomState,
  CognitiveDecisionEnvelope,
} from "../types/boardroom.types";

const API_BASE =
  import.meta.env.VITE_INGESTION_API_BASE_URL ?? "http://localhost:3030/api/v1";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`[BoardroomService] ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const result = await getJson<{
    success: boolean;
    data: AuditLogEntry[];
  }>("/boardroom/audit-log");

  return Array.isArray(result.data) ? result.data : [];
}

export async function getSnapshots(): Promise<BoardroomSnapshot[]> {
  const result = await getJson<{
    success: boolean;
    data: BoardroomSnapshot[];
  }>("/boardroom/snapshots");

  return Array.isArray(result.data) ? result.data : [];
}

export async function reconstructAt(timestamp: string): Promise<BoardroomSnapshot> {
  const result = await getJson<ReconstructedBoardroomState>(
    `/boardroom/reconstruct?at=${encodeURIComponent(timestamp)}`
  );

  return result.state;
}

// ─── Phase 83: Oracle Feed ────────────────────────────────────────────────────

/**
 * fetchEnvelope — Backend Boardroom Oracle Feed'den CognitiveDecisionEnvelope getirir.
 *
 * "Kernel karar verir, UI tanıklık eder."
 * Frontend artık karar üretmez. Bu fonksiyon deriveEnvelope() mock'unu kalıcı olarak
 * backend kaynağıyla değiştirir.
 *
 * @param actionId - Audit kaydındaki actionId (ya da audit entry id)
 * @param at - Opsiyonel: belirli bir zaman noktasındaki snapshot'tan türet
 */
export async function fetchEnvelope(
  actionId: string,
  at?: string
): Promise<CognitiveDecisionEnvelope> {
  const params = new URLSearchParams({ actionId });
  if (at) params.set("at", at);

  const result = await getJson<{
    success: boolean;
    data: CognitiveDecisionEnvelope;
  }>(`/boardroom/cognitive-analysis?${params.toString()}`);

  return result.data;
}

