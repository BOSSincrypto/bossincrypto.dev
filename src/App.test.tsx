import { beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
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
    // Multiple elements may contain the site title (e.g., header + project
    // card URLs), so use getAllByText and assert at least one exists.
    const elements = screen.getAllByText(/BOSSincrypto\.dev/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the TerminalHeader identity block", async () => {
    await renderApp();
    expect(
      screen.getByRole("heading", { level: 1, name: /ILYA/i }),
    ).toBeInTheDocument();
  });

  it("renders the project hub with the correct number of cards", async () => {
    await renderApp();
    // Flush the loading→loaded transition
    await act(async () => {});
    const cards = await screen.findAllByTestId("project-card");
    // Should render all non-fork static repos (count depends on repos.json)
    expect(cards.length).toBeGreaterThan(20);
    expect(cards.length).toBeLessThan(30);
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

describe("App — tab navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(BOOT_SEEN_KEY, "true");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the tab navigation", async () => {
    await renderApp();
    expect(screen.getByTestId("tab-nav")).toBeInTheDocument();
    expect(screen.getByTestId("tab-open-source")).toBeInTheDocument();
    expect(screen.getByTestId("tab-private")).toBeInTheDocument();
  });

  it("shows open-source view by default", async () => {
    await renderApp();
    await act(async () => {});
    // StatsBar and ControlBar should be visible
    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("control-bar")).toBeInTheDocument();
    // Project grid should be present
    const cards = await screen.findAllByTestId("project-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("switches to private tab and shows PrivateProjects", async () => {
    await renderApp();
    await act(async () => {});

    fireEvent.click(screen.getByTestId("tab-private"));

    // Wait for the transition to complete
    await waitFor(() => {
      expect(screen.getByTestId("private-tab-content")).toBeInTheDocument();
    });

    // StatsBar and ControlBar should be hidden
    expect(screen.queryByTestId("stats-bar")).toBeNull();
    expect(screen.queryByTestId("control-bar")).toBeNull();

    // Private projects should be visible
    expect(screen.getByTestId("private-projects")).toBeInTheDocument();
    expect(screen.getByTestId("private-project-card")).toBeInTheDocument();
  });

  it("hides ControlBar on private tab", async () => {
    await renderApp();
    await act(async () => {});

    fireEvent.click(screen.getByTestId("tab-private"));

    await waitFor(() => {
      expect(screen.queryByTestId("control-bar")).toBeNull();
    });
  });

  it("hides StatsBar on private tab", async () => {
    await renderApp();
    await act(async () => {});

    fireEvent.click(screen.getByTestId("tab-private"));

    await waitFor(() => {
      expect(screen.queryByTestId("stats-bar")).toBeNull();
    });
  });

  it("switches back to open-source tab", async () => {
    await renderApp();
    await act(async () => {});

    // Switch to private
    fireEvent.click(screen.getByTestId("tab-private"));
    await waitFor(() => {
      expect(screen.getByTestId("private-tab-content")).toBeInTheDocument();
    });

    // Switch back to open-source
    fireEvent.click(screen.getByTestId("tab-open-source"));

    await waitFor(() => {
      expect(screen.queryByTestId("private-tab-content")).toBeNull();
    });

    await act(async () => {});

    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("control-bar")).toBeInTheDocument();
  });

  it("SiteIntro is visible on both tabs", async () => {
    await renderApp();
    await act(async () => {});

    expect(screen.getByTestId("site-intro")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tab-private"));
    // SiteIntro is ABOVE the tabs, so it should always be visible
    expect(screen.getByTestId("site-intro")).toBeInTheDocument();
  });
});
