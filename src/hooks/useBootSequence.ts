import { useCallback, useEffect, useRef, useState } from "react";

/** The three states the boot animation can be in. */
export type BootState = "idle" | "playing" | "complete";

/** localStorage key marking that the user has already seen the boot. */
export const BOOT_SEEN_KEY = "boot-seen";

/** Delay (ms) before the first boot line appears — simulates CRT warm-up. */
export const CRT_WARMUP_MS = 400;

/** Delay (ms) between each boot text line. */
export const LINE_INTERVAL_MS = 280;

/** Extra delay (ms) after the last line before marking complete. */
export const TAIL_MS = 400;

export interface UseBootSequenceResult {
  /** Current boot state. */
  state: BootState;
  /** How many boot lines are currently visible (0..lines.length). */
  visibleLines: number;
  /** Immediately skip to complete. Safe to call at any time. */
  skip: () => void;
}

export interface UseBootSequenceOptions {
  /**
   * When `true`, the boot is skipped instantly (per `prefers-reduced-motion`).
   * Defaults to `false`.
   */
  reducedMotion?: boolean;
  /** The boot text lines to reveal progressively. */
  lines: string[];
}

/**
 * Boot sequence state machine.
 *
 * Lifecycle:
 * 1. **idle** — initial state on mount.
 * 2. **playing** — entered immediately if `boot-seen` is NOT set and
 *    `reducedMotion` is false. Boot lines are revealed one by one with
 *    `LINE_INTERVAL_MS` between them.
 * 3. **complete** — entered when all lines have been shown, when `skip()` is
 *    called, when `reducedMotion` is true, or when `boot-seen` is already set.
 *    On entering this state the `boot-seen` localStorage flag is written so
 *    the boot never replays on subsequent visits.
 *
 * All timers are cleaned up on unmount or when `skip()` fires mid-animation.
 */
export function useBootSequence(
  options: UseBootSequenceOptions,
): UseBootSequenceResult {
  const { reducedMotion = false, lines } = options;

  // Compute initial state synchronously so the overlay is never flashed on
  // return visits or reduced-motion mode.
  const [state, setState] = useState<BootState>(() => {
    if (reducedMotion) return "complete";
    try {
      if (
        typeof window !== "undefined" &&
        window.localStorage.getItem(BOOT_SEEN_KEY) === "true"
      ) {
        return "complete";
      }
    } catch {
      /* private mode — ignore */
    }
    return "playing";
  });
  const [visibleLines, setVisibleLines] = useState(0);

  // Refs for cleanup — timers and a mounted flag.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const markSeen = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(BOOT_SEEN_KEY, "true");
      }
    } catch {
      /* private mode — ignore */
    }
  }, []);

  const finish = useCallback(() => {
    if (!mountedRef.current) return;
    clearTimers();
    markSeen();
    setVisibleLines(lines.length);
    setState("complete");
  }, [clearTimers, markSeen, lines.length]);

  // Boot lifecycle — only set up timers when actively playing
  useEffect(() => {
    mountedRef.current = true;

    if (state !== "playing") {
      return () => {
        mountedRef.current = false;
      };
    }

    // Reveal lines one by one
    lines.forEach((_, index) => {
      const delay = CRT_WARMUP_MS + index * LINE_INTERVAL_MS;
      const id = setTimeout(() => {
        if (!mountedRef.current) return;
        setVisibleLines(index + 1);
      }, delay);
      timersRef.current.push(id);
    });

    // Schedule completion after all lines + tail
    const completionDelay =
      CRT_WARMUP_MS + lines.length * LINE_INTERVAL_MS + TAIL_MS;
    const completeId = setTimeout(() => {
      finish();
    }, completionDelay);
    timersRef.current.push(completeId);

    return () => {
      mountedRef.current = false;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When state is 'complete' from the start (boot-seen or reduced motion),
  // ensure the flag is persisted. `finish()` already does this for the
  // playing → complete transition.
  useEffect(() => {
    if (state === "complete") {
      markSeen();
    }
  }, [state, markSeen]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  return { state, visibleLines, skip };
}
