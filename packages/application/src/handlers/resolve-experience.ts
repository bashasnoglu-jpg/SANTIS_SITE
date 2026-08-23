import type { ResolveExperienceCommand } from "@santis/event-contracts";
import { ResolveExperienceCommandSchema } from "@santis/event-contracts";
import type { ExperienceRouter } from "@santis/openr";

export interface MoodHeatmapProvider {
  getAmbientMoodState(): Record<string, number>;
}

export class ResolveExperienceHandler {
  constructor(
    private readonly router: ExperienceRouter,
    private readonly moodHeatmapProvider?: MoodHeatmapProvider
  ) {}

  public async execute(rawCommand: unknown) {
    const command = ResolveExperienceCommandSchema.parse(rawCommand);

    const ambientMoodState = this.moodHeatmapProvider?.getAmbientMoodState();

    return this.router.resolve({
      command,
      deviceTier: "high",
      ambientMoodState,
    });
  }
}

