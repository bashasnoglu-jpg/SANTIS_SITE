import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * SANTIS_SITE — Centralized Contract Guard
 * Validates the TypeScript contract for the current package.
 */

const pkgDir = process.cwd();
const hasTsConfig = existsSync(join(pkgDir, 'tsconfig.json'));

if (!hasTsConfig) {
  console.log(`[AUDIT_CONTRACT] Skipping ${pkgDir} (No tsconfig.json found)`);
  process.exit(0);
}

console.log(`[AUDIT_CONTRACT] Validating contract for: ${pkgDir}`);

try {
  execSync('pnpm exec tsc --noEmit', { stdio: 'inherit' });
  console.log('[AUDIT_CONTRACT] ✅ Success: Contract validated.');
} catch (error) {
  console.error('[AUDIT_CONTRACT] ❌ Failure: Contract drift detected.');
  process.exit(1);
}
