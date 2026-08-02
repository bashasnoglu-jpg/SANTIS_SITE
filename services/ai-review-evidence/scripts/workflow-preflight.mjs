import { appendFile, readFile } from "node:fs/promises";

const EXPECTED_REPOSITORY_ID = "1146035054";
const EXPECTED_OWNER_ID = "241850015";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Input path is required");

  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const eligible =
    input?.schemaVersion === "1.0" &&
    input?.repository?.id === EXPECTED_REPOSITORY_ID &&
    input?.repository?.ownerId === EXPECTED_OWNER_ID &&
    input?.pullRequest?.headRepositoryId === EXPECTED_REPOSITORY_ID &&
    input?.source?.fork === false &&
    typeof input?.diff?.sha256 === "string" &&
    typeof input?.diff?.content === "string";

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `eligible=${eligible}\n`);
  }
  if (!eligible) {
    console.log("Evaluation denied: fork or repository identity mismatch.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
