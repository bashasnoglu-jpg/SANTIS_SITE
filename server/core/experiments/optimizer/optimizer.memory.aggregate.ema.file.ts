import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

import { computeEMA } from './optimizer.memory.ema.ts';

export interface EMARecord {
  experimentId: string;
  variantId: string;
  contextKey: string;
  level: string;

  sampleCount: number;

  emaUplift: number;
  emaRisk: number;
  emaConfidence: number;
  emaFinal: number;

  lastEvaluatedAt: string;
  updatedAt: string;
}

interface State {
  records: EMARecord[];
}

export class FileBackedEMAOptimizerMemory {
  constructor(
    private readonly filePath: string,
    private readonly alpha = 0.2
  ) {}

  private async ensure(): Promise<void> {
    await fs.mkdir(dirname(this.filePath), { recursive: true });

    if (!existsSync(this.filePath)) {
      await fs.writeFile(
        this.filePath,
        JSON.stringify({ records: [] }, null, 2),
        'utf8'
      );
    }
  }

  private async read(): Promise<State> {
    await this.ensure();
    return JSON.parse(await fs.readFile(this.filePath, 'utf8'));
  }

  private async write(state: State): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8');
  }

  async merge(params: {
    experimentId: string;
    variantId: string;
    contextKey: string;
    level: string;
    signal: {
      uplift: number;
      risk: number;
      confidence: number;
      final: number;
      evaluatedAt: string;
    };
  }): Promise<void> {
    const state = await this.read();

    const idx = state.records.findIndex(
      (r) =>
        r.experimentId === params.experimentId &&
        r.variantId === params.variantId &&
        r.contextKey === params.contextKey
    );

    if (idx === -1) {
      state.records.push({
        experimentId: params.experimentId,
        variantId: params.variantId,
        contextKey: params.contextKey,
        level: params.level,
        sampleCount: 1,
        emaUplift: params.signal.uplift,
        emaRisk: params.signal.risk,
        emaConfidence: params.signal.confidence,
        emaFinal: params.signal.final,
        lastEvaluatedAt: params.signal.evaluatedAt,
        updatedAt: new Date().toISOString(),
      });

      await this.write(state);
      return;
    }

    const current = state.records[idx];

    const updated: EMARecord = {
      ...current,
      sampleCount: current.sampleCount + 1,
      emaUplift: computeEMA(current.emaUplift, params.signal.uplift, this.alpha),
      emaRisk: computeEMA(current.emaRisk, params.signal.risk, this.alpha),
      emaConfidence: computeEMA(
        current.emaConfidence,
        params.signal.confidence,
        this.alpha
      ),
      emaFinal: computeEMA(current.emaFinal, params.signal.final, this.alpha),
      lastEvaluatedAt: params.signal.evaluatedAt,
      updatedAt: new Date().toISOString(),
    };

    state.records[idx] = updated;
    await this.write(state);
  }

  async getAll(): Promise<EMARecord[]> {
    return (await this.read()).records;
  }
  
  async getByContextKeys(contextKeys: string[]): Promise<EMARecord[]> {
    const keySet = new Set(contextKeys);
    const state = await this.read();
    return state.records.filter((record) => keySet.has(record.contextKey));
  }
}
