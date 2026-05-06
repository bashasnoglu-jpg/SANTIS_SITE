import React, { useMemo } from "react";
import ExecutiveRail from "./components/ExecutiveRail";
import TelemetryStrip from "./components/TelemetryStrip";
import MetricStrip from "./components/MetricStrip";
import IntentMatrix from "./components/IntentMatrix";
import SessionFriction from "./components/SessionFriction";
import TherapistDeployment from "./components/TherapistDeployment";
import VipRadar from "./components/VipRadar";
import LivePulseLog from "./components/LivePulseLog";
import SystemIntegrityRail from "./components/SystemIntegrityRail";
import { VaultHeatMap } from "./components/VaultHeatMap";
import { createBoardroomViewModel } from "./boardroom.adapter";
import { useBoardroomData, useBoardroomState, usePulseStream, useVipRadar } from "./boardroom.hooks";
import { useBoardroomIntelligence } from "./boardroom.intelligence.hooks";

const navItems = [
  { key: "overview", label: "Overview" },
  { key: "gods-eye", label: "God's Eye" },
  { key: "vault-ops", label: "Vault Operations" },
  { key: "booking-intelligence", label: "Booking Intelligence" },
  { key: "revenue-intelligence", label: "Revenue Intelligence" },
  { key: "vip-concierge", label: "VIP Concierge" },
  { key: "therapists", label: "Therapists" },
  { key: "tenants", label: "Tenants" },
  { key: "system-health", label: "System Health" },
];

export default function BoardroomPage() {
  const { data, loading, error } = useBoardroomData();

  const vm = useMemo(() => {
    return createBoardroomViewModel(
      data ?? {
        tenants: [],
        metrics: [],
        intents: [],
        friction: [],
        therapists: [],
        vipQueue: [],
        pulse: [],
        integrity: [],
        vaultAssets: [],
      }
    );
  }, [data]);

// --- SKIPPED LINES TO INJECT VAULT HEATMAP --- //

// (Start replacement lines inside the main block)

  const {
    activeNav,
    setActiveNav,
    selectedTenant,
    setSelectedTenant,
  } = useBoardroomState({
    tenants: vm.tenants,
    initialActiveNav: "gods-eye",
  });

  const {
    vipItems,
    acknowledgingIds,
    pendingCount,
    acknowledgeVip,
  } = useVipRadar(vm.vipItems);

  const { events } = usePulseStream({
    initialEvents: vm.pulseEvents,
    intervalMs: 8000,
    maxItems: 12,
  });

  const intelligence = useBoardroomIntelligence({
    ...vm,
    vipItems,
    pulseEvents: events,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#F5F1E8]">
        <div className="space-y-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.42em] text-white/26">
            Santis Sovereign OS
          </div>
          <div className="text-2xl font-light tracking-[0.08em]">
            Loading Telemetry...
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/24">
            Awaiting Boardroom Core State
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#F5F1E8]">
        <div className="space-y-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.42em] text-[#9F5A4A]">
            Boardroom Signal Failure
          </div>
          <div className="text-2xl font-light tracking-[0.08em]">
            Telemetry link interrupted
          </div>
          <div className="max-w-xl text-[11px] uppercase tracking-[0.18em] text-white/24">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F1E8]">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_340px]">
        <ExecutiveRail
          items={navItems}
          activeKey={activeNav}
          onNavigate={setActiveNav}
          operatorScope={`${selectedTenant?.label ?? "Global Facilities"} / Primary Node`}
        />

        <div className="min-w-0">
          <TelemetryStrip
            tenantOptions={vm.tenants}
            selectedTenant={selectedTenant}
            onTenantChange={setSelectedTenant}
            dateLabel="Today"
            viewLabel="Executive View"
            operatorIdentity="Operator / Sovereign"
            liveStatus="Admin Panel Live"
          />

          <div className="mx-auto max-w-[1600px] px-6 py-10 sm:px-8 lg:px-12 xl:px-16">
            <header className="mb-20 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="text-[10px] uppercase tracking-[0.42em] text-white/28">
                  Santis Sovereign OS / Boardroom
                </div>

                <h1 className="text-4xl font-light tracking-[0.08em] sm:text-5xl lg:text-6xl">
                  God&apos;s Eye Experience Intelligence
                </h1>

                <p className="max-w-3xl text-sm uppercase tracking-[0.18em] text-white/34">
                  Executive command surface for intent gravity, friction leakage,
                  therapist deployment and live operational visibility.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-l border-white/5 pl-8">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.34em] text-white/22">
                    Pending VIP Handoff
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-[0.08em] text-[#D4AF37]">
                    {String(pendingCount).padStart(2, "0")}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.34em] text-white/22">
                    Active Tenant Scope
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-[0.08em] text-[#A7B69A]">
                    {selectedTenant?.label ?? "Global Facilities"}
                  </div>
                </div>
              </div>
            </header>

            <main className="space-y-24">
              <MetricStrip metrics={vm.metrics} />

              {/* God's Eye Phase 2: Vault Financial Heatmap */}
              <VaultHeatMap assets={vm.vaultAssets} />

              <section className="grid grid-cols-1 gap-16 xl:grid-cols-[1.15fr_0.85fr]">
                <IntentMatrix
                  title="The God's Eye Matrix / Intent Flow"
                  subtitle="Conversion pressure across intent signatures."
                  intents={vm.intents}
                  gravityScores={intelligence.intentGravityScores}
                />

                <SessionFriction
                  title="Session Friction"
                  subtitle="Leak points inside the live decision field."
                  rows={vm.frictionRows}
                />
              </section>

              <TherapistDeployment
                title="Therapist Deployment"
                subtitle="Resource allocation calibrated by margin and capacity."
                therapists={vm.therapists}
                stressScores={intelligence.therapistStressScores}
              />
            </main>
          </div>
        </div>

        <aside className="hidden border-l border-white/[0.04] px-6 py-8 xl:block bg-[#0A0A0A]/50">
          <div className="space-y-14 flex flex-col h-full">
            <SystemIntegrityRail
              services={vm.integrityServices}
              executiveSignals={intelligence.executiveSignals}
            />

            <VipRadar
              items={vipItems}
              acknowledgingIds={acknowledgingIds}
              onAcknowledge={acknowledgeVip}
              riskScores={intelligence.vipRiskScores}
            />
            <div className="flex-1 min-h-[300px]">
              <LivePulseLog events={events} maxItems={12} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
