export type LayoutShiftSample = {
  value: number;
  hadRecentInput: boolean;
  sampledAt: number;
};

/**
 * Shape of the browser's layout-shift PerformanceEntry.
 * These fields are added by the Layout Instability API and are not part of
 * the base PerformanceEntry type in TypeScript's lib definitions.
 */
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/**
 * Observes layout-shift entries via PerformanceObserver.
 * Emits only unattributed shifts (hadRecentInput === false) with value > 0.
 * Returns a cleanup function that disconnects the observer.
 */
export function startClsGuard(
  onShift: (sample: LayoutShiftSample) => void,
): () => void {
  if (!("PerformanceObserver" in window)) {
    return () => undefined;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as LayoutShiftEntry;
      if (!layoutShift.hadRecentInput && layoutShift.value > 0) {
        onShift({
          value: layoutShift.value,
          hadRecentInput: layoutShift.hadRecentInput,
          sampledAt: performance.now(),
        });
      }
    }
  });

  observer.observe({ type: "layout-shift", buffered: true });

  return () => observer.disconnect();
}
