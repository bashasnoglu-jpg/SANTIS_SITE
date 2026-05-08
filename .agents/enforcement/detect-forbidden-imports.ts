import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const FORBIDDEN_IMPORTS = ['zustand', 'redux', '@reduxjs', 'prisma', '@prisma/client'];
const IGNORE_DIRS = ['node_modules', '.git', '.turbo', 'dist', 'build', '.agents', '.next', 'coverage', '.vercel', '_archive'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

export function runForbiddenImportsScan(dir: string): { file: string; line: number; match: string }[] {
  const violations: { file: string; line: number; match: string }[] = [];

  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(file)) {
          scan(fullPath);
        }
      } else if (EXTENSIONS.includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((lineText, lineIndex) => {
          for (const forbidden of FORBIDDEN_IMPORTS) {
            const regex = new RegExp(`import\\s+.*\\s+from\\s+['"]${forbidden}.*['"]`, 'g');
            const matches = lineText.match(regex);
            if (matches) {
              matches.forEach(match => {
                violations.push({ file: fullPath, line: lineIndex + 1, match: match.trim() });
              });
            }
          }
        });
      }
    }
  }

  scan(dir);
  return violations;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = runForbiddenImportsScan(process.cwd());
  console.log("=== P0: FORBIDDEN IMPORTS SCAN ===");
  violations.forEach(v => console.log(`[VIOLATION] ${v.file}:${v.line} -> ${v.match}`));
  console.log(`Total Violations: ${violations.length}`);
}
