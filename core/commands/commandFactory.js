export const CommandFactory = {
  /**
   * Guest (Misafir) için Mood Seçim emrini kurşungeçirmez bir zarfa koyar.
   */
  createSelectMood: (moodValue, sessionId, tenantId) => {
    return {
      commandType: "guest.select_mood",
      commandId: crypto.randomUUID(),
      traceId: crypto.randomUUID(), // İzleme Zincirinin Başı!
      requestedAt: new Date().toISOString(),
      tenantId: tenantId,
      sessionId: sessionId,
      payload: { 
        mood: moodValue 
      }
    };
  }
};
