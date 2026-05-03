#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

console.log('[SANTIS_AUDIT] Running contract enforcement for decision-kernel...');

const result = spawnSync('npx', ['tsc', '--noEmit'], {
  stdio: 'inherit',
  shell: true,
  cwd: resolve(process.cwd())
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
