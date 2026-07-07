import { motion } from "framer-motion";

/**
 * App — root component.
 *
 * This is a minimal scaffold shell that demonstrates the full toolchain is
 * wired up (React 19, Tailwind CSS 4 terminal theme, Framer Motion, JetBrains
 * Mono font). Subsequent features build out the terminal UI, data layer, and
 * interactive experience on top of this foundation.
 */
export default function App() {
  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-green font-mono p-8">
      <motion.h1
        className="text-2xl font-bold tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-terminal-amber">$</span>{" "}
        <span>BOSSincrypto.dev</span>
      </motion.h1>

      <p className="mt-4 text-terminal-text text-sm">
        // Project hub initializing...
      </p>
      <p className="mt-2 text-terminal-cyan text-sm">
        <span className="text-terminal-green">{'>'}</span> Awaiting boot
        sequence.
      </p>
    </main>
  );
}
