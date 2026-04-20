import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import path from "node:path";

import { RitualRegistry } from "./ritual-registry.ts";

const STORAGE_DIR = path.resolve(process.cwd(), "storage");
const OVERRIDE_PATH = path.join(STORAGE_DIR, "price_overrides.jsonl");
const DEFAULT_TENANT_ID = "tn_santis_club";

export interface ApplyPriceOverrideInput {
  ritualId: string;
  multiplier: number;
  tenantId?: string | null;
  source?: string | null;
  origin?: string | null;
  correlationId?: string | null;
}

export interface PriceOverrideEntry {
  ritualId: string;
  canonicalRitualId: string;
  requestedRitualId: string;
  affectedRitualIds: string[];
  ritualTitle: string;
  ritualCategory: string;
  multiplier: number;
  previousPrice: number;
  effectivePrice: number;
  currency: "EUR";
  tenantId: string;
  source: string;
  origin: string;
  correlationId?: string;
  timestamp: number;
}

const roundCurrency = (value: number) => Number(value.toFixed(2));

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toFiniteMultiplier = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Number(value.toFixed(3));
};

const parseLedgerLine = (line: string): PriceOverrideEntry | null => {
  try {
    const parsed = JSON.parse(line) as Partial<PriceOverrideEntry>;

    if (
      typeof parsed?.canonicalRitualId !== "string" ||
      typeof parsed?.multiplier !== "number" ||
      typeof parsed?.effectivePrice !== "number" ||
      typeof parsed?.timestamp !== "number"
    ) {
      return null;
    }

    return parsed as PriceOverrideEntry;
  } catch {
    return null;
  }
};

export const PriceController = {
  activeOverrides: new Map<string, PriceOverrideEntry>(),
  initialized: false,

  init(): void {
    if (this.initialized) {
      return;
    }

    mkdirSync(STORAGE_DIR, { recursive: true });

    if (existsSync(OVERRIDE_PATH)) {
      const lines = readFileSync(OVERRIDE_PATH, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        const entry = parseLedgerLine(line);
        if (!entry) {
          continue;
        }

        this.activeOverrides.set(entry.canonicalRitualId, entry);
      }
    }

    this.initialized = true;
  },

  getLedgerPath(): string {
    return OVERRIDE_PATH;
  },

  getActiveOverride(ritualId: string): PriceOverrideEntry | null {
    this.init();

    const canonicalId = RitualRegistry.normalizeRitualId(ritualId);
    if (!canonicalId) {
      return null;
    }

    return this.activeOverrides.get(canonicalId) ?? null;
  },

  getEffectivePrice(ritualId: string): number | null {
    this.init();

    const identity = RitualRegistry.getIdentity(ritualId);
    if (!identity) {
      return null;
    }

    const active = this.activeOverrides.get(identity.canonicalId);
    const multiplier = active?.multiplier ?? 1;
    return roundCurrency(identity.ritual.price * multiplier);
  },

  applyOverride(input: ApplyPriceOverrideInput): PriceOverrideEntry {
    this.init();

    const multiplier = toFiniteMultiplier(input.multiplier);
    if (multiplier == null) {
      throw new Error("INVALID_MULTIPLIER");
    }

    const identity = RitualRegistry.getIdentity(input.ritualId);
    if (!identity) {
      throw new Error(`UNKNOWN_RITUAL:${input.ritualId}`);
    }

    const currentOverride = this.activeOverrides.get(identity.canonicalId);
    const previousPrice = currentOverride?.effectivePrice ?? identity.ritual.price;
    const effectivePrice = roundCurrency(identity.ritual.price * multiplier);
    const entry: PriceOverrideEntry = {
      ritualId: identity.canonicalId,
      canonicalRitualId: identity.canonicalId,
      requestedRitualId: identity.requestedId,
      affectedRitualIds: identity.aliases,
      ritualTitle: identity.ritual.title,
      ritualCategory: identity.ritual.cat,
      multiplier,
      previousPrice,
      effectivePrice,
      currency: "EUR",
      tenantId: toOptionalString(input.tenantId) ?? DEFAULT_TENANT_ID,
      source: toOptionalString(input.source) ?? "boardroom.oracle",
      origin: toOptionalString(input.origin) ?? "NODE_ORCHESTRATOR",
      correlationId: toOptionalString(input.correlationId),
      timestamp: Date.now(),
    };

    appendFileSync(OVERRIDE_PATH, JSON.stringify(entry) + "\n", "utf8");
    this.activeOverrides.set(identity.canonicalId, entry);

    return entry;
  },
};
