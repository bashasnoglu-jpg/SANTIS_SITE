import { getWaveSuccessRate } from "./wave-memory.js";

export interface TemporalContext {
  timestamp: number;
  demandLevel: "low" | "normal" | "high";
}

export interface WaveResult {
  waveFactor: number;
  reasoning: string[];
  successRate: number;
  key: string;
  band: string;
}

export async function resolveTemporalWave(input: TemporalContext): Promise<WaveResult> {
  const date = new Date(input.timestamp);
  const hour = date.getHours();

  let band;
  if (hour < 10) band = "morning";
  else if (hour < 17) band = "day";
  else if (hour < 22) band = "evening";
  else band = "night";

  let factor = 1;
  const r: string[] = [];

  if (band === "evening") { factor += 0.2; r.push("evening"); }
  if (band === "night") { factor += 0.1; r.push("night"); }

  if (input.demandLevel === "high") { factor += 0.25; r.push("high_demand"); }
  if (input.demandLevel === "low") { factor -= 0.15; r.push("low_demand"); }

  const day = date.getDay();
  if (day === 0 || day === 6) { factor += 0.15; r.push("weekend"); }

  const key = `${band}|${input.demandLevel}`;

  // 🔥 GLOBAL MEMORY READ
  const successRate = await getWaveSuccessRate(key);

  factor = factor * (0.8 + successRate * 0.4);

  factor = Math.max(0.5, Math.min(1.5, factor));
  r.push(`global_learning_rate=${(successRate * 100).toFixed(0)}%`);

  return {
    band,
    waveFactor: factor,
    successRate,
    key,
    reasoning: r
  };
}
