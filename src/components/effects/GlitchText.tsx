import type { ReactNode } from "react";

// ================================================================
// GlitchText — reusable glitch text component (VAL-BOOT-008, VAL-BOOT-009)
// ================================================================
//
// Two modes:
// - "hover": children get an RGB-split text-shadow + micro-jitter on hover.
//   Designed for project cards, links, and interactive elements. Wraps
//   the text in a <span> with the .glitch-hover CSS class.
// - "static": children get a layered text-shadow aesthetic (perpetual
//   RGB split / CRT glow) with occasional glitch keyframe animation.
//   Designed for section titles and non-interactive heading text. Uses
//   the .glitch-static CSS class.
//
// Reduced-motion: both modes suppress animations and shadows when the
// user has `prefers-reduced-motion: reduce`. The component accepts a
// `reducedMotion` prop so the ClassName is cleanly toggled.

export interface GlitchTextProps {
  children: ReactNode;
  /** "hover" for interactive elements, "static" for section titles. */
  mode?: "hover" | "static";
  /** Disable animations when the OS reports reduced-motion preference. */
  reducedMotion?: boolean;
  /** Optional additional className applied to the wrapper. */
  className?: string;
}

export default function GlitchText({
  children,
  mode = "static",
  reducedMotion = false,
  className = "",
}: GlitchTextProps) {
  const baseClass = mode === "hover" ? "glitch-hover" : "glitch-static";
  const reducedClass = reducedMotion ? "glitch-reduced" : "";

  return (
    <span
      data-testid="glitch-text"
      className={`${baseClass} ${reducedClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
