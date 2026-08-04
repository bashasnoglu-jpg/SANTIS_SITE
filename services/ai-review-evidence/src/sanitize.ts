const SECRET_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  {
    label: "private-key",
    pattern:
      /-----BEGIN ([A-Z ]*PRIVATE KEY)-----[\s\S]*?-----END \1-----/g
  },
  { label: "github-token", pattern: /\bgh[opsu]_[A-Za-z0-9_]{20,}\b/g },
  { label: "google-api-key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { label: "airtable-token", pattern: /\bpat[A-Za-z0-9]{14}\.[A-Za-z0-9]{32,}\b/g },
  { label: "aws-access-key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { label: "stripe-key", pattern: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  {
    label: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g
  },
  {
    label: "generic-secret",
    pattern: /\b(password|secret|token|api[_-]?key)\s*[:=]\s*(?!\[REDACTED:)[^\s,;]+/gi
  },
  { label: "bearer-token", pattern: /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi }
];

const FORBIDDEN_PATH_PARTS = [
  ".env",
  ".git/",
  "node_modules/",
  "credentials",
  "secrets/",
  "private/",
  "backups/",
  "exports/",
  ".pem",
  ".p12",
  ".pfx",
  ".key"
] as const;

export function isForbiddenPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  return FORBIDDEN_PATH_PARTS.some((part) => normalized.includes(part));
}

export function redactSecrets(input: string): { content: string; redactions: number } {
  let content = input;
  let redactions = 0;

  for (const { label, pattern } of SECRET_PATTERNS) {
    content = content.replace(pattern, () => {
      redactions += 1;
      return `[REDACTED:${label}]`;
    });
  }

  return { content, redactions };
}

export function assertSanitizedDiff(content: string): void {
  for (const { label, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      pattern.lastIndex = 0;
      throw new Error(`Unsanitized diff rejected: ${label}`);
    }
    pattern.lastIndex = 0;
  }
}
