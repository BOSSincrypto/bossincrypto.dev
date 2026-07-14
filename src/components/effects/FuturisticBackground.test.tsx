import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FuturisticBackground from "./FuturisticBackground";

// Mock requestAnimationFrame and cancelAnimationFrame
const rafSpy = vi.spyOn(window, "requestAnimationFrame");
const cafSpy = vi.spyOn(window, "cancelAnimationFrame");

describe("FuturisticBackground", () => {
  beforeEach(() => {
    rafSpy.mockReset();
    cafSpy.mockReset();
    rafSpy.mockReturnValue(42);
  });

  describe("visibility", () => {
    it("renders a starfield canvas and holographic grid when visible is true", () => {
      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("starfield-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("holographic-grid")).toBeInTheDocument();
    });

    it("does not render when visible is false", () => {
      render(
        <FuturisticBackground visible={false} reducedMotion={false} />,
      );
      expect(screen.queryByTestId("starfield-canvas")).toBeNull();
      expect(screen.queryByTestId("holographic-grid")).toBeNull();
    });

    it("toggles correctly when re-rendered", () => {
      const { rerender } = render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("starfield-canvas")).toBeInTheDocument();

      rerender(
        <FuturisticBackground visible={false} reducedMotion={false} />,
      );
      expect(screen.queryByTestId("starfield-canvas")).toBeNull();

      rerender(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("starfield-canvas")).toBeInTheDocument();
    });

    it("starts the animation loop when visible", () => {
      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(rafSpy).toHaveBeenCalled();
    });

    it("stops the animation loop when unmounted", () => {
      const { unmount } = render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      unmount();
      expect(cafSpy).toHaveBeenCalledWith(42);
    });
  });

  describe("reduced-motion", () => {
    it("does not start animation when reducedMotion is true", () => {
      rafSpy.mockReset();
      render(
        <FuturisticBackground visible={true} reducedMotion={true} />,
      );
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it("still renders canvas and grid when reducedMotion is true and visible true", () => {
      render(
        <FuturisticBackground visible={true} reducedMotion={true} />,
      );
      expect(screen.getByTestId("starfield-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("holographic-grid")).toBeInTheDocument();
    });

    it("stops animation when reducedMotion toggles on", () => {
      const { rerender } = render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(rafSpy).toHaveBeenCalled();

      cafSpy.mockReset();
      rerender(
        <FuturisticBackground visible={true} reducedMotion={true} />,
      );
      expect(cafSpy).toHaveBeenCalledWith(42);
    });
  });

  describe("accessibility", () => {
    it("has aria-hidden on both the canvas and the grid", () => {
      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("starfield-canvas")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(screen.getByTestId("holographic-grid")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });

  describe("CSS classes", () => {
    it("canvas has starfield-canvas CSS class for positioning", () => {
      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("starfield-canvas").className).toContain(
        "starfield-canvas",
      );
    });

    it("grid has holographic-grid CSS class for styling", () => {
      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("holographic-grid").className).toContain(
        "holographic-grid",
      );
    });
  });

  describe("mobile performance", () => {
    it("does not render on narrow viewports (<768px)", () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      window.dispatchEvent(new Event("resize"));

      rafSpy.mockReset();
      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.queryByTestId("starfield-canvas")).toBeNull();
      expect(screen.queryByTestId("holographic-grid")).toBeNull();

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    it("does render on wide viewports (>=768px)", () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1440,
      });
      window.dispatchEvent(new Event("resize"));

      render(
        <FuturisticBackground visible={true} reducedMotion={false} />,
      );
      expect(screen.getByTestId("starfield-canvas")).toBeInTheDocument();

      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });
});
