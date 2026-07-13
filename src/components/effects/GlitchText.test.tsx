import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GlitchText from "./GlitchText";

describe("GlitchText", () => {
  describe("rendering (VAL-BOOT-009)", () => {
    it("renders children inside a span", () => {
      render(<GlitchText mode="static">Hello World</GlitchText>);
      const el = screen.getByTestId("glitch-text");
      expect(el).toBeInTheDocument();
      expect(el.tagName).toBe("SPAN");
      expect(el).toHaveTextContent("Hello World");
    });

    it("renders with glitch-static className by default", () => {
      render(<GlitchText>Static Text</GlitchText>);
      const el = screen.getByTestId("glitch-text");
      expect(el.className).toContain("glitch-static");
    });

    it("renders with glitch-hover className in hover mode", () => {
      render(<GlitchText mode="hover">Hover Text</GlitchText>);
      const el = screen.getByTestId("glitch-text");
      expect(el.className).toContain("glitch-hover");
    });
  });

  describe("reduced-motion (VAL-BOOT-011)", () => {
    it("adds glitch-reduced class when reducedMotion is true", () => {
      render(
        <GlitchText mode="static" reducedMotion={true}>
          Reduced
        </GlitchText>,
      );
      const el = screen.getByTestId("glitch-text");
      expect(el.className).toContain("glitch-reduced");
    });

    it("does not add glitch-reduced class when reducedMotion is false", () => {
      render(
        <GlitchText mode="static" reducedMotion={false}>
          Not Reduced
        </GlitchText>,
      );
      const el = screen.getByTestId("glitch-text");
      expect(el.className).not.toContain("glitch-reduced");
    });
  });

  describe("className passthrough", () => {
    it("appends custom className", () => {
      render(
        <GlitchText mode="static" className="text-lg font-bold">
          Custom
        </GlitchText>,
      );
      const el = screen.getByTestId("glitch-text");
      expect(el.className).toContain("text-lg");
      expect(el.className).toContain("font-bold");
    });
  });

  describe("mode switching", () => {
    it("switches between hover and static modes", () => {
      const { rerender } = render(
        <GlitchText mode="hover">Switch</GlitchText>,
      );
      let el = screen.getByTestId("glitch-text");
      expect(el.className).toContain("glitch-hover");
      expect(el.className).not.toContain("glitch-static");

      rerender(<GlitchText mode="static">Switch</GlitchText>);
      el = screen.getByTestId("glitch-text");
      expect(el.className).toContain("glitch-static");
      expect(el.className).not.toContain("glitch-hover");
    });
  });

  describe("text remains legible", () => {
    it("preserves text content without alteration", () => {
      const text = "BOSSincrypto • Crypto Hub";
      render(<GlitchText mode="static">{text}</GlitchText>);
      expect(screen.getByTestId("glitch-text")).toHaveTextContent(text);
    });

    it("renders nested React elements", () => {
      render(
        <GlitchText mode="static">
          <strong>Bold</strong> text
        </GlitchText>,
      );
      const el = screen.getByTestId("glitch-text");
      expect(el).toHaveTextContent("Bold text");
      expect(el.querySelector("strong")).toBeInTheDocument();
    });
  });
});
