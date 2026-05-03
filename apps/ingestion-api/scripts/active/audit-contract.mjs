import { execSync } from 'child_process';

console.log('[AUDIT_CONTRACT] Starting type check...');

try {
  execSync('tsc --noEmit', { stdio: 'inherit' });
  console.log('[AUDIT_CONTRACT] Success: Contract validated.');
} catch (error) {
  console.error('[AUDIT_CONTRACT] Failure: Contract drift detected.');
  process.exit(1);
}
