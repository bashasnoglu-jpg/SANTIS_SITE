import { RITUAL_DATA } from "../../assets/js/data/sovereign-rituals.js";

export interface RitualRecord {
  id: string;
  cat: string;
  title: string;
  meta?: string;
  price: number;
  img?: string;
}

type RitualCatalog = {
  massage?: RitualRecord[];
  skincare?: RitualRecord[];
};

const ritualCatalog = RITUAL_DATA as RitualCatalog;
const allRituals: RitualRecord[] = [
  ...(Array.isArray(ritualCatalog.massage) ? ritualCatalog.massage : []),
  ...(Array.isArray(ritualCatalog.skincare) ? ritualCatalog.skincare : []),
];

const ritualById = new Map<string, RitualRecord>(
  allRituals.map((ritual) => [ritual.id, ritual])
);

const aliasToCanonical = new Map<string, string>([
  // Marketing highlight and full catalog entry refer to the same ritual.
  ["bali-highlight", "geleneksel-bali"],
]);

const canonicalToAliases = new Map<string, Set<string>>();

for (const ritual of allRituals) {
  const canonicalId = aliasToCanonical.get(ritual.id) ?? ritual.id;
  const aliases = canonicalToAliases.get(canonicalId) ?? new Set<string>();

  aliases.add(canonicalId);
  aliases.add(ritual.id);

  canonicalToAliases.set(canonicalId, aliases);
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

function resolveCanonicalId(ritualId: unknown): string | null {
  const requestedId = toOptionalString(ritualId);
  if (!requestedId) {
    return null;
  }

  const mappedId = aliasToCanonical.get(requestedId) ?? requestedId;
  return ritualById.has(mappedId) ? mappedId : null;
}

export interface RitualIdentity {
  requestedId: string;
  canonicalId: string;
  ritual: RitualRecord;
  aliases: string[];
}

export const RitualRegistry = {
  canonicalize(ritualId: unknown): string | null {
    return resolveCanonicalId(ritualId);
  },

  normalizeRitualId(ritualId: unknown): string | null {
    return resolveCanonicalId(ritualId);
  },

  findRitual(ritualId: unknown): RitualRecord | null {
    const canonicalId = resolveCanonicalId(ritualId);
    if (!canonicalId) {
      return null;
    }

    return ritualById.get(canonicalId) ?? null;
  },

  getIdentity(ritualId: unknown): RitualIdentity | null {
    const requestedId = toOptionalString(ritualId);
    const canonicalId = resolveCanonicalId(ritualId);

    if (!requestedId || !canonicalId) {
      return null;
    }

    const ritual = ritualById.get(canonicalId);
    if (!ritual) {
      return null;
    }

    return {
      requestedId,
      canonicalId,
      ritual,
      aliases: this.listAliases(canonicalId),
    };
  },

  listAliases(ritualId: unknown): string[] {
    const canonicalId = resolveCanonicalId(ritualId);
    if (!canonicalId) {
      return [];
    }

    return [...(canonicalToAliases.get(canonicalId) ?? new Set([canonicalId]))];
  },

  has(ritualId: unknown): boolean {
    return resolveCanonicalId(ritualId) != null;
  },
};
