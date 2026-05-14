import type { Express } from 'express';
import { createOptimizerOpsRoute } from './optimizer-ops.route.ts';
import { createOptimizerOpsSeedRoute } from './optimizer-ops.seed.route.ts';
import { createOptimizerOpsTrendsRoute } from './optimizer-ops-trends.route.ts';
import { createOptimizerOpsAnomaliesRoute } from './optimizer-ops-anomalies.route.ts';
import { createOptimizerPolicyRoute } from './optimizer.policy.route.ts';
import { createOptimizerPolicyApprovalRoute } from './optimizer.policy.approval.route.ts';
import { createOptimizerPolicySimulationRoute } from './optimizer.policy.simulation.route.ts';
import { createOptimizerPolicyBacktestRoute } from './optimizer.policy.backtest.route.ts';
import { createOptimizerPolicyRecommenderRoute } from './optimizer.policy.recommender.route.ts';
import { createOptimizerPolicyRecommenderApplyRoute } from './optimizer.policy.recommender.apply.route.ts';
import { OptimizerPolicySimulationEngine } from '../../core/experiments/optimizer/optimizer.policy.simulation.engine.ts';
import { OptimizerPolicyBacktestEngine } from '../../core/experiments/optimizer/optimizer.policy.backtest.engine.ts';
import { OptimizerPolicyRecommenderEngine } from '../../core/experiments/optimizer/optimizer.policy.recommender.engine.ts';
import { OptimizerPolicyCompiler } from '../../core/experiments/optimizer/optimizer.policy.compiler.ts';
import { OptimizerPolicyRecommenderApplyEngine } from '../../core/experiments/optimizer/optimizer.policy.recommender.apply.engine.ts';
import { InMemoryOptimizerPolicyRolloutStore } from '../../core/experiments/optimizer/optimizer.policy.rollout.memory.ts';
import { InMemoryOptimizerPolicyStateRepository } from '../../core/experiments/optimizer/optimizer.policy.state.memory.ts';
import { NoopOptimizerPolicyRolloutMetricsProvider } from '../../core/experiments/optimizer/optimizer.policy.rollout.metrics.ts';
import { OptimizerPolicyRolloutEngine } from '../../core/experiments/optimizer/optimizer.policy.rollout.engine.ts';
import { OptimizerPolicyRolloutWorker } from '../../core/experiments/optimizer/optimizer.policy.rollout.worker.ts';
import { OptimizerPolicyRolloutScheduler } from '../../core/experiments/optimizer/optimizer.policy.rollout.scheduler.ts';
import { OptimizerPolicyApprovalRepositoryAdapter } from '../../core/experiments/optimizer/optimizer.policy.approval.repository.adapter.ts';
import { registerOptimizerPolicyRolloutRoute } from './optimizer.policy.rollout.route.ts';
import { InMemoryOptimizerPolicyRecommenderStore } from '../../core/experiments/optimizer/optimizer.policy.recommender.store.ts';
import { sovereignEventBus } from '../../core/events/sovereign-event-bus.ts';
import { WebSocketServer, WebSocket } from 'ws';
import type { OptimizerDecisionSnapshotStore } from '../../core/experiments/optimizer/optimizer.ops.snapshot.store.ts';
import type { OptimizerPolicyEngineV33 } from '../../core/experiments/optimizer/optimizer.policy.engine.v33.ts';
import type { OptimizerPolicyAuditStore } from '../../core/experiments/optimizer/optimizer.policy.audit.memory.ts';
import type { OptimizerPolicyApprovalStore } from '../../core/experiments/optimizer/optimizer.policy.approval.memory.ts';

interface RegisterOptimizerOpsRoutesDeps {
  app: Express;
  snapshotStore: OptimizerDecisionSnapshotStore;
  policyEngine: OptimizerPolicyEngineV33;
  policyAuditStore: OptimizerPolicyAuditStore;
  policyApprovalStore: OptimizerPolicyApprovalStore;
}

let optimizerPolicyRolloutScheduler: OptimizerPolicyRolloutScheduler | null = null;

export function registerOptimizerOpsRoutes(
  deps: RegisterOptimizerOpsRoutesDeps
): void {
  deps.app.get(
    '/api/optimizer/ops',
    createOptimizerOpsRoute({
      getLatestOptimizerDecisionSnapshot: async ({ experimentId, requestId }) => {
        return deps.snapshotStore.getLatest({
          experimentId,
          requestId,
        });
      },
    })
  );

  deps.app.get(
    '/api/optimizer/ops/trends',
    createOptimizerOpsTrendsRoute({
      snapshotStore: deps.snapshotStore,
    })
  );

  deps.app.get(
    '/api/optimizer/ops/anomalies',
    createOptimizerOpsAnomaliesRoute({
      snapshotStore: deps.snapshotStore,
    })
  );

  deps.app.get(
    '/api/optimizer/policy',
    createOptimizerPolicyRoute({
      policyEngine: deps.policyEngine,
      auditStore: deps.policyAuditStore,
    })
  );

  const approvalRoute = createOptimizerPolicyApprovalRoute({
    policyEngine: deps.policyEngine,
    approvalStore: deps.policyApprovalStore,
  });

  deps.app.get('/api/optimizer/policy/approvals', approvalRoute.listPending);
  deps.app.post('/api/optimizer/policy/approvals/approve', approvalRoute.approve);
  deps.app.post('/api/optimizer/policy/approvals/reject', approvalRoute.reject);

  const simulationEngine = new OptimizerPolicySimulationEngine();
  const backtestEngine = new OptimizerPolicyBacktestEngine(simulationEngine);
  const recommenderStore = new InMemoryOptimizerPolicyRecommenderStore();
  const recommenderEngine = new OptimizerPolicyRecommenderEngine(backtestEngine, recommenderStore);
  const policyCompiler = new OptimizerPolicyCompiler(deps.policyApprovalStore);
  const recommenderApplyEngine = new OptimizerPolicyRecommenderApplyEngine(recommenderStore, policyCompiler);

  deps.app.get(
    '/api/optimizer/policy/simulate',
    createOptimizerPolicySimulationRoute({
      approvalStore: deps.policyApprovalStore,
      snapshotStore: deps.snapshotStore,
      simulationEngine,
    })
  );

  deps.app.get(
    '/api/optimizer/policy/backtest',
    createOptimizerPolicyBacktestRoute({
      approvalStore: deps.policyApprovalStore,
      snapshotStore: deps.snapshotStore,
      backtestEngine,
    })
  );

  deps.app.get(
    '/api/optimizer/policy/recommendations',
    createOptimizerPolicyRecommenderRoute({
      snapshotStore: deps.snapshotStore,
      policyEngine: deps.policyEngine,
      recommenderEngine,
    })
  );

  deps.app.post(
    '/api/optimizer/policy-recommender/apply',
    createOptimizerPolicyRecommenderApplyRoute({
      applyEngine: recommenderApplyEngine
    })
  );

  deps.app.post(
    '/api/optimizer/ops/seed',
    createOptimizerOpsSeedRoute({
      snapshotStore: deps.snapshotStore,
    })
  );

  const rolloutStore = new InMemoryOptimizerPolicyRolloutStore();
  const policyStateRepository = new InMemoryOptimizerPolicyStateRepository();
  const metricsProvider = new NoopOptimizerPolicyRolloutMetricsProvider();
  const approvalRepository = new OptimizerPolicyApprovalRepositoryAdapter(deps.policyApprovalStore);

  const rolloutEngine = new OptimizerPolicyRolloutEngine(
    approvalRepository,
    policyStateRepository,
    rolloutStore,
  );

  registerOptimizerPolicyRolloutRoute(deps.app, { rolloutEngine });

  const rolloutWorker = new OptimizerPolicyRolloutWorker(
    rolloutStore,
    policyStateRepository,
    metricsProvider,
  );

  if (!optimizerPolicyRolloutScheduler) {
    optimizerPolicyRolloutScheduler = new OptimizerPolicyRolloutScheduler(
      rolloutWorker,
      15_000,
    );
    optimizerPolicyRolloutScheduler.start();
    
    // Broadcast Sovereign Event Bus to Nöral Köprü (WebSocket)
    sovereignEventBus.on('ROLLOUT_STATUS_UPDATE', (rolloutPayload) => {
      // API mock veya server.js üzerinden global wss veya wss2 nesnelerini yakalama
      const wss = (global as any).globalWss || (global as any).globalWss2 || (global as any).wss;
      if (wss && wss.clients) {
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'ROLLOUT_STATUS_UPDATE',
              data: rolloutPayload
            }));
          }
        });
      } else {
        console.log("📡 [Sovereign Event Bus] Rollout update caught, but no global WS found:", rolloutPayload.status);
      }
    });
  }
}
