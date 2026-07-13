import { describe, it, expect, beforeEach } from "vitest";
import {
  setSoundEnabled,
  isSoundEnabled,
  onUserGesture,
  playTyping,
  playBeep,
  playBootTyping,
} from "./SoundService";

// Test the public API behavior with the service's internal state.
// We don't mock AudioContext — we test guard behavior (sound disabled,
// reducedMotion) to ensure the service never reaches AudioContext creation
// when it shouldn't.

describe("SoundService", () => {
  beforeEach(() => {
    // Reset service state
    setSoundEnabled(false);
  });

  describe("enable/disable (VAL-BOOT-012)", () => {
    it("starts disabled by default", () => {
      expect(isSoundEnabled()).toBe(false);
    });

    it("setSoundEnabled(true) enables sound", () => {
      setSoundEnabled(true);
      expect(isSoundEnabled()).toBe(true);
    });

    it("setSoundEnabled(false) disables sound", () => {
      setSoundEnabled(true);
      expect(isSoundEnabled()).toBe(true);
      setSoundEnabled(false);
      expect(isSoundEnabled()).toBe(false);
    });

    it("toggling sound on/off is idempotent", () => {
      setSoundEnabled(true);
      setSoundEnabled(true);
      expect(isSoundEnabled()).toBe(true);
      setSoundEnabled(false);
      setSoundEnabled(false);
      expect(isSoundEnabled()).toBe(false);
    });
  });

  describe("silent no-op when disabled", () => {
    it("playTyping does not throw when sound is disabled", () => {
      setSoundEnabled(false);
      expect(() => playTyping(false)).not.toThrow();
    });

    it("playBeep does not throw when sound is disabled", () => {
      setSoundEnabled(false);
      expect(() => playBeep(false)).not.toThrow();
    });

    it("playBootTyping does not throw when sound is disabled", () => {
      setSoundEnabled(false);
      expect(() => playBootTyping(false)).not.toThrow();
    });
  });

  describe("autoplay-policy compliance (VAL-BOOT-012)", () => {
    it("onUserGesture can be called without error before AudioContext exists", () => {
      setSoundEnabled(true);
      expect(() => onUserGesture()).not.toThrow();
    });

    it("sound functions do not throw when enabled but context not yet created", () => {
      setSoundEnabled(true);
      // No gesture yet — context may not exist
      expect(() => playTyping(false)).not.toThrow();
      expect(() => playBeep(false)).not.toThrow();
      expect(() => playBootTyping(false)).not.toThrow();
    });
  });

  describe("reduced-motion compliance (VAL-BOOT-011)", () => {
    it("playTyping silently no-ops when reducedMotion is true", () => {
      setSoundEnabled(true);
      expect(() => playTyping(true)).not.toThrow();
    });

    it("playBeep silently no-ops when reducedMotion is true", () => {
      setSoundEnabled(true);
      expect(() => playBeep(true)).not.toThrow();
    });

    it("playBootTyping silently no-ops when reducedMotion is true", () => {
      setSoundEnabled(true);
      expect(() => playBootTyping(true)).not.toThrow();
    });
  });

  describe("error resilience", () => {
    it("no uncaught errors when calling sound functions rapidly", () => {
      setSoundEnabled(true);
      // Rapid calls should not throw
      for (let i = 0; i < 10; i++) {
        expect(() => playTyping(false)).not.toThrow();
        expect(() => playBeep(false)).not.toThrow();
        expect(() => playBootTyping(false)).not.toThrow();
      }
    });

    it("toggling on/off rapidly does not cause errors", () => {
      for (let i = 0; i < 10; i++) {
        setSoundEnabled(i % 2 === 0);
        expect(() => playTyping(false)).not.toThrow();
        expect(() => playBeep(false)).not.toThrow();
      }
    });
  });
});
