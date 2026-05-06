import { lazy, Suspense } from "react";
import type { ReactNode } from "react";

/**
 * Heavy route surfaces — loaded only when the route is mounted.
 * These modules must NOT appear in the initial admin shell bundle.
 *
 * Tier mapping (mirrors vite.config.js manualChunks):
 *   vendor-3d-calendar → react-big-calendar, moment (used by Operations)
 *   vendor-charts      → recharts, d3, victory
 *   (three → vendor-3d-calendar if a 3D route is added in the future)
 */
export const LazyOperations = lazy(() => import("../pages/Operations"));
export const LazyFinance = lazy(() => import("../pages/Finance"));
export const LazyServiceManager = lazy(() => import("../pages/ServiceManager"));

function RouteFallback(): ReactNode {
  return <div aria-busy="true">Preparing surface...</div>;
}

/**
 * Wraps children in a Suspense boundary with a lightweight fallback.
 * Use for every heavy admin surface so it is isolated from the shell.
 */
export function AdminLazyBoundary({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}
