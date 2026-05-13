import path from 'node:path';
import { existsSync } from 'node:fs';

// Decoupled interface to avoid importing from private server
interface MetricsObserver {
  getConversionRate(): Promise<number>;
  getErrorRate(): Promise<number>;
  getP95LatencyMs(): Promise<number>;
  getSampleSize(): Promise<number>;
  getConfidenceScore(): Promise<number>;
}

const logger = {
  info(message: string, meta: Record<string, unknown> = {}) {
    console.log(`[INFO] ${message}`, meta);
  },
  warn(message: string, meta: Record<string, unknown> = {}) {
    console.warn(`[WARN] ${message}`, meta);
  },
  error(message: string, meta: Record<string, unknown> = {}) {
    console.error(`[ERROR] ${message}`, meta);
  },
};

class NoopMetricsObserver implements MetricsObserver {
  async getConversionRate(): Promise<number> {
    return 0;
  }

  async getErrorRate(): Promise<number> {
    return 0;
  }

  async getP95LatencyMs(): Promise<number> {
    return 0;
  }

  async getSampleSize(): Promise<number> {
    return 0;
  }

  async getConfidenceScore(): Promise<number> {
    return 0;
  }
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value == null) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStringEnv(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value : fallback;
}

async function main(): Promise<void> {
  const serverPath = path.resolve(__dirname, '../server/core/experiments/rollout/rollout.bootstrap.ts');
  
  if (!existsSync(serverPath)) {
    console.warn('[SKIPPED_PRIVATE_OS_DEPENDENCY] Rollout Runtime: Server bootstrap missing. Skipping execution.');
    process.exit(0);
  }

  // Dynamic import to avoid early crash if server directory is missing
  const { getOrCreateRolloutBootstrapContainer } = await import('../server/core/experiments/rollout/rollout.bootstrap.ts');

  const enabled = readBooleanEnv('ROLLOUT_RUNTIME_ENABLED', true);
  const dryRun = readBooleanEnv('ROLLOUT_RUNTIME_DRY_RUN', true);
  const tickIntervalMs = readNumberEnv('ROLLOUT_RUNTIME_TICK_MS', 15_000);
  const runImmediateTickOnStart = readBooleanEnv(
    'ROLLOUT_RUNTIME_IMMEDIATE_TICK',
    true
  );

  const repositoryMode =
    readStringEnv('ROLLOUT_REPOSITORY_MODE', 'file') === 'memory'
      ? 'memory'
      : 'file';

  const repositoryFilePath = path.resolve(
    readStringEnv('ROLLOUT_REPOSITORY_FILE', './data/rollout-state.json')!
  );

  const approvalStoreFilePath = path.resolve(
    readStringEnv('ROLLOUT_APPROVAL_STORE_FILE', './data/rollout-approval-state.json')!
  );

  const healthWindowStoreFilePath = path.resolve(
    readStringEnv('ROLLOUT_HEALTH_STORE_FILE', './data/rollout-health-state.json')!
  );

  const optimizerMemoryFilePath = path.resolve(
    readStringEnv('ROLLOUT_OPTIMIZER_MEMORY_FILE', './data/optimizer-memory-state.json')!
  );

  const contextualOptimizerMemoryFilePath = path.resolve(
    readStringEnv('ROLLOUT_CONTEXTUAL_MEMORY_FILE', './data/optimizer-context-memory-state.json')!
  );

  const learningAuditStoreFilePath = path.resolve(
    readStringEnv('ROLLOUT_LEARNING_AUDIT_FILE', './data/optimizer-learning-rejections.jsonl')!
  );

  const aggregatedOptimizerMemoryFilePath = path.resolve(
    readStringEnv('ROLLOUT_AGGREGATED_MEMORY_FILE', './data/optimizer-aggregated-memory-state.json')!
  );

  const emaOptimizerMemoryFilePath = path.resolve(
    readStringEnv('ROLLOUT_EMA_MEMORY_FILE', './data/optimizer-ema-memory-state.json')!
  );

  logger.info('rollout.daemon.booting', {
    mode: 'sidecar',
    enabled,
    dryRun,
    tickIntervalMs,
    runImmediateTickOnStart,
    repositoryMode,
    repositoryFilePath: repositoryMode === 'file' ? repositoryFilePath : null,
    approvalStoreFilePath: repositoryMode === 'file' ? approvalStoreFilePath : null,
    healthWindowStoreFilePath: repositoryMode === 'file' ? healthWindowStoreFilePath : null,
    optimizerMemoryFilePath: repositoryMode === 'file' ? optimizerMemoryFilePath : null,
    contextualOptimizerMemoryFilePath: repositoryMode === 'file' ? contextualOptimizerMemoryFilePath : null,
    learningAuditStoreFilePath: repositoryMode === 'file' ? learningAuditStoreFilePath : null,
    aggregatedOptimizerMemoryFilePath: repositoryMode === 'file' ? aggregatedOptimizerMemoryFilePath : null,
    emaOptimizerMemoryFilePath: repositoryMode === 'file' ? emaOptimizerMemoryFilePath : null,
  });

  const metricsObserver = new NoopMetricsObserver();

  const container = getOrCreateRolloutBootstrapContainer(
    {
      enabled,
      dryRun,
      tickIntervalMs,
      runImmediateTickOnStart,
      repositoryMode,
      repositoryFilePath,
      approvalStoreFilePath,
      healthWindowStoreFilePath,
      optimizerMemoryFilePath: repositoryMode === 'file' ? optimizerMemoryFilePath : undefined,
      contextualOptimizerMemoryFilePath: repositoryMode === 'file' ? contextualOptimizerMemoryFilePath : undefined,
      learningAuditStoreFilePath: repositoryMode === 'file' ? learningAuditStoreFilePath : undefined,
      aggregatedOptimizerMemoryFilePath: repositoryMode === 'file' ? aggregatedOptimizerMemoryFilePath : undefined,
      emaOptimizerMemoryFilePath: repositoryMode === 'file' ? emaOptimizerMemoryFilePath : undefined,
    },
    {
      metricsObserver,
      logger,
    }
  );

  container.runtime.start();

  process.on('SIGINT', () => {
    logger.info('rollout.daemon.signal.received', { signal: 'SIGINT' });
    container.runtime.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('rollout.daemon.signal.received', { signal: 'SIGTERM' });
    container.runtime.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    logger.error('rollout.daemon.uncaught_exception', {
      error: error instanceof Error ? error.stack : String(error),
    });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('rollout.daemon.unhandled_rejection', {
      error: reason instanceof Error ? reason.stack : String(reason),
    });
  });
}

void main();
