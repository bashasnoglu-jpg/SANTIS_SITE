#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const PACKAGE_PATH = path.join(ROOT_DIR, 'package.json');
const FOREIGN_LOCKFILES = ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock'];

function fail(invariant, details) {
  console.error(`\n❌ [Sovereign Guard] ${invariant}`);
  for (const [key, value] of Object.entries(details)) {
    console.error(`   ${key}: ${value}`);
  }
  process.exitCode = 1;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail('PACKAGE_JSON_UNREADABLE', {
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
      fix: 'Ensure package.json is valid JSON.'
    });
    return null;
  }
}

function parseMajor(versionLike) {
  const match = String(versionLike).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getPnpmVersion() {
  try {
    return execFileSync('pnpm', ['--version'], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

console.log('🛡️  [Sovereign Guard] Auditing execution environment...');

const pkg = readJson(PACKAGE_PATH);

if (pkg) {
  const expectedNode = pkg.engines?.node ?? '>=20.0.0';
  const expectedPnpm = pkg.engines?.pnpm ?? '>=9.0.0';
  const packageManager = pkg.packageManager ?? '';

  const expectedNodeMajor = parseMajor(expectedNode);
  const actualNodeMajor = parseMajor(process.versions.node);

  if (expectedNodeMajor !== null && actualNodeMajor !== expectedNodeMajor) {
    fail('NODE_VERSION_DRIFT', {
      expected: expectedNode,
      actual: process.version,
      fix: `Use Node ${expectedNodeMajor}.x before running Santis OS.`
    });
  }

  const pnpmVersion = getPnpmVersion();
  const expectedPnpmMajor = parseMajor(expectedPnpm);
  const actualPnpmMajor = pnpmVersion ? parseMajor(pnpmVersion) : null;

  if (!pnpmVersion) {
    fail('PNPM_UNAVAILABLE', {
      expected: expectedPnpm,
      actual: 'pnpm command not found',
      fix: 'Run corepack enable, then retry.'
    });
  } else if (expectedPnpmMajor !== null && actualPnpmMajor !== expectedPnpmMajor) {
    fail('PNPM_VERSION_DRIFT', {
      expected: expectedPnpm,
      actual: pnpmVersion,
      fix: `Use pnpm ${expectedPnpmMajor}.x via Corepack.`
    });
  }

  if (!packageManager.startsWith('pnpm@')) {
    fail('PACKAGE_MANAGER_DRIFT', {
      expected: 'packageManager must start with pnpm@',
      actual: packageManager || '(missing)',
      fix: 'Set packageManager to the pinned pnpm version.'
    });
  }
}

for (const lockfile of FOREIGN_LOCKFILES) {
  const lockfilePath = path.join(ROOT_DIR, lockfile);
  if (existsSync(lockfilePath)) {
    fail('FOREIGN_LOCKFILE_DETECTED', {
      path: lockfile,
      expected: 'Only pnpm-lock.yaml is allowed.',
      fix: `Remove ${lockfile} and regenerate dependencies with pnpm only.`
    });
  }
}

if (!existsSync(path.join(ROOT_DIR, 'pnpm-lock.yaml'))) {
  fail('PNPM_LOCKFILE_MISSING', {
    path: 'pnpm-lock.yaml',
    expected: 'A committed pnpm lockfile is required for frozen installs.',
    fix: 'Run pnpm install and commit pnpm-lock.yaml.'
  });
}

if (process.exitCode) {
  console.error('\n🚨 [Sovereign Guard] Environment audit failed.');
  process.exit(process.exitCode);
}

console.log('✅ [Sovereign Guard] Environment aligned.');
