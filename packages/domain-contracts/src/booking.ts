export type BookingStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ServiceCategory =
  | "CLASSIC"
  | "RITUAL"
  | "MEDICAL"
  | "HAMAM"
  | "SKINCARE"
  | "PREMIUM_SIGNATURE";

export type GuestPriority = "NONE" | "VIP" | "SIGNATURE";

export interface BookingTimeFields {
  Scheduled_Start: string;
  Scheduled_End: string;
  Planned_Duration_Minutes: number;
  Actual_Start: string | null;
  Actual_End: string | null;
  Pause_Minutes: number;
  Extension_Minutes: number;
}

export interface CanonicalBooking extends BookingTimeFields {
  Booking_ID: string;
  Tenant_Link: string;
  Location_Link: string;
  Environment: string;
  Client_Link: string | null;
  Service_Link: string;
  Therapist_Link: string | null;
  Room_Link: string | null;
  Status: BookingStatus;
  Service_Category: ServiceCategory;
  Guest_Tier: GuestPriority;
  VIP: boolean;
  Manual_Lock: boolean;
  Payment_Status: string;
  Payment_Authorization_Status: string;
}

export type GuardState =
  | "NOT_EVALUATED"
  | "PASS"
  | "WARNING"
  | "FAIL"
  | "OVERRIDDEN";

export type GuardSeverity = "WARNING" | "FAIL";

export type GuardType =
  | "QUARANTINE"
  | "CONFLICT"
  | "BRANCH"
  | "CAPABILITY"
  | "PAYMENT"
  | "LOCK"
  | "DATA_QUALITY";

export interface OverrideAudit {
  overriddenBy: string;
  overrideRole: string;
  overrideReason: string;
  overriddenAt: string;
  overrideExpiresAt: string | null;
  correlationId: string;
}

export interface GuardResult {
  guard: string;
  type: GuardType;
  state: GuardState;
  severity: GuardSeverity | null;
  code: string | null;
  message: string | null;
  suggestedAction: string | null;
  evaluatedAt: string | null;
  ruleVersion: string;
  override: OverrideAudit | null;
}

export type ActionPriority = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";

export interface ActionReason {
  code: string;
  priority: ActionPriority;
  severity: GuardSeverity;
  source: string;
  message: string;
  action: string;
}

export interface ActionPriorityResult {
  highest_priority: ActionPriority | null;
  reasons: ActionReason[];
}

export type ProgressStateKey =
  | "NOT_APPLICABLE"
  | "NOT_STARTED"
  | "NORMAL"
  | "DELAY_WARNING"
  | "CRITICAL_DELAY"
  | "COMPLETED";

export interface ProgressState {
  state: ProgressStateKey;
  elapsedMinutes: number | null;
  totalMinutes: number | null;
  progressPercent: number | null;
  delayMinutes: number | null;
  expectedEnd: string | null;
}

export interface GuardBadge {
  type: GuardType;
  severity: GuardSeverity;
  code: string;
  label: string;
}

export interface VisualState {
  statusKey: BookingStatus;
  categoryKey: ServiceCategory;
  guestPriority: GuestPriority;
  actionPriority: ActionPriority | null;
  progressPercent: number | null;
  progressState: ProgressStateKey;
  progressLabel: string | null;
  badges: GuardBadge[];
}
