import { motion } from "framer-motion";

/**
 * Single social link rendered as a terminal command.
 * `command` is the CLI-style token shown after the `$ ` prompt.
 */
interface SocialLink {
  readonly command: string;
  readonly label: string;
  readonly href: string;
}

/**
 * The five social links, in display order.
 * URLs are authoritative for VAL-HEADER-003.
 */
const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    command: "twitter",
    label: "X / Twitter",
    href: "https://x.com/BOSSincrypto",
  },
  {
    command: "github",
    label: "GitHub",
    href: "https://github.com/BOSSincrypto",
  },
  {
    command: "telegram",
    label: "Telegram",
    href: "https://t.me/BOSSincrypto",
  },
  {
    command: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/bossincrypto",
  },
  {
    command: "email",
    label: "Email",
    href: "mailto:bossincrypto@gmail.com",
  },
];

/**
 * Tech stack display. Exactly six technologies (VAL-HEADER-004).
 */
const TECH_STACK = [
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Solidity",
  "Web3.js",
] as const;

/**
 * Per-link accent color, cycled so each social command stands out in a
 * different neon channel while staying within the terminal palette.
 */
const LINK_ACCENTS = [
  "text-terminal-cyan",
  "text-terminal-amber",
  "text-terminal-cyan",
  "text-terminal-amber",
  "text-terminal-cyan",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * TerminalHeader — identity block for the project hub.
 *
 * Renders the avatar, name (ILYA), title (BOSSincrypto), subtitle, five
 * social links styled as terminal commands, the tech stack, and a blinking
 * terminal cursor prompt. Satisfies VAL-HEADER-001..004 and VAL-BOOT-010.
 *
 * Responsive: stacks vertically on mobile, row layout on desktop.
 */
export default function TerminalHeader() {
  return (
    <motion.header
      data-testid="terminal-header"
      className="terminal-window flex flex-col gap-6 p-5 sm:p-6 md:flex-row md:items-start"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label="Profile header"
    >
      {/* Avatar */}
      <motion.div variants={itemVariants} className="shrink-0">
        <img
          src="/avatarka_main.jpg"
          alt="ILYA — BOSSincrypto avatar"
          width={128}
          height={128}
          loading="eager"
          className="h-28 w-28 rounded border border-terminal-green/40 bg-terminal-bg object-cover shadow-[0_0_25px_-5px_rgba(0,255,65,0.5)] sm:h-32 sm:w-32"
        />
      </motion.div>

      {/* Identity + links + stack */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <h1 className="font-mono text-3xl font-bold tracking-wide text-terminal-green sm:text-4xl">
            ILYA
          </h1>
          <h2 className="font-mono text-lg font-semibold text-terminal-cyan sm:text-xl">
            BOSSincrypto
          </h2>
          <p className="font-mono text-sm text-terminal-text">
            Crypto Investor • Influencer • Builder
          </p>
        </motion.div>

        {/* Social links styled as terminal commands */}
        <motion.nav
          variants={itemVariants}
          data-testid="social-links"
          aria-label="Social links"
          className="flex flex-col gap-1.5"
        >
          {SOCIAL_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className={`group font-mono text-sm transition-colors hover:text-terminal-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg ${LINK_ACCENTS[i % LINK_ACCENTS.length]}`}
            >
              <span className="text-terminal-green">$</span>{" "}
              <span className="text-terminal-text/70 group-hover:text-terminal-green">
                ./
              </span>
              <span>{link.command}</span>
            </a>
          ))}
        </motion.nav>

        {/* Tech stack */}
        <motion.div
          variants={itemVariants}
          data-testid="tech-stack"
          aria-label="Tech stack"
          className="flex flex-col gap-1.5"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-terminal-dim">
            <span className="text-terminal-amber">#</span> stack
          </p>
          <ul className="flex flex-wrap gap-2">
            {TECH_STACK.map((tech) => (
              <li
                key={tech}
                className="rounded border border-terminal-green/30 bg-terminal-green/5 px-2 py-0.5 font-mono text-xs text-terminal-green"
              >
                {tech}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Blinking terminal cursor prompt (VAL-BOOT-010) */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-1 font-mono text-sm text-terminal-green"
          aria-hidden="true"
        >
          <span>$</span>
          <span
            data-testid="terminal-cursor"
            className="terminal-cursor inline-block h-4 w-2 translate-y-0.5"
          />
        </motion.div>
      </div>
    </motion.header>
  );
}
