import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  GetPolicyRolloutResponse,
  StartPolicyRolloutRequest,
  StartPolicyRolloutResponse,
} from './optimizer.policy.rollout.contract.ts';
import { OptimizerPolicyRolloutEngine } from './optimizer.policy.rollout.engine.ts';

type Dependencies = {
  rolloutEngine: OptimizerPolicyRolloutEngine;
};

export async function registerOptimizerPolicyRolloutRoute(
  app: any,
  deps: Dependencies,
) {
  app.post(
    '/api/optimizer/policy-rollouts',
    async (
      req: any,
      res: any,
    ) => {
      const actorId = req.actor?.id ?? 'system';

      const result = await deps.rolloutEngine.startRollout(
        { actorId },
        req.body as StartPolicyRolloutRequest,
      );

      return res.json(result);
    },
  );

  app.get(
    '/api/optimizer/policy-rollouts/:rolloutId',
    async (
      req: any,
      res: any,
    ) => {
      const result = await deps.rolloutEngine.getRollout(
        req.params.rolloutId,
      );

      return res.json(result);
    },
  );
}
