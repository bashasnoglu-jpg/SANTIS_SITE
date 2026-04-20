import { InMemoryRolloutRepository, type RolloutRepository } from './rollout.repository.ts';
import { FileBackedRolloutRepository } from './rollout.repository.file.ts';
import { InMemoryRolloutApprovalStore } from './rollout.approval.ts';
import { FileBackedRolloutApprovalStore } from './rollout.approval.file.ts';
import { InMemoryRolloutHealthWindowStore } from './rollout.health-window-store.ts';
import { FileBackedRolloutHealthWindowStore } from './rollout.health-window-store.file.ts';
import { StaticRolloutGuardrailProvider } from './rollout.guardrails.ts';
import { RolloutScheduler } from './rollout.scheduler.ts';
import { createRolloutRuntime, type RolloutRuntime } from './rollout.runtime.ts';
import type { MetricsObserver } from './rollout.telemetry-bridge.ts';
import type { RolloutRuntimeLogger } from './rollout.runtime.ts';
import { FileBackedOptimizerMemory } from '../optimizer/optimizer.memory.file.ts';
import { FeedbackEngine } from '../optimizer/optimizer.feedback.engine.ts';
import { OptimizerAdapter } from '../optimizer/optimizer.adapter.ts';
import { FileBackedContextualOptimizerMemory } from '../optimizer/optimizer.context.memory.file.ts';
import { ContextualOptimizerAdapter } from '../optimizer/optimizer.context.adapter.ts';
import { HierarchicalOptimizerAdapter } from '../optimizer/optimizer.hierarchical.adapter.ts';
import { FileBackedLearningAuditLogger } from '../optimizer/optimizer.learning.audit.file.ts';
import { OptimizerLearningPipeline } from '../optimizer/optimizer.learning.pipeline.ts';
import { FileBackedAggregatedOptimizerMemory } from '../optimizer/optimizer.memory.aggregate.file.ts';
import { AggregatedOptimizerMemoryWriter } from '../optimizer/optimizer.memory.aggregate.writer.ts';
import { TemporalAggregatedOptimizerAdapter } from '../optimizer/optimizer.temporal.adapter.ts';
import { FileBackedEMAOptimizerMemory } from '../optimizer/optimizer.memory.aggregate.ema.file.ts';
import { EMAOptimizerMemoryWriter } from '../optimizer/optimizer.memory.aggregate.ema.writer.ts';
import { TemporalEMAOptimizerAdapter } from '../optimizer/optimizer.temporal.ema.adapter.ts';
import { OptimizerBanditAdapter } from '../optimizer/optimizer.bandit.adapter.ts';

export interface RolloutBootstrapConfig {
  enabled: boolean;
  dryRun: boolean;
  tickIntervalMs: number;
  runImmediateTickOnStart?: boolean;
  repositoryMode?: 'memory' | 'file';
  repositoryFilePath?: string;
  approvalStoreFilePath?: string;
  healthWindowStoreFilePath?: string;
  optimizerMemoryFilePath?: string;
  contextualOptimizerMemoryFilePath?: string;
  learningAuditStoreFilePath?: string;
  aggregatedOptimizerMemoryFilePath?: string;
  emaOptimizerMemoryFilePath?: string;
}

export interface RolloutBootstrapDeps {
  metricsObserver: MetricsObserver;
  logger?: RolloutRuntimeLogger;
}

export interface RolloutBootstrapContainer {
  repository: RolloutRepository;
  approvalStore: {
    hasApproval(rolloutId: string, requestedStage: 100): Promise<boolean>;
    requestApproval(input: { rolloutId: string; requestedStage: 100 }): Promise<void>;
    approve?(input: { rolloutId: string; approvedAt: string; approvedBy: string }): Promise<void>;
  };
  healthWindowStore: {
    getConsecutiveHealthyCount(rolloutId: string): Promise<number>;
    recordHealthyWindow(rolloutId: string): Promise<void>;
    resetHealthyWindows(rolloutId: string): Promise<void>;
  };
  guardrailProvider: StaticRolloutGuardrailProvider;
  scheduler: RolloutScheduler;
  runtime: RolloutRuntime;
  optimizerAdapter?: OptimizerAdapter;
  contextualOptimizerAdapter?: ContextualOptimizerAdapter;
  contextualOptimizerMemory?: FileBackedContextualOptimizerMemory;
  hierarchicalOptimizerAdapter?: HierarchicalOptimizerAdapter;
  optimizerLearningPipeline?: OptimizerLearningPipeline;
  aggregatedOptimizerMemory?: FileBackedAggregatedOptimizerMemory;
  aggregatedOptimizerMemoryWriter?: AggregatedOptimizerMemoryWriter;
  temporalAggregatedOptimizerAdapter?: TemporalAggregatedOptimizerAdapter;
  emaOptimizerMemory?: FileBackedEMAOptimizerMemory;
  emaOptimizerMemoryWriter?: EMAOptimizerMemoryWriter;
  temporalEMAOptimizerAdapter?: TemporalEMAOptimizerAdapter;
  optimizerBanditAdapter?: OptimizerBanditAdapter;
}

let singletonContainer: RolloutBootstrapContainer | null = null;

function createRepository(
  config: RolloutBootstrapConfig
): RolloutRepository {
  const mode = config.repositoryMode ?? 'memory';

  if (mode === 'file') {
    if (!config.repositoryFilePath) {
      throw new Error(
        'repositoryFilePath is required when repositoryMode is "file".'
      );
    }

    return new FileBackedRolloutRepository({
      filePath: config.repositoryFilePath,
    });
  }

  return new InMemoryRolloutRepository();
}

function createApprovalStore(config: RolloutBootstrapConfig) {
  if ((config.repositoryMode ?? 'memory') === 'file') {
    if (!config.approvalStoreFilePath) {
      throw new Error('approvalStoreFilePath is required when repositoryMode is "file".');
    }
    return new FileBackedRolloutApprovalStore({
      filePath: config.approvalStoreFilePath,
    });
  }

  return new InMemoryRolloutApprovalStore();
}

function createHealthWindowStore(config: RolloutBootstrapConfig) {
  if ((config.repositoryMode ?? 'memory') === 'file') {
    if (!config.healthWindowStoreFilePath) {
      throw new Error(
        'healthWindowStoreFilePath is required when repositoryMode is "file".'
      );
    }
    return new FileBackedRolloutHealthWindowStore({
      filePath: config.healthWindowStoreFilePath,
    });
  }

  return new InMemoryRolloutHealthWindowStore();
}

export function createRolloutBootstrapContainer(
  config: RolloutBootstrapConfig,
  deps: RolloutBootstrapDeps
): RolloutBootstrapContainer {
  const repository = createRepository(config);
  const approvalStore = createApprovalStore(config);
  const healthWindowStore = createHealthWindowStore(config);
  const guardrailProvider = new StaticRolloutGuardrailProvider();

  const feedbackEngine = config.optimizerMemoryFilePath
    ? new FeedbackEngine(new FileBackedOptimizerMemory(config.optimizerMemoryFilePath))
    : undefined;

  const optimizerAdapter = config.optimizerMemoryFilePath
    ? new OptimizerAdapter(new FileBackedOptimizerMemory(config.optimizerMemoryFilePath))
    : undefined;

  const contextualOptimizerMemory = config.contextualOptimizerMemoryFilePath
    ? new FileBackedContextualOptimizerMemory(config.contextualOptimizerMemoryFilePath)
    : undefined;

  const contextualOptimizerAdapter = contextualOptimizerMemory
    ? new ContextualOptimizerAdapter(contextualOptimizerMemory)
    : undefined;

  const hierarchicalOptimizerAdapter = contextualOptimizerMemory
    ? new HierarchicalOptimizerAdapter(contextualOptimizerMemory)
    : undefined;

  const optimizerLearningGuardConfig = {
    minSamplesRequired: 5,
    minConfidenceRequired: 60,
    maxRiskAllowed: 80,
    maxAbsoluteUpliftAllowed: 100,
    maxAbsoluteFinalScoreAllowed: 100,
  };

  const learningAuditLogger = config.learningAuditStoreFilePath
    ? new FileBackedLearningAuditLogger(config.learningAuditStoreFilePath)
    : undefined;

  const optimizerLearningPipeline = contextualOptimizerMemory
    ? new OptimizerLearningPipeline(contextualOptimizerMemory, optimizerLearningGuardConfig, learningAuditLogger)
    : undefined;

  const aggregatedOptimizerMemory = config.aggregatedOptimizerMemoryFilePath
    ? new FileBackedAggregatedOptimizerMemory(config.aggregatedOptimizerMemoryFilePath)
    : undefined;

  const aggregatedOptimizerMemoryWriter = aggregatedOptimizerMemory
    ? new AggregatedOptimizerMemoryWriter(aggregatedOptimizerMemory)
    : undefined;

  const temporalAggregatedOptimizerAdapter = aggregatedOptimizerMemory
    ? new TemporalAggregatedOptimizerAdapter(aggregatedOptimizerMemory, {
        minSamplesRequired: 2,
        minAverageConfidenceRequired: 60,
      })
    : undefined;

  const emaOptimizerMemory = config.emaOptimizerMemoryFilePath
    ? new FileBackedEMAOptimizerMemory(config.emaOptimizerMemoryFilePath, 0.2)
    : undefined;

  const emaOptimizerMemoryWriter = emaOptimizerMemory
    ? new EMAOptimizerMemoryWriter(emaOptimizerMemory)
    : undefined;

  const temporalEMAOptimizerAdapter = emaOptimizerMemory
    ? new TemporalEMAOptimizerAdapter(emaOptimizerMemory, {
        minSamplesRequired: 2,
        minAverageConfidenceRequired: 60,
      })
    : undefined;

  const optimizerBanditAdapter = new OptimizerBanditAdapter({
    strategy: 'thompson_sampling',
    thompsonPriorAlpha: 1,
    thompsonPriorBeta: 1,
    ucbExplorationConstant: 1.4,
    maxExplorationBonus: 0.2,
    minLearnedWeightForExploration: 0.55,
  });

  const scheduler = new RolloutScheduler({
    repository,
    guardrailProvider,
    metricsObserver: deps.metricsObserver,
    approvalStore,
    healthWindowStore,
    logger: deps.logger,
    feedbackEngine,
  });

  const runtime = createRolloutRuntime(
    {
      enabled: config.enabled,
      dryRun: config.dryRun,
      tickIntervalMs: config.tickIntervalMs,
      runImmediateTickOnStart: config.runImmediateTickOnStart,
    },
    {
      scheduler,
      logger: deps.logger,
    }
  );

  return {
    repository,
    approvalStore,
    healthWindowStore,
    guardrailProvider,
    scheduler,
    runtime,
    optimizerAdapter,
    contextualOptimizerAdapter,
    contextualOptimizerMemory,
    hierarchicalOptimizerAdapter,
    optimizerLearningPipeline,
    aggregatedOptimizerMemory,
    aggregatedOptimizerMemoryWriter,
    temporalAggregatedOptimizerAdapter,
    emaOptimizerMemory,
    emaOptimizerMemoryWriter,
    temporalEMAOptimizerAdapter,
    optimizerBanditAdapter,
  };
}

export function getOrCreateRolloutBootstrapContainer(
  config: RolloutBootstrapConfig,
  deps: RolloutBootstrapDeps
): RolloutBootstrapContainer {
  if (singletonContainer) {
    return singletonContainer;
  }

  singletonContainer = createRolloutBootstrapContainer(config, deps);
  return singletonContainer;
}

export function resetRolloutBootstrapContainer(): void {
  singletonContainer = null;
}
