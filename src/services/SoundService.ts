// ================================================================
// SoundService — Web Audio API sound effects (VAL-BOOT-012)
// ================================================================
//
// Generates procedural terminal sound effects (typing clicks, beep)
// using the Web Audio API. No external audio files needed.
//
// Key behaviors:
// - Sound is OFF by default — `enabled` starts as `false`.
// - AudioContext is created lazily on first user interaction (click,
//   keydown, touch) to comply with browser autoplay policies.
// - All public methods are safe to call before the context is ready —
//   they silently no-op when sound is disabled or context isn't running.
// - Errors during sound generation are caught and logged at debug level
//   so they never surface as uncaught exceptions in the console.
// - Toggling sound on after the context is already running works
//   immediately (no re-init needed).

let audioCtx: AudioContext | null = null;
let _enabled = false;

/** Mutable flag — true after the first user-gesture activates audio. */
let contextUnlocked = false;

/**
 * Must be called from a user-gesture handler (click, keydown, touchstart)
 * so the browser allows the AudioContext to resume.
 */
function ensureContext(): AudioContext | null {
  if (!_enabled) return null;

  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      // Web Audio not supported — silently disabled
      return null;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// ---- Public API -----------------------------------------------------------

/**
 * Enable or disable all sound effects. Setting this to `true` does NOT
 * create the AudioContext — that happens lazily on the next user-gesture
 * call to ensure autoplay-policy compliance.
 */
export function setSoundEnabled(enabled: boolean): void {
  _enabled = enabled;
  contextUnlocked = false;
}

/** Return whether sound effects are currently enabled. */
export function isSoundEnabled(): boolean {
  return _enabled;
}

/**
 * Notify the service that a user gesture occurred. This is the safe
 * moment to create / resume the AudioContext. Call this from click,
 * keydown, or touch event handlers.
 */
export function onUserGesture(): void {
  if (!contextUnlocked) {
    contextUnlocked = true;
    ensureContext();
  }
}

/**
 * Play a short typing "click" sound — a burst of filtered noise.
 *
 * Safe to call at any time; silently no-ops when sound is disabled,
 * context isn't ready, or reduced-motion is active.
 */
export function playTyping(reducedMotion = false): void {
  if (!_enabled || reducedMotion) return;

  const ctx = ensureContext();
  if (!ctx || ctx.state !== "running") return;

  try {
    const now = ctx.currentTime;

    // White noise burst
    const bufferSize = ctx.sampleRate * 0.03; // 30ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to make it sound like a key click
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1600 + Math.random() * 800;
    filter.Q.value = 2;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.04);
  } catch {
    // Silently ignore — sound is non-critical
  }
}

/**
 * Play a terminal beep — a short sine wave at ~800 Hz.
 *
 * Safe to call at any time; silently no-ops when disabled.
 */
export function playBeep(reducedMotion = false): void {
  if (!_enabled || reducedMotion) return;

  const ctx = ensureContext();
  if (!ctx || ctx.state !== "running") return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 800;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Silently ignore
  }
}

/**
 * Play a short "boot typing" sequence — multiple clicks in rapid succession.
 * Used during the boot sequence animation.
 */
export function playBootTyping(reducedMotion = false): void {
  if (!_enabled || reducedMotion) return;

  const ctx = ensureContext();
  if (!ctx || ctx.state !== "running") return;

  try {
    const count = 5;
    const now = ctx.currentTime;

    for (let i = 0; i < count; i++) {
      const t = now + i * 0.06;

      const bufferSize = ctx.sampleRate * 0.02;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * 0.06;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2000 + Math.random() * 500;
      filter.Q.value = 2;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.1, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start(t);
      noise.stop(t + 0.03);
    }
  } catch {
    // Silently ignore
  }
}
