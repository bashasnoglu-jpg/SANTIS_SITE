declare global {
  interface Window {
    SantisLegacy?: {
      boot?: () => void;
      mountObservers?: () => void;
    };
  }
}

export function bootLegacyBridge() {
  window.SantisLegacy?.boot?.();
  window.SantisLegacy?.mountObservers?.();
}
