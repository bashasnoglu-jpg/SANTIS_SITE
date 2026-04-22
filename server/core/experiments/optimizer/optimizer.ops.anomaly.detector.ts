import type { OptimizerOpsTrendPoint } from './optimizer.ops.trends.contract.ts';
import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function detectOptimizerAnomalies(
  points: OptimizerOpsTrendPoint[]
): OptimizerAnomaly[] {
  if (points.length < 5) return [];

  const anomalies: OptimizerAnomaly[] = [];

  const last = points.slice(-3);
  const prev = points.slice(-10, -3);

  const lastExploration = avg(last.map((p) => p.explorationRate));
  const prevExploration = avg(prev.map((p) => p.explorationRate));

  if (lastExploration > prevExploration * 1.5) {
    anomalies.push({
      type: 'exploration_spike',
      severity: 'medium',
      message: 'Exploration rate spiked significantly.',
      detectedAt: new Date().toISOString(),
    });
  }

  const lastAllowed = avg(last.map((p) => p.allowedCandidates));
  const prevAllowed = avg(prev.map((p) => p.allowedCandidates));

  if (lastAllowed < prevAllowed * 0.6) {
    anomalies.push({
      type: 'allowed_drop',
      severity: 'high',
      message: 'Allowed candidates dropped sharply.',
      detectedAt: new Date().toISOString(),
    });
  }

  const lastRisk = avg(last.map((p) => p.totalPortfolioRisk));
  const prevRisk = avg(prev.map((p) => p.totalPortfolioRisk));

  if (lastRisk > prevRisk * 1.4) {
    anomalies.push({
      type: 'risk_surge',
      severity: 'high',
      message: 'Portfolio risk increasing rapidly.',
      detectedAt: new Date().toISOString(),
    });
  }

  const lastBlocked = avg(last.map((p) => p.blockedCandidates));
  const prevBlocked = avg(prev.map((p) => p.blockedCandidates));

  if (lastBlocked > prevBlocked * 1.5) {
    anomalies.push({
      type: 'blocked_spike',
      severity: 'medium',
      message: 'Blocked candidates increased significantly.',
      detectedAt: new Date().toISOString(),
    });
  }

  return anomalies;
}
