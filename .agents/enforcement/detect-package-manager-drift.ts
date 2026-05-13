import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const FORBIDDEN_FILES = ['package-lock.json', 'yarn.lock'];
const IGNORE_DIRS = ['node_modules', '.git', '.turbo', 'dist', 'build', '.agents', '.next', 'coverage', '.vercel', '_archive'];

export function runPackageManagerDriftScan(dir: string): string[] {
  const violations: string[] = [];

  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(file)) {
          scan(fullPath);
        }
      } else if (FORBIDDEN_FILES.includes(file)) {
        violations.push(fullPath);
      }
    }
  }

  scan(dir);
  return violations;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = runPackageManagerDriftScan(process.cwd());
  console.log("=== P1: PACKAGE MANAGER DRIFT SCAN ===");
  violations.forEach(v => console.log(`[VIOLATION] Rogue lock file found: ${v}`));
  console.log(`Total Violations: ${violations.length}`);
}
