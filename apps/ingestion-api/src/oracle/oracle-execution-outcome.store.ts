import { appendFile, mkdir } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import * as readline from "readline";
import * as path from "path";
import crypto from "crypto";
import {
  OracleExecutionOutcome,
  OracleExecutionOutcomeRecord,
  OracleExecutionOutcomeRecordSchema,
  OracleExecutionOutcomeSummary,
} from "./oracle-execution-outcome.contract.js";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "oracle-execution-outcomes.jsonl");

export class OracleExecutionOutcomeStore {
  async append(outcome: OracleExecutionOutcome): Promise<OracleExecutionOutcomeRecord> {
    if (!existsSync(STORE_DIR)) {
      await mkdir(STORE_DIR, { recursive: true });
    }

    const record: OracleExecutionOutcomeRecord = {
      ...outcome,
      outcomeId: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
    };

    await appendFile(STORE_FILE, `${JSON.stringify(record)}\n`, "utf-8");
    return record;
  }

  async summarize(limit: number = 50): Promise<OracleExecutionOutcomeSummary> {
    const outcomes = await this.replay(limit);

    const averageRevenueDelta = this.average(outcomes.map((o) =>
      o.actualRevenueLift - o.forecastRevenueLift
    ));

    const averageConfidenceDelta = this.average(outcomes.map((o) =>
      o.actualConfidence - o.forecastConfidence
    ));

    const economicAccuracy = this.scoreAccuracy(averageRevenueDelta);
    const confidenceAccuracy = this.scoreAccuracy(averageConfidenceDelta);

    const intelligenceScore = Math.round((economicAccuracy * 0.6) + (confidenceAccuracy * 0.4));

    const advisoryCalibration = this.computeAdvisory(intelligenceScore, averageRevenueDelta, averageConfidenceDelta, outcomes.length);

    return {
      outcomeCount: outcomes.length,
      averageRevenueDelta,
      averageConfidenceDelta,
      calibrationSignal: this.resolveCalibrationSignal(outcomes.length, averageRevenueDelta, averageConfidenceDelta),
      boardroomIntelligence: {
        intelligenceScore,
        economicAccuracy,
        confidenceAccuracy,
        decisionQuality: this.resolveDecisionQuality(intelligenceScore, outcomes.length),
        sampleSize: outcomes.length,
        advisoryCalibration,
      },
      latestOutcome: outcomes[0] || null,
      outcomes,
    };
  }

  computeAdvisory(score: number, revenueDelta: number, confidenceDelta: number, sample: number) {
    if (sample < 5) {
      return {
        mode: "collect_more_data",
        recommendedAdjustment: 0,
        requiresHumanApproval: true,
        rationale: "Insufficient sample size for calibration",
      };
    }

    if (score < 50) {
      return {
        mode: "reduce_confidence",
        recommendedAdjustment: -10,
        requiresHumanApproval: true,
        rationale: "System is overestimating outcomes",
      };
    }

    if (score > 85) {
      return {
        mode: "increase_confidence",
        recommendedAdjustment: +5,
        requiresHumanApproval: true,
        rationale: "System is underestimating outcomes",
      };
    }

    return {
      mode: "hold_thresholds",
      recommendedAdjustment: 0,
      requiresHumanApproval: true,
      rationale: "System is calibrated within acceptable range",
    };
  }

  async replay(limit: number = 50): Promise<OracleExecutionOutcomeRecord[]> {
    if (!existsSync(STORE_FILE)) {
      return [];
    }

    const records: OracleExecutionOutcomeRecord[] = [];
    const fileStream = createReadStream(STORE_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (line.trim() === "") continue;

      try {
        records.push(OracleExecutionOutcomeRecordSchema.parse(JSON.parse(line)));
      } catch (error) {
        console.warn("[Oracle Execution Outcome] Skipping invalid outcome record.", error);
      }
    }

    return records
      .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
      .slice(0, limit);
  }

  resolveCalibrationSignal(count: number, revenueDelta: number, confidenceDelta: number) {
    if (count === 0) return "awaiting_outcomes";
    if (revenueDelta <= -5 || confidenceDelta <= -8) return "over_forecast";
    if (revenueDelta >= 5 || confidenceDelta >= 8) return "under_forecast";
    return "aligned";
  }

  resolveDecisionQuality(score: number, sample: number) {
    if (sample === 0) return "awaiting_data";
    if (score < 40) return "critical";
    if (score < 60) return "watch";
    if (score < 80) return "stable";
    return "excellent";
  }

  scoreAccuracy(delta: number) {
    const abs = Math.abs(delta);
    if (abs >= 20) return 0;
    if (abs >= 15) return 20;
    if (abs >= 10) return 40;
    if (abs >= 5) return 60;
    if (abs >= 2) return 80;
    return 100;
  }

  average(values: number[]): number {
    if (!values.length) return 0;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }
}

export const oracleExecutionOutcomeStore = new OracleExecutionOutcomeStore();
