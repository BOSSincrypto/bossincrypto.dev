import { useEffect, useRef, useCallback } from "react";

// ================================================================
// FuturisticBackground — starfield + grid background layer
// ================================================================
//
// Renders two layers behind all content (z-index 0):
// 1. A canvas-based starfield with 180 slowly drifting dots.
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

const PARTICLE_COUNT = 180;
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
  isBright: boolean;       // bright stars get a glow halo
  hue: number;             // subtle color tint: cool white, cyan, or amber
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
    const roll = rng();
    // 60% tiny (0.5–0.8px), 25% medium (1–1.5px), 15% bright (2–3px with glow)
    let radius: number;
    let isBright: boolean;
    if (roll < 0.6) {
      radius = 0.5 + rng() * 0.3;
      isBright = false;
    } else if (roll < 0.85) {
      radius = 1.0 + rng() * 0.5;
      isBright = false;
    } else {
      radius = 2.0 + rng() * 1.0;
      isBright = true;
    }

    // Subtle color variety: mostly cool white, occasional cyan or amber tint
    const hueRoll = rng();
    let hue: number;
    if (hueRoll < 0.75) {
      hue = 210; // cool white / blue-white
    } else if (hueRoll < 0.90) {
      hue = 185; // cyan
    } else {
      hue = 40;  // warm amber
    }

    stars.push({
      x: rng() * width,
      y: rng() * height,
      radius,
      opacity: 0.35 + rng() * 0.6,        // 0.35–0.95
      driftX: -3 + rng() * 6,              // -3 to +3 px/s
      driftY: -2 + rng() * 4,              // -2 to +2 px/s
      twinkleSpeed: 0.3 + rng() * 1.2,     // 0.3–1.5 rad/s
      twinklePhase: rng() * Math.PI * 2,
      isBright,
      hue,
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

    // Fill with a dark radial gradient background so the page has a dark
    // foundation even if the body background is transparent.  The gradient
    // is darkest at center (space-like depth) and subtly lighter at edges.
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
    bgGrad.addColorStop(0, "rgba(5, 5, 10, 1)");
    bgGrad.addColorStop(0.6, "rgba(8, 8, 14, 0.98)");
    bgGrad.addColorStop(1, "rgba(12, 12, 20, 0.9)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

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

      // Convert hue to RGB with a cool-white / cyan / amber tint.
      const hue = s.hue;
      const sat = hue === 210 ? 8 : hue === 185 ? 35 : 50; // lower sat for cool white
      const lum = 85 + alpha * 15;
      const hslStr = `hsl(${hue}, ${sat}%, ${lum}%)`;

      // ── Glow halo for bright stars ──
      if (s.isBright) {
        const glowRadius = s.radius * 4;
        const glowGrad = ctx.createRadialGradient(
          s.x, s.y, s.radius * 0.3,
          s.x, s.y, glowRadius,
        );
        const glowAlpha = alpha * 0.5;
        glowGrad.addColorStop(0, `hsla(${hue}, ${sat}%, ${lum}%, ${glowAlpha})`);
        glowGrad.addColorStop(0.4, `hsla(${hue}, ${sat}%, ${lum}%, ${glowAlpha * 0.3})`);
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      }

      // ── Star core ──
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = hslStr;
      ctx.fill();

      // ── Extra bright core for larger stars ──
      if (s.radius >= 1.5) {
        const innerAlpha = Math.min(1, alpha * 1.3);
        const innerStr = `hsla(${hue}, 5%, 95%, ${innerAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = innerStr;
        ctx.fill();
      }
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
