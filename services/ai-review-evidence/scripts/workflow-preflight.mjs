import { createHash } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Input path is required");

  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const expectedRepositoryId = requiredEnvironment("EXPECTED_REPOSITORY_ID");
  const expectedOwnerId = requiredEnvironment("EXPECTED_OWNER_ID");
  const expectedWorkflowRunId = requiredEnvironment("EXPECTED_WORKFLOW_RUN_ID");
  const expectedPullRequestNumber = Number(requiredEnvironment("EXPECTED_PULL_REQUEST_NUMBER"));
  const expectedBaseSha = requiredEnvironment("EXPECTED_BASE_SHA");
  const expectedHeadSha = requiredEnvironment("EXPECTED_HEAD_SHA");
  const content = input?.diff?.content;
  const digest = typeof content === "string"
    ? createHash("sha256").update(content).digest("hex")
    : "";
  const eligible =
    input?.schemaVersion === "1.0" &&
    input?.repository?.id === expectedRepositoryId &&
    input?.repository?.ownerId === expectedOwnerId &&
    input?.pullRequest?.number === expectedPullRequestNumber &&
    input?.pullRequest?.baseSha === expectedBaseSha &&
    input?.pullRequest?.headSha === expectedHeadSha &&
    input?.pullRequest?.headRepositoryId === expectedRepositoryId &&
    input?.source?.eventName === "pull_request" &&
    input?.source?.workflowRunId === expectedWorkflowRunId &&
    input?.source?.fork === false &&
    input?.preparation?.truncated === false &&
    Number.isInteger(input?.preparation?.includedFileCount) &&
    input.preparation.includedFileCount === input?.diff?.files?.length &&
    Array.isArray(input?.diff?.files) &&
    input.diff.files.length > 0 &&
    input.diff.files.length <= 200 &&
    typeof content === "string" &&
    content.length > 0 &&
    content.length <= 120_000 &&
    input?.diff?.sha256 === digest;

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `eligible=${eligible}\n`);
  }
  if (!eligible) {
    console.log("Evaluation denied: artifact provenance or review boundary mismatch.");
    if (process.env.FAIL_ON_INELIGIBLE === "true") {
      throw new Error("Artifact failed strict provenance validation");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
