"use client";

import React, { useCallback } from "react";
import styles from "./SovereignCard.module.css";
import { useTelemetry } from "../../providers/TelemetryProvider";

interface SovereignCardProps {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mood: "deep_relaxation" | "recovery" | "beauty" | "detox" | "couple_connection";
}

export default function SovereignCard({ id, title, subtitle, imageUrl, mood }: SovereignCardProps) {
  const { sendEvent } = useTelemetry();

  // Otoriter Telemetry Tetiklemesi
  const handleClick = useCallback(() => {
    // "Parse, Don't Validate" prensibine göre tam formatlı SantisEvent yolluyoruz.
    // Ingestion API'sindeki Zod kapısından kusursuz geçecektir.
    sendEvent({
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      schemaVersion: "v1",
      tenant: {
        hotelId: "00000000-0000-0000-0000-000000000000",
        hotelCode: "SANTIS-CORE",
        region: "EU",
        locale: "tr",
        currency: "EUR",
        activePolicies: [],
        fallbackMode: false,
      },
      intent: {
        isReturningGuest: false,
        segment: "premium_intent",
        moodAffinity: [mood],
        premiumThreshold: 100,
      },
      traceId: crypto.randomUUID(),
      sessionId: "session_id_mock", // Gerçekte Auth context'ten alınır
      eventType: "experience.interaction.mood_selected",
      payload: {
        mood: mood,
        source: "homepage",
      }
    });

    // Ardından sayfa yönlendirmesi veya modal açılışı tetiklenir...
    console.log(`[Card Router] Yönlendiriliyor: ${id}`);
  }, [sendEvent, mood, id]);

  return (
    <article 
      className={styles.card} 
      onClick={handleClick}
      data-card-id={id}
    >
      <img 
        src={imageUrl} 
        alt={title} 
        className={styles.image}
        loading="lazy" 
        decoding="async" 
      />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </article>
  );
}
