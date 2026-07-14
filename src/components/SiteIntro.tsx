import { motion } from "framer-motion";

export interface SiteIntroProps {
  /** Total number of projects. */
  totalRepos: number;
  /** Number of unique categories. */
  categoryCount: number;
  /** Disable animations for reduced motion. */
  reducedMotion?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/**
 * SiteIntro — terminal-styled introduction section.
 *
 * Renders a brief description of the project hub in a terminal-window
 * format, including a command prompt (`$ cat about.txt`), a two-sentence
 * overview, and a stats summary line.  Animates in with a staggered fade.
 */
export default function SiteIntro({
  totalRepos,
  categoryCount,
  reducedMotion = false,
}: SiteIntroProps) {
  return (
    <motion.section
      data-testid="site-intro"
      className="terminal-window mt-6 p-4 font-mono sm:p-5 md:p-6"
      variants={containerVariants}
      initial={reducedMotion ? "visible" : "hidden"}
      animate="visible"
      aria-label="Site introduction"
    >
      {/* Command line */}
      <motion.p
        variants={itemVariants}
        className="mb-3 text-sm text-terminal-dim sm:text-base"
        aria-hidden="true"
      >
        <span className="text-terminal-green">$</span>{" "}
        <span className="text-terminal-cyan">cat</span> about.txt
      </motion.p>

      {/* Description text */}
      <motion.div
        variants={itemVariants}
        className="mb-4 flex flex-col gap-2 text-sm leading-relaxed text-terminal-text sm:text-base"
      >
        <p>
          A live hub of all my open-source projects — from crypto tools and AI
          experiments to developer utilities and Telegram bots.
        </p>
        <p>
          Data is pulled in real-time from the GitHub API. Every project card
          shows live stars, languages, and topics.
        </p>
      </motion.div>

      {/* Stats line */}
      <motion.p
        variants={itemVariants}
        className="text-sm text-terminal-dim sm:text-base"
        aria-hidden="true"
      >
        <span className="text-terminal-green">$</span>{" "}
        <span className="text-terminal-text">
          ls projects/ <span className="text-terminal-dim">|</span> wc -l{" "}
        </span>
        <span className="text-terminal-amber">→</span>{" "}
        <span className="text-terminal-green font-bold">
          {totalRepos}+ repositories
        </span>{" "}
        <span className="text-terminal-dim">across</span>{" "}
        <span className="text-terminal-cyan font-bold">
          {categoryCount} categories
        </span>
      </motion.p>
    </motion.section>
  );
}
