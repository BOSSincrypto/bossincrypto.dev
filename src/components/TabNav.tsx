import { motion } from "framer-motion";

/** Valid tab identifiers. */
export type TabId = "open-source" | "private";

export interface TabNavProps {
  /** Currently active tab. */
  activeTab: TabId;
  /** Called when the user switches tabs. */
  onTabChange: (tab: TabId) => void;
  /** Disable non-essential animations (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

const TABS: { id: TabId; label: string; command: string }[] = [
  { id: "open-source", label: "Open Source", command: "./open-source" },
  { id: "private", label: "Private", command: "./private" },
];

/**
 * TabNav — terminal-styled tab navigation for switching between project views.
 *
 * Two tabs rendered as terminal commands (`$ ./open-source` and `$ ./private`).
 * The active tab glows in terminal-green; the inactive tab uses terminal-dim.
 * Framer Motion `AnimatePresence` + `layoutId` provides a sliding underline
 * that tracks the active tab.
 */
export default function TabNav({
  activeTab,
  onTabChange,
  reducedMotion = false,
}: TabNavProps) {
  return (
    <nav
      data-testid="tab-nav"
      className="mx-auto mt-4 w-full max-w-7xl px-3 sm:px-6"
      aria-label="Project tabs"
    >
      <div className="flex gap-1 rounded-lg border border-terminal-green/20 bg-terminal-green/5 p-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              data-active={isActive}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 rounded-md px-4 py-2.5 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg ${
                isActive
                  ? "text-terminal-green"
                  : "text-terminal-dim hover:text-terminal-text"
              }`}
              style={{ minHeight: 44 }}
            >
              <span
                className="mr-1 text-terminal-amber"
                aria-hidden="true"
              >
                $
              </span>
              {tab.command}
              {isActive && (
                <motion.div
                  data-testid="tab-indicator"
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-md border border-terminal-green/40"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 35 }
                  }
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
