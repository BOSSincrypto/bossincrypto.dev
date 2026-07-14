import { useEffect, useRef, useCallback } from "react";

// ================================================================
// FuturisticBackground — starfield + grid background layer
// ================================================================
//
// Renders two layers behind all content (z-index 0):
// 1. A canvas-based starfield with ~120 slowly drifting dots.
// 2. A CSS-based holographic scan grid.
//
// Performance / accessibility:
// - FPS throttled to ~30 fps via delta accumulation.
// - Pauses when the browser tab is hidden (visibilitychange).
// - Disabled on narrow viewports (< 768px) to save battery on mobile.
// - Disabled when prefers-reduced-motion is set.
// - aria-hidden="true" so screen readers ignore both layers.
// - Coexists with MatrixRain — both sit at z-index 0, pointer-events: none.

export interface FuturisticBackgroundProps {
  /** When `false`, the component is not mounted at all. */
  visible: boolean;
  /** OS / browser reduced-motion preference (suppresses animation). */
  reducedMotion: boolean;
}

// ── Starfield constants ──────────────────────────────────────────

const PARTICLE_COUNT = 130;
const FRAME_INTERVAL_MS = 1000 / 30; // ~30 FPS target
const MOBILE_BREAKPOINT = 768;

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;         // base opacity 0.2–0.9
  driftX: number;          // px/s horizontal drift
  driftY: number;          // px/s vertical drift
  twinkleSpeed: number;    // phase change per second
  twinklePhase: number;
}

/** Seeded PRNG for deterministic star initialisation. */
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createStars(width: number, height: number): Star[] {
  const rng = createRng(137);
  const stars: Star[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    stars.push({
      x: rng() * width,
      y: rng() * height,
      radius: rng() < 0.7 ? 0.5 : 1.0,   // most are 0.5px, a few are 1px
      opacity: 0.35 + rng() * 0.6,        // 0.35–0.95
      driftX: -3 + rng() * 6,              // -3 to +3 px/s
      driftY: -2 + rng() * 4,              // -2 to +2 px/s
      twinkleSpeed: 0.3 + rng() * 1.2,     // 0.3–1.5 rad/s
      twinklePhase: rng() * Math.PI * 2,
    });
  }

  return stars;
}

// ── Component ─────────────────────────────────────────────────────

export default function FuturisticBackground({
  visible,
  reducedMotion,
}: FuturisticBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const frozenRef = useRef(false);
  const isMobileRef = useRef(false);

  // ── Mobile detection ──────────────────────────────────────────

  const updateMobile = useCallback(() => {
    isMobileRef.current =
      typeof window !== "undefined" &&
      window.innerWidth < MOBILE_BREAKPOINT;
  }, []);

  // ── Animation loop (throttled to ~30 fps) ────────────────────

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    // Cap to avoid huge jumps when tab becomes visible again
    const dt = Math.min(rawDt, 0.15);

    // Accumulate time; only render when enough has elapsed
    accumulatorRef.current += dt;
    if (accumulatorRef.current < FRAME_INTERVAL_MS / 1000) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    // Use the accumulated time for smooth integration
    const frameDt = accumulatorRef.current;
    accumulatorRef.current = 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear with full dark background
    ctx.clearRect(0, 0, w, h);

    const stars = starsRef.current;

    // Draw each star
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      // Update position with drift
      s.x += s.driftX * frameDt;
      s.y += s.driftY * frameDt;

      // Wrap around edges
      if (s.x < 0) s.x += w;
      if (s.x > w) s.x -= w;
      if (s.y < 0) s.y += h;
      if (s.y > h) s.y -= h;

      // Update twinkle phase
      s.twinklePhase += s.twinkleSpeed * frameDt;
      if (s.twinklePhase > Math.PI * 2) s.twinklePhase -= Math.PI * 2;

      // Twinkle modulates opacity sinusoidally around base opacity.
      // Range: opacity × 0.7  to  opacity × 1.0 (gentler fade so stars
      // never disappear completely).
      const twinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase);
      const alpha = s.opacity * (0.7 + 0.3 * twinkle);

      // Cool cyan-white: shift toward white with a subtle cyan cast.
      const r = Math.floor(230 * alpha + 25);
      const g = Math.floor(250 * alpha + 5);
      const b = Math.floor(255 * alpha);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // ── Lifecycle ──────────────────────────────────────────────────

  useEffect(() => {
    updateMobile();
    const controller = new AbortController();
    window.addEventListener("resize", updateMobile, {
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [updateMobile]);

  // Visibility (tab inactive) pause / resume
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        frozenRef.current = true;
        cancelAnimationFrame(rafRef.current);
        lastTimeRef.current = 0;
        accumulatorRef.current = 0;
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
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      starsRef.current = createStars(window.innerWidth, window.innerHeight);

      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
    };
  }, [visible, reducedMotion, animate]);

  // Resize handler — rebuild stars for new dimensions
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
      starsRef.current = createStars(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Mobile check for render decision
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

  if (!visible || isMobile) return null;

  return (
    <>
      {/* Starfield canvas */}
      <canvas
        ref={canvasRef}
        data-testid="starfield-canvas"
        className="starfield-canvas"
        aria-hidden="true"
      />

      {/* Holographic grid overlay (CSS) */}
      <div
        data-testid="holographic-grid"
        className="holographic-grid"
        aria-hidden="true"
      />
    </>
  );
}
