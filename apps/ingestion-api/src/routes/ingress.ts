import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { SantisCommandSchema } from "../../../../packages/event-dictionary/src/index.js";
import { SovereignBus } from "../../../../packages/sovereign-bus/src/index.js";
import { sendAck, sendNack } from "../utils/http-contract.js";

// Factory pattern to inject the bus since we bootstrap it in index.ts
export const createIngressRouter = (sovereignBus: SovereignBus) => {
  const ingressRouter = Router();

  ingressRouter.post("/commands", async (req: Request, res: Response, next: NextFunction) => {
    // 1. TraceId Propagation (Dışarıdan geleni al, yoksa yeni üret)
    const traceId = (req.headers["x-trace-id"] as string) || crypto.randomUUID();
    const sessionId = (req.headers["x-session-id"] as string) || "anonymous-session";

    console.log(`\n🛡️ [Ingress Gate] Sinyal tespit edildi. Trace: ${traceId}`);

    try {
      const rawPayload = req.body;

      // 2. ZOD GATE (Parse, Don't Validate)
      // Eğer payload bozuksa, bu satırda ZodError fırlatır ve catch bloğuna düşer.
      const validCommand = SantisCommandSchema.parse(rawPayload);

      // 3. Güvenlik Zırhı: Dışarıdan gelen Trace/Session ID'yi zarfa fiziksel olarak mühürle
      const commandToDispatch = {
        ...validCommand,
        traceId,
        sessionId
      };

      console.log(`✅ [Ingress Gate] Gümrük geçildi. Command: ${commandToDispatch.commandType}`);

      // 4. COMMAND DISPATCH (Otoriter Bus'a fırlat)
      await sovereignBus.commands.dispatch(commandToDispatch);

      // 5. ACKNOWLEDGE (Arayüze/Edge'e "Kabul Edildi" sinyali dön)
      return sendAck(res, traceId, {
        status: "ACCEPTED",
        commandId: commandToDispatch.commandId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn(`🛑 [Ingress Gate] Zod Kalkanı Devrede! Payload reddedildi. Trace: ${traceId}`);
        // Zod hatalarını arayüzün/istemcinin anlayacağı şekilde formatla
        const issues = error.errors.map(e => ({ path: e.path.join("."), message: e.message }));
        return sendNack(res, traceId, { type: "ValidationFailed", issues }, 400);
      }
      
      // İş kuralları veya sistem hataları için bir sonraki Dead-Letter middleware'e aktar
      next(error);
    }
  });

  return ingressRouter;
};
