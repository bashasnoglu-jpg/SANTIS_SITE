#!/usr/bin/env node

import { execSync } from 'node:child_process';

console.log('🛡️  [Sovereign Guard] Auditing workspace scripts...');

const data = JSON.parse(execSync('pnpm list -r --json').toString());

for (const pkg of data) {
  const scripts = pkg.scripts || {};
  for (const name of Object.keys(scripts)) {
    const allowed = name.startsWith('santis:') || name.startsWith('audit:') || ['dev','build','start','test','lint','typecheck'].includes(name);
    if (!allowed) {
      console.error(`❌ Script violation in ${pkg.name}: ${name}`);
      process.exit(1);
    }
  }
}

console.log('✅ Workspace script contract valid.');
