import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MatrixRain from "./MatrixRain";

// Mock requestAnimationFrame and cancelAnimationFrame
const rafSpy = vi.spyOn(window, "requestAnimationFrame");
const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

describe("MatrixRain", () => {
  beforeEach(() => {
    rafSpy.mockReset();
    cafSpy.mockReset();
    // Return a dummy handle so we can test cleanup
    rafSpy.mockReturnValue(42);
  });

  afterEach(() => {
    // Restore real implementations
  });

  describe("visibility (VAL-BOOT-005, VAL-BOOT-006)", () => {
    it("renders a canvas when visible is true", () => {
      render(<MatrixRain visible={true} reducedMotion={false} />);
      const canvas = screen.getByTestId("matrix-canvas");
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe("CANVAS");
    });

    it("does not render when visible is false", () => {
      render(<MatrixRain visible={false} reducedMotion={false} />);
      expect(screen.queryByTestId("matrix-canvas")).toBeNull();
    });

    it("toggles correctly when re-rendered", () => {
      const { rerender } = render(
        <MatrixRain visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("matrix-canvas")).toBeInTheDocument();

      rerender(<MatrixRain visible={false} reducedMotion={false} />);
      expect(screen.queryByTestId("matrix-canvas")).toBeNull();

      rerender(<MatrixRain visible={true} reducedMotion={false} />);
      expect(screen.getByTestId("matrix-canvas")).toBeInTheDocument();
    });

    it("starts the animation loop when visible", () => {
      render(<MatrixRain visible={true} reducedMotion={false} />);
      expect(rafSpy).toHaveBeenCalled();
    });

    it("stops the animation loop when unmounted", () => {
      const { unmount } = render(
        <MatrixRain visible={true} reducedMotion={false} />,
      );
      unmount();
      expect(cafSpy).toHaveBeenCalledWith(42);
    });
  });

  describe("reduced-motion (VAL-BOOT-011)", () => {
    it("does not start animation when reducedMotion is true", () => {
      rafSpy.mockReset();
      render(<MatrixRain visible={true} reducedMotion={true} />);
      // RAF should not be called because animation is suppressed
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it("canvas still renders when reducedMotion is true and visible true", () => {
      render(<MatrixRain visible={true} reducedMotion={true} />);
      // The canvas should exist but not animate
      expect(screen.getByTestId("matrix-canvas")).toBeInTheDocument();
    });

    it("stops animation when reducedMotion toggles on", () => {
      const { rerender } = render(
        <MatrixRain visible={true} reducedMotion={false} />,
      );
      expect(rafSpy).toHaveBeenCalled();

      cafSpy.mockReset();
      rerender(<MatrixRain visible={true} reducedMotion={true} />);
      expect(cafSpy).toHaveBeenCalledWith(42);
    });
  });

  describe("accessibility (VAL-BOOT-014)", () => {
    it("has aria-hidden set to true", () => {
      render(<MatrixRain visible={true} reducedMotion={false} />);
      const canvas = screen.getByTestId("matrix-canvas");
      expect(canvas).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("pointer interaction", () => {
    it("canvas has the matrix-canvas CSS class for pointer-events", () => {
      render(<MatrixRain visible={true} reducedMotion={false} />);
      const canvas = screen.getByTestId("matrix-canvas");
      expect(canvas.className).toContain("matrix-canvas");
    });
  });

  describe("mobile performance", () => {
    it("does not animate on narrow viewports (<768px)", () => {
      // Mock innerWidth to simulate mobile
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Trigger resize
      window.dispatchEvent(new Event("resize"));

      rafSpy.mockReset();
      render(<MatrixRain visible={true} reducedMotion={false} />);
      // Should not start RAF on mobile
      expect(rafSpy).not.toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    it("does animate on wide viewports (>=768px)", () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1440,
      });

      window.dispatchEvent(new Event("resize"));

      rafSpy.mockReset();
      render(<MatrixRain visible={true} reducedMotion={false} />);
      expect(rafSpy).toHaveBeenCalled();

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });
});
