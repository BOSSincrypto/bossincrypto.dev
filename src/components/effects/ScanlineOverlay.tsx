/**
 * ScanlineOverlay — a fixed, full-viewport CRT scanline effect.
 *
 * Renders a layer of horizontal repeating-linear-gradient lines across the
 * entire viewport. Decorative: `aria-hidden="true"` and `pointer-events: none`
 * so it never interferes with content or assistive tech.
 *
 * The component renders `null` when `visible` is `false`, so toggling
 * scanlines off in SettingsPanel cleanly removes the overlay from the DOM.
 *
 * Satisfies VAL-BOOT-004, VAL-BOOT-014, VAL-BOOT-011 (reduced-motion handled
 * in CSS).
 */
export interface ScanlineOverlayProps {
  /** When `false`, the overlay is not rendered at all. */
  visible: boolean;
}

export default function ScanlineOverlay({ visible }: ScanlineOverlayProps) {
  if (!visible) return null;

  return (
    <div
      data-testid="scanline-overlay"
      className="scanline-overlay"
      aria-hidden="true"
    />
  );
}
