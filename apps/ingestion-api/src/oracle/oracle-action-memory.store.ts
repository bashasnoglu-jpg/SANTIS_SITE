import { appendFile, mkdir } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import * as readline from "readline";
import * as path from "path";
import crypto from "crypto";
import {
  OracleActionDecision,
  OracleActionMemoryRecord,
  OracleActionMemoryRecordSchema,
} from "./oracle-action-memory.contract.js";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "oracle-action-memory.jsonl");

export class OracleActionMemoryStore {
  async append(decision: OracleActionDecision): Promise<OracleActionMemoryRecord> {
    if (!existsSync(STORE_DIR)) {
      await mkdir(STORE_DIR, { recursive: true });
    }

    const record: OracleActionMemoryRecord = {
      ...decision,
      eventId: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
    };

    await appendFile(STORE_FILE, `${JSON.stringify(record)}\n`, "utf-8");
    return record;
  }

  async replay(limit: number = 100): Promise<OracleActionMemoryRecord[]> {
    if (!existsSync(STORE_FILE)) {
      return [];
    }

    const recordsByAction = new Map<string, OracleActionMemoryRecord>();
    const fileStream = createReadStream(STORE_FILE);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (line.trim() === "") continue;

      try {
        const parsed = OracleActionMemoryRecordSchema.parse(JSON.parse(line));
        recordsByAction.set(parsed.actionId, parsed);
      } catch (error) {
        console.warn("[Oracle Action Memory] Skipping invalid memory record.", error);
      }
    }

    return Array.from(recordsByAction.values())
      .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))
      .slice(0, limit);
  }
}

export const oracleActionMemoryStore = new OracleActionMemoryStore();
