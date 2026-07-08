import { beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";
import { BOOT_SEEN_KEY } from "./hooks/useBootSequence";

/**
 * Render <App /> and flush the async data-layer state update (useGitHubData
 * resolves a promise after mount) inside an act() scope to avoid act warnings.
 */
async function renderApp() {
  const utils = render(<App />);
  await act(async () => {
    /* flush pending microtasks from the data layer */
  });
  return utils;
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    // Mark boot as seen so the boot overlay doesn't interfere with layout assertions
    localStorage.setItem(BOOT_SEEN_KEY, "true");
    // Prevent the data layer from making real network calls during App tests.
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the terminal-themed root layout", async () => {
    await renderApp();
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main).toHaveClass("bg-terminal-bg");
    expect(main).toHaveClass("font-mono");
  });

  it("shows the site title", async () => {
    await renderApp();
    expect(screen.getByText(/BOSSincrypto\.dev/i)).toBeInTheDocument();
  });

  it("renders the TerminalHeader identity block", async () => {
    await renderApp();
    expect(
      screen.getByRole("heading", { level: 1, name: /ILYA/i }),
    ).toBeInTheDocument();
  });

  it("renders the project hub with all 23 cards", async () => {
    await renderApp();
    // Flush the loading→loaded transition
    await act(async () => {});
    const cards = await screen.findAllByTestId("project-card");
    expect(cards).toHaveLength(23);
  });

  it("renders the settings trigger button", async () => {
    await renderApp();
    expect(
      screen.getByRole("button", { name: /open settings/i }),
    ).toBeInTheDocument();
  });

  it("renders the scanline overlay by default (scanlines setting on)", async () => {
    await renderApp();
    expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();
  });

  it("does not show the boot overlay when boot-seen is set", async () => {
    await renderApp();
    expect(screen.queryByTestId("boot-overlay")).toBeNull();
  });

  it("opens the settings panel when trigger is clicked", async () => {
    await renderApp();
    expect(screen.queryByTestId("settings-panel")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));

    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });

  it("toggling scanlines off removes the overlay", async () => {
    await renderApp();
    expect(screen.getByTestId("scanline-overlay")).toBeInTheDocument();

    // Open settings and toggle scanlines off
    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));
    fireEvent.click(screen.getByRole("switch", { name: /scanlines/i }));

    expect(screen.queryByTestId("scanline-overlay")).toBeNull();
  });

  it("persists settings toggle to localStorage", async () => {
    await renderApp();
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows boot overlay on first visit (no boot-seen flag)", async () => {
    await renderApp();
    expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();
  });

  it("hides boot overlay after completing boot sequence", async () => {
    await renderApp();
    expect(screen.getByTestId("boot-overlay")).toBeInTheDocument();

    // Skip the boot
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByTestId("boot-overlay")).toBeNull();
  });
});
