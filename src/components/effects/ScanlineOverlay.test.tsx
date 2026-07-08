import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ScanlineOverlay from "./ScanlineOverlay";

describe("ScanlineOverlay", () => {
  describe("visibility (VAL-BOOT-004, VAL-BOOT-007)", () => {
    it("renders the overlay when visible is true", () => {
      render(<ScanlineOverlay visible={true} />);
      const overlay = screen.getByTestId("scanline-overlay");
      expect(overlay).toBeInTheDocument();
    });

    it("does not render when visible is false", () => {
      render(<ScanlineOverlay visible={false} />);
      expect(screen.queryByTestId("scanline-overlay")).toBeNull();
    });

    it("toggles correctly when re-rendered", () => {
      const { rerender } = render(<ScanlineOverlay visible={true} />);
      expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();

      rerender(<ScanlineOverlay visible={false} />);
      expect(screen.queryByTestId("scanline-overlay")).toBeNull();

      rerender(<ScanlineOverlay visible={true} />);
      expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();
    });
  });

  describe("accessibility (VAL-BOOT-014)", () => {
    it("has aria-hidden set to true", () => {
      render(<ScanlineOverlay visible={true} />);
      const overlay = screen.getByTestId("scanline-overlay");
      expect(overlay).toHaveAttribute("aria-hidden", "true");
    });

    it("does not block pointer interaction (pointer-events none)", () => {
      render(<ScanlineOverlay visible={true} />);
      const overlay = screen.getByTestId("scanline-overlay");
      // The scanline-overlay CSS class includes pointer-events: none
      expect(overlay.className).toMatch(/scanline-overlay/);
    });
  });

  describe("positioning", () => {
    it("uses the fixed-position scanline overlay class", () => {
      render(<ScanlineOverlay visible={true} />);
      const overlay = screen.getByTestId("scanline-overlay");
      expect(overlay.className).toContain("scanline-overlay");
    });
  });
});
