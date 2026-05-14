import type { RolloutScheduler } from './rollout.scheduler.ts';

export interface RolloutRuntimeLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface RolloutRuntimeConfig {
  enabled: boolean;
  dryRun: boolean;
  tickIntervalMs: number;
  runImmediateTickOnStart?: boolean;
}

export interface RolloutRuntimeDeps {
  scheduler: RolloutScheduler;
  logger?: RolloutRuntimeLogger;
}

export interface RolloutRuntime {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  tickOnce(nowIso?: string): Promise<void>;
}

export function createRolloutRuntime(
  config: RolloutRuntimeConfig,
  deps: RolloutRuntimeDeps
): RolloutRuntime {
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;
  let started = false;

  async function safeTick(nowIso: string): Promise<void> {
    if (!config.enabled) {
      deps.logger?.warn('rollout.runtime.tick.skipped.disabled', {
        nowIso,
      });
      return;
    }

    if (inFlight) {
      deps.logger?.warn('rollout.runtime.tick.skipped.in_flight', {
        nowIso,
      });
      return;
    }

    inFlight = true;
    const startedAt = Date.now();

    deps.logger?.info('rollout.runtime.tick.started', {
      nowIso,
      dryRun: config.dryRun,
    });

    try {
      const results = await deps.scheduler.tickAll(nowIso);

      deps.logger?.info('rollout.runtime.tick.completed', {
        nowIso,
        dryRun: config.dryRun,
        processedRollouts: results.length,
        tickDurationMs: Date.now() - startedAt,
      });
    } catch (error) {
      deps.logger?.error('rollout.runtime.tick.failed', {
        nowIso,
        dryRun: config.dryRun,
        tickDurationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      inFlight = false;
    }
  }

  return {
    start(): void {
      if (started) {
        deps.logger?.warn('rollout.runtime.start.ignored.already_started', {
          tickIntervalMs: config.tickIntervalMs,
        });
        return;
      }

      if (!config.enabled) {
        deps.logger?.warn('rollout.runtime.start.disabled', {
          tickIntervalMs: config.tickIntervalMs,
          dryRun: config.dryRun,
        });
        started = true;
        return;
      }

      deps.logger?.info('rollout.runtime.started', {
        enabled: config.enabled,
        dryRun: config.dryRun,
        tickIntervalMs: config.tickIntervalMs,
        runImmediateTickOnStart: config.runImmediateTickOnStart ?? true,
      });

      if (!config.enabled) {
        deps.logger?.warn('rollout.runtime.started.disabled_mode', {});
        return;
      }

      if (config.runImmediateTickOnStart ?? true) {
        void safeTick(new Date().toISOString());
      }

      timer = setInterval(() => {
        void safeTick(new Date().toISOString());
      }, config.tickIntervalMs);
    },

    stop(): void {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      if (started) {
        deps.logger?.info('rollout.runtime.stopped', {});
      }

      started = false;
    },

    isRunning(): boolean {
      return started;
    },

    async tickOnce(nowIso = new Date().toISOString()): Promise<void> {
      await safeTick(nowIso);
    },
  };
}
