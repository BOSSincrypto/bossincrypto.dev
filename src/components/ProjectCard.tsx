import { motion } from "framer-motion";
import { useCallback, type KeyboardEvent } from "react";
import type { Project } from "../types";

/**
 * Accent color per primary language for the language badge pill.
 * Falls back to terminal-cyan for unmapped languages.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Rust: "#dea584",
  Go: "#00ADD8",
  Shell: "#89e051",
  Java: "#b07219",
  Swift: "#F05138",
};

function languageColor(language: string | null): string {
  if (!language) return "#00e5ff";
  return LANGUAGE_COLORS[language] ?? "#00e5ff";
}

/** Maximum number of topic tags shown on a card (rest are truncated). */
const MAX_TOPICS = 4;

/** Fallback placeholder for missing descriptions (VAL-PROJ-005). */
const NO_DESCRIPTION = "// no description";

export interface ProjectCardProps {
  project: Project;
  /** Invoked when the card body is clicked / activated (opens detail modal). */
  onClick?: (project: Project) => void;
  /** Delay (seconds) before the entrance animation plays (stagger). */
  entranceDelay?: number;
  /** Disable non-essential animations (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

/**
 * ProjectCard — a single project rendered as a terminal window.
 *
 * Layout:
 * - **Title bar**: three traffic-light dots + the repo name (terminal window chrome).
 * - **Body** (clickable, keyboard-accessible): prominent title with hover glitch,
 *   description (graceful empty handling), language badge, star count, fork
 *   indicator, and topic tags.
 * - **Footer**: license tag, GitHub link, and a distinct homepage link.
 *
 * The body click/Enter/Space fires `onClick` (ready for the detail modal).
 * Homepage and GitHub links live outside the clickable body and stop
 * propagation so they never trigger the detail view (VAL-PROJ-010, VAL-PROJ-019).
 */
export default function ProjectCard({
  project,
  onClick,
  entranceDelay = 0,
  reducedMotion = false,
}: ProjectCardProps) {
  const handleActivate = useCallback(() => {
    onClick?.(project);
  }, [onClick, project]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleActivate();
      }
    },
    [handleActivate],
  );

  const title = project.displayName || project.name;
  const description = project.description?.trim() || NO_DESCRIPTION;
  const topics = project.topics?.slice(0, MAX_TOPICS) ?? [];

  return (
    <motion.article
      data-testid="project-card"
      className="group flex flex-col overflow-hidden rounded-lg border border-terminal-green/30 bg-terminal-bg font-mono shadow-[0_0_0_rgba(0,0,0,0)] transition-shadow duration-200 hover:border-terminal-green/60 hover:shadow-[0_0_24px_-4px_rgba(0,255,65,0.45)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.3,
        delay: reducedMotion ? 0 : entranceDelay,
        ease: "easeOut",
      }}
      whileHover={reducedMotion ? undefined : { scale: 1.03 }}
    >
      {/* Title bar — terminal window chrome with 3 traffic-light dots */}
      <div
        data-testid="card-title-bar"
        className="flex items-center gap-1.5 border-b border-terminal-green/20 bg-terminal-green/5 px-3 py-2"
      >
        <span
          data-testid="traffic-dot"
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#ff5f56" }}
          aria-hidden="true"
        />
        <span
          data-testid="traffic-dot"
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#ffbd2e" }}
          aria-hidden="true"
        />
        <span
          data-testid="traffic-dot"
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#27c93f" }}
          aria-hidden="true"
        />
        <span className="ml-2 truncate text-xs text-terminal-dim">
          {project.name}
        </span>
      </div>

      {/* Body — clickable, opens detail (VAL-PROJ-014 wiring) */}
      <div
        data-testid="card-body"
        role="button"
        tabIndex={0}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        aria-label={`Open details for ${title}`}
        className="flex flex-1 cursor-pointer flex-col gap-2 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
      >
        <h3
          data-testid="card-title"
          className="card-glitch text-base font-bold leading-tight text-terminal-green sm:text-lg"
        >
          {title}
        </h3>

        <p
          data-testid="card-description"
          className={`text-xs leading-relaxed sm:text-sm ${
            project.description?.trim()
              ? "text-terminal-text"
              : "text-terminal-dim italic"
          }`}
        >
          {description}
        </p>

        {/* Meta row: language badge, stars, fork indicator */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {project.language && (
            <span
              data-testid="card-language"
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
              style={{
                color: languageColor(project.language),
                borderColor: `${languageColor(project.language)}55`,
                backgroundColor: `${languageColor(project.language)}14`,
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: languageColor(project.language) }}
                aria-hidden="true"
              />
              {project.language}
            </span>
          )}

          <span
            data-testid="card-stars"
            className="inline-flex items-center gap-1 text-terminal-amber"
            title={`${project.stars} stars`}
          >
            <StarIcon />
            <span>{project.stars}</span>
          </span>

          {project.isFork && (
            <span
              data-testid="card-fork"
              className="inline-flex items-center gap-1 rounded border border-terminal-red/40 px-1.5 py-0.5 text-terminal-red"
            >
              <ForkIcon /> fork
            </span>
          )}
        </div>

        {/* Topic tags — hidden when empty (VAL-PROJ-008) */}
        {topics.length > 0 && (
          <div
            data-testid="card-topics"
            className="mt-1 flex flex-wrap gap-1.5"
          >
            {topics.map((topic) => (
              <span
                key={topic}
                data-testid="topic-tag"
                className="rounded border border-terminal-cyan/30 bg-terminal-cyan/5 px-1.5 py-0.5 text-[0.65rem] text-terminal-cyan"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer — license, GitHub link, homepage link (distinct from body click) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-terminal-green/15 px-4 py-2 text-xs">
        {project.license && (
          <span
            data-testid="card-license"
            className="text-terminal-dim"
            title={`License: ${project.license}`}
          >
            <span className="text-terminal-green/60">⚖</span> {project.license}
          </span>
        )}

        <a
          data-testid="card-github"
          href={project.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${project.name} on GitHub (opens in new tab)`}
          className="text-terminal-green/80 underline-offset-2 transition-colors hover:text-terminal-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
        >
          [github]
        </a>

        {project.homepage && (
          <a
            data-testid="card-homepage"
            href={project.homepage}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open homepage for ${project.name} (opens in new tab)`}
            className="text-terminal-cyan/80 underline-offset-2 transition-colors hover:text-terminal-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
          >
            [live demo ↗]
          </a>
        )}
      </div>
    </motion.article>
  );
}

/** Inline star icon (crisp at small sizes, no external asset). */
function StarIcon() {
  return (
    <svg
      data-testid="star-icon"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

/** Inline fork indicator icon. */
function ForkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="11"
      height="11"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  );
}
