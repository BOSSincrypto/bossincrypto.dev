import { useEffect, useRef, useCallback } from "react";

// ================================================================
// MatrixRain — canvas-based digital rain background (VAL-BOOT-005)
// ================================================================
//
// Renders a full-viewport <canvas> with falling characters styled like
// the iconic Matrix digital rain. The animation runs via
// requestAnimationFrame with delta-time to be frame-rate independent.
// The canvas sits at z-index 0 behind all foreground content and has
// pointer-events: none so it never blocks interaction.
//
// Performance / accessibility:
// - Pauses when the browser tab is hidden (visibilitychange).
// - Does not render on narrow viewports (< 768px) to save battery on
//   mobile (feature spec). Also disabled when the component is told to
//   hide or when prefers-reduced-motion is set.
// - aria-hidden="true" so screen readers ignore it.

export interface MatrixRainProps {
  /** When `false`, the canvas is not mounted at all. */
  visible: boolean;
  /** OS / browser reduced-motion preference (suppresses animation). */
  reducedMotion: boolean;
}

/** Characters used in the rain: katakana 0x30A0-0x30FF + latin + digits */
const KATAKANA_START = 0x30a0;
const KATAKANA_END = 0x30ff;
const LATIN_DIGITS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChar(rng: () => number): string {
  const k = rng() > 0.35 ? String.fromCodePoint(KATAKANA_START + Math.floor(rng() * (KATAKANA_END - KATAKANA_START + 1))) : LATIN_DIGITS[Math.floor(rng() * LATIN_DIGITS.length)];
  return k;
}

/** Seeded PRNG so the rain looks deterministic on resize (cosmetic). */
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MOBILE_BREAKPOINT = 768;

// ---- Column descriptor ---------------------------------------------------

interface RainColumn {
  x: number;
  y: number;
  speed: number;          // px/s (scroll speed)
  charSize: number;
  length: number;          // trail length in chars
  chars: string[];         // ring buffer of recent characters
  headIndex: number;       // write position in ring buffer
  rng: () => number;
}

// ---- Helpers --------------------------------------------------------------

function createColumns(canvas: HTMLCanvasElement, rng: () => number): RainColumn[] {
  const charSize = 16;
  const columnWidth = charSize + 4;
  const cols = Math.ceil(canvas.width / columnWidth);
  const columns: RainColumn[] = [];

  for (let i = 0; i < cols; i++) {
    const length = 6 + Math.floor(rng() * 12);   // trail 6-18 chars
    columns.push({
      x: i * columnWidth + 2,
      y: -(rng() * canvas.height),                // stagger initial y
      speed: 120 + rng() * 280,                   // 120-400 px/s
      charSize,
      length,
      chars: new Array(length).fill(""),
      headIndex: 0,
      rng: createRng(Math.floor(i * 9999 + rng() * 9999)),
    });
  }

  return columns;
}

// ================================================================
// Component
// ================================================================

export default function MatrixRain({ visible, reducedMotion }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const columnsRef = useRef<RainColumn[]>([]);
  const lastTimeRef = useRef<number>(0);
  const frozenRef = useRef(false);

  // Mobile detection on mount + resize
  const isMobileRef = useRef(false);

  const updateMobile = useCallback(() => {
    isMobileRef.current = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
  }, []);

  // Main animation loop
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    const dt = (timestamp - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = timestamp;

    // Cap dt to avoid huge jumps when tab becomes visible again
    const cappedDt = Math.min(dt, 0.1);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fade the whole canvas (trail effect)
    ctx.fillStyle = "rgba(10, 10, 10, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = columnsRef.current;
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];

      // Draw the trail
      for (let j = 0; j < col.length; j++) {
        const idx = (col.headIndex - j + col.length) % col.length;
        const ch = col.chars[idx];
        if (!ch) continue;

        // Trail opacity: head is brightest, tail fades
        const t = 1 - j / col.length;
        const alpha = t * 0.8;
        const green = Math.floor(120 * t + 135); // 135-255

        ctx.font = `${col.charSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = `rgba(0, ${green}, 65, ${alpha})`;
        ctx.fillText(ch, col.x, col.y - j * col.charSize);
      }

      // Move column
      col.y += col.speed * cappedDt;

      // Add new random character periodically
      if (col.y % col.charSize < col.speed * cappedDt || col.chars[col.headIndex] === "") {
        col.chars[col.headIndex] = randomChar(col.rng);
        col.headIndex = (col.headIndex + 1) % col.length;
      }

      // Reset column when head goes off screen
      if (col.y > canvas.height + col.length * col.charSize) {
        col.y = -(col.length * col.charSize * col.rng());
        col.speed = 120 + col.rng() * 280;
        col.chars.fill("");
        col.headIndex = 0;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ---- Lifecycle & resize -------------------------------------------------

  useEffect(() => {
    updateMobile();
    const abort = new AbortController();

    window.addEventListener("resize", updateMobile, { signal: abort.signal });
    return () => abort.abort();
  }, [updateMobile]);

  // Visibility (tab inactive) pause / resume
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        frozenRef.current = true;
        cancelAnimationFrame(rafRef.current);
        lastTimeRef.current = 0;
      } else if (!reducedMotion && !isMobileRef.current && visible) {
        frozenRef.current = false;
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [animate, reducedMotion, visible]);

  // Start / stop based on visibility + reducedMotion + mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const shouldRun = visible && !reducedMotion && !isMobileRef.current;
    frozenRef.current = !shouldRun;

    if (shouldRun) {
      // Set canvas size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Dark background for first frame
        ctx.fillStyle = "rgba(10, 10, 10, 1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Create columns
      columnsRef.current = createColumns(canvas, createRng(42));

      // Start the loop
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [visible, reducedMotion, animate]);

  // Resize handler
  useEffect(() => {
    const handler = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      // Rebuild columns for new width
      columnsRef.current = createColumns(canvas, createRng(42));
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Don't render at all when not visible
  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="matrix-canvas"
      className="matrix-canvas"
      aria-hidden="true"
    />
  );
}
