import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ContextualFeedbackScore } from './optimizer.context.contract.ts';
import type { LearningBlockReason } from './optimizer.learning.guard.contract.ts';

export interface RejectedLearningAuditEvent {
  experimentId: string;
  variantId: string;
  contextKey: string;
  reasons: LearningBlockReason[];
  evaluatedAt: string;
}

export class FileBackedLearningAuditLogger {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  async logRejection(
    score: ContextualFeedbackScore,
    reasons: LearningBlockReason[]
  ): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    
    const event: RejectedLearningAuditEvent = {
      experimentId: score.experimentId,
      variantId: score.variantId,
      contextKey: score.contextKey,
      reasons,
      evaluatedAt: score.evaluatedAt,
    };

    await fs.appendFile(
      this.filePath,
      JSON.stringify(event) + '\n',
      'utf8'
    );
  }
}
