import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARBITRARY_PATTERNS = [
  { regex: /w-\[[^\]]+\]/g, type: 'spacing' },
  { regex: /h-\[[^\]]+\]/g, type: 'spacing' },
  { regex: /text-\[[^\]]+\]/g, type: 'text-size' },
  { regex: /bg-\[[^\]]+\]/g, type: 'color' },
  { regex: /shadow-\[[^\]]+\]/g, type: 'shadow' },
  { regex: /style=\{/g, type: 'inline-style' }
];
const IGNORE_DIRS = ['node_modules', '.git', '.turbo', 'dist', 'build', '.agents', '.next', 'coverage', '.vercel', '_archive'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.html'];

export interface TailwindViolation {
  file: string;
  line: number;
  match: string;
  type: string;
}

export function runArbitraryTailwindScan(dir: string): TailwindViolation[] {
  const violations: TailwindViolation[] = [];

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
          for (const patternObj of ARBITRARY_PATTERNS) {
            const matches = lineText.match(patternObj.regex);
            if (matches) {
              matches.forEach(match => {
                violations.push({ file: fullPath, line: lineIndex + 1, match, type: patternObj.type });
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

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = runArbitraryTailwindScan(process.cwd());
  console.log("=== P2: ARBITRARY TAILWIND / INLINE STYLE SCAN ===");
  violations.forEach(v => console.log(`[VIOLATION] ${v.file}:${v.line} -> [${v.type}] contains '${v.match}'`));
  console.log(`Total Violations: ${violations.length}`);
}
