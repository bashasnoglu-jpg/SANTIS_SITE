import { runForbiddenImportsScan } from './detect-forbidden-imports.js';
import { runPackageManagerDriftScan } from './detect-package-manager-drift.js';
import { runArbitraryTailwindScan } from './detect-arbitrary-tailwind.js';

console.log("==================================================");
console.log("🛡️  SANTIS OS - PASSIVE GOVERNANCE REPORT");
console.log("==================================================\n");

const cwd = process.cwd();

// P0
console.log("-> Running P0: Forbidden Imports Scan...");
const p0Violations = runForbiddenImportsScan(cwd);

// P1
console.log("-> Running P1: Package Manager Drift Scan...");
const p1Violations = runPackageManagerDriftScan(cwd);

// P2
console.log("-> Running P2: Arbitrary Tailwind / Inline Style Scan...");
const p2Violations = runArbitraryTailwindScan(cwd);

console.log("\n==================================================");
console.log("📊 REPORT SUMMARY");
console.log("==================================================");

if (p0Violations.length === 0 && p1Violations.length === 0 && p2Violations.length === 0) {
  console.log("\n✅  SYSTEM CLEAN. No governance violations detected.");
} else {
  if (p0Violations.length > 0) {
    console.log(`\n❌ P0 (Forbidden Imports) - [CRITICAL]: ${p0Violations.length} violations`);
    p0Violations.forEach(v => console.log(`   - ${v.file}:${v.line} (${v.match})`));
  }

  if (p1Violations.length > 0) {
    console.log(`\n❌ P1 (Package Manager Drift) - [HIGH]: ${p1Violations.length} violations`);
    p1Violations.forEach(v => console.log(`   - ${v}`));
  }

  if (p2Violations.length > 0) {
    console.log(`\n❌ P2 (Arbitrary Tailwind/Inline Styles) - [MEDIUM]: ${p2Violations.length} violations`);
    
    // Grouping logic for P2
    const fileStats = new Map<string, { count: number, dir: string, types: Record<string, number> }>();
    
    p2Violations.forEach(v => {
      // Use relative path for cleaner output
      const relPath = v.file.replace(cwd, '').replace(/^[/\\]/, '');
      if (!fileStats.has(relPath)) {
        // Simple regex to get dir path in cross-platform way
        const dir = relPath.substring(0, relPath.lastIndexOf('/')) || relPath.substring(0, relPath.lastIndexOf('\\')) || '.';
        fileStats.set(relPath, { count: 0, dir, types: {} });
      }
      const stat = fileStats.get(relPath)!;
      stat.count++;
      stat.types[v.type] = (stat.types[v.type] || 0) + 1;
    });

    const sortedFiles = Array.from(fileStats.entries()).sort((a, b) => b[1].count - a[1].count);
    const top10 = sortedFiles.slice(0, 10);
    
    console.log(`\n   --- TOP 10 FILES BY P2 VIOLATION COUNT ---`);
    top10.forEach(([fileName, stat], index) => {
      console.log(`   ${index + 1}. [${stat.dir}] ${fileName.replace(stat.dir, '').replace(/^[/\\]/, '')} (${stat.count} violations)`);
      const typeStr = Object.entries(stat.types).map(([type, count]) => `${count}x ${type}`).join(', ');
      console.log(`      Tokens: ${typeStr}`);
    });

    if (sortedFiles.length > 10) {
      console.log(`   ...and ${sortedFiles.length - 10} more files. (Total violations: ${p2Violations.length})`);
    }
  }
}

console.log("\n⚠️  STATUS: REPORT ONLY. No CI blocking, no auto-deletion, no auto-refactoring.");
// Always return 0 to prevent CI blocking in Passive Phase
process.exit(0);
