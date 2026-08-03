import { z } from "zod";

const sha40 = z.string().regex(/^[a-f0-9]{40}$/i);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/i);

export const ReviewRequestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    requestId: z.string().uuid(),
    repository: z.object({
      fullName: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
      id: z.string().regex(/^\d+$/),
      ownerId: z.string().regex(/^\d+$/)
    }),
    pullRequest: z.object({
      number: z.number().int().positive(),
      baseSha: sha40,
      headSha: sha40,
      headRepositoryId: z.string().regex(/^\d+$/)
    }),
    source: z.object({
      eventName: z.enum(["pull_request", "workflow_dispatch"]),
      workflowRunId: z.string().regex(/^\d+$/),
      fork: z.boolean()
    }),
    diff: z.object({
      sha256,
      content: z.string().min(1).max(120_000),
      files: z
        .array(
          z.object({
            path: z.string().min(1).max(512),
            status: z.enum(["added", "modified", "removed", "renamed", "copied", "changed"]),
            additions: z.number().int().nonnegative(),
            deletions: z.number().int().nonnegative()
          })
        )
        .min(1)
        .max(200)
    }),
    preparation: z
      .object({
        ignoredFileCount: z.number().int().nonnegative(),
        includedFileCount: z.number().int().positive().max(200),
        redactionCount: z.number().int().nonnegative(),
        truncated: z.literal(false)
      })
      .strict()
  })
  .strict();

export const FindingSchema = z
  .object({
    severity: z.enum(["info", "warning", "critical"]),
    category: z.enum([
      "security",
      "correctness",
      "data_integrity",
      "governance",
      "testing",
      "maintainability"
    ]),
    path: z.string().max(512).optional(),
    line: z.number().int().positive().optional(),
    message: z.string().min(1).max(2_000),
    recommendation: z.string().min(1).max(2_000)
  })
  .strict();

export const ModelReviewSchema = z
  .object({
    summary: z.string().min(1).max(4_000),
    findings: z.array(FindingSchema).max(50),
    limitations: z.array(z.string().min(1).max(1_000)).max(20)
  })
  .strict();

export const EvidenceSchema = z
  .object({
    schema_version: z.literal("1.0"),
    evidence_id: z.string().uuid(),
    request_id: z.string().uuid(),
    generated_at: z.string().datetime(),
    mode: z.literal("shadow"),
    binding_status: z.literal("NON_BINDING"),
    human_review_status: z.literal("NOT_EVALUATED"),
    ai_disclosure: z.literal(
      "AI-generated pre-review evidence. A human reviewer must independently verify every finding."
    ),
    content_provenance: z.object({
      provider: z.literal("google-vertex-ai"),
      model: z.string().min(1),
      region: z.string().min(1),
      repository_id: z.string().regex(/^\d+$/),
      pull_request_number: z.number().int().positive(),
      base_sha: sha40,
      head_sha: sha40,
      diff_sha256: sha256
    }),
    review: ModelReviewSchema
  })
  .strict();

export const SignedEvidenceSchema = z
  .object({
    evidence: EvidenceSchema,
    signature: z.object({
      algorithm: z.literal("HMAC-SHA256"),
      value: sha256
    })
  })
  .strict();

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
export type ModelReview = z.infer<typeof ModelReviewSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type SignedEvidence = z.infer<typeof SignedEvidenceSchema>;
