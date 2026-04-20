import path from 'node:path';

import { getOrCreateRolloutBootstrapContainer } from '../server/core/experiments/rollout/rollout.bootstrap.ts';
import type { MetricsObserver } from '../server/core/experiments/rollout/rollout.telemetry-bridge.ts';

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
