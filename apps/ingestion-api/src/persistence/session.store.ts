import { createHash } from "node:crypto";
import net from "node:net";
import tls from "node:tls";

import type { AdminSessionRecordV1, RevocationReason } from "@santis/session-contracts";

export interface AdminPolicyRecord {
  tenant_scope: string[];
  location_scope: string[];
  capability_set: string[];
}

export interface SessionStore {
  getAdminPolicy(subjectId: string): Promise<AdminPolicyRecord | null>;
  getSessionByReference(rawSessionToken: string): Promise<unknown | null>;
  saveSession(record: AdminSessionRecordV1, ttlSeconds: number): Promise<void>;
  revokeSession(
    rawSessionToken: string,
    reason: RevocationReason,
    now?: Date,
  ): Promise<AdminSessionRecordV1 | null>;
}

const POLICY_KEYS = new Set(["tenant_scope", "location_scope", "capability_set"]);
const CAPABILITY_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;
const OPAQUE_SESSION_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const REDIS_COMMAND_TIMEOUT_MS = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueStringArray(
  value: unknown,
  options: { minItems?: number; capability?: boolean } = {},
): value is string[] {
  const minItems = options.minItems ?? 0;
  if (!Array.isArray(value) || value.length < minItems) return false;
  if (!value.every((item) => typeof item === "string" && item.length > 0 && item.length <= 128)) {
    return false;
  }
  if (new Set(value).size !== value.length || value.includes("*")) return false;
  if (options.capability) {
    return value.every(
      (item) =>
        item !== "ALL" &&
        item !== "ADMIN_ALL" &&
        item.length <= 64 &&
        CAPABILITY_PATTERN.test(item),
    );
  }
  return true;
}

export function parseAdminPolicyRecord(value: unknown): AdminPolicyRecord | null {
  if (!isRecord(value)) return null;
  if (!Object.keys(value).every((key) => POLICY_KEYS.has(key))) return null;
  if (!isUniqueStringArray(value.tenant_scope, { minItems: 1 })) return null;
  if (!isUniqueStringArray(value.location_scope)) return null;
  if (!isUniqueStringArray(value.capability_set, { minItems: 1, capability: true })) return null;
  return {
    tenant_scope: [...value.tenant_scope],
    location_scope: [...value.location_scope],
    capability_set: [...value.capability_set],
  };
}

export function hashSessionToken(rawSessionToken: string): `sha256:${string}` {
  if (!OPAQUE_SESSION_PATTERN.test(rawSessionToken)) {
    throw new Error("ERR_INVALID_SESSION_REFERENCE");
  }
  return `sha256:${createHash("sha256").update(rawSessionToken, "utf8").digest("hex")}`;
}

interface ParsedResp {
  value: string | number | null;
  nextOffset: number;
}

function readLine(buffer: Buffer, offset: number): { line: string; nextOffset: number } | null {
  const end = buffer.indexOf("\r\n", offset, "utf8");
  if (end === -1) return null;
  return { line: buffer.subarray(offset, end).toString("utf8"), nextOffset: end + 2 };
}

function parseRespValue(buffer: Buffer, offset: number): ParsedResp | null {
  if (offset >= buffer.length) return null;
  const type = String.fromCharCode(buffer[offset]!);
  const header = readLine(buffer, offset + 1);
  if (!header) return null;

  if (type === "+") return { value: header.line, nextOffset: header.nextOffset };
  if (type === ":") {
    const value = Number.parseInt(header.line, 10);
    if (!Number.isFinite(value)) throw new Error("ERR_REDIS_PROTOCOL");
    return { value, nextOffset: header.nextOffset };
  }
  if (type === "-") throw new Error("ERR_REDIS_COMMAND");
  if (type === "$") {
    const length = Number.parseInt(header.line, 10);
    if (length === -1) return { value: null, nextOffset: header.nextOffset };
    if (!Number.isInteger(length) || length < 0) throw new Error("ERR_REDIS_PROTOCOL");
    const end = header.nextOffset + length;
    if (buffer.length < end + 2) return null;
    if (buffer[end] !== 13 || buffer[end + 1] !== 10) throw new Error("ERR_REDIS_PROTOCOL");
    return {
      value: buffer.subarray(header.nextOffset, end).toString("utf8"),
      nextOffset: end + 2,
    };
  }

  throw new Error("ERR_REDIS_PROTOCOL");
}

function encodeRedisCommand(args: readonly string[]): Buffer {
  const chunks = [`*${args.length}\r\n`];
  for (const arg of args) {
    const bytes = Buffer.byteLength(arg, "utf8");
    chunks.push(`$${bytes}\r\n${arg}\r\n`);
  }
  return Buffer.from(chunks.join(""), "utf8");
}

interface RedisConnectionConfig {
  secure: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
  database: number;
}

function parseRedisUrl(redisUrl: string): RedisConnectionConfig {
  let url: URL;
  try {
    url = new URL(redisUrl);
  } catch {
    throw new Error("ERR_INVALID_REDIS_URL");
  }
  if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
    throw new Error("ERR_INVALID_REDIS_URL");
  }
  if (!url.hostname) throw new Error("ERR_INVALID_REDIS_URL");

  const databaseText = url.pathname.replace(/^\//, "") || "0";
  const database = Number.parseInt(databaseText, 10);
  if (!Number.isInteger(database) || database < 0) throw new Error("ERR_INVALID_REDIS_URL");

  const username = url.username ? decodeURIComponent(url.username) : undefined;
  const password = url.password ? decodeURIComponent(url.password) : undefined;
  return {
    secure: url.protocol === "rediss:",
    host: url.hostname,
    port: Number(url.port || (url.protocol === "rediss:" ? 6380 : 6379)),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    database,
  };
}

export class RedisSessionStore implements SessionStore {
  readonly #config: RedisConnectionConfig;

  constructor(redisUrl: string) {
    if (!redisUrl) throw new Error("ERR_MISSING_REDIS_URL");
    this.#config = parseRedisUrl(redisUrl);
  }

  async #command(args: readonly string[]): Promise<string | number | null> {
    const commands: string[][] = [];
    if (this.#config.password) {
      commands.push(
        this.#config.username
          ? ["AUTH", this.#config.username, this.#config.password]
          : ["AUTH", this.#config.password],
      );
    }
    if (this.#config.database !== 0) commands.push(["SELECT", String(this.#config.database)]);
    commands.push([...args]);

    return await new Promise((resolve, reject) => {
      let settled = false;
      let buffer = Buffer.alloc(0);
      let parsedReplies = 0;
      let offset = 0;
      let finalValue: string | number | null = null;

      const socket = this.#config.secure
        ? tls.connect({
            host: this.#config.host,
            port: this.#config.port,
            servername: this.#config.host,
          })
        : net.createConnection({ host: this.#config.host, port: this.#config.port });

      const finish = (error?: Error): void => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (error) reject(error);
        else resolve(finalValue);
      };

      const timer = setTimeout(() => finish(new Error("ERR_REDIS_TIMEOUT")), REDIS_COMMAND_TIMEOUT_MS);
      timer.unref();

      const onConnected = (): void => {
        for (const command of commands) socket.write(encodeRedisCommand(command));
      };
      if (this.#config.secure) socket.once("secureConnect", onConnected);
      else socket.once("connect", onConnected);

      socket.on("data", (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        try {
          while (parsedReplies < commands.length) {
            const parsed = parseRespValue(buffer, offset);
            if (!parsed) break;
            parsedReplies += 1;
            offset = parsed.nextOffset;
            finalValue = parsed.value;
          }
          if (parsedReplies === commands.length) {
            clearTimeout(timer);
            finish();
          }
        } catch (error) {
          clearTimeout(timer);
          finish(error instanceof Error ? error : new Error("ERR_REDIS_PROTOCOL"));
        }
      });
      socket.once("error", (error) => {
        clearTimeout(timer);
        finish(new Error("ERR_REDIS_UNAVAILABLE", { cause: error }));
      });
      socket.once("end", () => {
        if (!settled) {
          clearTimeout(timer);
          finish(new Error("ERR_REDIS_CONNECTION_CLOSED"));
        }
      });
    });
  }

  async getAdminPolicy(subjectId: string): Promise<AdminPolicyRecord | null> {
    if (!subjectId || subjectId.length > 128) return null;
    const raw = await this.#command(["GET", `admin-policy:${subjectId}`]);
    if (raw === null) return null;
    if (typeof raw !== "string") throw new Error("ERR_REDIS_PROTOCOL");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
    return parseAdminPolicyRecord(parsed);
  }

  async getSessionByReference(rawSessionToken: string): Promise<unknown | null> {
    const hash = hashSessionToken(rawSessionToken);
    const raw = await this.#command(["GET", `admin-session:${hash}`]);
    if (raw === null) return null;
    if (typeof raw !== "string") throw new Error("ERR_REDIS_PROTOCOL");
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  async saveSession(record: AdminSessionRecordV1, ttlSeconds: number): Promise<void> {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) throw new Error("ERR_INVALID_SESSION_TTL");
    const result = await this.#command([
      "SET",
      `admin-session:${record.session_id_hash}`,
      JSON.stringify(record),
      "EX",
      String(ttlSeconds),
    ]);
    if (result !== "OK") throw new Error("ERR_REDIS_WRITE_FAILED");
  }

  async revokeSession(
    rawSessionToken: string,
    reason: RevocationReason,
    now = new Date(),
  ): Promise<AdminSessionRecordV1 | null> {
    const candidate = await this.getSessionByReference(rawSessionToken);
    if (!isRecord(candidate)) return null;
    const absoluteExpiresAt = typeof candidate.absolute_expires_at === "string"
      ? Date.parse(candidate.absolute_expires_at)
      : Number.NaN;
    if (!Number.isFinite(absoluteExpiresAt)) return null;

    const revoked = {
      ...candidate,
      session_state: "REVOKED",
      revocation_state: "REVOKED",
      revoked_at: now.toISOString(),
      revocation_reason: reason,
    } as unknown as AdminSessionRecordV1;

    const ttlSeconds = Math.max(1, Math.ceil((absoluteExpiresAt - now.getTime()) / 1_000));
    await this.saveSession(revoked, ttlSeconds);
    return revoked;
  }
}
