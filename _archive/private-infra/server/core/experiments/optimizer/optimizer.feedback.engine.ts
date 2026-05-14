import { analyzeFeedback } from './optimizer.feedback.analyzer.ts';
import { FileBackedOptimizerMemory } from './optimizer.memory.file.ts';
import type { FeedbackSignal } from './optimizer.feedback.contract.ts';

export class FeedbackEngine {
  constructor(
    private memory: FileBackedOptimizerMemory
  ) {}

  async process(signal: FeedbackSignal) {
    const score = analyzeFeedback(signal);

    await this.memory.append(score);

    return score;
  }
}
