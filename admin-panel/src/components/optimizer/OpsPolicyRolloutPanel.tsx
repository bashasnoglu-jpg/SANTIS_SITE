import React, { useState } from 'react';
import type {
  OptimizerPolicyRolloutRecord,
  StartPolicyRolloutResponse,
} from '../../types/optimizer-policy-rollout';

type Props = {
  proposalId: string;
  onStarted?: (rollout: OptimizerPolicyRolloutRecord) => void;
};

export function OpsPolicyRolloutPanel({ proposalId, onStarted }: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OptimizerPolicyRolloutRecord | null>(null);
  const [error, setError] = useState('');

  async function startCanaryRollout() {
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/optimizer/policy-rollouts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          proposalId,
          scope: {
            type: 'canary',
            rolloutPercentage: 10,
          },
          guard: {
            maxRiskIncrease: 5,
            minScoreDelta: -2,
            minStabilityDelta: -3,
            evaluationWindowMinutes: 15,
            minSampleSize: 30,
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to start rollout');
      }

      const data: StartPolicyRolloutResponse = await response.json();
      setResult(data.rollout);
      onStarted?.(data.rollout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown rollout error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-4">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-1">Controlled Rollout</h3>
        <p className="text-slate-400 text-sm">Approved proposal için kontrollü canlı dağıtım başlat</p>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={startCanaryRollout}
          disabled={busy}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white rounded font-medium transition-colors"
        >
          {busy ? 'Başlatılıyor...' : '10% Canary Rollout Başlat'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-slate-900 rounded border border-indigo-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-green-400">Rollout Active</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
            <div><span className="text-slate-500">ID:</span> {result.rolloutId.split('-')[0]}</div>
            <div><span className="text-slate-500">Durum:</span> <span className="text-indigo-400 font-mono">{result.status}</span></div>
            <div><span className="text-slate-500">Scope:</span> {result.scope.type}</div>
            <div><span className="text-slate-500">Başlangıç:</span> {new Date(result.startedAt).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
