import { SignalType, resolveSignalClass } from '../lib/signal-token-map';

export function SignalBadge({ type }: { type: SignalType }) {
  // Safe fallback and space formatting for UI display
  const safeType = type || "unknown_signal";
  
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] font-semibold ${resolveSignalClass(type as SignalType)}`}>
      {safeType.toString().replaceAll("_", " ")}
    </span>
  );
}
