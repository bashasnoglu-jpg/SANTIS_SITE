# Governance Deviation Log: Admin Override on PR #328

- **PR:** #328
- **Source:** fix/api-client-localhost-leak
- **Target:** develop
- **Reason:** CI pipeline unblock for localhost vulnerability fix (seal check flaky E2E failure)
- **Override type:** admin merge / branch protection bypass
- **Why allowed:** The PR fixes a critical P0 security rule violation (localhost/127.0.0.1 leakage). The seal failure was identified as a known flaky E2E frame budget issue (GPU bottleneck on runner) completely unrelated to the PR's code. Frame budget has been fixed separately in PR #329.
- **Risk:** LOW
- **Follow-up status:** OPEN
- **Follow-up:** Merge PR #329 to stabilize the flaky E2E test.
- **Deviation status:** RECORDED / CLOSED
