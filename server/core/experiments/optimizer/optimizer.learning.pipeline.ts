import type { FileBackedContextualOptimizerMemory } from './optimizer.context.memory.file.ts';
import type { ContextualFeedbackScore } from './optimizer.context.contract.ts';
import type { OptimizerLearningGuardConfig } from './optimizer.learning.guard.contract.ts';
import { evaluateLearningGuard } from './optimizer.learning.guard.ts';
import { buildContextualLearningDecision } from './optimizer.learning.decision.ts';
import type { FileBackedLearningAuditLogger } from './optimizer.learning.audit.file.ts';

export interface LearningPipelineInput {
  score: ContextualFeedbackScore;
  observedSampleCount: number;
}

export interface LearningPipelineResult {
  accepted: boolean;
  reasons: ReturnType<typeof buildContextualLearningDecision>['reasons'];
  persisted: boolean;
  contextKey: string;
}

export class OptimizerLearningPipeline {
  constructor(
    private readonly memory: FileBackedContextualOptimizerMemory,
    private readonly config: OptimizerLearningGuardConfig,
    private readonly auditLogger?: FileBackedLearningAuditLogger
  ) {}

  async process(input: LearningPipelineInput): Promise<LearningPipelineResult> {
    const guard = evaluateLearningGuard(
      {
        sampleCount: input.observedSampleCount,
        confidenceScore: input.score.confidenceScore,
        riskScore: input.score.riskScore,
        upliftScore: input.score.upliftScore,
        finalScore: input.score.finalScore,
      },
      this.config
    );

    const decision = buildContextualLearningDecision(input.score, guard);

    if (!decision.accepted) {
      if (this.auditLogger) {
        await this.auditLogger.logRejection(input.score, decision.reasons).catch(() => {
          // Fire and forget, don't break pipeline if audit fails
        });
      }
      return {
        accepted: false,
        reasons: decision.reasons,
        persisted: false,
        contextKey: input.score.contextKey,
      };
    }

    await this.memory.append(input.score);

    return {
      accepted: true,
      reasons: [],
      persisted: true,
      contextKey: input.score.contextKey,
    };
  }
}
