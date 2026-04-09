export function makeRawSelectMoodCommand(overrides: Partial<any> = {}) {
  return {
    commandId: "11111111-1111-4111-8111-111111111111",
    traceId: "22222222-2222-4222-8222-222222222222",
    requestedAt: "2026-04-05T10:00:00.000Z",
    tenantId: "33333333-3333-4333-8333-333333333333",
    sessionId: "sess_abc12345",
    commandType: "guest.select_mood",
    payload: {
      mood: "deep_relaxation",
    },
    ...overrides,
  };
}
