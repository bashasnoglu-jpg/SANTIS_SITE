import type { ResolveExperienceCommand } from "../../event-dictionary/src/index.js";
import { ResolveExperienceCommandSchema } from "../../event-dictionary/src/index.js";
import type { ExperienceRouter } from "../../openr/src/experience-router.js";

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

