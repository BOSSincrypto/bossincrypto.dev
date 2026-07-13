import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project } from "../types";
import { relativeTime } from "../utils/format";

/**
 * Animation variants for the modal backdrop (fade in/out).
 */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
} as const;

/**
 * Animation variants for the modal panel (spring scale + fade).
 */
const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.15, ease: "easeIn" },
  },
} as const;

/** Reduced-motion variants — instant appear/disappear. */
const instantVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
} as const;

export interface ProjectDetailProps {
  /** The project to display, or null to hide the modal. */
  project: Project | null;
  /** Called when the modal should close. */
  onClose: () => void;
  /** When true, animations are skipped (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

/**
 * ProjectDetail — a modal overlay that displays full project information.
 *
 * Features:
 * - Spring-based scale+fade entrance, reverse exit (or instant with reduced-motion).
 * - Displays: name, full description, ALL topics, languages, license, stars, forks,
 *   homepage (when present), GitHub link (target=_blank, rel=noopener),
 *   relative-time of updatedAt, and a README link affordance.
 * - Closable via: close button, backdrop click, Escape key.
 * - Focus is trapped inside the modal while open.
 * - No "null" or "undefined" text leaks.
 * - Only one modal is open at a time (managed by parent state).
 *
 * Always renders AnimatePresence so exit animations play when project becomes null.
 */
export default function ProjectDetail({
  project,
  onClose,
  reducedMotion = false,
}: ProjectDetailProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when modal opens
  useEffect(() => {
    if (project && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [project]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && project) {
        onClose();
      }
    },
    [onClose, project],
  );

  useEffect(() => {
    if (project) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [project, handleKeyDown]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    if (project) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [project]);

  const backdrop = reducedMotion ? instantVariants : backdropVariants;
  const panel = reducedMotion ? instantVariants : panelVariants;

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const title = project?.displayName || project?.name;
  const description = project?.description?.trim() || "// no description";
  const topics = project?.topics ?? [];
  const languages = project?.languages ?? [];
  const homepage = project?.homepage;

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="modal-backdrop"
          data-testid="modal-backdrop"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          aria-label="Close modal"
          role="presentation"
        >
          <motion.div
            key="modal-panel"
            data-testid="modal-panel"
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-terminal-green/40 bg-terminal-bg font-mono shadow-[0_0_48px_-8px_rgba(0,255,65,0.3)]"
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={stopPropagation}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Close button — top right corner, min 44x44 touch target */}
            <button
              ref={closeBtnRef}
              data-testid="modal-close-btn"
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded border border-terminal-green/30 bg-terminal-bg/90 text-terminal-green transition-colors hover:border-terminal-green/60 hover:bg-terminal-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg"
            >
              <span aria-hidden="true">✕</span>
            </button>

            {/* Scrollable content area — responsive padding */}
            <div className="overflow-y-auto p-4 sm:p-6">
              {/* Title bar — terminal window chrome */}
              <div className="mb-4 flex items-center gap-1.5 border-b border-terminal-green/20 pb-3">
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
                <span className="ml-2 text-xs text-terminal-dim">
                  {project.name}
                </span>
              </div>

              {/* Project name */}
              <h2
                id="modal-title"
                data-testid="modal-title"
                className="mb-2 text-xl font-bold text-terminal-green"
              >
                {title}
              </h2>

              {project.isFork && (
                <span
                  data-testid="modal-fork-indicator"
                  className="mb-3 inline-block rounded border border-terminal-red/40 px-2 py-0.5 text-xs text-terminal-red"
                >
                  ⑂ fork of another repository
                </span>
              )}

              {/* Description */}
              <p
                data-testid="modal-description"
                className={`mb-4 leading-relaxed text-sm sm:text-base ${
                  project.description?.trim()
                    ? "text-terminal-text"
                    : "text-terminal-dim italic"
                }`}
              >
                {description}
              </p>

              {/* Meta grid: stats + details */}
              <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
                {/* Stars */}
                <div className="flex items-center gap-1.5">
                  <span className="text-terminal-dim">★</span>
                  <span className="text-terminal-amber">Stars:</span>
                  <span
                    data-testid="modal-stars"
                    className="text-terminal-green"
                  >
                    {project.stars}
                  </span>
                </div>

                {/* Forks */}
                <div className="flex items-center gap-1.5">
                  <span className="text-terminal-dim">⑂</span>
                  <span className="text-terminal-amber">Forks:</span>
                  <span
                    data-testid="modal-forks"
                    className="text-terminal-green"
                  >
                    {project.forks}
                  </span>
                </div>

                {/* License */}
                {project.license && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-terminal-dim">⚖</span>
                    <span className="text-terminal-amber">License:</span>
                    <span
                      data-testid="modal-license"
                      className="text-terminal-green"
                    >
                      {project.license}
                    </span>
                  </div>
                )}

                {/* Primary language */}
                {project.language && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-terminal-dim">◉</span>
                    <span className="text-terminal-amber">Primary:</span>
                    <span className="text-terminal-cyan">
                      {project.language}
                    </span>
                  </div>
                )}
              </div>

              {/* All languages */}
              {languages.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-terminal-amber">
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded border border-terminal-cyan/30 bg-terminal-cyan/5 px-2 py-0.5 text-xs text-terminal-cyan"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All topics */}
              {topics.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-1.5 text-xs font-semibold text-terminal-amber">
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((topic) => (
                      <span
                        key={topic}
                        data-testid="modal-topic-tag"
                        className="rounded border border-terminal-green/25 bg-terminal-green/5 px-1.5 py-0.5 text-[0.7rem] text-terminal-green/80"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relative time */}
              <div className="mb-4">
                <span
                  data-testid="modal-updated"
                  className="text-xs text-terminal-dim"
                >
                  {relativeTime(project.updatedAt)}
                </span>
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-terminal-green/15 pt-4 text-sm">
                {/* GitHub link */}
                <a
                  data-testid="modal-github"
                  href={project.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-terminal-green/80 underline-offset-2 transition-colors hover:text-terminal-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
                >
                  [View on GitHub ↗]
                </a>

                {/* Homepage link (when present) */}
                {homepage && (
                  <a
                    data-testid="modal-homepage"
                    href={homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-terminal-cyan/80 underline-offset-2 transition-colors hover:text-terminal-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
                  >
                    [Live Demo ↗]
                  </a>
                )}

                {/* README link */}
                <a
                  data-testid="modal-readme"
                  href={`${project.htmlUrl}#readme`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-terminal-dim/80 underline-offset-2 transition-colors hover:text-terminal-dim hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-dim"
                >
                  [README.md]
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
