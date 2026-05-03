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

console.log('🛡️  [Sovereign Guard] Auditing @santis/db contract...');

const REQUIRED_FILES = [
  'src/index.ts',
  'src/schema.ts',
];

for (const rel of REQUIRED_FILES) {
  if (!existsSync(path.join(ROOT, rel))) {
    fail('CONTRACT_FILE_MISSING', {
      file: rel,
      fix: `Ensure ${rel} exists in @santis/db (package.json exports depend on it).`,
    });
  }
}

if (process.exitCode) {
  console.error('\n🚨 [Sovereign Guard] @santis/db contract audit failed.');
  process.exit(process.exitCode);
}

console.log('✅ [Sovereign Guard] @santis/db contract aligned.');
