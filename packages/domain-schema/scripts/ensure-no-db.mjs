import { readFileSync } from "fs";
import { join } from "path";

const pkgPath = join(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

const forbiddenKeywords = ["drizzle", "postgres", "mysql", "sqlite", "typeorm", "prisma"];

const checkDeps = (deps) => {
  if (!deps) return;
  for (const dep of Object.keys(deps)) {
    if (forbiddenKeywords.some(keyword => dep.includes(keyword))) {
      console.error(`[AUDIT_CONTRACT] ❌ Failure: Forbidden database dependency "${dep}" found in @santis/domain-schema.`);
      console.error(`[AUDIT_CONTRACT] Domain contracts must remain pure and ORM-free.`);
      process.exit(1);
    }
  }
};

checkDeps(pkg.dependencies);
checkDeps(pkg.devDependencies);

console.log("[AUDIT_CONTRACT] ✅ Success: No database dependencies found in domain-schema.");
