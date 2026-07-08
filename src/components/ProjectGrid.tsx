import { motion } from "framer-motion";
import ProjectCard from "./ProjectCard";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Project } from "../types";
import type { CategoryGroup } from "../hooks/useProjects";

export interface ProjectGridProps {
  /** Projects grouped by category, in display order. */
  groups: CategoryGroup[];
  /** When true, a terminal-themed loading state is shown instead of cards. */
  loading?: boolean;
  /** Forwarded to each card body click (opens the detail modal). */
  onCardClick?: (project: Project) => void;
  /** Disable non-essential animations (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

/** Total time budget for the full stagger entrance, in seconds (~2s). */
const STAGGER_BUDGET_SECONDS = 1.8;
/** Hard cap on per-card stagger so very large lists don't crawl. */
const MAX_STAGGER_STEP = 0.08;

/** Number of skeleton placeholders shown while loading. */
const SKELETON_COUNT = 6;

/**
 * ProjectGrid — responsive, category-grouped grid of {@link ProjectCard}s.
 *
 * - **Responsive** (VAL-PROJ-002): 1 column on mobile, 2 at sm, 3 at lg,
 *   4 at xl. No fixed widths → no horizontal scroll.
 * - **Grouped** (VAL-PROJ-022): each category renders under a terminal-style
 *   `## <category>` heading.
 * - **Stagger entrance** (VAL-PROJ-012): cards animate in sequentially across
 *   the whole grid, finishing in ~2s. With `reducedMotion`, all cards appear
 *   instantly.
 * - **Loading** (VAL-PROJ-021): skeleton cards + blinking text while data loads.
 */
export default function ProjectGrid({
  groups,
  loading = false,
  onCardClick,
  reducedMotion = false,
}: ProjectGridProps) {
  if (loading) {
    return <LoadingState />;
  }

  // Normalize to CATEGORY_ORDER priority so the grid always renders in the
  // curated order regardless of how groups were supplied.
  const priority = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  const orderedGroups = [...groups].sort(
    (a, b) => (priority.get(a.category) ?? 99) - (priority.get(b.category) ?? 99),
  );

  const totalCards = orderedGroups.reduce((n, g) => n + g.projects.length, 0);
  // Spread the ~2s budget across all cards so the entrance lands near 2s
  // regardless of how many projects are rendered.
  const staggerStep = reducedMotion
    ? 0
    : Math.min(MAX_STAGGER_STEP, STAGGER_BUDGET_SECONDS / Math.max(totalCards, 1));

  let globalIndex = 0;

  return (
    <div data-testid="project-grid" className="flex flex-col gap-8">
      {orderedGroups.map((group) => {
        const label = CATEGORY_LABELS[group.category] ?? group.category;
        return (
          <motion.section
            key={group.category}
            data-testid="category-section"
            aria-labelledby={`heading-${group.category}`}
            className="flex flex-col gap-3"
          >
            <h3
              id={`heading-${group.category}`}
              data-testid="category-heading"
              className="font-mono text-sm text-terminal-green sm:text-base"
            >
              <span className="text-terminal-dim">##</span>{" "}
              <span>{group.category}</span>
              <span className="ml-2 text-terminal-dim">
                {label} ({group.projects.length})
              </span>
            </h3>

            <div
              data-testid="card-grid"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {group.projects.map((project) => {
                const delay = globalIndex * staggerStep;
                globalIndex += 1;
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={onCardClick}
                    entranceDelay={delay}
                    reducedMotion={reducedMotion}
                  />
                );
              })}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

/**
 * Terminal-themed loading state: a blinking prompt line plus skeleton cards
 * in the same responsive grid. (VAL-PROJ-021)
 */
function LoadingState() {
  return (
    <div
      data-testid="project-grid-loading"
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="font-mono text-sm text-terminal-green">
        <span className="text-terminal-amber">$</span> fetching project data
        <span className="terminal-cursor ml-1 inline-block h-3.5 w-1.5 translate-y-0.5" />
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div
            key={i}
            data-testid="skeleton-card"
            className="animate-pulse rounded-lg border border-terminal-green/15 bg-terminal-bg p-4"
          >
            <div className="mb-3 h-2.5 w-16 rounded bg-terminal-green/15" />
            <div className="mb-2 h-4 w-3/4 rounded bg-terminal-green/15" />
            <div className="mb-1.5 h-3 w-full rounded bg-terminal-green/10" />
            <div className="h-3 w-2/3 rounded bg-terminal-green/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
