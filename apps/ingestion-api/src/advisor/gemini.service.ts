import { GoogleGenAI } from '@google/genai';
import { AdvisorContext } from './types.js';

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;
  private isEnabled: boolean;

  // Whitelist of allowed spa services
  private readonly ALLOWED_SERVICES = [
    'Sultan Hammam Ritual',
    'Olive Oil Soap Massage',
    'Deep Tissue Massage',
    'Aromatherapy Massage',
    'Sothys Facial',
    'Couples Ritual'
  ];

  // Forbidden words for post-filtering safety checks
  private readonly FORBIDDEN_WORDS = [
    'tedavi',
    'iyileştirir',
    'garanti',
    'indirim',
    'fiyat düşür',
    'tıbbi',
    'diagnosis',
    'cure',
    'discount',
    'guarantee'
  ];

  constructor() {
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const mode = process.env.ADVISOR_MODE || 'deterministic';
    const apiKey = process.env.GEMINI_API_KEY;

    this.isEnabled = mode === 'llm' && !!apiKey;
    
    if (this.isEnabled && apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      // Mock client just to avoid undefined checks if not enabled, though it shouldn't be called.
      this.ai = {} as GoogleGenAI;
    }
  }

  public isLlmEnabled(): boolean {
    return this.isEnabled;
  }

  public async generateRecommendation(context: AdvisorContext): Promise<AdvisorContext> {
    if (!this.isEnabled) {
      throw new Error("LLM mode is not enabled or API key is missing");
    }

    const systemPrompt = `You are the Santis Advisor Kernel. You are a 'Quiet Luxury' hospitality concierge AI. Your goal is to review the provided Guest Context (Traits, Intents, Recent Sessions) and recommend exactly TWO suitable spa services and ONE next best action.

Strict Rules:
1. Do not invent services. You MUST choose exactly 2 services ONLY from this whitelist:
${this.ALLOWED_SERVICES.map(s => `- ${s}`).join('\n')}
2. Do not make medical claims or suggest medical treatments.
3. Do not promise discounts or manipulate prices.
4. Keep the messaging tone 'Premium & Refined'.
5. Return ONLY a raw JSON object (no markdown formatting, no backticks, no comments) adhering strictly to this schema:
{
  "suggestedServices": ["string", "string"],
  "messagingTone": "string",
  "nextBestAction": "string"
}`;

    const prompt = `Guest Context:
Traits: ${context.traits?.join(', ') || 'None'}
Intents: ${context.intents?.join(', ') || 'None'}
Active Memory: ${context.activeMemory?.join(', ') || 'None'}
Recent Sessions: ${context.recentSessions?.join(', ') || 'None'}

Generate recommendation JSON:`;

    try {
      // Setup timeout controller for 5000ms guard
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Call Gemini API using the new sdk format @google/genai
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          maxOutputTokens: 150,
          responseMimeType: "application/json"
        }
      });
      
      clearTimeout(timeoutId);

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      // Parse JSON
      const parsed = JSON.parse(responseText);

      // 1. Enforce Whitelist
      if (!Array.isArray(parsed.suggestedServices)) {
        throw new Error("suggestedServices must be an array");
      }
      
      for (const service of parsed.suggestedServices) {
        if (!this.ALLOWED_SERVICES.includes(service)) {
          throw new Error(`LLM hallucinated a non-whitelisted service: ${service}`);
        }
      }

      // 2. Post-filter safety check against forbidden words
      const textToFilter = JSON.stringify(parsed).toLowerCase();
      for (const word of this.FORBIDDEN_WORDS) {
        if (textToFilter.includes(word.toLowerCase())) {
          throw new Error(`Safety Guard triggered: found forbidden word '${word}' in response`);
        }
      }

      // Merge results
      return {
        ...context,
        mode: "llm-generated",
        recommendation: {
          suggestedServices: parsed.suggestedServices.slice(0, 2),
          messagingTone: parsed.messagingTone || "Premium & Refined",
          nextBestAction: parsed.nextBestAction || "Offer a personalized consultation"
        }
      };

    } catch (error) {
      console.error("Gemini LLM Error, falling back to deterministic:", error);
      throw error; // Let advisor.service.ts catch this and apply fallback
    }
  }
}
