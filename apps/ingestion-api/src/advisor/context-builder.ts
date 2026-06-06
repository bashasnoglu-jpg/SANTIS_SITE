import { AdvisorContext, IntentPayload } from "./types.js";
import { MemoryService } from "./memory.service.js";
import { IntentService } from "./intent.service.js";

export class ContextBuilder {
  constructor(
    private memoryService: MemoryService,
    private intentService: IntentService
  ) {}

  async buildContext(payload: IntentPayload): Promise<AdvisorContext> {
    const traits = await this.memoryService.fetchActiveTraits(payload.guestId, payload.tenantId);
    const intents = await this.intentService.extractIntents(payload);
    const activeMemory = await this.memoryService.fetchRecentMemories(payload.guestId, payload.tenantId);
    const recentSessions = await this.memoryService.fetchRecentSessions(payload.guestId, payload.tenantId);

    // Phase 11F-A: deterministic mode. LLM logic is withheld for Phase 11F-B.
    return {
      mode: "deterministic",
      guestId: payload.guestId,
      tenantId: payload.tenantId,
      traits,
      intents,
      recentSessions,
      activeMemory,
      recommendation: {
        suggestedServices: intents.some(i => i.toLowerCase().includes("hammam")) 
          ? ["Sultan Hammam Ritual", "Olive Oil Soap Massage"]
          : ["Deep Tissue Massage", "Organic Facial"],
        messagingTone: traits.some(t => t.toLowerCase().includes("luxury")) ? "Premium & Refined" : "Welcoming & Relaxing",
        nextBestAction: "Offer a personalized consultation"
      }
    };
  }
}
