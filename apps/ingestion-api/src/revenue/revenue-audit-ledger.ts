// apps/ingestion-api/src/revenue/revenue-audit-ledger.ts

interface AuditEntry {
  decisionId: string;
  input: any;
  resolved: any;
  wave: any;
  constraints: any;
  final: number;
  timestamp: number;
}

const ledger: AuditEntry[] = [];

export function recordDecision(entry: AuditEntry) {
  ledger.push(entry);
}

export function getLedger() {
  return ledger.slice(-50); // Keep last 50
}
