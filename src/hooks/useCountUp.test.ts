import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountUp } from "./useCountUp";

/**
 * Advance fake timers by the given duration, then schedule a few extra
 * rAF ticks so the final callback that sets `done = true` fires.
 *
 * jsdom's requestAnimationFrame runs on ~16ms frame boundaries via fake
 * timers.  Calling advanceTimersByTime(duration) fires rAF callbacks at
 * 16, 32, … 992ms, but NOT at exactly `duration` ms.  We need one extra
 * 32ms advance so the callback with progress >= 1 fires.
 */
function advanceAnimationFrames(ms: number) {
  vi.advanceTimersByTime(ms + 32);
}

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at the start value", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, start: 50, duration: 1000, autoplay: false }),
    );
    expect(result.current.value).toBe(50);
    expect(result.current.animating).toBe(false);
    expect(result.current.done).toBe(false);
  });

  it("starts at 0 by default", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 1000, autoplay: false }),
    );
    expect(result.current.value).toBe(0);
  });

  it("animates to the end value within the duration", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 1000 }),
    );

    // Should be animating
    expect(result.current.animating).toBe(true);
    expect(result.current.done).toBe(false);

    // After 500ms, should be partially animated
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.value).toBeGreaterThan(0);
    expect(result.current.value).toBeLessThan(100);
    expect(result.current.animating).toBe(true);

    // After full duration, should reach end value
    act(() => {
      advanceAnimationFrames(1000);
    });

    expect(result.current.value).toBe(100);
    expect(result.current.animating).toBe(false);
    expect(result.current.done).toBe(true);
  });

  it("restart resets and plays again", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 1000 }),
    );

    // Advance to completion
    act(() => {
      advanceAnimationFrames(1000);
    });

    expect(result.current.done).toBe(true);
    expect(result.current.value).toBe(100);

    // Restart
    act(() => {
      result.current.restart();
    });

    expect(result.current.animating).toBe(true);
    expect(result.current.done).toBe(false);
    expect(result.current.value).toBe(0);

    act(() => {
      advanceAnimationFrames(1000);
    });

    expect(result.current.value).toBe(100);
    expect(result.current.done).toBe(true);
  });

  it("handles end value of 0", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 0, duration: 500 }),
    );

    act(() => {
      advanceAnimationFrames(500);
    });

    expect(result.current.value).toBe(0);
    expect(result.current.done).toBe(true);
  });

  it("handles a large number correctly", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 9999, duration: 1000 }),
    );

    act(() => {
      advanceAnimationFrames(1000);
    });

    expect(result.current.value).toBe(9999);
    expect(result.current.done).toBe(true);
  });

  it("animates to same value on end change", () => {
    const { result, rerender } = renderHook(
      ({ end }: { end: number }) =>
        useCountUp({ end, duration: 500 }),
      { initialProps: { end: 50 } },
    );

    act(() => {
      advanceAnimationFrames(500);
    });

    expect(result.current.value).toBe(50);
    expect(result.current.done).toBe(true);

    // Change end value
    rerender({ end: 100 });

    act(() => {
      advanceAnimationFrames(500);
    });

    expect(result.current.value).toBe(100);
  });

  it("respects autoplay=false", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 500, autoplay: false }),
    );

    expect(result.current.animating).toBe(false);
    expect(result.current.value).toBe(0);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.value).toBe(0);
  });

  it("respects decimals option", () => {
    const { result } = renderHook(() =>
      useCountUp({ end: 100, duration: 1000, decimals: 1 }),
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should have at most 1 decimal place
    const str = String(result.current.value);
    const dotIndex = str.indexOf(".");
    if (dotIndex !== -1) {
      expect(str.length - dotIndex - 1).toBeLessThanOrEqual(1);
    }

    act(() => {
      advanceAnimationFrames(1000);
    });

    expect(result.current.value).toBe(100);
  });
});
