import { drizzle } from "drizzle-orm/node-postgres";
import { desc } from "drizzle-orm";
import pg from "pg";
import { technicalDebtSignals } from "@santis/db/schema";
import type { TechnicalDebtSignal } from "./technical-debt.contract";

const { Pool } = pg;

type TechnicalDebtPersistenceState = {
  enabled: boolean;
  db?: ReturnType<typeof drizzle>;
};

let state: TechnicalDebtPersistenceState | null = null;

function getPersistenceState(): TechnicalDebtPersistenceState {
  if (state) return state;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    state = { enabled: false };
    return state;
  }

  const pool = new Pool({ connectionString });
  state = {
    enabled: true,
    db: drizzle(pool),
  };

  return state;
}

export async function persistTechnicalDebtSignal(signal: TechnicalDebtSignal) {
  const persistence = getPersistenceState();

  if (!persistence.enabled || !persistence.db) {
    return { persisted: false as const, reason: "DATABASE_URL_NOT_CONFIGURED" };
  }

  await persistence.db.insert(technicalDebtSignals).values({
    id: signal.id,
    source: signal.source,
    type: signal.type,
    severity: signal.severity,
    title: signal.title,
    detail: signal.detail,
    workspace: signal.workspace ?? null,
    filePath: signal.filePath ?? null,
    detectedAt: new Date(signal.detectedAt),
    euroRisk: String(signal.euroRisk),
    confidence: signal.confidence,
    remediation: signal.remediation,
    payload: signal,
  });

  return { persisted: true as const };
}

export async function readTechnicalDebtSignals(limit = 100): Promise<TechnicalDebtSignal[] | null> {
  const persistence = getPersistenceState();

  if (!persistence.enabled || !persistence.db) {
    return null;
  }

  const rows = await persistence.db
    .select()
    .from(technicalDebtSignals)
    .orderBy(desc(technicalDebtSignals.detectedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    source: row.source as TechnicalDebtSignal["source"],
    type: row.type as TechnicalDebtSignal["type"],
    severity: row.severity as TechnicalDebtSignal["severity"],
    title: row.title,
    detail: row.detail,
    workspace: row.workspace ?? undefined,
    filePath: row.filePath ?? undefined,
    detectedAt: row.detectedAt.toISOString(),
    euroRisk: Number(row.euroRisk),
    confidence: Number(row.confidence),
    remediation: row.remediation,
  }));
}
