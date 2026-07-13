import { useCallback, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ProjectCategory, type SortOption } from "../types";

export interface ControlBarProps {
  // Search
  search: string;
  onSearchChange: (query: string) => void;

  // Category filter
  activeCategory: ProjectCategory | null;
  onCategoryChange: (category: ProjectCategory | null) => void;

  // Language filter
  activeLanguage: string | null;
  onLanguageChange: (language: string | null) => void;
  allLanguages: string[];

  // Fork toggle
  includeForks: boolean;
  onIncludeForksChange: (include: boolean) => void;

  // Sort
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;

  // Clear
  onClear: () => void;

  // Result count
  filteredCount: number;
  totalCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "stars", label: "stars ↓" },
  { value: "updated", label: "updated ↓" },
  { value: "name", label: "name ↑" },
];

/**
 * ControlBar — terminal-styled search, filter, sort, and result count.
 *
 * All filter state is managed externally (via {@link useProjects}) and passed
 * as props — this component is purely presentational.
 *
 * Layout (responsive):
 * - Mobile: single column stack.
 * - Tablet+: search row, then filter/sort row.
 * - Desktop: single row with everything inline.
 *
 * Styling follows the terminal aesthetic:
 * - Monospace font, dark bg, neon accents, `$ ` prefix on the search input.
 */
export default function ControlBar({
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  activeLanguage,
  onLanguageChange,
  allLanguages,
  includeForks,
  onIncludeForksChange,
  sortBy,
  onSortChange,
  onClear,
  filteredCount,
  totalCount,
}: ControlBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters =
    search.trim() !== "" ||
    activeCategory !== null ||
    activeLanguage !== null ||
    includeForks ||
    sortBy !== "stars";

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange],
  );

  const handleSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Escape clears the search field
      if (e.key === "Escape") {
        onSearchChange("");
        searchRef.current?.blur();
      }
    },
    [onSearchChange],
  );

  const handleCategoryChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onCategoryChange(value === "" ? null : (value as ProjectCategory));
    },
    [onCategoryChange],
  );

  const handleLanguageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onLanguageChange(value === "" ? null : value);
    },
    [onLanguageChange],
  );

  // ── Fork toggle description ────────────────────────────────

  return (
    <div
      data-testid="control-bar"
      className="mx-auto mt-4 w-full max-w-7xl px-3 sm:px-6"
      role="region"
      aria-label="Search and filter controls"
    >
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + Fork toggle row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Terminal-style search input (VAL-SEARCH-001) */}
          <div
            data-testid="search-container"
            className="relative flex flex-1 items-center"
          >
            <span
              className="pointer-events-none absolute left-3 font-mono text-sm text-terminal-green"
              aria-hidden="true"
            >
              $
            </span>
            <input
              ref={searchRef}
              data-testid="search-input"
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="grep -i project, topic, or language"
              aria-label="Search projects by name, description, or topics"
              className="w-full min-h-[44px] rounded border border-terminal-green/30 bg-terminal-bg py-2.5 pl-8 pr-8 font-mono text-sm text-terminal-text placeholder-terminal-dim/50 caret-terminal-green outline-none transition-colors focus:border-terminal-green/60 focus:ring-1 focus:ring-terminal-green/40"
            />
            <span
              data-testid="search-cursor"
              className="terminal-cursor pointer-events-none absolute right-3 inline-block h-4 w-1.5 translate-y-0.5"
              aria-hidden="true"
            />
          </div>

          {/* Fork toggle (VAL-SEARCH-009) — min 44px touch target */}
          <button
            data-testid="fork-toggle"
            type="button"
            role="switch"
            aria-checked={includeForks}
            aria-label={`${includeForks ? "Exclude" : "Include"} forked repositories`}
            onClick={() => onIncludeForksChange(!includeForks)}
            className={`flex shrink-0 items-center gap-2 rounded border px-3 py-2.5 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg ${
              includeForks
                ? "border-terminal-green/50 bg-terminal-green/10 text-terminal-green"
                : "border-terminal-green/20 bg-terminal-green/5 text-terminal-dim"
            }`}
            style={{ minHeight: 44 }}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded border transition-colors ${
                includeForks
                  ? "border-terminal-green bg-terminal-green"
                  : "border-terminal-dim bg-transparent"
              }`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">forks</span>
            <span className="sm:hidden">fork</span>
          </button>
        </div>

        {/* Row 2: Filters + Sort + Clear + Result count */}
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          {/* Category filter dropdown (VAL-SEARCH-008) — min 44px touch target */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="category-select"
              className="shrink-0 font-mono text-xs text-terminal-cyan"
            >
              <span className="text-terminal-green">$</span> cat
            </label>
            <select
              id="category-select"
              data-testid="category-select"
              value={activeCategory ?? ""}
              onChange={handleCategoryChange}
              aria-label="Filter by category"
              className="w-full min-w-[140px] min-h-[44px] rounded border border-terminal-green/30 bg-terminal-bg px-2 py-2 font-mono text-xs text-terminal-text outline-none transition-colors focus:border-terminal-cyan/60 focus:ring-1 focus:ring-terminal-cyan/40"
            >
              <option value="">all categories</option>
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Language filter dropdown (VAL-SEARCH-007) — min 44px touch target */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="language-select"
              className="shrink-0 font-mono text-xs text-terminal-cyan"
            >
              <span className="text-terminal-green">$</span> lang
            </label>
            <select
              id="language-select"
              data-testid="language-select"
              value={activeLanguage ?? ""}
              onChange={handleLanguageChange}
              aria-label="Filter by language"
              className="w-full min-w-[130px] min-h-[44px] rounded border border-terminal-green/30 bg-terminal-bg px-2 py-2 font-mono text-xs text-terminal-text outline-none transition-colors focus:border-terminal-cyan/60 focus:ring-1 focus:ring-terminal-cyan/40"
            >
              <option value="">all languages</option>
              {allLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector — terminal-style radio buttons (VAL-SEARCH-013), min 44px touch targets */}
          <fieldset
            data-testid="sort-selector"
            className="flex flex-wrap items-center gap-1.5"
            aria-label="Sort projects"
          >
            <legend className="sr-only">Sort by</legend>
            <span className="shrink-0 font-mono text-xs text-terminal-cyan">
              <span className="text-terminal-green">$</span> sort
            </span>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => {
                const isActive = sortBy === opt.value;
                return (
                  <label
                    key={opt.value}
                    data-testid={`sort-option-${opt.value}`}
                    className={`inline-flex min-h-[44px] cursor-pointer items-center rounded border px-2.5 py-2.5 font-mono text-xs transition-colors focus-within:ring-2 focus-within:ring-terminal-green/60 ${
                      isActive
                        ? "border-terminal-green bg-terminal-green/15 text-terminal-green"
                        : "border-terminal-green/20 bg-terminal-green/5 text-terminal-dim hover:border-terminal-green/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={opt.value}
                      checked={isActive}
                      onChange={() => onSortChange(opt.value)}
                      className="sr-only"
                      aria-label={`Sort by ${opt.label}`}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Clear/reset button (VAL-SEARCH-016) — min 44px touch target */}
          {hasActiveFilters && (
            <button
              data-testid="clear-filters"
              type="button"
              onClick={onClear}
              aria-label="Clear all filters"
              className="inline-flex min-h-[44px] items-center rounded border border-terminal-red/30 bg-terminal-red/5 px-3 py-2 font-mono text-xs text-terminal-red transition-colors hover:border-terminal-red/60 hover:bg-terminal-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-red focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
            >
              <span className="text-terminal-red">$</span> clear
            </button>
          )}

          {/* Result count display (VAL-SEARCH-017) */}
          <span
            data-testid="result-count"
            className="shrink-0 font-mono text-xs text-terminal-dim md:ml-auto"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing{" "}
            <span className="text-terminal-amber">{filteredCount}</span>
            {" of "}
            <span className="text-terminal-green">{totalCount}</span>{" "}
            projects
          </span>
        </div>
      </div>
    </div>
  );
}
