# PR #376 Evidence Note — Draft-Only

PR #376 remains **open, mergeable, and Draft** at head `03b980faf5687499bfc5ba85381c6ee7de835fab`. Its base matches the current `develop` head `b96324c3fa6c0d45b460d5ffbb31a34c3e76966e`.

**Comparison with PR #375:** Both correct RSA-PSS/SHA-256 verification by verifying the canonical UTF-8 evidence bytes with `SHA-256`, `RSA_PKCS1_PSS_PADDING`, and a 32-byte salt. PR #376 is narrower: unlike #375, it does not expand the production `signDigest` test seam to receive the canonical payload; it confines the production change to verification and updates fixtures separately.

**Vercel:** The `sovereign-os` preview is **Ready**. The unrelated admin-panel deployment was **Ignored**, whereas #375 deployed both projects. This is acceptable as preview/build evidence but does not prove the live Cloud KMS signing path.

**Validation:** The current head has successful observed checks and no unresolved review threads. The independent review records 33/33 tests, typecheck, build, traceability, secret scan, and 9/9 GitHub checks as passing, with no blocking issue inside the bounded Shadow Evidence scope.

**Remaining before any status promotion:**

1. Run one real Cloud KMS → canonical payload → RSA-PSS verification round trip against the expected key version.
2. Rerun the bounded PR #373 Shadow Evidence probe, including wrong-key, tamper, missing-signature, key-version, and replay failures.
3. Record #376 as the canonical successor to #375 and close or supersede #375 to avoid duplicate corrective paths.
4. Revalidate all checks if the head or `develop` base changes.

Until those checks and the required governance decision are recorded, PR #376 should remain **Draft-only, non-production, non-binding, and non-activating**.
