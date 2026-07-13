import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCountUpOptions {
  /** Target value to count up to. */
  end: number;
  /** Duration of the animation in milliseconds (default: 1000). */
  duration?: number;
  /** Start value (default: 0). */
  start?: number;
  /** Whether to start the animation immediately (default: true). */
  autoplay?: boolean;
  /** Number of decimal places to round to (default: 0). */
  decimals?: number;
}

export interface UseCountUpResult {
  /** The current animated value. */
  value: number;
  /** Whether the animation is currently in progress. */
  animating: boolean;
  /** Whether the animation has completed. */
  done: boolean;
  /** Restart the animation from the start value. */
  restart: () => void;
}

/**
 * useCountUp — animated count-up hook using requestAnimationFrame.
 *
 * Animates from `start` to `end` over `duration` milliseconds with an
 * ease-out deceleration curve. Resets when `end` changes.
 *
 * ```tsx
 * const { value } = useCountUp({ end: 100, duration: 1000 });
 * ```
 */
export function useCountUp({
  end,
  duration = 1000,
  start: startValue = 0,
  autoplay = true,
  decimals = 0,
}: UseCountUpOptions): UseCountUpResult {
  const [value, setValue] = useState(startValue);
  const [animating, setAnimating] = useState(false);
  const [done, setDone] = useState(false);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startValRef = useRef(startValue);
  const endRef = useRef(end);

  const animate = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out quad: decelerating towards the end value.
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = startValRef.current + (endRef.current - startValRef.current) * eased;

    setValue(Number(current.toFixed(decimals)));

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      setValue(endRef.current);
      setAnimating(false);
      setDone(true);
    }
  }, [duration, decimals]);

  const startAnimation = useCallback(() => {
    setAnimating(true);
    setDone(false);
    setValue(startValue);
    startTimeRef.current = performance.now();
    startValRef.current = startValue;
    endRef.current = end;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, end, startValue]);

  const restart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startAnimation();
  }, [startAnimation]);

  useEffect(() => {
    if (autoplay) {
      cancelAnimationFrame(rafRef.current);
      startAnimation();
    }
    return () => cancelAnimationFrame(rafRef.current);
    // Only react to `end` and `autoplay` changes; `startValue` is initial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, autoplay, startAnimation]);

  return { value, animating, done, restart };
}
