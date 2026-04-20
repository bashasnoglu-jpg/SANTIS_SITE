export interface GuestGenomeMetrics {
  dwellTime: number;
  scrollDepth: number;
  detailViews: number;
}

const DWELL_BENCHMARK_SECONDS = 45;
const SCROLL_BENCHMARK_RATIO = 0.7;
const DETAIL_VIEW_BENCHMARK = 3;

const DWELL_WEIGHT = 0.4;
const SCROLL_WEIGHT = 0.3;
const DETAIL_VIEW_WEIGHT = 0.3;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
};

const round = (value: number) => Number(value.toFixed(3));

function normalizeScrollDepth(scrollDepth: number): number {
  const normalized = scrollDepth > 1 ? scrollDepth / 100 : scrollDepth;
  return clamp(normalized, 0, 1);
}

export const GuestGenomeScorer = {
  normalizeScore(rawScore: unknown): number | undefined {
    const numeric = toOptionalNumber(rawScore);
    if (numeric == null) {
      return undefined;
    }

    const normalized = numeric > 1 ? numeric / 100 : numeric;
    return round(clamp(normalized, 0, 1));
  },

  calculateScore(metrics: Partial<GuestGenomeMetrics> | null | undefined): number | undefined {
    if (!metrics || typeof metrics !== "object") {
      return undefined;
    }

    const dwellTime = toOptionalNumber(metrics.dwellTime);
    const scrollDepth = toOptionalNumber(metrics.scrollDepth);
    const detailViews = toOptionalNumber(metrics.detailViews);

    if (dwellTime == null && scrollDepth == null && detailViews == null) {
      return undefined;
    }

    const dwellComponent = clamp(
      (dwellTime ?? 0) / DWELL_BENCHMARK_SECONDS,
      0,
      1.2
    );
    const scrollComponent = clamp(
      normalizeScrollDepth(scrollDepth ?? 0) / SCROLL_BENCHMARK_RATIO,
      0,
      1
    );
    const detailViewComponent = clamp(
      (detailViews ?? 0) / DETAIL_VIEW_BENCHMARK,
      0,
      1.5
    );

    const weightedScore =
      dwellComponent * DWELL_WEIGHT +
      scrollComponent * SCROLL_WEIGHT +
      detailViewComponent * DETAIL_VIEW_WEIGHT;

    return round(clamp(weightedScore, 0, 1));
  },
};
