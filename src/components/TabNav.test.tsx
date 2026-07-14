import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TabNav from "./TabNav";

describe("TabNav", () => {
  it("renders both tab buttons", () => {
    render(<TabNav activeTab="open-source" onTabChange={vi.fn()} />);
    expect(screen.getByTestId("tab-open-source")).toBeInTheDocument();
    expect(screen.getByTestId("tab-private")).toBeInTheDocument();
  });

  it("marks the open-source tab as active by default", () => {
    render(<TabNav activeTab="open-source" onTabChange={vi.fn()} />);
    const osTab = screen.getByTestId("tab-open-source");
    expect(osTab).toHaveAttribute("aria-selected", "true");
    expect(osTab).toHaveAttribute("data-active", "true");
    expect(osTab.className).toMatch(/text-terminal-green/);

    const privTab = screen.getByTestId("tab-private");
    expect(privTab).toHaveAttribute("aria-selected", "false");
    expect(privTab).toHaveAttribute("data-active", "false");
    expect(privTab.className).toMatch(/text-terminal-dim/);
  });

  it("marks the private tab as active when selected", () => {
    render(<TabNav activeTab="private" onTabChange={vi.fn()} />);
    const privTab = screen.getByTestId("tab-private");
    expect(privTab).toHaveAttribute("aria-selected", "true");
    expect(privTab).toHaveAttribute("data-active", "true");
  });

  it("calls onTabChange with the correct tab id when clicked", () => {
    const onTabChange = vi.fn();
    render(<TabNav activeTab="open-source" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByTestId("tab-private"));
    expect(onTabChange).toHaveBeenCalledWith("private");

    fireEvent.click(screen.getByTestId("tab-open-source"));
    expect(onTabChange).toHaveBeenCalledWith("open-source");
  });

  it("renders terminal command labels with $ prefix", () => {
    render(<TabNav activeTab="open-source" onTabChange={vi.fn()} />);
    // The $ prefix is in a separate span, so textContent may concatenate.
    // Use toMatch to check the presence of the command pattern.
    expect(screen.getByTestId("tab-open-source").textContent).toMatch(
      /\$.*open-source/,
    );
    expect(screen.getByTestId("tab-private").textContent).toMatch(
      /\$.*private/,
    );
  });

  it("renders the tab indicator on the active tab", () => {
    render(<TabNav activeTab="open-source" onTabChange={vi.fn()} />);
    const indicator = screen.getByTestId("tab-indicator");
    // The indicator should be inside the active tab
    expect(
      screen.getByTestId("tab-open-source").contains(indicator),
    ).toBe(true);
  });

  it("has proper ARIA role attributes", () => {
    render(<TabNav activeTab="open-source" onTabChange={vi.fn()} />);
    expect(screen.getByTestId("tab-nav")).toHaveAttribute(
      "aria-label",
      "Project tabs",
    );
    expect(screen.getByTestId("tab-open-source")).toHaveAttribute(
      "role",
      "tab",
    );
    expect(screen.getByTestId("tab-private")).toHaveAttribute("role", "tab");
  });

  it("renders without error when reducedMotion is true", () => {
    render(
      <TabNav activeTab="open-source" onTabChange={vi.fn()} reducedMotion />,
    );
    expect(screen.getByTestId("tab-nav")).toBeInTheDocument();
  });
});
