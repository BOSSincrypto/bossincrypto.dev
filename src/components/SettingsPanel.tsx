import { useEffect, useRef } from "react";
import type { SettingsState } from "../types";

export type SettingsKey = keyof SettingsState;

export interface SettingsPanelProps {
  /** When `true`, the panel is visible. */
  open: boolean;
  /** Current settings state. */
  settings: SettingsState;
  /** Called when a toggle is activated. Receives the setting key. */
  onToggle: (key: SettingsKey) => void;
  /** Called when the panel requests to close (Escape or close button). */
  onClose: () => void;
}

interface ToggleConfig {
  key: SettingsKey;
  label: string;
  command: string;
  placeholder: boolean;
}

const TOGGLES: readonly ToggleConfig[] = [
  {
    key: "scanlines",
    label: "Scanlines",
    command: "scanlines",
    placeholder: false,
  },
  {
    key: "matrixRain",
    label: "Matrix Rain",
    command: "matrix-rain",
    placeholder: true,
  },
  {
    key: "sound",
    label: "Sound",
    command: "sound",
    placeholder: true,
  },
];

/**
 * SettingsPanel — toggleable visual/audio effect controls.
 *
 * Renders three switches (scanlines, matrix rain, sound) in a terminal-styled
 * panel that slides in from the right. Matrix rain and sound are placeholders
 * (their effects ship in a later milestone) but the toggles are functional and
 * persist their state.
 *
 * Keyboard accessibility (VAL-BOOT-013):
 * - Each toggle is a native `<button role="switch">` — focusable via Tab and
 *   operable with Enter/Space through the browser's native click activation.
 * - Escape closes the panel and returns focus to the trigger button.
 * - All focusable elements have a visible focus ring (focus-visible).
 *
 * The panel does NOT render when `open` is `false`.
 */
export default function SettingsPanel({
  open,
  settings,
  onToggle,
  onClose,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstToggleRef = useRef<HTMLButtonElement>(null);

  // Focus the first toggle when the panel opens.
  useEffect(() => {
    if (open && firstToggleRef.current) {
      firstToggleRef.current.focus();
    }
  }, [open]);

  // Global Escape handler while the panel is open.
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        data-testid="settings-backdrop"
        className="fixed inset-0 z-[10001] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        data-testid="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="settings-panel-enter fixed right-0 top-0 z-[10002] flex h-full w-72 flex-col gap-4 border-l border-terminal-green/40 bg-terminal-bg p-6 font-mono text-sm shadow-[-8px_0_30px_-10px_rgba(0,0,0,0.8)]"
      >
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-terminal-green/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-terminal-green">$</span>
            <span className="text-terminal-amber">settings</span>
            <span
              data-testid="settings-cursor"
              className="terminal-cursor inline-block h-3.5 w-1.5 translate-y-0.5"
              aria-hidden="true"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="text-terminal-dim transition-colors hover:text-terminal-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
          >
            [x]
          </button>
        </div>

        {/* Toggle switches */}
        <div className="flex flex-col gap-3" role="group" aria-label="Effect toggles">
          {TOGGLES.map((toggle, index) => {
            const checked = settings[toggle.key];
            const isPlaceholder = toggle.placeholder;
            return (
              <button
                key={toggle.key}
                ref={index === 0 ? firstToggleRef : undefined}
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={toggle.label}
                onClick={() => onToggle(toggle.key)}
                className="group flex w-full items-center justify-between rounded border border-terminal-green/20 bg-terminal-green/5 px-3 py-2.5 text-left transition-colors hover:border-terminal-green/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-terminal-text">
                    <span className="text-terminal-green">$</span>{" "}
                    {toggle.command}
                  </span>
                  {isPlaceholder && (
                    <span className="text-[10px] uppercase tracking-wider text-terminal-dim">
                      coming soon
                    </span>
                  )}
                </span>
                <span
                  className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
                    checked
                      ? "border-terminal-green bg-terminal-green/30"
                      : "border-terminal-dim bg-terminal-dim/20"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
                      checked
                        ? "left-4 bg-terminal-green"
                        : "left-0.5 bg-terminal-dim"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="mt-auto border-t border-terminal-green/20 pt-3 text-xs text-terminal-dim">
          <p>
            <span className="text-terminal-amber">tip:</span> press{" "}
            <span className="text-terminal-cyan">esc</span> to close
          </p>
        </div>
      </div>
    </>
  );
}
