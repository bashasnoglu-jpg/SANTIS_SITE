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
    const averageRevenueDelta = this.average(outcomes.map((outcome) =>
      outcome.actualRevenueLift - outcome.forecastRevenueLift
    ));
    const averageConfidenceDelta = this.average(outcomes.map((outcome) =>
      outcome.actualConfidence - outcome.forecastConfidence
    ));

    return {
      outcomeCount: outcomes.length,
      averageRevenueDelta,
      averageConfidenceDelta,
      calibrationSignal: this.resolveCalibrationSignal(outcomes.length, averageRevenueDelta, averageConfidenceDelta),
      latestOutcome: outcomes[0] || null,
      outcomes,
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

  resolveCalibrationSignal(
    outcomeCount: number,
    averageRevenueDelta: number,
    averageConfidenceDelta: number,
  ): OracleExecutionOutcomeSummary["calibrationSignal"] {
    if (outcomeCount === 0) return "awaiting_outcomes";
    if (averageRevenueDelta <= -5 || averageConfidenceDelta <= -8) return "over_forecast";
    if (averageRevenueDelta >= 5 || averageConfidenceDelta >= 8) return "under_forecast";
    return "aligned";
  }

  average(values: number[]): number {
    if (!values.length) return 0;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }
}

export const oracleExecutionOutcomeStore = new OracleExecutionOutcomeStore();
