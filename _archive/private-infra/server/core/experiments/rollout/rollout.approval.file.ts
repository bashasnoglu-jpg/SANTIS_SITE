import { promises as fs } from 'node:fs';
import path from 'node:path';

interface ApprovalRecord {
  rolloutId: string;
  requestedStage: 100;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
}

interface ApprovalFileState {
  approvals: Record<string, ApprovalRecord>;
}

function createEmptyState(): ApprovalFileState {
  return { approvals: {} };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function parseState(raw: unknown): ApprovalFileState {
  if (!raw || typeof raw !== 'object') {
    return createEmptyState();
  }

  const input = raw as Partial<ApprovalFileState>;
  const approvals: Record<string, ApprovalRecord> = {};

  for (const [rolloutId, record] of Object.entries(input.approvals ?? {})) {
    if (!record || typeof record !== 'object') continue;

    const candidate = record as Partial<ApprovalRecord>;
    if (candidate.requestedStage !== 100) continue;

    approvals[rolloutId] = {
      rolloutId,
      requestedStage: 100,
      approved: Boolean(candidate.approved),
      approvedAt: candidate.approvedAt,
      approvedBy: candidate.approvedBy,
    };
  }

  return { approvals };
}

export interface FileBackedRolloutApprovalStoreOptions {
  filePath: string;
}

export class FileBackedRolloutApprovalStore {
  private readonly filePath: string;
  private readonly tempFilePath: string;

  constructor(options: FileBackedRolloutApprovalStoreOptions) {
    this.filePath = path.resolve(options.filePath);
    this.tempFilePath = `${this.filePath}.tmp`;
  }

  private async ensureParentDir(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async readState(): Promise<ApprovalFileState> {
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

  private async writeState(state: ApprovalFileState): Promise<void> {
    await this.ensureParentDir();

    const serialized = JSON.stringify(state, null, 2);
    await fs.writeFile(this.tempFilePath, serialized, 'utf8');
    await fs.rename(this.tempFilePath, this.filePath);
  }

  async requestApproval(input: {
    rolloutId: string;
    requestedStage: 100;
  }): Promise<void> {
    const state = await this.readState();
    const current = state.approvals[input.rolloutId];

    if (current && current.requestedStage === input.requestedStage) {
      return;
    }

    state.approvals[input.rolloutId] = {
      rolloutId: input.rolloutId,
      requestedStage: input.requestedStage,
      approved: false,
    };

    await this.writeState(state);
  }

  async approve(input: {
    rolloutId: string;
    approvedAt: string;
    approvedBy: string;
  }): Promise<void> {
    const state = await this.readState();
    const current = state.approvals[input.rolloutId] ?? {
      rolloutId: input.rolloutId,
      requestedStage: 100 as const,
      approved: false,
    };

    state.approvals[input.rolloutId] = {
      ...current,
      approved: true,
      approvedAt: input.approvedAt,
      approvedBy: input.approvedBy,
    };

    await this.writeState(state);
  }

  async hasApproval(rolloutId: string, requestedStage: 100): Promise<boolean> {
    const state = await this.readState();
    const record = state.approvals[rolloutId];
    if (!record) return false;
    return record.requestedStage === requestedStage && record.approved === true;
  }

  async getApproval(rolloutId: string): Promise<ApprovalRecord | null> {
    const state = await this.readState();
    return state.approvals[rolloutId] ? clone(state.approvals[rolloutId]) : null;
  }
}
