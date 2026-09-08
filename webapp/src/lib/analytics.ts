declare global {
  interface Window {
    ym?: (id: number | string, action: string, target: string, params?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fires an event to whichever analytics script is actually loaded (if any). */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const ymId = process.env.NEXT_PUBLIC_YM_ID;
  if (ymId && window.ym) {
    window.ym(ymId, "reachGoal", name, params);
  }
  if (window.gtag) {
    window.gtag("event", name, params);
  }
}
