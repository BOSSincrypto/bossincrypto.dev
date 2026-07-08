import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import BootSequence from "./BootSequence";
import { BOOT_SEEN_KEY } from "../hooks/useBootSequence";

describe("BootSequence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("first visit — boot plays (VAL-BOOT-001)", () => {
    it("renders the boot overlay on first visit", () => {
      render(<BootSequence reducedMotion={false} />);
      expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();
    });

    it("shows boot text lines progressively", () => {
      render(<BootSequence reducedMotion={false} />);

      // Initially no lines visible
      const bootText = screen.getByTestId("boot-text");
      expect(bootText.children).toHaveLength(1); // only cursor

      // Advance past CRT warmup — first line appears
      act(() => {
        vi.advanceTimersByTime(450);
      });
      const afterFirst = screen.getByTestId("boot-text");
      expect(
        afterFirst.textContent,
      ).toContain("> Initializing BOSS protocol...");

      // Advance more — second line appears
      act(() => {
        vi.advanceTimersByTime(280);
      });
      expect(
        screen.getByTestId("boot-text").textContent,
      ).toContain("> Loading project data...");
    });

    it("has aria-hidden on the boot overlay (VAL-BOOT-014)", () => {
      render(<BootSequence reducedMotion={false} />);
      const overlay = screen.getByTestId("boot-overlay");
      expect(overlay).toHaveAttribute("aria-hidden", "true");
    });

    it("renders a skip button", () => {
      render(<BootSequence reducedMotion={false} />);
      expect(screen.getByText(/skip/i)).toBeInTheDocument();
    });
  });

  describe("skip functionality (VAL-BOOT-003)", () => {
    it("skips via clicking the overlay", () => {
      render(<BootSequence reducedMotion={false} />);
      const overlay = screen.getByTestId("boot-overlay");

      act(() => {
        fireEvent.click(overlay);
      });

      // After skip, state is 'complete' and overlay is removed
      expect(screen.queryByTestId("boot-overlay")).toBeNull();
    });

    it("skips via pressing Escape", () => {
      render(<BootSequence reducedMotion={false} />);
      expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      expect(screen.queryByTestId("boot-overlay")).toBeNull();
    });

    it("skips via pressing Enter", () => {
      render(<BootSequence reducedMotion={false} />);
      expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(window, { key: "Enter" });
      });

      expect(screen.queryByTestId("boot-overlay")).toBeNull();
    });

    it("clicking the skip button triggers skip", () => {
      render(<BootSequence reducedMotion={false} />);
      const skipButton = screen.getByText(/skip/i);

      act(() => {
        fireEvent.click(skipButton);
      });

      expect(screen.queryByTestId("boot-overlay")).toBeNull();
    });

    it("sets boot-seen flag after skipping", () => {
      render(<BootSequence reducedMotion={false} />);

      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe("true");
    });
  });

  describe("onComplete callback", () => {
    it("fires onComplete when boot finishes naturally", () => {
      const onComplete = vi.fn();
      render(<BootSequence reducedMotion={false} onComplete={onComplete} />);

      // Advance past all timers (CRT warmup + 6 lines * 280ms + tail)
      act(() => {
        vi.advanceTimersByTime(400 + 6 * 280 + 400 + 100);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("fires onComplete when skipped", () => {
      const onComplete = vi.fn();
      render(<BootSequence reducedMotion={false} onComplete={onComplete} />);

      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("fires onComplete only once", () => {
      const onComplete = vi.fn();
      render(<BootSequence reducedMotion={false} onComplete={onComplete} />);

      // Skip
      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });
      // Advance timers (shouldn't re-trigger)
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("return visit — boot skipped (VAL-BOOT-002)", () => {
    it("does not render the overlay when boot-seen is set", () => {
      localStorage.setItem(BOOT_SEEN_KEY, "true");

      const { rerender } = render(<BootSequence reducedMotion={false} />);
      act(() => {
        rerender(<BootSequence reducedMotion={false} />);
      });
      expect(screen.queryByTestId("boot-overlay")).toBeNull();
    });

    it("fires onComplete immediately when boot-seen is set", () => {
      localStorage.setItem(BOOT_SEEN_KEY, "true");
      const onComplete = vi.fn();

      act(() => {
        render(<BootSequence reducedMotion={false} onComplete={onComplete} />);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("reduced motion (VAL-BOOT-011)", () => {
    it("does not render the overlay when reducedMotion is true", () => {
      const { rerender } = render(<BootSequence reducedMotion={true} />);
      // Flush effects
      act(() => {
        rerender(<BootSequence reducedMotion={true} />);
      });
      expect(screen.queryByTestId("boot-overlay")).toBeNull();
    });

    it("fires onComplete immediately when reducedMotion is true", () => {
      const onComplete = vi.fn();
      act(() => {
        render(<BootSequence reducedMotion={true} onComplete={onComplete} />);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("sets boot-seen flag even with reduced motion", () => {
      act(() => {
        render(<BootSequence reducedMotion={true} />);
      });
      expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe("true");
    });
  });

  describe("no crashes when toggling mid-animation (VAL-BOOT-015)", () => {
    it("unmounts cleanly during boot without errors", () => {
      const { unmount } = render(<BootSequence reducedMotion={false} />);

      // Advance partially through boot
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});
