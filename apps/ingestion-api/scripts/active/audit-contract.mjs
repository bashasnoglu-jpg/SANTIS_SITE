#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function fail(invariant, details) {
  console.error(`\n❌ [Sovereign Guard] ${invariant}`);
  for (const [key, value] of Object.entries(details)) {
    console.error(`   ${key}: ${value}`);
  }
  process.exitCode = 1;
}

console.log('🛡️  [Sovereign Guard] Auditing @santis/ingestion-api contract...');

const REQUIRED_FILES = [
  'src/index.ts',
  'src/routes/ingress.ts',
  'src/routes/sse-streams.ts',
  'src/routes/core-state-stream.ts',
  'src/security/crypto-token.ts',
  'tsconfig.json',
];

for (const rel of REQUIRED_FILES) {
  if (!existsSync(path.join(ROOT, rel))) {
    fail('CONTRACT_FILE_MISSING', {
      file: rel,
      fix: `Ensure ${rel} exists in @santis/ingestion-api.`,
    });
  }
}

if (process.exitCode) {
  console.error('\n🚨 [Sovereign Guard] ingestion-api contract audit failed.');
  process.exit(process.exitCode);
}

console.log('✅ [Sovereign Guard] @santis/ingestion-api contract aligned.');
