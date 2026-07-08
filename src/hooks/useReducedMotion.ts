import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reactive hook that reports whether the user has requested reduced motion
 * via the OS / browser setting (`prefers-reduced-motion: reduce`).
 *
 * SSR-safe: returns `false` when `window.matchMedia` is unavailable.
 * The value updates live when the preference changes at runtime.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);

    // Sync in case the initial state was computed before the listener
    setReduced(mql.matches);

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}
