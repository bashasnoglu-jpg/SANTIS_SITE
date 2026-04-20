import { promises as fs } from 'node:fs';
import path from 'node:path';

interface HealthWindowRecord {
  rolloutId: string;
  consecutiveHealthyCount: number;
  updatedAt?: string;
}

interface HealthWindowFileState {
  windows: Record<string, HealthWindowRecord>;
}

function createEmptyState(): HealthWindowFileState {
  return { windows: {} };
}

function parseState(raw: unknown): HealthWindowFileState {
  if (!raw || typeof raw !== 'object') {
    return createEmptyState();
  }

  const input = raw as Partial<HealthWindowFileState>;
  const windows: Record<string, HealthWindowRecord> = {};

  for (const [rolloutId, record] of Object.entries(input.windows ?? {})) {
    if (!record || typeof record !== 'object') continue;

    const candidate = record as Partial<HealthWindowRecord>;
    const count = Number(candidate.consecutiveHealthyCount ?? 0);

    windows[rolloutId] = {
      rolloutId,
      consecutiveHealthyCount: Number.isFinite(count) && count >= 0 ? count : 0,
      updatedAt: candidate.updatedAt,
    };
  }

  return { windows };
}

export interface FileBackedRolloutHealthWindowStoreOptions {
  filePath: string;
}

export class FileBackedRolloutHealthWindowStore {
  private readonly filePath: string;
  private readonly tempFilePath: string;

  constructor(options: FileBackedRolloutHealthWindowStoreOptions) {
    this.filePath = path.resolve(options.filePath);
    this.tempFilePath = `${this.filePath}.tmp`;
  }

  private async ensureParentDir(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async readState(): Promise<HealthWindowFileState> {
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

  private async writeState(state: HealthWindowFileState): Promise<void> {
    await this.ensureParentDir();

    const serialized = JSON.stringify(state, null, 2);
    await fs.writeFile(this.tempFilePath, serialized, 'utf8');
    await fs.rename(this.tempFilePath, this.filePath);
  }

  async getConsecutiveHealthyCount(rolloutId: string): Promise<number> {
    const state = await this.readState();
    return state.windows[rolloutId]?.consecutiveHealthyCount ?? 0;
  }

  async recordHealthyWindow(rolloutId: string): Promise<void> {
    const state = await this.readState();
    const current = state.windows[rolloutId]?.consecutiveHealthyCount ?? 0;

    state.windows[rolloutId] = {
      rolloutId,
      consecutiveHealthyCount: current + 1,
      updatedAt: new Date().toISOString(),
    };

    await this.writeState(state);
  }

  async resetHealthyWindows(rolloutId: string): Promise<void> {
    const state = await this.readState();

    state.windows[rolloutId] = {
      rolloutId,
      consecutiveHealthyCount: 0,
      updatedAt: new Date().toISOString(),
    };

    await this.writeState(state);
  }
}
