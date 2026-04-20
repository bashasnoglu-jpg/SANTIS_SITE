import React, { useEffect, useState, useRef } from 'react';
import { useConciergeTelemetry } from '../../hooks/useConciergeTelemetry';
import { useAutonomousConcierge } from '../../hooks/useAutonomousConcierge';
import { TelemetryDebugStrip } from '../boardroom/TelemetryDebugStrip.jsx';
import { ConciergeAssistBanner } from '../concierge/ConciergeAssistBanner.jsx';
import { SlotConfidenceHint } from '../concierge/SlotConfidenceHint.jsx';
import { ServiceChoiceRail } from '../concierge/ServiceChoiceRail.jsx';

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
        const response = await fetch(
          'http://localhost:4040/api/concierge/snapshot?tenantId=santis-club&locale=tr&currency=EUR&date=2026-04-20&partySize=2&memberTier=gold'
        );
        const data = await response.json();
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
    const mockIntentId = `int_${crypto.randomUUID()}`;
    setIntentId(mockIntentId);

    await emit('BOOKING_INTENT_SUBMITTED', {
      serviceId: selectedService.id,
      slotStartIso: selectedSlot.startIso,
      hasEmail: true,
      hasPhone: true,
    });

    // Simulate backend intent confirmation
    setTimeout(async () => {
      // 90% success rate mock
      if (Math.random() > 0.1) {
        setIntentStatus('CONFIRMED');
        markFlowCompleted(); // Explicitly clear abandonment risk
        await emit('INTENT_CONFIRMED', {
          serviceId: selectedService.id,
          slotStartIso: selectedSlot.startIso,
        });
      } else {
        setIntentStatus('FAILED');
        await emit('INTENT_FAILED', {
          serviceId: selectedService.id,
          reason: 'PAYMENT_REJECTED',
        });
      }
    }, 800);
  };

  if (loading) {
    return <div className="text-slate-400 p-12 text-center animate-pulse font-serif tracking-widest uppercase text-sm">Sovereign Gateway Bağlanıyor...</div>;
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
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-[#c6a96b] text-[10px] font-black tracking-widest uppercase">Select Ritual</h3>
          <span className="text-xs text-slate-500">{visibleServices.length} Available</span>
        </div>

        <ServiceChoiceRail reduced={decision.shouldReduceChoices} visibleCount={visibleServices.length} totalCount={snapshot.services?.length || 0} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleServices.map((svc, idx) => (
            <button 
              key={svc.id}
              onClick={() => handleServiceClick(svc, idx)}
              className={`text-left p-6 rounded-xl border transition-all duration-300 ${
                selectedService?.id === svc.id 
                  ? 'bg-white/10 border-[#c6a96b]' 
                  : 'bg-black/40 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-serif text-xl text-white">{svc.title}</span>
                <span className="text-[#c6a96b] font-serif text-lg">€{svc.price}</span>
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest flex justify-between">
                <span>{svc.category}</span>
                <span>{svc.durationMin} MIN</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Slot Selection (Visible if service selected) */}
      {selectedService && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-[#c6a96b] text-[10px] font-black tracking-widest uppercase">Available Slots</h3>
              <span className="text-xs text-slate-500">For {selectedService.title}</span>
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
                       ? 'bg-[#c6a96b] text-black border-[#c6a96b] font-bold'
                       : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/30'
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
        <div className="pt-8 border-t border-white/10 text-right animate-in slide-in-from-bottom-4 duration-500">
          {!quote ? (
            <div className="flex flex-col items-end gap-3">
              {decision.shouldShowUrgency && (
                <span className="text-xs text-amber-500 animate-pulse">High demand for this time slot.</span>
              )}
              <button 
                onClick={handleRequestQuote}
                className="bg-white text-black px-12 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#c6a96b] transition-all"
              >
                Verify Availability & Get Quote
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-[#c6a96b]/30 p-6 rounded-xl inline-block text-left min-w-[300px]">
              <div className="text-[10px] text-[#c6a96b] uppercase tracking-widest mb-4">Confirmed Quote ({quoteLatency}ms)</div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-slate-300">Final Price</span>
                <span className="text-3xl font-serif text-white">€{quote.finalPrice.amount}</span>
              </div>
              <div className="text-xs text-green-400 flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Slot Reserved
              </div>
              
              {intentStatus !== 'CONFIRMED' && (
                <button 
                  onClick={handleConfirmIntent}
                  disabled={intentStatus === 'SUBMITTED'}
                  className="w-full bg-[#c6a96b] text-black px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
                >
                  {intentStatus === 'SUBMITTED' ? 'Confirming...' : 'Confirm Intent & Pay'}
                </button>
              )}
              
              {intentStatus === 'CONFIRMED' && (
                <div className="w-full text-center border border-green-500/50 bg-green-500/10 text-green-400 px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  Intent Confirmed - Boardroom Updated
                </div>
              )}
              {intentStatus === 'FAILED' && (
                <div className="w-full text-center border border-red-500/50 bg-red-500/10 text-red-400 px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2">
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
