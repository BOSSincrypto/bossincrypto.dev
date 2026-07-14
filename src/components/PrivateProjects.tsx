import { motion } from "framer-motion";
import privateProjectsData from "../data/private-projects.json";

/** A single private/commercial project entry. */
export interface PrivateProject {
  id: string;
  name: string;
  url: string;
  description: string;
  emoji?: string;
  techStack?: string[];
  status: "live" | "in-development" | "maintenance";
}

export interface PrivateProjectsProps {
  /** Disable non-essential animations (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

/** Status badge configuration: colour, label, glow. */
const STATUS_META: Record<
  PrivateProject["status"],
  { color: string; label: string; glow: string }
> = {
  live: {
    color: "text-terminal-green border-terminal-green/60",
    label: "● live",
    glow: "shadow-[0_0_8px_-2px_rgba(0,255,65,0.5)]",
  },
  "in-development": {
    color: "text-terminal-amber border-terminal-amber/60",
    label: "● in dev",
    glow: "shadow-[0_0_8px_-2px_rgba(255,176,0,0.5)]",
  },
  maintenance: {
    color: "text-terminal-dim border-terminal-dim/60",
    label: "● maintenance",
    glow: "",
  },
};

/** Total time budget for the stagger entrance (seconds). */
const STAGGER_BUDGET_SECONDS = 1.2;
const MAX_STAGGER_STEP = 0.1;

/**
 * PrivateProjects — renders private/commercial project cards in the
 * terminal-window card style used by the open-source grid.
 *
 * - **Heading**: a terminal section heading `## private-projects/`
 * - **Cards**: same dark bg, monospace font, terminal border, title bar
 *   with traffic-light dots, emoji + name title, description, tech stack
 *   tags, status badge, and a project URL link.
 * - **Stagger animation**: cards animate in sequentially on mount,
 *   matching the open-source grid entrance feel.
 * - **Reduced motion**: skips all animations, cards appear instantly.
 */
export default function PrivateProjects({
  reducedMotion = false,
}: PrivateProjectsProps) {
  const projects = privateProjectsData as PrivateProject[];

  const staggerStep = reducedMotion
    ? 0
    : Math.min(
        MAX_STAGGER_STEP,
        STAGGER_BUDGET_SECONDS / Math.max(projects.length, 1),
      );

  return (
    <section
      data-testid="private-projects"
      className="mx-auto mt-6 w-full max-w-7xl px-3 sm:px-6"
      aria-label="Private projects"
    >
      {/* Section heading */}
      <h2
        data-testid="private-heading"
        className="mb-4 font-mono text-sm text-terminal-green sm:text-base"
      >
        <span className="text-terminal-dim">##</span> private-projects/
        <span className="ml-2 text-terminal-dim">
          ({projects.length})
        </span>
      </h2>

      {/* Card grid — responsive 1-4 columns */}
      <div
        data-testid="private-card-grid"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {projects.map((project, index) => {
          const delay = index * staggerStep;
          const statusMeta = STATUS_META[project.status];

          return (
            <motion.article
              key={project.id}
              data-testid="private-project-card"
              className="group flex flex-col overflow-hidden rounded-lg border border-terminal-green/30 bg-terminal-bg font-mono shadow-[0_0_0_rgba(0,0,0,0)] transition-shadow duration-200 hover:border-terminal-green/60 hover:shadow-[0_0_24px_-4px_rgba(0,255,65,0.45)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.3,
                delay: reducedMotion ? 0 : delay,
                ease: "easeOut",
              }}
              whileHover={reducedMotion ? undefined : { scale: 1.03 }}
            >
              {/* Title bar — traffic-light dots */}
              <div className="flex items-center gap-1.5 border-b border-terminal-green/20 bg-terminal-green/5 px-3 py-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "#ff5f56" }}
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "#ffbd2e" }}
                  aria-hidden="true"
                />
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "#27c93f" }}
                  aria-hidden="true"
                />
                <span className="ml-2 truncate text-xs text-terminal-dim">
                  {project.name.toLowerCase()}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3
                  data-testid="private-card-title"
                  className="card-glitch text-base font-bold leading-tight text-terminal-green sm:text-lg"
                >
                  {project.emoji && (
                    <span className="mr-1.5" aria-hidden="true">
                      {project.emoji}
                    </span>
                  )}
                  {project.name}
                </h3>

                <p
                  data-testid="private-card-description"
                  className="text-xs leading-relaxed text-terminal-text sm:text-sm"
                >
                  {project.description}
                </p>

                {/* Status badge */}
                <div className="mt-0.5">
                  <span
                    data-testid="private-card-status"
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${statusMeta.color} ${statusMeta.glow}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                {/* Tech stack tags */}
                {project.techStack && project.techStack.length > 0 && (
                  <div
                    data-testid="private-card-tech"
                    className="mt-1 flex flex-wrap gap-1.5"
                  >
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        data-testid="private-tech-tag"
                        className="rounded border border-terminal-cyan/30 bg-terminal-cyan/5 px-1.5 py-0.5 text-[0.65rem] text-terminal-cyan"
                      >
                        #{tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer — project URL */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-terminal-green/15 px-4 py-2.5 text-xs">
                <a
                  data-testid="private-card-url"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${project.name} website (opens in new tab)`}
                  className="inline-flex min-h-[44px] items-center text-terminal-green/80 underline-offset-2 transition-colors hover:text-terminal-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
                >
                  [visit ↗]
                </a>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
