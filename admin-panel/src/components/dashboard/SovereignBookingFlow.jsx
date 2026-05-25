import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useConciergeTelemetry } from '../../hooks/useConciergeTelemetry';
import { useAutonomousConcierge } from '../../hooks/useAutonomousConcierge';
import { TelemetryDebugStrip } from '../boardroom/TelemetryDebugStrip.jsx';
import { ConciergeAssistBanner } from '../concierge/ConciergeAssistBanner.jsx';
import { SlotConfidenceHint } from '../concierge/SlotConfidenceHint.jsx';
import { ServiceChoiceRail } from '../concierge/ServiceChoiceRail.jsx';
import { SovereignCard, SovereignQuoteSummary } from '@santis/ui';

const initialUpsells = [
  { id: 'sothys_elixir', title: 'Sothys Paris Post-Treatment Elixir', price: 450, isSelected: false },
  { id: 'genetic_kit', title: 'Longevity DNA Kit', price: 1200, isSelected: false }
];

export function SovereignBookingFlow() {
  const { telemetryContext, updateFromSnapshotResponse, emit, setQuoteId, setIntentId, startQuoteTimer, endQuoteTimer } = useConciergeTelemetry({
    tenantId: 'santis-club',
    source: 'direct',
  });

  const [snapshot, setSnapshot] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteLatency, setQuoteLatency] = useState(null);
  const [intentStatus, setIntentStatus] = useState(null); // 'STARTED' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED'
  const [loading, setLoading] = useState(true);
  const [upsells, setUpsells] = useState(initialUpsells);
  const [isPricingLocked, setIsPricingLocked] = useState(false);

  const handleToggleUpsell = (id) => {
    setUpsells(upsells.map(u => u.id === id ? { ...u, isSelected: !u.isSelected } : u));
  };

  // Behavioral Counters
  const [serviceOpenCount, setServiceOpenCount] = useState(0);
  const [slotSelectionCount, setSlotSelectionCount] = useState(0);
  const [quoteRequestCount, setQuoteRequestCount] = useState(0);
  const [quoteFailureCount, setQuoteFailureCount] = useState(0);

  // Abandonment Guard
  const completionRef = useRef(false);
  function markFlowCompleted() {
    completionRef.current = true;
  }

  useEffect(() => {
    return () => {
      const timeout = window.setTimeout(() => {
        if (!completionRef.current && !telemetryContext.intentId) {
          void emit('FLOW_ABANDONED', {
            lastEvent: telemetryContext.lastEvent,
          });
        }
      }, 1200);

      return () => window.clearTimeout(timeout);
    };
  }, [telemetryContext.intentId, telemetryContext.lastEvent, emit]);

  // Derive Abandonment Risk Heuristic
  const abandonmentRisk = useMemo(() => {
    let risk = 0;
    if (telemetryContext.degraded) risk += 0.25;
    if ((telemetryContext.quoteLatencyMs ?? 0) > 1200) risk += 0.25;
    if (serviceOpenCount >= 3) risk += 0.2;
    if (quoteFailureCount > 0) risk += 0.3;
    return Math.max(0, Math.min(1, risk));
  }, [telemetryContext.degraded, telemetryContext.quoteLatencyMs, serviceOpenCount, quoteFailureCount]);

  // The Autonomous Engine
  const decision = useAutonomousConcierge({
    snapshot: snapshot
      ? {
          degraded: telemetryContext.degraded,
          warningCodes: telemetryContext.warningCodes || [],
          services: snapshot.services,
          nextAvailableSlots: snapshot.nextAvailableSlots,
        }
      : null,
    telemetry: {
      requestId: telemetryContext.requestId,
      quoteId: telemetryContext.quoteId,
      intentId: telemetryContext.intentId,
      responseTimeMs: telemetryContext.responseTimeMs,
      quoteLatencyMs: quoteLatency, // Feed live quote latency here
      lastEvent: telemetryContext.lastEvent,
    },
    behavioral: {
      serviceOpenCount,
      slotSelectionCount,
      quoteRequestCount,
      quoteFailureCount,
      abandonmentRisk,
    },
  });

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const startedAt = performance.now();
        const telemetryUrl = import.meta.env.VITE_TELEMETRY_API_URL || 'http://localhost:4040';
        const response = await fetch(
          `${telemetryUrl}/api/concierge/snapshot?tenantId=santis-club&locale=tr&currency=EUR&date=2026-04-20&partySize=2&memberTier=gold`
        );
        const data = await response.json();

        console.log('[SOVEREIGN KIOSK] Gateway ile Nöral Köprü kuruluyor...');
        const servicesWithNeuralPricing = await Promise.all((data.services || []).map(async (svc) => {
          try {
            const coreUrl = import.meta.env.VITE_CORE_API_URL || 'http://localhost:3030';
            const priceRes = await fetch(`${coreUrl}/api/v1/rituals/pricing?ritualId=${svc.id}&basePrice=${svc.price}&guestSegment=UHNWI`);
            if (priceRes.ok) {
                const priceJson = await priceRes.json();
                return { ...svc, price: priceJson.data.finalPrice };
            }
          } catch (error) {
            console.error(`[SOVEREIGN ZIRHI] ${svc.id} için fiyat bağlantısı koptu.`, error);
          }
          return svc;
        }));
        
        data.services = servicesWithNeuralPricing;
        setIsPricingLocked(true);
        console.log('[SOVEREIGN KIOSK] Prestij Vektörleri ekrana mühürlendi.');

        const responseTimeMs = Math.round(performance.now() - startedAt);

        updateFromSnapshotResponse({
          snapshot: data,
          headerRequestId: response.headers.get('x-santis-request-id'),
          headerDegraded: response.headers.get('x-santis-degraded'),
          responseTimeMs,
        });

        await emit('SNAPSHOT_VIEWED', {
          serviceCount: data.services?.length ?? 0,
          slotCount: data.nextAvailableSlots?.length ?? 0,
          responseTimeMs,
        });

        setSnapshot(data);
      } catch (err) {
        console.error('Snapshot fetch failed', err);
      } finally {
        setLoading(false);
      }
    }
    loadSnapshot();
  }, [updateFromSnapshotResponse, emit]);

  const handleServiceClick = async (service, index) => {
    setServiceOpenCount((v) => v + 1);
    setSelectedService(service);
    setSelectedSlot(null);
    setQuote(null);
    setUpsells(initialUpsells); // Reset upsells on new service
    await emit('SERVICE_OPENED', {
      serviceId: service.id,
      serviceTitle: service.title,
      category: service.category,
      price: service.price,
      position: index,
    });
  };

  const handleSlotClick = async (slot) => {
    if (!selectedService) return;
    setSlotSelectionCount((v) => v + 1);
    setSelectedSlot(slot);
    setQuote(null);
    await emit('SLOT_SELECTED', {
      serviceId: selectedService.id,
      slotStartIso: slot.startIso,
      therapistId: slot.therapistId,
      confidence: slot.confidence,
      rankScore: slot.rankScore,
    });
  };

  const handleRequestQuote = async () => {
    if (!selectedService || !selectedSlot) return;

    setQuoteRequestCount((v) => v + 1);
    startQuoteTimer();
    await emit('QUOTE_REQUESTED', {
      serviceId: selectedService.id,
      slotStartIso: selectedSlot.startIso,
      addOnIds: [],
    });

    try {
      // Simulate backend quote processing latency (150-350ms)
      const fakeLatency = Math.floor(Math.random() * 200) + 150;
      await new Promise(r => setTimeout(r, fakeLatency));
      
      const latencyMs = endQuoteTimer();
      setQuoteLatency(latencyMs);

      const mockQuote = {
        quoteId: `quote_${crypto.randomUUID()}`,
        finalPrice: { amount: selectedService.price },
        availabilityConfirmed: true,
        upsellSuggestions: [1, 2]
      };
      
      setQuoteId(mockQuote.quoteId);
      setQuote(mockQuote);

      await emit('QUOTE_RECEIVED', {
        serviceId: selectedService.id,
        finalAmount: mockQuote.finalPrice.amount,
        currency: 'EUR',
        latencyMs,
        availabilityConfirmed: mockQuote.availabilityConfirmed,
        upsellCount: mockQuote.upsellSuggestions.length,
      });
      
      // Implicitly start intent when quote is received
      setIntentStatus('STARTED');
      await emit('INTENT_STARTED', {
        serviceId: selectedService.id,
        slotStartIso: selectedSlot.startIso,
      });

    } catch {
      setQuoteFailureCount((v) => v + 1);
      await emit('QUOTE_FAILED', {
        serviceId: selectedService.id,
        reason: 'NETWORK_OR_VALIDATION',
      });
    }
  };

  const handleConfirmIntent = async () => {
    if (!quote || !selectedService) return;

    setIntentStatus('SUBMITTED');
    const mockIntentId = `int_${window.crypto.randomUUID()}`;
    setIntentId(mockIntentId);

    const totalUpsellPrice = upsells.filter(u => u.isSelected).reduce((acc, curr) => acc + curr.price, 0);

    await emit('BOOKING_INTENT_SUBMITTED', {
      serviceId: selectedService.id,
      slotStartIso: selectedSlot.startIso,
      upsellAmount: totalUpsellPrice,
      hasEmail: true,
      hasPhone: true,
    });

    try {
      // 1. Zod Uyumlu Sentetik Event Hazırlığı
      const syntheticEvent = {
        eventId: window.crypto.randomUUID(),
        eventType: "commerce.upsell.therapist_accepted",
        occurredAt: new Date().toISOString(),
        traceId: window.crypto.randomUUID(),
        sessionId: "kiosk-session",
        tenant: {
          hotelId: "123e4567-e89b-12d3-a456-426614174000",
          hotelCode: "SANTIS",
          region: "EU",
          locale: "tr",
          currency: "EUR",
          activePolicies: [],
          fallbackMode: false
        },
        intent: {
          isReturningGuest: true,
          segment: "vip",
          moodAffinity: [],
          premiumThreshold: 100
        },
        payload: {
          therapistId: "123e4567-e89b-12d3-a456-426614174001", // Zod UUID beklentisi
          upsellAmount: totalUpsellPrice,
          originalPackageId: "123e4567-e89b-12d3-a456-426614174002" // Zod UUID beklentisi
        }
      };

      // 2. Gateway'e Fırlatma
      const coreUrl = import.meta.env.VITE_CORE_API_URL || 'http://localhost:3030';
      const res = await fetch(`${coreUrl}/api/v1/test-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syntheticEvent)
      });

      if (!res.ok) {
        throw new Error("Nöral Fısıltı İletilemedi!");
      }

      setIntentStatus('CONFIRMED');
      markFlowCompleted();
      await emit('INTENT_CONFIRMED', {
        serviceId: selectedService.id,
        slotStartIso: selectedSlot.startIso,
        grandTotal: selectedService.price + totalUpsellPrice
      });
      
      console.log("Nöral Fısıltı Başarıyla İletildi. GodMode Radar'ı kontrol edin.");

    } catch (err) {
      console.error(err);
      setIntentStatus('FAILED');
      await emit('INTENT_FAILED', {
        serviceId: selectedService.id,
        reason: 'GATEWAY_REJECTED',
      });
    }
  };


  if (loading) {
    return <div className="text-text-secondary p-12 text-center animate-pulse font-serif tracking-widest uppercase text-sm">Sovereign Gateway Bağlanıyor...</div>;
  }

  if (!snapshot) {
    return <div className="text-red-400 p-12 text-center">Sistem geçici olarak çevrimdışı. Lütfen daha sonra tekrar deneyin.</div>;
  }

  // Interventions
  const visibleServices = decision.shouldReduceChoices
    ? snapshot.services.slice(0, decision.maxVisibleServices)
    : snapshot.services;

  const filteredSlots = (snapshot.nextAvailableSlots || []).filter(
    (slot) => (slot.confidence ?? 0) >= decision.minSlotConfidence
  );

  const hiddenSlotCount = (snapshot.nextAvailableSlots?.length || 0) - filteredSlots.length;

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700">
      
      {/* 1. Debug Strip */}
      <div className="mb-12">
        <TelemetryDebugStrip
          requestId={telemetryContext.requestId}
          degraded={telemetryContext.degraded}
          warningCount={telemetryContext.warningCodes?.length ?? 0}
          responseTimeMs={telemetryContext.responseTimeMs}
          lastEvent={telemetryContext.lastEvent}
          quoteId={telemetryContext.quoteId}
          quoteMs={quoteLatency}
          intentId={telemetryContext.intentId}
          intentStatus={intentStatus}
          decisionAssist={decision.shouldOfferConciergeAssist}
          decisionReasons={decision.explanationCodes}
        />
      </div>

      {decision.shouldOfferConciergeAssist && (
        <ConciergeAssistBanner
          degraded={decision.shouldEscalateToHuman}
          explanationCodes={decision.explanationCodes}
        />
      )}

      {/* 2. Services Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border-decorative pb-4">
          <h3 className="text-accent-gold text-2xs font-black tracking-widest uppercase">Select Ritual</h3>
          <span className="text-xs text-text-secondary">{visibleServices.length} Available</span>
        </div>

        <ServiceChoiceRail reduced={decision.shouldReduceChoices} visibleCount={visibleServices.length} totalCount={snapshot.services?.length || 0} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleServices.map((svc, idx) => (
            <div key={svc.id} className={`transition-opacity duration-1000 ease-in-out ${isPricingLocked ? 'opacity-100' : 'opacity-0'}`}>
              <SovereignCard
                state={selectedService?.id === svc.id ? 'selected' : 'default'}
                title={svc.title}
                price={svc.price}
                category={svc.category}
                durationMin={svc.durationMin}
                onClick={() => isPricingLocked && handleServiceClick(svc, idx)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Slot Selection (Visible if service selected) */}
      {selectedService && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between border-b border-border-decorative pb-4">
              <h3 className="text-accent-gold text-2xs font-black tracking-widest uppercase">Available Slots</h3>
              <span className="text-xs text-text-secondary">For {selectedService.title}</span>
           </div>

           <SlotConfidenceHint minConfidence={decision.minSlotConfidence} hiddenCount={hiddenSlotCount} />

           <div className="flex flex-wrap gap-3">
             {filteredSlots.map((slot, idx) => {
               const time = new Date(slot.startIso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
               return (
                 <button
                   key={idx}
                   onClick={() => handleSlotClick(slot)}
                   className={`px-6 py-3 rounded-lg border text-sm transition-all duration-300 ${
                     selectedSlot?.startIso === slot.startIso
                       ? 'bg-accent-gold text-text-on-gold border-accent-gold font-bold'
                       : 'bg-surface-panel border-border-decorative text-text-primary hover:border-interactive-hover'
                   }`}
                 >
                   {time}
                 </button>
               );
             })}
           </div>
        </div>
      )}

      {/* 4. Request Quote & Intent Confirmation */}
      {selectedSlot && (
        <div className="pt-8 border-t border-border-decorative text-right animate-in slide-in-from-bottom-4 duration-500">
          {!quote ? (
            <div className="flex flex-col items-end gap-3">
              {decision.shouldShowUrgency && (
                <span className="text-xs text-amber-500 animate-pulse">High demand for this time slot.</span>
              )}
              <button 
                onClick={handleRequestQuote}
                className="bg-text-primary text-bg-primary px-12 py-4 rounded-xl text-2xs font-bold uppercase tracking-widest hover:bg-accent-gold transition-all"
              >
                Verify Availability & Get Quote
              </button>
            </div>
          ) : (
            <div className="w-full">
              <div className="text-2xs text-accent-gold uppercase tracking-widest mb-2 text-right">
                Verified Availability ({quoteLatency}ms)
              </div>
              
              <SovereignQuoteSummary 
                ritualTitle={selectedService.title}
                ritualPrice={selectedService.price}
                upsells={upsells}
                onToggleUpsell={handleToggleUpsell}
                onConfirm={handleConfirmIntent}
                isConfirming={intentStatus === 'SUBMITTED'}
              />
              
              {intentStatus === 'CONFIRMED' && (
                <div className="w-full text-center border border-green-500/50 bg-green-500/10 text-green-400 px-6 py-3 rounded-lg text-2xs font-bold uppercase tracking-widest mt-4">
                  Intent Confirmed - Boardroom Updated
                </div>
              )}
              {intentStatus === 'FAILED' && (
                <div className="w-full text-center border border-red-500/50 bg-red-500/10 text-red-400 px-6 py-3 rounded-lg text-2xs font-bold uppercase tracking-widest mt-4">
                  Intent Failed - Try Again
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
