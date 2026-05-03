export type PolicyAction =
  | "allow"
  | "suppress"
  | "clamp"
  | "override";

export interface PolicyResult {
  allowed: boolean;
  action: PolicyAction;

  adjustedValue?: number;

  reasons: string[];
}
