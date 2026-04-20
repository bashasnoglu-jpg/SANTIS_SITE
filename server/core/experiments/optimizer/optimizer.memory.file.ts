import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { FeedbackScore } from './optimizer.feedback.contract.ts';

interface MemoryState {
  scores: Record<string, FeedbackScore[]>;
}

function createEmpty(): MemoryState {
  return { scores: {} };
}

export class FileBackedOptimizerMemory {
  constructor(private filePath: string) {}

  private async ensureParentDir(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
  }

  private async read(): Promise<MemoryState> {
    await this.ensureParentDir();
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return createEmpty();
    }
  }

  private async write(state: MemoryState) {
    await this.ensureParentDir();
    const tmp = this.filePath + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(state, null, 2));
    await fs.rename(tmp, this.filePath);
  }

  async append(score: FeedbackScore) {
    const state = await this.read();

    const key = `${score.experimentId}`;
    const list = state.scores[key] ?? [];

    list.push(score);

    // memory pruning (son 50 kayıt)
    state.scores[key] = list.slice(-50);

    await this.write(state);
  }

  async getScores(experimentId: string): Promise<FeedbackScore[]> {
    const state = await this.read();
    return state.scores[experimentId] ?? [];
  }
}
