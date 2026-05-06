"use client";

import React, { createContext, useContext, useCallback, useRef } from "react";
// Bu kısımlar @santis/event-dictionary monorepo'dan gelir
import { type SantisEvent, type SantisCommand } from "@santis/event-dictionary";

interface TelemetryContextValue {
  sendEvent: (event: SantisEvent) => void;
  sendCommand: (command: SantisCommand) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

/**
 * MİMARİ KARAR (ADR): 
 * Yüksek frekanslı (hover, scroll, vb) telemetri verileri Next.js Server Actions 
 * ÜZERİNDEN GÖNDERİLMEZ. Bunun yerine Ingestion API'sine "fetch" veya "sendBeacon" 
 * ile doğrudan Edge üzerinden iletilir.
 */
export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  // Gelecek için batch işlemi eklenebilir, şu an anında iletim var.
  
  const sendToIngestionAPI = useCallback((payload: unknown, type: "event" | "command") => {
    // Ingestion API adresimiz (Phase 4): 
    // Gerçek prod ortamında process.env.INGESTION_API_URL kullanılır.
    const url = "/api/ingestion"; // Şimdilik mock endpoint
    
    const envelope = {
      kind: type,
      ...payload as any
    };

    try {
      // Sayfa kapanışlarındaki veri kaybını önlemek için sendBeacon tercih edilir.
      // Eger blob limiti aşarsa veya tarayıcı desteklemezse fetch (keepalive) fallback kullanılır.
      const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
      const success = navigator.sendBeacon(url, blob);

      if (!success) {
        // Fallback
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(envelope),
          keepalive: true,
        }).catch(err => console.error("Telemetry fetch fallback failed", err));
      }
    } catch (error) {
      console.error("Telemetry beacon failed", error);
    }
  }, []);

  const sendEvent = useCallback((event: SantisEvent) => {
    console.debug("[Telemetry] Dispacthing Event:", event.eventType);
    sendToIngestionAPI(event, "event");
  }, [sendToIngestionAPI]);

  const sendCommand = useCallback((command: SantisCommand) => {
    console.debug("[Telemetry] Dispacthing Command:", command.commandType);
    sendToIngestionAPI(command, "command");
  }, [sendToIngestionAPI]);

  return (
    <TelemetryContext.Provider value={{ sendEvent, sendCommand }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
}
