export interface GuestSessionRepository {
  markMoodSelected(params: {
    tenantId: string;
    sessionId: string;
    mood: string;
    selectedAt: string;
  }): Promise<void>;
}
