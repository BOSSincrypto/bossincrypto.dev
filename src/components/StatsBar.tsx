import { useMemo } from "react";
import { useCountUp } from "../hooks/useCountUp";
import type { Project } from "../types";

export interface StatsBarProps {
  /** All projects (unfiltered) to compute aggregates from. */
  projects: Project[];
  /** Disable animations for reduced motion. */
  reducedMotion?: boolean;
}

interface Stat {
  label: string;
  value: number;
  icon: string;
  accent: string;
}

/**
 * StatsBar — animated count-up stats row.
 *
 * Renders four terminal-styled stat cards with animated count-up numbers
 * using `useCountUp`.  Stats are computed from the full (unfiltered) project
 * list so the aggregates remain stable regardless of active filters.
 *
 * - **Total Repos**: count of all projects.
 * - **Total Stars**: sum of `stars` across all projects.
 * - **Languages**: count of unique primary languages.
 * - **Contributions**: sum of `forks` across all projects (used as a proxy
 *   for community contributions / engagement).
 *
 * Animation (VAL-SEARCH-018):
 * - Each stat animates from 0 to its final value over ~1s.
 * - Uses `useCountUp` with `requestAnimationFrame` for smooth animation.
 * - With `reducedMotion`, all values appear at their final value immediately.
 */
export default function StatsBar({ projects, reducedMotion = false }: StatsBarProps) {
  const stats = useMemo<Stat[]>(() => {
    const totalRepos = projects.length;
    const totalStars = projects.reduce((sum, p) => sum + p.stars, 0);
    const languages = new Set(projects.map((p) => p.language).filter(Boolean));
    const contributions = projects.reduce((sum, p) => sum + p.forks, 0);

    return [
      {
        label: "Total Repos",
        value: totalRepos,
        icon: ">",
        accent: "text-terminal-green",
      },
      {
        label: "Total Stars",
        value: totalStars,
        icon: "★",
        accent: "text-terminal-amber",
      },
      {
        label: "Languages",
        value: languages.size,
        icon: "#",
        accent: "text-terminal-cyan",
      },
      {
        label: "Contributions",
        value: contributions,
        icon: "⎔",
        accent: "text-terminal-green",
      },
    ];
  }, [projects]);

  return (
    <div
      data-testid="stats-bar"
      className="mx-auto mt-6 grid w-full max-w-7xl grid-cols-2 gap-2 px-3 sm:grid-cols-4 sm:gap-3 sm:px-6"
      role="group"
      aria-label="Project statistics"
    >
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          stat={stat}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}

interface StatCardProps {
  stat: Stat;
  reducedMotion: boolean;
}

function StatCard({ stat, reducedMotion }: StatCardProps) {
  const countUpOpts = useMemo(
    () => ({
      end: stat.value,
      duration: 1000,
      start: reducedMotion ? stat.value : 0,
      autoplay: !reducedMotion,
    }),
    [stat.value, reducedMotion],
  );

  const { value } = useCountUp(countUpOpts);

  const formattedValue = useMemo(() => {
    if (stat.value >= 1000) {
      return `${(stat.value / 1000).toFixed(1)}k`;
    }
    return String(value);
  }, [stat.value, value]);

  return (
    <div
      data-testid="stat-card"
      className="flex flex-col gap-1 rounded border border-terminal-green/20 bg-terminal-green/5 px-3 py-3 font-mono sm:px-4"
    >
      <div className="flex items-center gap-1.5 text-xs text-terminal-dim">
        <span className={stat.accent} aria-hidden="true">
          {stat.icon}
        </span>
        <span>{stat.label}</span>
      </div>
      <span
        data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
        className={`text-lg font-bold sm:text-xl ${stat.accent}`}
        aria-live="polite"
        aria-label={`${stat.label}: ${stat.value}`}
      >
        {formattedValue}
      </span>
    </div>
  );
}
