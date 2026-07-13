import { useEffect, useRef } from "react";
import { useBootSequence } from "../hooks/useBootSequence";
import { playTyping } from "../services/SoundService";

/**
 * Boot text lines printed progressively during the CRT power-on sequence.
 */
const BOOT_LINES = [
  "> Initializing BOSS protocol...",
  "> Loading project data...",
  "> Establishing connection...",
  "> Decrypting repository cache...",
  "> Calibrating CRT display...",
  "> Boot sequence complete.",
] as const;

export interface BootSequenceProps {
  /**
   * When `true`, the boot is skipped instantly per `prefers-reduced-motion`.
   */
  reducedMotion: boolean;
  /** Called exactly once when the boot finishes (naturally or via skip). */
  onComplete?: () => void;
}

/**
 * BootSequence — CRT power-on animation with terminal boot text.
 *
 * Shows a full-screen black overlay that powers on (expanding from a thin
 * line) while boot text lines appear one-by-one. Plays once on first visit
 * only (controlled by the `boot-seen` localStorage flag inside the hook).
 *
 * Skip methods (VAL-BOOT-003):
 * - Click anywhere on the overlay
 * - Press Escape, Enter, or Space (global keyboard listener)
 * - Click the visible skip button
 *
 * The overlay is `aria-hidden="true"` because it is purely decorative
 * (VAL-BOOT-014). Screen-reader users are not impacted — the boot text is
 * cosmetic and the keyboard skip works regardless.
 *
 * When `reducedMotion` is `true`, the boot is skipped entirely and
 * `onComplete` fires immediately (VAL-BOOT-011).
 */
export default function BootSequence({
  reducedMotion,
  onComplete,
}: BootSequenceProps) {
  const { state, visibleLines, skip } = useBootSequence({
    lines: [...BOOT_LINES],
    reducedMotion,
  });

  // Fire onComplete exactly once when boot reaches 'complete'.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const firedRef = useRef(false);

  // Play a typing click sound each time a new boot line appears.
  const prevLinesRef = useRef(visibleLines);
  useEffect(() => {
    if (visibleLines > prevLinesRef.current && state !== "complete") {
      playTyping(reducedMotion);
    }
    prevLinesRef.current = visibleLines;
  }, [visibleLines, state, reducedMotion]);

  useEffect(() => {
    if (state === "complete" && !firedRef.current) {
      firedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [state]);

  // Global keyboard skip: Escape, Enter, or Space while boot is playing.
  useEffect(() => {
    if (state === "complete") return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        // preventDefault guards against page scroll when Space is pressed
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [state, skip]);

  return (
    <>
      {state !== "complete" && (
        <div
          data-testid="boot-overlay"
          className="boot-overlay crt-power-on"
          onClick={skip}
          aria-hidden="true"
          role="presentation"
        >
          {/* Moving scan band (decorative CRT effect) */}
          <div className="crt-scan-band" />

          {/* Boot text container — responsive padding + text sizing for mobile */}
          <div
            data-testid="boot-text"
            className="relative z-10 flex min-h-full w-full max-w-2xl flex-col items-start justify-center px-4 py-8 font-mono text-xs text-terminal-green sm:px-8 sm:text-sm md:text-base"
          >
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="boot-line py-0.5">
                {line}
              </div>
            ))}

            {/* Blinking cursor while boot text is still typing */}
            {visibleLines < BOOT_LINES.length && (
              <span
                data-testid="boot-cursor"
                className="terminal-cursor mt-1 inline-block h-4 w-2 translate-y-0.5"
              />
            )}
          </div>

          {/* Skip button — visible affordance for sighted users, min 44px touch target */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skip();
            }}
            className="absolute bottom-4 right-4 z-20 flex h-11 min-h-[44px] items-center justify-center px-4 font-mono text-xs text-terminal-dim transition-colors hover:text-terminal-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
            tabIndex={-1}
          >
            [ skip ]
          </button>
        </div>
      )}
    </>
  );
}
