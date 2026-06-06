import { ContextBuilder } from "./context-builder.js";
import { MemoryService } from "./memory.service.js";
import { IntentService } from "./intent.service.js";
import { GeminiService } from "./gemini.service.js";
import { IntentPayload, AdvisorContext } from "./types.js";
import crypto from 'crypto';

import { SovereignBus } from '@santis/sovereign-bus';

export class AdvisorService {
  private contextBuilder: ContextBuilder;
  private geminiService: GeminiService;

  constructor(private db: any, private bus: SovereignBus) {
    const memoryService = new MemoryService(db);
    const intentService = new IntentService(db);
    this.contextBuilder = new ContextBuilder(memoryService, intentService);
    this.geminiService = new GeminiService();
  }

  async processIntent(payload: IntentPayload): Promise<AdvisorContext> {
    // 1. Context Builder runs the deterministic Read Path
    const context = await this.contextBuilder.buildContext(payload);
    let finalContext = context;

    // 2. If Gemini is enabled, try LLM recommendation
    if (this.geminiService.isLlmEnabled()) {
      try {
        finalContext = await this.geminiService.generateRecommendation(context);
      } catch (error) {
        // Fallback to deterministic mode cleanly on any LLM failure or safety guard breach
        finalContext = {
          ...context,
          mode: "deterministic-fallback"
        };
      }
    }

    // Broadcast result to Boardroom via SovereignBus
    await this.bus.events.publish({
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      traceId: crypto.randomUUID(),
      sessionId: "anonymous-session",
      schemaVersion: "v1",
      tenant: {
        hotelId: "00000000-0000-0000-0000-000000000000",
        hotelCode: payload.tenantId || "default",
        region: "EU",
        locale: "en",
        currency: "EUR",
        activePolicies: [],
        fallbackMode: false
      },
      intent: {
        isReturningGuest: false,
        segment: "explorer",
        moodAffinity: [],
        premiumThreshold: 50
      },
      eventType: "advisor.intent.evaluated",
      payload: {
        tenantId: payload.tenantId,
        guestId: payload.guestId,
        currentAction: payload.currentAction,
        intentDetected: finalContext.intents?.[0] || 'unknown',
        recommendedMode: finalContext.mode,
        confidence: 0.9
      }
    } as any);

    return finalContext;
  }
}
