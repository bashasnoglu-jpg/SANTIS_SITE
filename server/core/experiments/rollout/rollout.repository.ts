import type {
  RolloutAuditEvent,
  RolloutDecisionRecord,
  RolloutPlan,
} from './rollout.contract.ts';
import {
  RolloutAuditEventSchema,
  RolloutDecisionRecordSchema,
  RolloutPlanSchema,
} from './rollout.schemas.ts';

export interface RolloutRepository {
  savePlan(plan: RolloutPlan): Promise<void>;
  getPlanByRolloutId(rolloutId: string): Promise<RolloutPlan | null>;
  getPlanByExperimentId(experimentId: string): Promise<RolloutPlan | null>;
  getActivePlanByExperimentId(experimentId: string): Promise<RolloutPlan | null>;
  listActivePlans(): Promise<RolloutPlan[]>;
  saveDecisionRecord(record: RolloutDecisionRecord): Promise<void>;
  listDecisionRecords(rolloutId: string): Promise<RolloutDecisionRecord[]>;
  saveAuditEvent(event: RolloutAuditEvent): Promise<void>;
  listAuditEvents(rolloutId: string): Promise<RolloutAuditEvent[]>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isActiveStatus(status: RolloutPlan['status']): boolean {
  return status === 'scheduled' || status === 'running';
}

export class InMemoryRolloutRepository implements RolloutRepository {
  private readonly plansByRolloutId = new Map<string, RolloutPlan>();
  private readonly rolloutIdByExperimentId = new Map<string, string>();
  private readonly decisionRecordsByRolloutId = new Map<string, RolloutDecisionRecord[]>();
  private readonly auditEventsByRolloutId = new Map<string, RolloutAuditEvent[]>();

  async savePlan(plan: RolloutPlan): Promise<void> {
    const parsed = RolloutPlanSchema.parse(plan);

    this.plansByRolloutId.set(parsed.rolloutId, clone(parsed));
    this.rolloutIdByExperimentId.set(parsed.experimentId, parsed.rolloutId);
  }

  async getPlanByRolloutId(rolloutId: string): Promise<RolloutPlan | null> {
    const plan = this.plansByRolloutId.get(rolloutId);
    return plan ? clone(plan) : null;
  }

  async getPlanByExperimentId(experimentId: string): Promise<RolloutPlan | null> {
    const rolloutId = this.rolloutIdByExperimentId.get(experimentId);
    if (!rolloutId) return null;

    const plan = this.plansByRolloutId.get(rolloutId);
    return plan ? clone(plan) : null;
  }

  async getActivePlanByExperimentId(experimentId: string): Promise<RolloutPlan | null> {
    const plan = await this.getPlanByExperimentId(experimentId);
    if (!plan) return null;
    return isActiveStatus(plan.status) ? plan : null;
  }

  async listActivePlans(): Promise<RolloutPlan[]> {
    const result: RolloutPlan[] = [];

    for (const plan of this.plansByRolloutId.values()) {
      if (isActiveStatus(plan.status)) {
        result.push(clone(plan));
      }
    }

    return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async saveDecisionRecord(record: RolloutDecisionRecord): Promise<void> {
    const parsed = RolloutDecisionRecordSchema.parse(record);
    const existing = this.decisionRecordsByRolloutId.get(parsed.rolloutId) ?? [];
    existing.push(clone(parsed));
    this.decisionRecordsByRolloutId.set(parsed.rolloutId, existing);
  }

  async listDecisionRecords(rolloutId: string): Promise<RolloutDecisionRecord[]> {
    return clone(this.decisionRecordsByRolloutId.get(rolloutId) ?? []);
  }

  async saveAuditEvent(event: RolloutAuditEvent): Promise<void> {
    const parsed = RolloutAuditEventSchema.parse(event);
    const existing = this.auditEventsByRolloutId.get(parsed.rolloutId) ?? [];
    existing.push(clone(parsed));
    this.auditEventsByRolloutId.set(parsed.rolloutId, existing);
  }

  async listAuditEvents(rolloutId: string): Promise<RolloutAuditEvent[]> {
    return clone(this.auditEventsByRolloutId.get(rolloutId) ?? []);
  }
}
