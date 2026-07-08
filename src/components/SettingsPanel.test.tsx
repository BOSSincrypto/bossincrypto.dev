import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPanel from "./SettingsPanel";
import { DEFAULT_SETTINGS, type SettingsState } from "../types";

const mockSettings: SettingsState = { ...DEFAULT_SETTINGS };

function renderPanel(overrides?: Partial<Parameters<typeof SettingsPanel>[0]>) {
  const onToggle = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <SettingsPanel
      open={true}
      settings={mockSettings}
      onToggle={onToggle}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { ...utils, onToggle, onClose };
}

describe("SettingsPanel", () => {
  beforeEach(() => {
    mockSettings.scanlines = true;
    mockSettings.matrixRain = false;
    mockSettings.sound = false;
  });

  describe("rendering (VAL-BOOT-007)", () => {
    it("renders the panel when open is true", () => {
      renderPanel();
      expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
    });

    it("does not render the panel when open is false", () => {
      renderPanel({ open: false });
      expect(screen.queryByTestId("settings-panel")).toBeNull();
    });

    it("renders all three toggle controls", () => {
      renderPanel();
      expect(screen.getByRole("switch", { name: /scanlines/i })).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /matrix/i })).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /sound/i })).toBeInTheDocument();
    });

    it("reflects current settings state in toggle aria-checked", () => {
      renderPanel({
        settings: { scanlines: true, matrixRain: false, sound: false },
      });
      expect(screen.getByRole("switch", { name: /scanlines/i })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("switch", { name: /matrix/i })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });

    it("marks matrix rain and sound toggles as placeholder (coming soon)", () => {
      renderPanel();
      const matrix = screen.getByRole("switch", { name: /matrix/i });
      const sound = screen.getByRole("switch", { name: /sound/i });
      // Placeholder text should be visible so users know it's not active yet
      const placeholders = screen.getAllByText(/coming soon/i);
      expect(placeholders).toHaveLength(2);
      // Both should still be focusable toggle controls
      expect(matrix).toBeInTheDocument();
      expect(sound).toBeInTheDocument();
    });
  });

  describe("toggle logic (VAL-BOOT-007)", () => {
    it("calls onToggle('scanlines') when scanlines switch is clicked", () => {
      const { onToggle } = renderPanel();
      fireEvent.click(screen.getByRole("switch", { name: /scanlines/i }));
      expect(onToggle).toHaveBeenCalledWith("scanlines");
    });

    it("calls onToggle('matrixRain') when matrix switch is clicked", () => {
      const { onToggle } = renderPanel();
      fireEvent.click(screen.getByRole("switch", { name: /matrix/i }));
      expect(onToggle).toHaveBeenCalledWith("matrixRain");
    });

    it("calls onToggle('sound') when sound switch is clicked", () => {
      const { onToggle } = renderPanel();
      fireEvent.click(screen.getByRole("switch", { name: /sound/i }));
      expect(onToggle).toHaveBeenCalledWith("sound");
    });
  });

  describe("keyboard accessibility (VAL-BOOT-013)", () => {
    it("scanlines toggle is focusable (tabindex 0 or button element)", () => {
      renderPanel();
      const toggle = screen.getByRole("switch", { name: /scanlines/i });
      expect(toggle.getAttribute("tabindex")).not.toBe("-1");
    });

    it("Enter key on scanlines toggle triggers onToggle", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderPanel();
      const toggle = screen.getByRole("switch", { name: /scanlines/i });
      toggle.focus();
      await user.keyboard("{Enter}");
      expect(onToggle).toHaveBeenCalledWith("scanlines");
    });

    it("Space key on scanlines toggle triggers onToggle", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderPanel();
      const toggle = screen.getByRole("switch", { name: /scanlines/i });
      toggle.focus();
      await user.keyboard(" ");
      expect(onToggle).toHaveBeenCalledWith("scanlines");
    });

    it("Enter key on matrix toggle triggers onToggle", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderPanel();
      const toggle = screen.getByRole("switch", { name: /matrix/i });
      toggle.focus();
      await user.keyboard("{Enter}");
      expect(onToggle).toHaveBeenCalledWith("matrixRain");
    });

    it("has a close button", () => {
      renderPanel();
      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    });

    it("Escape key closes the panel", () => {
      const { onClose } = renderPanel();
      fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("close button calls onClose", () => {
      const { onClose } = renderPanel();
      fireEvent.click(screen.getByRole("button", { name: /close/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it("toggle controls have visible focus styles (focus-visible ring class)", () => {
      renderPanel();
      const toggle = screen.getByRole("switch", { name: /scanlines/i });
      expect(toggle.className).toMatch(/focus-visible/);
    });
  });

  describe("persistence integration", () => {
    it("settings prop drives aria-checked state updates", () => {
      const { rerender } = renderPanel({
        settings: { scanlines: true, matrixRain: false, sound: false },
      });

      rerender(
        <SettingsPanel
          open={true}
          settings={{ scanlines: false, matrixRain: true, sound: true }}
          onToggle={vi.fn()}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByRole("switch", { name: /scanlines/i })).toHaveAttribute(
        "aria-checked",
        "false",
      );
      expect(screen.getByRole("switch", { name: /matrix/i })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("switch", { name: /sound/i })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  });
});
