export type FpsSample = {
  fps: number;
  droppedFrames: number;
  sampledAt: number;
};

/**
 * Starts an rAF-based FPS monitor.
 * Frame budget is based on 120 FPS target (8.3 ms per frame).
 * A frame is counted as dropped when its delta exceeds 2× the budget.
 * Returns a cleanup function that cancels the loop.
 */
export function startFpsMonitor(onSample: (sample: FpsSample) => void): () => void {
  let frameCount = 0;
  let droppedFrames = 0;
  let lastSecond = performance.now();
  let previousFrame = lastSecond;
  let rafId = 0;

  // 120 FPS target → 8.3 ms per frame
  const frameBudgetMs = 8.3;

  function loop(now: number) {
    const delta = now - previousFrame;
    previousFrame = now;
    frameCount += 1;

    if (delta > frameBudgetMs * 2) {
      droppedFrames += 1;
    }

    if (now - lastSecond >= 1000) {
      onSample({
        fps: frameCount,
        droppedFrames,
        sampledAt: now,
      });

      frameCount = 0;
      droppedFrames = 0;
      lastSecond = now;
    }

    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  return () => cancelAnimationFrame(rafId);
}
