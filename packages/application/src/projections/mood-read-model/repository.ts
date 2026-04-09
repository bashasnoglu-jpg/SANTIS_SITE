export interface MoodReadModelRepository {
  incrementSelection(params: {
    hotelId: string;
    mood: string;
    occurredAt: string;
  }): Promise<void>;
}
