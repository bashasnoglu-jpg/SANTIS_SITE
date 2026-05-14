import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Optimizer Smoke Test',
  requiredPaths: [
    'server/core/concierge/optimizer/optimizer.adapter.ts',
    'server/core/concierge/optimizer/optimizer.rules.ts'
  ],
  run: async () => {
    const { derivePolicyOptimizerOutput } = await import('./server/core/concierge/optimizer/optimizer.adapter.ts');
    const { optimizerReasonCodes } = await import('./server/core/concierge/optimizer/optimizer.rules.ts');

    const cases = [
      {
        name: 'CASE A — quote latency threshold should decrease',
        observation: {
          thresholdKey: 'highQuoteLatencyMs',
          currentValue: 1200,
          candidateValue: 1000,
          sampleSize: 50,
          revenueDelta: 200,
          abandonmentDelta: -0.05,
          confirmedIntentDelta: 0.05,
        },
        expected: {
          direction: 'decrease',
          reasons: [
            optimizerReasonCodes.STRONG_REVENUE_GAIN,
            optimizerReasonCodes.ABANDONMENT_REDUCTION,
            optimizerReasonCodes.INTENT_RATE_GAIN
          ],
          confidenceGte: 0.6
        }
      },
      {
        name: 'CASE B — compact layout threshold should increase',
        observation: {
          thresholdKey: 'compactLayoutServiceThreshold',
          currentValue: 4,
          candidateValue: 5,
          sampleSize: 30,
          revenueDelta: 150,
          abandonmentDelta: 0,
          confirmedIntentDelta: 0,
        },
        expected: {
          direction: 'increase',
          reasons: [
            optimizerReasonCodes.STRONG_REVENUE_GAIN
          ],
          confidenceGte: 0.4
        }
      },
      {
        name: 'CASE C — no clear winner',
        observation: {
          thresholdKey: 'highAbandonmentRisk',
          currentValue: 0.6,
          candidateValue: 0.5,
          sampleSize: 60,
          revenueDelta: 0,
          abandonmentDelta: 0,
          confirmedIntentDelta: 0,
        },
        expected: {
          direction: 'decrease',
          reasons: [
            optimizerReasonCodes.NO_CLEAR_WINNER
          ]
        }
      },
      {
        name: 'CASE D — low sample size',
        observation: {
          thresholdKey: 'urgencyLowSlotThreshold',
          currentValue: 2,
          candidateValue: 3,
          sampleSize: 10,
          revenueDelta: 0,
          abandonmentDelta: 0,
          confirmedIntentDelta: 0,
        },
        expected: {
          direction: 'increase',
          reasons: [
            optimizerReasonCodes.LOW_SAMPLE_SIZE
          ]
        }
      }
    ];

    console.log('=== ACTION POLICY OPTIMIZER V1.7 SMOKE TEST ===\n');

    let allPassed = true;

    cases.forEach(c => {
      console.log(`--- ${c.name} ---`);
      
      const output = derivePolicyOptimizerOutput({
        observations: [c.observation]
      } as any);

      const rec = output.recommendations[0];
      let pass = true;
      const failedKeys = [];

      if (rec.direction !== c.expected.direction) {
        pass = false;
        failedKeys.push(`Expected direction ${c.expected.direction}, got ${rec.direction}`);
      }

      c.expected.reasons.forEach(reason => {
        if (!rec.reasonCodes.includes(reason)) {
          pass = false;
          failedKeys.push(`Expected reason ${reason}, got ${rec.reasonCodes.join(',')}`);
        }
      });

      if (c.expected.confidenceGte !== undefined) {
        if (rec.confidence < c.expected.confidenceGte) {
          pass = false;
          failedKeys.push(`Expected confidence >= ${c.expected.confidenceGte}, got ${rec.confidence}`);
        }
      }

      const outStr = `Key: ${rec.thresholdKey}, ${rec.currentValue} -> ${rec.recommendedValue} [${rec.direction}], Confidence: ${rec.confidence}, Reasons: ${rec.reasonCodes.join(',')}`;
      console.log(`Output: ${outStr}`);

      if (pass) {
        console.log('✅ PASS\n');
      } else {
        console.log(`❌ FAIL: Mismatches -> ${failedKeys.join('; ')}\n`);
        allPassed = false;
      }
    });

    if (allPassed) {
      console.log('🏆 ALL POLICY OPTIMIZER MATRIX CASES PASSED. THE SYSTEM IS READY TO TUNE ITSELF.');
    } else {
      console.log('🚨 OPTIMIZER MATRIX FAILURE.');
      process.exit(1);
    }
  }
});

