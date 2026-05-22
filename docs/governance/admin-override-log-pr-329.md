# Governance Deviation Log: Admin Override on PR #329

- **PR:** #329
- **Source:** test/stabilize-sovereign-booking-frame-budget
- **Target:** develop
- **Reason:** CI pipeline unblock for test stabilization
- **Override type:** admin merge / branch protection bypass
- **Why allowed:** The PR fixes a known flaky E2E frame budget issue (GPU bottleneck on runner) by increasing the timeout slightly to stabilize the CI. All required checks, including the `seal` check, passed successfully, but branch protection requires explicit review or admin override.
- **Risk:** LOW
- **Follow-up status:** CLOSED
- **Follow-up:** None.
- **Deviation status:** RECORDED / CLOSED
