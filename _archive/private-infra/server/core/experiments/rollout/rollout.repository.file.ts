import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  RolloutAuditEvent,
  RolloutDecisionRecord,
  RolloutPlan,
} from './rollout.contract.ts';
import type { RolloutRepository } from './rollout.repository.ts';
import {
  RolloutAuditEventSchema,
  RolloutDecisionRecordSchema,
  RolloutPlanSchema,
} from './rollout.schemas.ts';

interface FileRepositoryState {
  plansByRolloutId: Record<string, RolloutPlan>;
  rolloutIdByExperimentId: Record<string, string>;
  decisionRecordsByRolloutId: Record<string, RolloutDecisionRecord[]>;
  auditEventsByRolloutId: Record<string, RolloutAuditEvent[]>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isActiveStatus(status: RolloutPlan['status']): boolean {
  return status === 'scheduled' || status === 'running';
}

function createEmptyState(): FileRepositoryState {
  return {
    plansByRolloutId: {},
    rolloutIdByExperimentId: {},
    decisionRecordsByRolloutId: {},
    auditEventsByRolloutId: {},
  };
}

function parseState(raw: unknown): FileRepositoryState {
  if (!raw || typeof raw !== 'object') {
    return createEmptyState();
  }

  const input = raw as Partial<FileRepositoryState>;

  const parsedPlansByRolloutId: Record<string, RolloutPlan> = {};
  for (const [rolloutId, plan] of Object.entries(input.plansByRolloutId ?? {})) {
    parsedPlansByRolloutId[rolloutId] = RolloutPlanSchema.parse(plan);
  }

  const parsedDecisionRecordsByRolloutId: Record<string, RolloutDecisionRecord[]> = {};
  for (const [rolloutId, records] of Object.entries(input.decisionRecordsByRolloutId ?? {})) {
    parsedDecisionRecordsByRolloutId[rolloutId] = (records ?? []).map((record) =>
      RolloutDecisionRecordSchema.parse(record)
    );
  }

  const parsedAuditEventsByRolloutId: Record<string, RolloutAuditEvent[]> = {};
  for (const [rolloutId, events] of Object.entries(input.auditEventsByRolloutId ?? {})) {
    parsedAuditEventsByRolloutId[rolloutId] = (events ?? []).map((event) =>
      RolloutAuditEventSchema.parse(event)
    );
  }

  return {
    plansByRolloutId: parsedPlansByRolloutId,
    rolloutIdByExperimentId: { ...(input.rolloutIdByExperimentId ?? {}) },
    decisionRecordsByRolloutId: parsedDecisionRecordsByRolloutId,
    auditEventsByRolloutId: parsedAuditEventsByRolloutId,
  };
}

export interface FileBackedRolloutRepositoryOptions {
  filePath: string;
}

export class FileBackedRolloutRepository implements RolloutRepository {
  private readonly filePath: string;
  private readonly tempFilePath: string;

  constructor(options: FileBackedRolloutRepositoryOptions) {
    this.filePath = path.resolve(options.filePath);
    this.tempFilePath = `${this.filePath}.tmp`;
  }

  private async ensureParentDir(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async readState(): Promise<FileRepositoryState> {
    await this.ensureParentDir();

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return parseState(JSON.parse(raw));
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';

      if (code === 'ENOENT') {
        return createEmptyState();
      }

      throw error;
    }
  }

  private async writeState(state: FileRepositoryState): Promise<void> {
    await this.ensureParentDir();

    const serialized = JSON.stringify(state, null, 2);
    await fs.writeFile(this.tempFilePath, serialized, 'utf8');
    await fs.rename(this.tempFilePath, this.filePath);
  }

  async savePlan(plan: RolloutPlan): Promise<void> {
    const parsed = RolloutPlanSchema.parse(plan);
    const state = await this.readState();

    state.plansByRolloutId[parsed.rolloutId] = clone(parsed);
    state.rolloutIdByExperimentId[parsed.experimentId] = parsed.rolloutId;

    await this.writeState(state);
  }

  async getPlanByRolloutId(rolloutId: string): Promise<RolloutPlan | null> {
    const state = await this.readState();
    const plan = state.plansByRolloutId[rolloutId];
    return plan ? clone(plan) : null;
  }

  async getPlanByExperimentId(experimentId: string): Promise<RolloutPlan | null> {
    const state = await this.readState();
    const rolloutId = state.rolloutIdByExperimentId[experimentId];
    if (!rolloutId) return null;

    const plan = state.plansByRolloutId[rolloutId];
    return plan ? clone(plan) : null;
  }

  async getActivePlanByExperimentId(experimentId: string): Promise<RolloutPlan | null> {
    const plan = await this.getPlanByExperimentId(experimentId);
    if (!plan) return null;
    return isActiveStatus(plan.status) ? plan : null;
  }

  async listActivePlans(): Promise<RolloutPlan[]> {
    const state = await this.readState();

    return Object.values(state.plansByRolloutId)
      .filter((plan) => isActiveStatus(plan.status))
      .map((plan) => clone(plan))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async saveDecisionRecord(record: RolloutDecisionRecord): Promise<void> {
    const parsed = RolloutDecisionRecordSchema.parse(record);
    const state = await this.readState();

    const existing = state.decisionRecordsByRolloutId[parsed.rolloutId] ?? [];
    existing.push(clone(parsed));
    state.decisionRecordsByRolloutId[parsed.rolloutId] = existing;

    await this.writeState(state);
  }

  async listDecisionRecords(rolloutId: string): Promise<RolloutDecisionRecord[]> {
    const state = await this.readState();
    return clone(state.decisionRecordsByRolloutId[rolloutId] ?? []);
  }

  async saveAuditEvent(event: RolloutAuditEvent): Promise<void> {
    const parsed = RolloutAuditEventSchema.parse(event);
    const state = await this.readState();

    const existing = state.auditEventsByRolloutId[parsed.rolloutId] ?? [];
    existing.push(clone(parsed));
    state.auditEventsByRolloutId[parsed.rolloutId] = existing;

    await this.writeState(state);
  }

  async listAuditEvents(rolloutId: string): Promise<RolloutAuditEvent[]> {
    const state = await this.readState();
    return clone(state.auditEventsByRolloutId[rolloutId] ?? []);
  }
}
