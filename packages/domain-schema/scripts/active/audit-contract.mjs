#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
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

console.log('🛡️  [Sovereign Guard] Auditing @santis/domain-schema contract...');

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const exports_ = pkg.exports ?? {};

for (const [key, target] of Object.entries(exports_)) {
  const filePath = path.join(ROOT, target);
  if (!existsSync(filePath)) {
    fail('EXPORT_TARGET_MISSING', {
      export: key,
      target,
      fix: `Create ${target} or remove the export entry from package.json.`,
    });
  }
}

if (process.exitCode) {
  console.error('\n🚨 [Sovereign Guard] @santis/domain-schema contract audit failed.');
  process.exit(process.exitCode);
}

console.log('✅ [Sovereign Guard] @santis/domain-schema contract aligned.');
