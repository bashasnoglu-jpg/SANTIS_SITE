import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ContextualFeedbackScore } from './optimizer.context.contract.ts';

interface ContextMemoryState {
  scoresByContextKey: Record<string, ContextualFeedbackScore[]>;
}

function createEmptyState(): ContextMemoryState {
  return {
    scoresByContextKey: {},
  };
}

export class FileBackedContextualOptimizerMemory {
  private readonly filePath: string;
  private readonly tempFilePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.tempFilePath = `${this.filePath}.tmp`;
  }

  private async ensureParentDir(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async readState(): Promise<ContextMemoryState> {
    await this.ensureParentDir();

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object'
        ? parsed
        : createEmptyState();
    } catch {
      return createEmptyState();
    }
  }

  private async writeState(state: ContextMemoryState): Promise<void> {
    await this.ensureParentDir();
    await fs.writeFile(
      this.tempFilePath,
      JSON.stringify(state, null, 2),
      'utf8'
    );
    await fs.rename(this.tempFilePath, this.filePath);
  }

  async append(score: ContextualFeedbackScore): Promise<void> {
    const state = await this.readState();
    const list = state.scoresByContextKey[score.contextKey] ?? [];

    list.push(score);
    state.scoresByContextKey[score.contextKey] = list.slice(-50);

    await this.writeState(state);
  }

  async getScoresByContextKey(contextKey: string): Promise<ContextualFeedbackScore[]> {
    const state = await this.readState();
    return state.scoresByContextKey[contextKey] ?? [];
  }

  async getScoresByContextKeys(contextKeys: string[]): Promise<Record<string, ContextualFeedbackScore[]>> {
    const state = await this.readState();
    const result: Record<string, ContextualFeedbackScore[]> = {};
    for (const key of contextKeys) {
      result[key] = state.scoresByContextKey[key] ?? [];
    }
    return result;
  }
}
