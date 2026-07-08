import { beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";
import { BOOT_SEEN_KEY } from "./hooks/useBootSequence";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    // Mark boot as seen so the boot overlay doesn't interfere with layout assertions
    localStorage.setItem(BOOT_SEEN_KEY, "true");
  });

  it("renders the terminal-themed root layout", () => {
    render(<App />);
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main).toHaveClass("bg-terminal-bg");
    expect(main).toHaveClass("font-mono");
  });

  it("shows the site title", () => {
    render(<App />);
    expect(screen.getByText(/BOSSincrypto\.dev/i)).toBeInTheDocument();
  });

  it("renders the TerminalHeader identity block", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: /ILYA/i }),
    ).toBeInTheDocument();
  });

  it("renders the settings trigger button", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /open settings/i }),
    ).toBeInTheDocument();
  });

  it("renders the scanline overlay by default (scanlines setting on)", () => {
    render(<App />);
    expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();
  });

  it("does not show the boot overlay when boot-seen is set", () => {
    render(<App />);
    expect(screen.queryByTestId("boot-overlay")).toBeNull();
  });

  it("opens the settings panel when trigger is clicked", () => {
    render(<App />);
    expect(screen.queryByTestId("settings-panel")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));

    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });

  it("toggling scanlines off removes the overlay", () => {
    render(<App />);
    expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();

    // Open settings and toggle scanlines off
    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));
    fireEvent.click(screen.getByRole("switch", { name: /scanlines/i }));

    expect(screen.queryByTestId("scanline-overlay")).toBeNull();
  });

  it("persists settings toggle to localStorage", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));
    fireEvent.click(screen.getByRole("switch", { name: /scanlines/i }));

    const stored = JSON.parse(
      localStorage.getItem("terminal-settings") || "{}",
    );
    expect(stored.scanlines).toBe(false);
  });
});

describe("App — boot sequence integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows boot overlay on first visit (no boot-seen flag)", () => {
    render(<App />);
    expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();
  });

  it("hides boot overlay after completing boot sequence", () => {
    render(<App />);
    expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();

    // Skip the boot
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByTestId("boot-overlay")).toBeNull();
  });
});
