import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ControlBar from "./ControlBar";
import type { ProjectCategory, SortOption } from "../types";

function setup(overrides: Partial<Parameters<typeof ControlBar>[0]> = {}) {
  const props = {
    search: "",
    onSearchChange: vi.fn(),
    activeCategory: null as ProjectCategory | null,
    onCategoryChange: vi.fn(),
    activeLanguage: null as string | null,
    onLanguageChange: vi.fn(),
    allLanguages: ["TypeScript", "Python", "JavaScript", "Kotlin", "Rust"],
    includeForks: false,
    onIncludeForksChange: vi.fn(),
    sortBy: "stars" as SortOption,
    onSortChange: vi.fn(),
    onClear: vi.fn(),
    filteredCount: 24,
    totalCount: 24,
    ...overrides,
  };
  return { ...props, ...render(<ControlBar {...props} />) };
}

describe("ControlBar", () => {
  // ── Search input (VAL-SEARCH-001) ──────────────────────────

  it("renders search input with $ prefix and grep placeholder text", () => {
    setup();

    const input = screen.getByTestId("search-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "placeholder",
      expect.stringContaining("grep"),
    );
    expect(screen.getAllByText("$").length).toBeGreaterThan(0);
    expect(input).toHaveClass("font-mono");
  });

  it("calls onSearchChange when typing in the search input", async () => {
    const onSearchChange = vi.fn();
    setup({ onSearchChange });

    const input = screen.getByTestId("search-input");
    await userEvent.type(input, "crypto");

    // Should be called for each character typed
    expect(onSearchChange).toHaveBeenCalledTimes(6);
    // Each keystroke sends the character being typed
    expect(onSearchChange).toHaveBeenNthCalledWith(1, "c");
    expect(onSearchChange).toHaveBeenNthCalledWith(2, "r");
  });

  it("displays the current search value", () => {
    setup({ search: "test query" });

    const input = screen.getByTestId("search-input");
    expect(input).toHaveValue("test query");
  });

  it("clears search on Escape key", () => {
    const onSearchChange = vi.fn();
    setup({ search: "hello", onSearchChange });

    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  // ── Category filter (VAL-SEARCH-008) ───────────────────────

  it("renders category dropdown with all categories", () => {
    setup();

    const select = screen.getByTestId("category-select");
    expect(select).toBeInTheDocument();

    // The "all categories" option + 7 categories
    expect(select.children.length).toBe(8);

    // Verify some category labels appear
    expect(screen.getByText("Crypto / Web3")).toBeInTheDocument();
    expect(screen.getByText("AI / ML")).toBeInTheDocument();
    expect(screen.getByText("Utilities")).toBeInTheDocument();
  });

  it("calls onCategoryChange when selecting a category", async () => {
    const onCategoryChange = vi.fn();
    setup({ onCategoryChange });

    const select = screen.getByTestId("category-select");
    await userEvent.selectOptions(select, "crypto-web3");

    expect(onCategoryChange).toHaveBeenCalledWith("crypto-web3");
  });

  it("calls onCategoryChange with null when selecting 'all categories'", async () => {
    const onCategoryChange = vi.fn();
    setup({ activeCategory: "crypto-web3" as ProjectCategory, onCategoryChange });

    const select = screen.getByTestId("category-select");
    await userEvent.selectOptions(select, "");

    expect(onCategoryChange).toHaveBeenCalledWith(null);
  });

  it("shows the currently selected category", () => {
    setup({ activeCategory: "ai-ml" });

    const select = screen.getByTestId("category-select") as HTMLSelectElement;
    expect(select.value).toBe("ai-ml");
  });

  // ── Language filter (VAL-SEARCH-007) ───────────────────────

  it("renders language dropdown with all available languages", () => {
    setup();

    const select = screen.getByTestId("language-select");
    expect(select).toBeInTheDocument();

    // "all languages" + 5 languages
    expect(select.children.length).toBe(6);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Rust")).toBeInTheDocument();
  });

  it("calls onLanguageChange when selecting a language", async () => {
    const onLanguageChange = vi.fn();
    setup({ onLanguageChange });

    const select = screen.getByTestId("language-select");
    await userEvent.selectOptions(select, "Python");

    expect(onLanguageChange).toHaveBeenCalledWith("Python");
  });

  it("calls onLanguageChange with null when selecting 'all languages'", async () => {
    const onLanguageChange = vi.fn();
    setup({ activeLanguage: "TypeScript", onLanguageChange });

    const select = screen.getByTestId("language-select");
    await userEvent.selectOptions(select, "");

    expect(onLanguageChange).toHaveBeenCalledWith(null);
  });

  // ── Fork toggle (VAL-SEARCH-009) ───────────────────────────

  it("renders fork toggle with correct default state", () => {
    setup();

    const toggle = screen.getByTestId("fork-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAttribute("role", "switch");
    expect(screen.getByLabelText("Include forked repositories")).toBeInTheDocument();
  });

  it("calls onIncludeForksChange when clicking fork toggle", async () => {
    const onIncludeForksChange = vi.fn();
    setup({ onIncludeForksChange });

    const toggle = screen.getByTestId("fork-toggle");
    await userEvent.click(toggle);

    expect(onIncludeForksChange).toHaveBeenCalledWith(true);
  });

  it("shows active state when forks are included", () => {
    setup({ includeForks: true });

    const toggle = screen.getByTestId("fork-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Exclude forked repositories")).toBeInTheDocument();
  });

  // ── Sort selector (VAL-SEARCH-013) ─────────────────────────

  it("renders sort radio buttons for all sort options", () => {
    setup();

    expect(screen.getByTestId("sort-option-stars")).toBeInTheDocument();
    expect(screen.getByTestId("sort-option-updated")).toBeInTheDocument();
    expect(screen.getByTestId("sort-option-name")).toBeInTheDocument();
  });

  it("highlights the currently active sort option", () => {
    setup({ sortBy: "updated" });

    const starsLabel = screen.getByTestId("sort-option-stars");
    const updatedLabel = screen.getByTestId("sort-option-updated");
    const nameLabel = screen.getByTestId("sort-option-name");

    // Updated should have the active class (border-terminal-green = active)
    function hasActiveClass(className: string): boolean {
      return className.split(/\s+/).includes("border-terminal-green");
    }
    expect(hasActiveClass(updatedLabel.className)).toBe(true);
    expect(hasActiveClass(starsLabel.className)).toBe(false);
    expect(hasActiveClass(nameLabel.className)).toBe(false);
  });

  it("calls onSortChange when clicking a sort option", async () => {
    const onSortChange = vi.fn();
    setup({ onSortChange });

    const nameRadio = screen.getByLabelText("Sort by name ↑");
    await userEvent.click(nameRadio);

    expect(onSortChange).toHaveBeenCalledWith("name");
  });

  it("has mutually exclusive radio buttons (all share the same name)", () => {
    setup();

    const starsRadio = screen.getByLabelText("Sort by stars ↓") as HTMLInputElement;
    const updatedRadio = screen.getByLabelText(
      "Sort by updated ↓",
    ) as HTMLInputElement;
    const nameRadio = screen.getByLabelText("Sort by name ↑") as HTMLInputElement;

    // All radio buttons share the same name (enforces mutual exclusion)
    expect(starsRadio.name).toBe("sort");
    expect(updatedRadio.name).toBe("sort");
    expect(nameRadio.name).toBe("sort");

    // Default: stars is checked
    expect(starsRadio.checked).toBe(true);
    expect(updatedRadio.checked).toBe(false);
    expect(nameRadio.checked).toBe(false);
  });

  // ── Clear/reset button (VAL-SEARCH-016) ────────────────────

  it("shows clear button when filters are active", () => {
    setup({ search: "test" });
    expect(screen.getByTestId("clear-filters")).toBeInTheDocument();
  });

  it("shows clear button when category is selected", () => {
    setup({ activeCategory: "crypto-web3" });
    expect(screen.getByTestId("clear-filters")).toBeInTheDocument();
  });

  it("shows clear button when language is selected", () => {
    setup({ activeLanguage: "Python" });
    expect(screen.getByTestId("clear-filters")).toBeInTheDocument();
  });

  it("shows clear button when forks are included", () => {
    setup({ includeForks: true });
    expect(screen.getByTestId("clear-filters")).toBeInTheDocument();
  });

  it("shows clear button when sort is changed from default", () => {
    setup({ sortBy: "name" });
    expect(screen.getByTestId("clear-filters")).toBeInTheDocument();
  });

  it("hides clear button when no filters are active", () => {
    setup();
    expect(screen.queryByTestId("clear-filters")).not.toBeInTheDocument();
  });

  it("calls onClear when clicking clear button", async () => {
    const onClear = vi.fn();
    setup({ search: "test", onClear });

    const clearBtn = screen.getByTestId("clear-filters");
    await userEvent.click(clearBtn);

    expect(onClear).toHaveBeenCalledOnce();
  });

  // ── Result count (VAL-SEARCH-017) ──────────────────────────

  it("displays result count with correct format", () => {
    setup({ filteredCount: 12, totalCount: 24 });

    const countDisplay = screen.getByTestId("result-count");
    expect(countDisplay).toBeInTheDocument();
    expect(countDisplay).toHaveTextContent("Showing 12 of 24 projects");
  });

  it("shows 0 count when no results match", () => {
    setup({ filteredCount: 0, totalCount: 24 });

    const countDisplay = screen.getByTestId("result-count");
    expect(countDisplay).toHaveTextContent("Showing 0 of 24 projects");
  });

  it("updates count dynamically", () => {
    const { rerender } = render(
      <ControlBar
        search=""
        onSearchChange={vi.fn()}
        activeCategory={null}
        onCategoryChange={vi.fn()}
        activeLanguage={null}
        onLanguageChange={vi.fn()}
        allLanguages={[]}
        includeForks={false}
        onIncludeForksChange={vi.fn()}
        sortBy="stars"
        onSortChange={vi.fn()}
        onClear={vi.fn()}
        filteredCount={24}
        totalCount={24}
      />,
    );

    expect(screen.getByTestId("result-count")).toHaveTextContent(
      "Showing 24 of 24 projects",
    );

    rerender(
      <ControlBar
        search="xyz"
        onSearchChange={vi.fn()}
        activeCategory={null}
        onCategoryChange={vi.fn()}
        activeLanguage={null}
        onLanguageChange={vi.fn()}
        allLanguages={[]}
        includeForks={false}
        onIncludeForksChange={vi.fn()}
        sortBy="stars"
        onSortChange={vi.fn()}
        onClear={vi.fn()}
        filteredCount={0}
        totalCount={24}
      />,
    );

    expect(screen.getByTestId("result-count")).toHaveTextContent(
      "Showing 0 of 24 projects",
    );
  });

  // ── Edge cases ─────────────────────────────────────────────

  it("renders with empty languages list", () => {
    setup({ allLanguages: [] });

    const select = screen.getByTestId("language-select");
    expect(select.children.length).toBe(1); // only "all languages"
  });
});
