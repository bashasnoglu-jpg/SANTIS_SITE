import type { OracleExecutionOutcomeRecord } from "./oracle-execution-outcome.contract.js";
import type { OracleStatisticalForecast } from "./oracle-statistical-forecast.contract.js";

export class OracleStatisticalForecastEngine {
  forecast(outcomes: OracleExecutionOutcomeRecord[]): OracleStatisticalForecast {
    const sorted = [...outcomes].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
    const seven = sorted.slice(0, 7);
    const thirty = sorted.slice(0, 30);
    const sevenOutcomeAverage = this.average(seven.map((outcome) => outcome.actualRevenueLift));
    const thirtyOutcomeAverage = this.average(thirty.map((outcome) => outcome.actualRevenueLift));
    const weightedTrend = this.round((sevenOutcomeAverage * 0.65) + (thirtyOutcomeAverage * 0.35));
    const baselineForecast = this.resolveBaselineForecast(sorted, weightedTrend);
    const variance = this.resolveVariance(thirty.map((outcome) => outcome.actualRevenueLift), baselineForecast);
    const confidence = this.resolveConfidence(sorted.length, variance);
    const heuristicForecast = this.average(sorted.slice(0, 10).map((outcome) => outcome.forecastRevenueLift));
    const heuristicComparison = this.resolveHeuristicComparison(sorted.length, heuristicForecast, baselineForecast);

    return {
      baselineForecast,
      sevenOutcomeAverage,
      thirtyOutcomeAverage,
      weightedTrend,
      trend: this.resolveTrend(sorted.length, sevenOutcomeAverage, thirtyOutcomeAverage),
      variance,
      confidence,
      heuristicComparison,
      hybridConfidence: this.resolveHybridConfidence(confidence, heuristicComparison),
      sampleSize: sorted.length,
      generatedAt: new Date().toISOString(),
    };
  }

  resolveBaselineForecast(outcomes: OracleExecutionOutcomeRecord[], weightedTrend: number): number {
    if (!outcomes.length) return 0;

    const latestConfidence = outcomes[0]?.actualConfidence || 50;
    return this.round(weightedTrend * (0.85 + (latestConfidence / 500)));
  }

  resolveTrend(sampleSize: number, sevenAverage: number, thirtyAverage: number): OracleStatisticalForecast["trend"] {
    if (sampleSize < 3) return "insufficient_data";
    if (sevenAverage > thirtyAverage + 3) return "up";
    if (sevenAverage < thirtyAverage - 3) return "down";
    return "flat";
  }

  resolveVariance(values: number[], baseline: number): number {
    if (values.length < 2 || baseline === 0) return 0;

    const averageDeviation = this.average(values.map((value) => Math.abs(value - baseline)));
    return this.round(Math.min(1, Math.abs(averageDeviation / Math.max(1, Math.abs(baseline)))));
  }

  resolveConfidence(sampleSize: number, variance: number): number {
    if (sampleSize === 0) return 0;

    const sampleWeight = Math.min(0.82, sampleSize / 30);
    const stabilityWeight = Math.max(0.1, 1 - variance);
    return this.round(Math.min(0.95, sampleWeight * stabilityWeight));
  }

  resolveHeuristicComparison(
    sampleSize: number,
    heuristicForecast: number,
    baselineForecast: number,
  ): OracleStatisticalForecast["heuristicComparison"] {
    if (sampleSize < 3 || baselineForecast === 0) return "insufficient_data";

    const delta = (heuristicForecast - baselineForecast) / Math.max(1, Math.abs(baselineForecast));
    if (delta > 0.18) return "overconfidence_flag";
    if (delta < -0.18) return "missed_opportunity";
    return "aligned";
  }

  resolveHybridConfidence(
    confidence: number,
    comparison: OracleStatisticalForecast["heuristicComparison"],
  ): number {
    if (comparison === "aligned") return this.round(Math.min(0.98, confidence + 0.12));
    if (comparison === "overconfidence_flag") return this.round(Math.max(0, confidence - 0.16));
    if (comparison === "missed_opportunity") return this.round(Math.min(0.92, confidence + 0.05));
    return confidence;
  }

  average(values: number[]): number {
    if (!values.length) return 0;
    return this.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

export const oracleStatisticalForecastEngine = new OracleStatisticalForecastEngine();
