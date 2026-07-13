import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import TerminalHeader from "./components/TerminalHeader";
import StatsBar from "./components/StatsBar";
import ControlBar from "./components/ControlBar";
import ProjectGrid from "./components/ProjectGrid";
import ScanlineOverlay from "./components/effects/ScanlineOverlay";
import { useProjects } from "./hooks/useProjects";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useReducedMotion } from "./hooks/useReducedMotion";
import {
  setSoundEnabled,
  onUserGesture,
  playBeep,
} from "./services/SoundService";
import { DEFAULT_SETTINGS, type SettingsState, type Project } from "./types";

// ── Lazy-loaded non-critical components ─────────────
// These are not needed for the initial render and are
// code-split to keep the main bundle lean (< 200KB gzipped).
const BootSequence = lazy(() => import("./components/BootSequence"));
const MatrixRain = lazy(() => import("./components/effects/MatrixRain"));
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));
import type { SettingsKey } from "./components/SettingsPanel";
const ProjectDetail = lazy(() => import("./components/ProjectDetail"));

// Shared fallback for lazy boundaries (empty — nothing renders until loaded)
function LazyFallback() {
  return null;
}

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

  // ── Detail modal state ──────────────────────────────
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Track the card element that opened the modal for focus return (VAL-PROJ-017)
  const cardTriggerRef = useRef<HTMLElement | null>(null);

  const handleCardClick = useCallback((project: Project) => {
    // Remember the active element (the card that was clicked/focused)
    cardTriggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedProject(project);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedProject(null);
    // Return focus to the card that opened the modal (VAL-PROJ-017)
    // Use setTimeout so the modal has unmounted before we try to focus
    setTimeout(() => {
      cardTriggerRef.current?.focus();
      cardTriggerRef.current = null;
    }, 0);
  }, []);

  const handleToggle = useCallback(
    (key: SettingsKey) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        // Sync sound setting to the SoundService immediately
        if (key === "sound") {
          setSoundEnabled(next.sound);
          // Play a beep as feedback when toggling sound ON (user-initiated)
          if (next.sound) {
            playBeep(reducedMotion);
          }
        }
        return next;
      });
    },
    [setSettings, reducedMotion],
  );

  // Sync sound enabled to SoundService on mount and when settings change
  useEffect(() => {
    setSoundEnabled(settings.sound);
  }, [settings.sound]);

  // Register global user-gesture listener to unlock AudioContext
  // (autoplay-policy compliant — context only created on user interaction)
  useEffect(() => {
    const handler = () => onUserGesture();
    window.addEventListener("click", handler, { once: false });
    window.addEventListener("keydown", handler, { once: false });
    window.addEventListener("touchstart", handler, { once: false });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

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

      {/* Matrix rain — canvas background, z-index 0, aria-hidden (VAL-BOOT-005, VAL-BOOT-014) */}
      <Suspense fallback={<LazyFallback />}>
        <MatrixRain visible={settings.matrixRain} reducedMotion={reducedMotion} />
      </Suspense>

      {/* Boot sequence — plays once on first visit (VAL-BOOT-001..003) */}
      {!booted && (
        <Suspense fallback={<LazyFallback />}>
          <BootSequence
            reducedMotion={reducedMotion}
            onComplete={() => setBooted(true)}
          />
        </Suspense>
      )}

      <main className="relative z-10 min-h-screen bg-terminal-bg font-mono text-terminal-green p-4 sm:p-8">
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
            onCardClick={handleCardClick}
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

      {/* Project detail modal — AnimatePresence handles enter/exit animations (VAL-PROJ-014..018) */}
      <Suspense fallback={<LazyFallback />}>
        <ProjectDetail
          project={selectedProject}
          onClose={handleModalClose}
          reducedMotion={reducedMotion}
        />
      </Suspense>

      {/* Settings panel — toggleable effect controls (VAL-BOOT-007, VAL-BOOT-013) */}
      <Suspense fallback={<LazyFallback />}>
        <SettingsPanel
          open={settingsOpen}
          settings={settings}
          onToggle={handleToggle}
          onClose={handleSettingsClose}
        />
      </Suspense>
    </>
  );
}
