import { type RawBoardroomData } from "./mock/boardroom.mock";

export type TenantOption = { key: string; label: string; };
export type BoardroomMetricView = { key: string; label: string; value: string; tone?: "gold" | "warning" | "success" | "neutral"; pulse?: boolean; };
export type BoardroomIntentView = { id: string; label: string; value: number; trend?: "up" | "down" | "flat"; };
export type BoardroomFrictionView = { id: string; cause: string; sessions: number; severity: "healthy" | "degraded" | "critical" | "warning"; };
export type BoardroomTherapistView = { id: string; name: string; margin: string; capacity: number; status?: "optimal" | "stressed" | "idle"; };
export type BoardroomVipView = { id: string; guest: string; ritual: string; estimatedValue: string; urgency: "high" | "medium" | "low"; state: "pending" | "acknowledged"; };
export type BoardroomPulseView = { id: string; ts: string; type: string; message: string; };
export type BoardroomIntegrityView = { id: string; label: string; status: "healthy" | "degraded" | "critical"; };

export type VaultAssetView = { id: string; name: string; value: number; riskScore: number; lastActivity: string; };

export type BoardroomViewModel = {
  tenants: TenantOption[];
  metrics: BoardroomMetricView[];
  intents: BoardroomIntentView[];
  frictionRows: BoardroomFrictionView[];
  therapists: BoardroomTherapistView[];
  vipItems: BoardroomVipView[];
  pulseEvents: BoardroomPulseView[];
  integrityServices: BoardroomIntegrityView[];
  vaultAssets: VaultAssetView[];
};

function formatEuro(val: number|string) { return `€${val}`; }
function formatPercent(val: number|string) { return `${val}%`; }
function formatPlainNumber(val: number|string) { return `${val}`; }

function mapMetricValue(key: string, value: number | string): string {
  if (typeof value === "string") return value;
  switch (key) {
    case "pipeline": return formatEuro(value);
    case "vault_conversion":
    case "abandonment_leak": return formatPercent(value);
    case "active_sessions": return formatPlainNumber(value);
    default: return String(value);
  }
}

export function createBoardroomViewModel(raw: RawBoardroomData | any): BoardroomViewModel {
  return {
    tenants: raw.tenants || [],
    metrics: (raw.metrics || []).map((m: any) => ({ ...m, value: mapMetricValue(m.key, m.value) })),
    intents: raw.intents || [],
    frictionRows: raw.friction || [],
    therapists: (raw.therapists || []).map((t: any) => ({ ...t, margin: formatEuro(t.margin) })),
    vipItems: (raw.vipQueue || []).map((v: any) => ({ ...v, estimatedValue: formatEuro(v.estimatedValue) })),
    pulseEvents: raw.pulse || [],
    integrityServices: raw.integrity || [],
    vaultAssets: raw.vaultAssets || [],
  };
}
