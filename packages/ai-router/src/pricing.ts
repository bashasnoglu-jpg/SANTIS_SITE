import { AIModel } from './types';

// Based on OpenAI official pricing (USD per 1M tokens)
// https://platform.openai.com/docs/models/gpt-4.1-mini
export const MODEL_PRICING_USD: Record<AIModel, { input: number; output: number }> = {
  'gpt-4.1-mini': {
    input: 0.40,
    output: 1.60
  },
  'gpt-4.1': {
    input: 2.0,
    output: 8.0
  }
};

// Configurable FX rate (do NOT fetch dynamically for determinism)
export const USD_TO_EUR = Number(process.env.USD_TO_EUR ?? 0.92);

export function estimateCostEUR(params: {
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
}): number {
  const pricing = MODEL_PRICING_USD[params.model];

  const inputCostUsd = (params.inputTokens / 1_000_000) * pricing.input;
  const outputCostUsd = (params.outputTokens / 1_000_000) * pricing.output;

  const totalUsd = inputCostUsd + outputCostUsd;
  return totalUsd * USD_TO_EUR;
}

export function roughTokenEstimate(text: string): number {
  // Approx: 1 token ≈ 4 chars
  return Math.ceil(text.length / 4);
}
