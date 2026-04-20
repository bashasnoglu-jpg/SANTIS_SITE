/**
 * SANTIS Sovereign OS - Constitutional Ingress Adapter
 * Bu modül, dış kütüphanelerden gelen (untyped) verileri
 * Sovereign OS standartlarına (telemetry.ts) zorlar.
 */

import { validateSovereignEnvelope } from "./telemetry.ts";
import type { SovereignEnvelope } from "./telemetry.ts";

export class ConstitutionalGuard {
  /**
   * Dış dünyadan gelen herhangi bir JSON veya Objeyi 
   * Anayasa tipine (SovereignEnvelope) dökümler.
   */
  static sanitize(rawInput: unknown): SovereignEnvelope | null {
    try {
      // 1. Gelen veri string ise parse et (Fastify/Pino logları gibi)
      let data = rawInput;

      if (typeof rawInput === "string") {
        data = JSON.parse(rawInput);
      } else if (rawInput instanceof Uint8Array) {
        data = JSON.parse(new TextDecoder().decode(rawInput));
      } else if (rawInput instanceof ArrayBuffer) {
        data = JSON.parse(new TextDecoder().decode(new Uint8Array(rawInput)));
      }

      // 2. Anayasaya uygunluk denetimi (Phase 0 Check)
      if (validateSovereignEnvelope(data)) {
        return data; // Veri güvenli, içeri alabilirsin.
      }

      // 3. Eğer veri bozuksa ama kurtarılabiliyorsa (Legacy Support)
      // Bu kısım "Gölge Mod" (Sprint E) için bir log bırakabilir.
      console.warn("[CONSTITUTIONAL_GUARD]: Unstructured data rejected.", data);
      return null;
    } catch (error) {
      console.error("[CONSTITUTIONAL_GUARD]: Parse Error. Execution Blocked.");
      return null;
    }
  }

  /**
   * Fastify veya WebSocket gibi 'emit' yapan yapıları sarmalar.
   */
  static wrapEmitter(emitter: any, eventName: string, callback: (msg: SovereignEnvelope) => void) {
    emitter.on(eventName, (rawData: any) => {
      const sanitized = this.sanitize(rawData);
      if (sanitized) {
        callback(sanitized);
      }
    });
  }
}
