import { ContextBuilder } from "./context-builder.js";
import { MemoryService } from "./memory.service.js";
import { IntentService } from "./intent.service.js";
import { GeminiService } from "./gemini.service.js";
import { IntentPayload, AdvisorContext } from "./types.js";

export class AdvisorService {
  private contextBuilder: ContextBuilder;
  private geminiService: GeminiService;

  constructor(private db: any) {
    const memoryService = new MemoryService(db);
    const intentService = new IntentService(db);
    this.contextBuilder = new ContextBuilder(memoryService, intentService);
    this.geminiService = new GeminiService();
  }

  async processIntent(payload: IntentPayload): Promise<AdvisorContext> {
    // 1. Context Builder runs the deterministic Read Path
    const context = await this.contextBuilder.buildContext(payload);

    // 2. If Gemini is enabled, try LLM recommendation
    if (this.geminiService.isLlmEnabled()) {
      try {
        return await this.geminiService.generateRecommendation(context);
      } catch (error) {
        // Fallback to deterministic mode cleanly on any LLM failure or safety guard breach
        return {
          ...context,
          mode: "deterministic-fallback"
        };
      }
    }

    // 3. Deterministic Mode (Default)
    return context;
  }
}
