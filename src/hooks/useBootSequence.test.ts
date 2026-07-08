import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useBootSequence,
  BOOT_SEEN_KEY,
  CRT_WARMUP_MS,
  LINE_INTERVAL_MS,
  TAIL_MS,
} from "./useBootSequence";

const BOOT_LINES = [
  "> Initializing BOSS protocol...",
  "> Loading project data...",
  "> Establishing connection...",
];

describe("useBootSequence — state machine", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("first visit (no boot-seen flag)", () => {
    it("starts in 'playing' state when boot-seen is not set", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );
      expect(result.current.state).toBe("playing");
      expect(result.current.visibleLines).toBe(0);
    });

    it("starts playing with 0 visible lines", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );
      expect(result.current.state).toBe("playing");
      expect(result.current.visibleLines).toBe(0);
    });

    it("reveals lines progressively over time", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      // Before CRT warmup, no lines visible
      act(() => {
        vi.advanceTimersByTime(CRT_WARMUP_MS - 1);
      });
      expect(result.current.visibleLines).toBe(0);

      // After warmup, first line appears
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current.visibleLines).toBe(1);

      // After one more interval, second line
      act(() => {
        vi.advanceTimersByTime(LINE_INTERVAL_MS);
      });
      expect(result.current.visibleLines).toBe(2);

      // Third line
      act(() => {
        vi.advanceTimersByTime(LINE_INTERVAL_MS);
      });
      expect(result.current.visibleLines).toBe(3);
    });

    it("transitions to 'complete' after all lines + tail", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      const totalTime =
        CRT_WARMUP_MS + BOOT_LINES.length * LINE_INTERVAL_MS + TAIL_MS;
      act(() => {
        vi.advanceTimersByTime(totalTime + 50);
      });

      expect(result.current.state).toBe("complete");
      expect(result.current.visibleLines).toBe(BOOT_LINES.length);
    });

    it("sets boot-seen flag in localStorage on completion", () => {
      renderHook(() => useBootSequence({ lines: BOOT_LINES }));

      const totalTime =
        CRT_WARMUP_MS + BOOT_LINES.length * LINE_INTERVAL_MS + TAIL_MS;
      act(() => {
        vi.advanceTimersByTime(totalTime + 50);
      });

      expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe("true");
    });
  });

  describe("skip functionality", () => {
    it("skip() immediately completes the boot", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      // Mid-boot: only first line shown
      act(() => {
        vi.advanceTimersByTime(CRT_WARMUP_MS + 50);
      });
      expect(result.current.visibleLines).toBe(1);

      // Skip
      act(() => {
        result.current.skip();
      });

      expect(result.current.state).toBe("complete");
      expect(result.current.visibleLines).toBe(BOOT_LINES.length);
    });

    it("skip() sets the boot-seen flag", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      act(() => {
        result.current.skip();
      });

      expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe("true");
    });

    it("skip() clears pending timers (no state update after unmount)", () => {
      const { result, unmount } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      act(() => {
        result.current.skip();
      });

      unmount();

      // Advancing timers should not throw or cause issues
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(5000);
        });
      }).not.toThrow();
    });
  });

  describe("return visit (boot-seen already set)", () => {
    it("immediately completes when boot-seen is set", () => {
      localStorage.setItem(BOOT_SEEN_KEY, "true");

      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      expect(result.current.state).toBe("complete");
      expect(result.current.visibleLines).toBe(0);
    });

    it("does not schedule any timers when boot-seen is set", () => {
      localStorage.setItem(BOOT_SEEN_KEY, "true");

      renderHook(() => useBootSequence({ lines: BOOT_LINES }));

      // Advancing timers should not change anything
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(10000);
        });
      }).not.toThrow();
    });
  });

  describe("reduced motion", () => {
    it("immediately completes when reducedMotion is true", () => {
      const { result } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES, reducedMotion: true }),
      );

      expect(result.current.state).toBe("complete");
    });

    it("completes even without boot-seen flag when reducedMotion is true", () => {
      expect(localStorage.getItem(BOOT_SEEN_KEY)).toBeNull();

      renderHook(() =>
        useBootSequence({ lines: BOOT_LINES, reducedMotion: true }),
      );

      expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe("true");
    });
  });

  describe("cleanup on unmount", () => {
    it("cleans up timers when unmounted mid-boot", () => {
      const { unmount } = renderHook(() =>
        useBootSequence({ lines: BOOT_LINES }),
      );

      unmount();

      // No errors when timers fire after unmount
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(10000);
        });
      }).not.toThrow();
    });
  });
});
