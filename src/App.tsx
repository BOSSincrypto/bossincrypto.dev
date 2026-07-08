import { motion } from "framer-motion";
import TerminalHeader from "./components/TerminalHeader";

/**
 * App — root component.
 *
 * Renders the terminal shell scaffold and the TerminalHeader identity block.
 * Subsequent features (BootSequence, StatsBar, ProjectGrid) will compose on top
 * of this foundation.
 */
export default function App() {
  return (
    <main className="min-h-screen bg-terminal-bg font-mono text-terminal-green p-4 sm:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          className="text-sm text-terminal-cyan"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-terminal-amber">$</span>{" "}
          <span>BOSSincrypto.dev</span>
          <span className="terminal-cursor ml-1 inline-block h-3 w-1.5 translate-y-0.5" />
        </motion.div>

        <div className="mt-6">
          <TerminalHeader />
        </div>
      </div>
    </main>
  );
}
