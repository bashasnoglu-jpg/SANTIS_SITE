export interface IntentSnapshotRepository {
  upsertIntentSnapshot(params: {
    tenantId: string;
    sessionId: string;
    moodAffinity: string[];
    updatedAt: string;
  }): Promise<void>;

  findBySessionId(
    sessionId: string
  ): Promise<{
    tenantId: string;
    sessionId: string;
    moodAffinity: string[];
    updatedAt: string;
  } | null>;
}
