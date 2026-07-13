import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import TerminalHeader from "./components/TerminalHeader";
import StatsBar from "./components/StatsBar";
import ControlBar from "./components/ControlBar";
import ProjectGrid from "./components/ProjectGrid";
import BootSequence from "./components/BootSequence";
import ScanlineOverlay from "./components/effects/ScanlineOverlay";
import SettingsPanel, {
  type SettingsKey,
} from "./components/SettingsPanel";
import { useProjects } from "./hooks/useProjects";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { DEFAULT_SETTINGS, type SettingsState } from "./types";

/**
 * App — root component.
 *
 * Renders the terminal shell with the CRT boot sequence, scanline overlay,
 * settings panel, stats bar, search/filter/sort controls, and the project
 * grid.
 *
 * - BootSequence plays once on first visit (localStorage `boot-seen`), then
 *   the main content is revealed.
 * - ScanlineOverlay is a fixed full-viewport CRT effect.
 * - StatsBar shows animated count-up aggregates (total repos, stars, etc.).
 * - ControlBar provides search, category/language/fork filters, sort, and
 *   a clear/reset button.
 * - ProjectGrid renders the filtered + sorted projects.
 */
export default function App() {
  const reducedMotion = useReducedMotion();
  const {
    projects,
    loading,
    filteredGroups,
    filteredCount,
    totalCount,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    activeLanguage,
    setActiveLanguage,
    allLanguages,
    includeForks,
    setIncludeForks,
    sortBy,
    setSortBy,
    clearFilters,
  } = useProjects();
  const [booted, setBooted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage<SettingsState>(
    "terminal-settings",
    DEFAULT_SETTINGS,
  );

  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(
    (key: SettingsKey) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [setSettings],
  );

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
    // Return focus to the settings trigger (VAL-BOOT-013).
    settingsBtnRef.current?.focus();
  }, []);

  // Show empty state when filters yield zero results (VAL-PROJ-020)
  const showEmptyState = !loading && filteredCount === 0;

  return (
    <>
      {/* CRT scanline overlay — decorative, aria-hidden (VAL-BOOT-004, VAL-BOOT-014) */}
      <ScanlineOverlay visible={settings.scanlines} />

      {/* Boot sequence — plays once on first visit (VAL-BOOT-001..003) */}
      {!booted && (
        <BootSequence
          reducedMotion={reducedMotion}
          onComplete={() => setBooted(true)}
        />
      )}

      <main className="min-h-screen bg-terminal-bg font-mono text-terminal-green p-4 sm:p-8">
        <div className="mx-auto w-full max-w-4xl">
          <motion.div
            className="text-sm text-terminal-cyan"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
          >
            <span className="text-terminal-amber">$</span>{" "}
            <span>BOSSincrypto.dev</span>
            <span className="terminal-cursor ml-1 inline-block h-3 w-1.5 translate-y-0.5" />
          </motion.div>

          {/* Settings trigger — keyboard accessible */}
          <button
            ref={settingsBtnRef}
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="fixed right-4 top-4 z-[9998] rounded border border-terminal-green/30 bg-terminal-bg/80 px-3 py-1.5 font-mono text-xs text-terminal-dim backdrop-blur transition-colors hover:border-terminal-green/60 hover:text-terminal-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
          >
            <span className="text-terminal-green">$</span> settings
          </button>

          <div className="mt-6">
            <TerminalHeader />
          </div>
        </div>

        {/* Stats bar (VAL-SEARCH-018) — animated count-up aggregates */}
        <StatsBar projects={projects} reducedMotion={reducedMotion} />

        {/* Control bar (VAL-SEARCH-001..017) — search, filter, sort */}
        <ControlBar
          search={search}
          onSearchChange={setSearch}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeLanguage={activeLanguage}
          onLanguageChange={setActiveLanguage}
          allLanguages={allLanguages}
          includeForks={includeForks}
          onIncludeForksChange={setIncludeForks}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClear={clearFilters}
          filteredCount={filteredCount}
          totalCount={totalCount}
        />

        {/* Project hub — wider container so the grid can use >=3 columns */}
        <section
          data-testid="project-hub"
          className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6"
          aria-label="Projects"
        >
          <ProjectGrid
            groups={showEmptyState ? [] : filteredGroups}
            loading={loading}
            reducedMotion={reducedMotion}
          />

          {/* Empty state when no results match (VAL-PROJ-020) */}
          {showEmptyState && (
            <div
              data-testid="empty-state"
              className="mt-8 flex flex-col items-center gap-3 rounded border border-terminal-green/20 bg-terminal-green/5 px-6 py-10 text-center font-mono"
            >
              <span className="text-2xl text-terminal-dim" aria-hidden="true">
                &gt;_ no matches found
              </span>
              <p className="text-sm text-terminal-dim/70">
                No projects match the current filters. Try adjusting your
                search, category, or language selection.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Clear all filters"
                className="mt-2 rounded border border-terminal-cyan/30 px-3 py-1.5 font-mono text-xs text-terminal-cyan transition-colors hover:border-terminal-cyan/60 hover:bg-terminal-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
              >
                <span className="text-terminal-green">$</span> clear filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Settings panel — toggleable effect controls (VAL-BOOT-007, VAL-BOOT-013) */}
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onToggle={handleToggle}
        onClose={handleSettingsClose}
      />
    </>
  );
}
