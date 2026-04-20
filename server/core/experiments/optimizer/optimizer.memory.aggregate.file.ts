import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

import type {
  AggregatedOptimizerMemoryRecord,
  LightweightAggregatedMemorySignal,
} from './optimizer.memory.aggregate.contract.ts';

interface AggregateMemoryState {
  records: AggregatedOptimizerMemoryRecord[];
}

export class FileBackedAggregatedOptimizerMemory {
  constructor(private readonly filePath: string) {}

  private async ensureFile(): Promise<void> {
    await fs.mkdir(dirname(this.filePath), { recursive: true });

    if (!existsSync(this.filePath)) {
      const initial: AggregateMemoryState = { records: [] };
      await fs.writeFile(this.filePath, JSON.stringify(initial, null, 2), 'utf8');
    }
  }

  private async readState(): Promise<AggregateMemoryState> {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(raw) as AggregateMemoryState;
  }

  private async writeState(state: AggregateMemoryState): Promise<void> {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8');
  }

  async getAll(): Promise<AggregatedOptimizerMemoryRecord[]> {
    const state = await this.readState();
    return state.records;
  }

  async getByContextKeys(
    contextKeys: string[]
  ): Promise<AggregatedOptimizerMemoryRecord[]> {
    const keySet = new Set(contextKeys);
    const state = await this.readState();
    return state.records.filter((record) => keySet.has(record.contextKey));
  }

  async upsertAggregate(
    next: AggregatedOptimizerMemoryRecord
  ): Promise<AggregatedOptimizerMemoryRecord> {
    const state = await this.readState();

    const index = state.records.findIndex(
      (record) =>
        record.experimentId === next.experimentId &&
        record.variantId === next.variantId &&
        record.contextKey === next.contextKey
    );

    if (index === -1) {
      state.records.push(next);
      await this.writeState(state);
      return next;
    }

    state.records[index] = next;
    await this.writeState(state);
    return next;
  }

  async mergeSignal(params: {
    experimentId: string;
    variantId: string;
    contextKey: string;
    level: AggregatedOptimizerMemoryRecord['level'];
    signal: LightweightAggregatedMemorySignal;
  }): Promise<AggregatedOptimizerMemoryRecord> {
    const state = await this.readState();

    const index = state.records.findIndex(
      (record) =>
        record.experimentId === params.experimentId &&
        record.variantId === params.variantId &&
        record.contextKey === params.contextKey
    );

    if (index === -1) {
      const created: AggregatedOptimizerMemoryRecord = {
        experimentId: params.experimentId,
        variantId: params.variantId,
        contextKey: params.contextKey,
        level: params.level,
        sampleCount: 1,
        avgUpliftScore: params.signal.upliftScore,
        avgRiskScore: params.signal.riskScore,
        avgConfidenceScore: params.signal.confidenceScore,
        avgFinalScore: params.signal.finalScore,
        lastEvaluatedAt: params.signal.evaluatedAt,
        updatedAt: new Date().toISOString(),
      };

      state.records.push(created);
      await this.writeState(state);
      return created;
    }

    const current = state.records[index];
    const nextSampleCount = current.sampleCount + 1;

    const merged: AggregatedOptimizerMemoryRecord = {
      ...current,
      sampleCount: nextSampleCount,
      avgUpliftScore:
        (current.avgUpliftScore * current.sampleCount + params.signal.upliftScore) /
        nextSampleCount,
      avgRiskScore:
        (current.avgRiskScore * current.sampleCount + params.signal.riskScore) /
        nextSampleCount,
      avgConfidenceScore:
        (
          current.avgConfidenceScore * current.sampleCount +
          params.signal.confidenceScore
        ) / nextSampleCount,
      avgFinalScore:
        (current.avgFinalScore * current.sampleCount + params.signal.finalScore) /
        nextSampleCount,
      lastEvaluatedAt: params.signal.evaluatedAt,
      updatedAt: new Date().toISOString(),
    };

    state.records[index] = merged;
    await this.writeState(state);
    return merged;
  }
}
