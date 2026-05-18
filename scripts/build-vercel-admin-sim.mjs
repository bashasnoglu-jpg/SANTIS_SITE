import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const prefix = '\x1b[90m[Sovereign Guard]\x1b[0m';

function log(message) {
  console.log(`${prefix} ${message}`);
}

function fail(message) {
  console.error(`\n\x1b[31mSOVEREIGN GUARD VIOLATION: ${message}\x1b[0m\n`);
  process.exit(1);
}

function success(message) {
  console.log(`\n\x1b[32mRESULT: ${message}\x1b[0m\n`);
}

try {
  log('Checking workspace topology...');

  if (!existsSync('pnpm-workspace.yaml')) {
    fail('pnpm-workspace.yaml missing from repository root');
  }

  log('Resolving admin-panel boundary...');

  if (!existsSync('admin-panel/package.json')) {
    fail('admin-panel/package.json missing');
  }

  log('Validating workspace package graph...');

  execSync('pnpm --filter admin-panel build', {
    stdio: 'inherit'
  });

  success('SOVEREIGN TOPOLOGY CONFIRMED');
} catch (error) {
  fail('Topology Drift Detected');
}
