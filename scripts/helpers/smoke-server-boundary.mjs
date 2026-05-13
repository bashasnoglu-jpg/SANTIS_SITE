import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../..');

export function repoRoot() {
  return REPO_ROOT;
}

export function pathExists(relativePath) {
  return existsSync(join(REPO_ROOT, relativePath));
}

/**
 * Checks if the private server infrastructure is available.
 * @param {string[]} requiredPaths Paths relative to repo root.
 * @param {string} context Descriptive name of the calling script.
 * @returns {boolean}
 */
export function isPrivateServerAvailable(requiredPaths = ['server'], context = 'Unknown Context') {
  const missing = requiredPaths.filter(p => !pathExists(p));
  
  if (missing.length > 0) {
    console.warn(`[SKIPPED_PRIVATE_OS_DEPENDENCY] ${context}: The following required paths are missing: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Utility for smoke scripts to either execute a callback with the server components 
 * or gracefully exit if they are missing.
 * @param {Object} options
 * @param {string} options.context
 * @param {string[]} options.requiredPaths
 * @param {Function} options.run Callback returning a promise.
 */
export async function runWithPrivateServerBoundary({ context, requiredPaths = ['server'], run }) {
  if (!isPrivateServerAvailable(requiredPaths, context)) {
    console.log(`[D2-B2] ${context}: Private infrastructure not detected. Skipping server-dependent validations.`);
    process.exit(0);
  }

  try {
    await run();
  } catch (error) {
    console.error(`[D2-B2] ${context}: Execution failed during server-dependent validation.`);
    console.error(error);
    process.exit(1);
  }
}
