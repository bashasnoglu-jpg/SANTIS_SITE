import { createHash } from "node:crypto";
import { ZodError } from "zod";
import { ReviewRequestSchema } from "./contracts.js";
import { createSignedEvidence } from "./evidence.js";
import { assertSanitizedDiff, isForbiddenPath, redactSecrets } from "./sanitize.js";
import { evaluateWithVertex } from "./vertex.js";

export type AppConfig = {
  mode: string;
  projectId: string;
  region: string;
  model: string;
  kmsKeyVersion: string;
  repositoryId: string;
  ownerId: string;
  signDigest?: (digest: Buffer) => Promise<string>;
};

export type AppResponse = {
  status: number;
  body: Record<string, unknown>;
};

export async function evaluateRequest(raw: unknown, config: AppConfig): Promise<AppResponse> {
  if (config.mode !== "shadow") {
    return { status: 503, body: { error: "AI_REVIEW_MODE_MUST_BE_SHADOW" } };
  }
  if (!/^projects\/.+\/cryptoKeyVersions\/\d+$/.test(config.kmsKeyVersion)) {
    return { status: 503, body: { error: "EVIDENCE_KMS_KEY_VERSION_INVALID" } };
  }

  let request;
  try {
    request = ReviewRequestSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: 400,
        body: { error: "INVALID_REVIEW_REQUEST", issues: error.issues }
      };
    }
    return { status: 400, body: { error: "INVALID_REVIEW_REQUEST" } };
  }

  try {
    if (request.source.fork || request.pullRequest.headRepositoryId !== request.repository.id) {
      return { status: 403, body: { error: "FORK_REVIEW_DENIED" } };
    }
    if (
      request.repository.id !== config.repositoryId ||
      request.repository.ownerId !== config.ownerId
    ) {
      return { status: 403, body: { error: "REPOSITORY_IDENTITY_MISMATCH" } };
    }
    if (request.preparation.truncated) {
      return { status: 422, body: { error: "INCOMPLETE_REVIEW_INPUT" } };
    }
    if (request.preparation.includedFileCount !== request.diff.files.length) {
      return { status: 422, body: { error: "FILE_COUNT_MISMATCH" } };
    }
    if (request.diff.files.some(({ path }) => isForbiddenPath(path))) {
      return { status: 422, body: { error: "FORBIDDEN_PATH_IN_DIFF" } };
    }

    assertSanitizedDiff(request.diff.content);
    const digest = createHash("sha256").update(request.diff.content).digest("hex");
    if (digest !== request.diff.sha256) {
      return { status: 422, body: { error: "DIFF_DIGEST_MISMATCH" } };
    }

    const sanitized = redactSecrets(request.diff.content);
    if (sanitized.redactions !== 0) {
      return { status: 422, body: { error: "UNREDACTED_SECRET_DETECTED" } };
    }

    const review = await evaluateWithVertex(request, config);
    const signedEvidence = await createSignedEvidence(request, review, config);
    return { status: 200, body: signedEvidence };
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "ai_evaluation_failed",
        message: error instanceof Error ? error.message : "Unknown evaluation error"
      })
    );
    return { status: 502, body: { error: "AI_EVALUATION_FAILED" } };
  }
}
