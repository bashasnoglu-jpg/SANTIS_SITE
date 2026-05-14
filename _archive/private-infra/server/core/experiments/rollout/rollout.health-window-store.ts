export class InMemoryRolloutHealthWindowStore {
  private readonly counts = new Map<string, number>();

  async getConsecutiveHealthyCount(rolloutId: string): Promise<number> {
    return this.counts.get(rolloutId) ?? 0;
  }

  async recordHealthyWindow(rolloutId: string): Promise<void> {
    const current = this.counts.get(rolloutId) ?? 0;
    this.counts.set(rolloutId, current + 1);
  }

  async resetHealthyWindows(rolloutId: string): Promise<void> {
    this.counts.set(rolloutId, 0);
  }
}
