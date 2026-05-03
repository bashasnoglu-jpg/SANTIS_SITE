import { useEffect, useMemo, useState } from "react";

export type TechnicalDebtSignal = {
  id: string;
  source: "ci" | "docker" | "local" | "runtime";
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  detail: string;
  detectedAt: string;
  euroRisk: number;
  confidence: number;
  remediation: string;
};

export type TechnicalDebtSnapshot = {
  generatedAt: string;
  totalSignals: number;
  criticalSignals: number;
  highSignals: number;
  euroRiskTotal: number;
  posture: "sealed" | "watch" | "degraded" | "breach";
  signals: TechnicalDebtSignal[];
};

type ApiSnapshotResponse = {
  ok: boolean;
  snapshot: TechnicalDebtSnapshot;
};

type Props = {
  apiBaseUrl?: string;
  streamUrl?: string;
};

const emptySnapshot: TechnicalDebtSnapshot = {
  generatedAt: new Date(0).toISOString(),
  totalSignals: 0,
  criticalSignals: 0,
  highSignals: 0,
  euroRiskTotal: 0,
  posture: "sealed",
  signals: [],
};

const postureLabel: Record<TechnicalDebtSnapshot["posture"], string> = {
  sealed: "Sealed",
  watch: "Watch",
  degraded: "Degraded",
  breach: "Breach",
};

function formatEuro(value: number) {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function useTechnicalDebtSnapshot(apiBaseUrl = "") {
  const [snapshot, setSnapshot] = useState<TechnicalDebtSnapshot>(emptySnapshot);
  const [status, setStatus] = useState<"idle" | "loading" | "live" | "offline">("idle");

  useEffect(() => {
    let alive = true;
    setStatus("loading");

    fetch(`${apiBaseUrl}/api/v1/technical-debt/snapshot`)
      .then((response) => response.json() as Promise<ApiSnapshotResponse>)
      .then((payload) => {
        if (!alive) return;
        if (payload.ok && payload.snapshot) {
          setSnapshot(payload.snapshot);
          setStatus("live");
        }
      })
      .catch(() => {
        if (alive) setStatus("offline");
      });

    return () => {
      alive = false;
    };
  }, [apiBaseUrl]);

  return { snapshot, setSnapshot, status, setStatus };
}

export function TechnicalDebtPanel({ apiBaseUrl = "", streamUrl }: Props) {
  const { snapshot, setSnapshot, status, setStatus } = useTechnicalDebtSnapshot(apiBaseUrl);

  useEffect(() => {
    if (!streamUrl || typeof EventSource === "undefined") return;

    const source = new EventSource(streamUrl);

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message?.type === "TECH_DEBT_UPDATE" && message?.payload) {
          setSnapshot(message.payload as TechnicalDebtSnapshot);
          setStatus("live");
        }
      } catch {
        // Ignore malformed stream frames; contract enforcement lives server-side.
      }
    };

    source.onerror = () => setStatus("offline");

    return () => source.close();
  }, [setSnapshot, setStatus, streamUrl]);

  const latestSignals = useMemo(() => snapshot.signals.slice(-3).reverse(), [snapshot.signals]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#101010]/95 p-6 text-[#ede9df] shadow-2xl shadow-black/30">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/40">Technical Debt Intelligence</p>
          <h2 className="mt-2 text-2xl font-light tracking-[-0.03em]">System Posture</h2>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/55">
          {status}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">Posture</p>
          <p className="mt-3 text-3xl font-light">{postureLabel[snapshot.posture]}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">EURO Risk</p>
          <p className="mt-3 text-3xl font-light">{formatEuro(snapshot.euroRiskTotal)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">Critical</p>
          <p className="mt-3 text-3xl font-light">{snapshot.criticalSignals}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">Trend</p>
          <p className="mt-3 text-3xl font-light">—</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-white/35">
          <span>Latest Signals</span>
          <span>{snapshot.totalSignals} total</span>
        </div>

        {latestSignals.length === 0 ? (
          <p className="py-6 text-sm text-white/45">No active technical debt signals. The estate is quiet.</p>
        ) : (
          <div className="space-y-3">
            {latestSignals.map((signal) => (
              <article key={signal.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/80">{signal.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{signal.detail}</p>
                  </div>
                  <p className="shrink-0 text-sm text-white/70">{formatEuro(signal.euroRisk)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TechnicalDebtPanel;
