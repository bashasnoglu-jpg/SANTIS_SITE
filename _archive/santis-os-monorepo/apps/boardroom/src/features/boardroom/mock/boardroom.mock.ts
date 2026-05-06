export type RawTenant = { key: string; label: string; };
export type RawMetric = { key: string; label: string; value: number | string; tone?: "gold" | "warning" | "success" | "neutral"; pulse?: boolean; };
export type RawIntent = { id: string; label: string; value: number; trend?: "up" | "down" | "flat"; };
export type RawFriction = { id: string; cause: string; sessions: number; severity: "healthy" | "degraded" | "critical" | "warning"; };
export type RawTherapist = { id: string; name: string; margin: number; capacity: number; status?: "optimal" | "stressed" | "idle"; };
export type RawVipItem = { id: string; guest: string; ritual: string; estimatedValue: number; urgency: "high" | "medium" | "low"; state: "pending" | "acknowledged"; };
export type RawPulseEvent = { id: string; ts: string; type: string; message: string; };
export type RawIntegrityService = { id: string; label: string; status: "healthy" | "degraded" | "critical"; };

export type RawBoardroomData = {
  tenants: RawTenant[];
  metrics: RawMetric[];
  intents: RawIntent[];
  friction: RawFriction[];
  therapists: RawTherapist[];
  vipQueue: RawVipItem[];
  pulse: RawPulseEvent[];
  integrity: RawIntegrityService[];
};

export const boardroomMockRaw: RawBoardroomData = {
    tenants: [
      { key: "global", label: "Global Facilities" },
      { key: "istanbul", label: "Istanbul" },
      { key: "maldives", label: "Maldives" },
    ],
    metrics: [], intents: [], friction: [], therapists: [], vipQueue: [], pulse: [], integrity: []
};
