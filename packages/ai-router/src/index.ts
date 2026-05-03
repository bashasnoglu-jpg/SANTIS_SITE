import { AIRouterRequestSchema } from './types';
import { decideModel, finalizeCost } from './router';
import { callOpenAI } from './providers/openai';

export async function runAIRouter(input: unknown) {
  const req = AIRouterRequestSchema.parse(input);

  const decision = decideModel(req);

  if (!decision.allowed) {
    throw new Error(`Blocked by cost guard: ${decision.metadata.costGuardReason}`);
  }

  if (decision.requiresManualApproval) {
    throw new Error('Manual approval required for this task');
  }

  const result = await callOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    model: decision.model,
    input: req.prompt,
    system: req.system,
    maxOutputTokens: decision.maxOutputTokens
  });

  const finalCost = decision.estimatedCostEur;
  finalizeCost(finalCost);

  return {
    id: req.id,
    model: decision.model,
    outputText: result.text,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      estimatedCostEur: finalCost
    }
  };
}
