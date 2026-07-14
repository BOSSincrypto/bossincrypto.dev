/**
 * Type definitions for the BOSSincrypto.dev project hub data layer.
 */

/**
 * The seven curated project categories.
 * Listed in classification priority order (first match wins).
 */
export type ProjectCategory =
  | "crypto-web3"
  | "ai-ml"
  | "developer-tools"
  | "telegram-bots"
  | "mobile-apps"
  | "web-apps"
  | "utilities";

/** Static, ordered list of all categories for iteration/iteration-order. */
export const CATEGORY_ORDER: ProjectCategory[] = [
  "crypto-web3",
  "ai-ml",
  "developer-tools",
  "telegram-bots",
  "mobile-apps",
  "web-apps",
  "utilities",
];

/** Human-readable labels for each category. */
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  "crypto-web3": "Crypto / Web3",
  "ai-ml": "AI / ML",
  "developer-tools": "Developer Tools",
  "telegram-bots": "Telegram Bots",
  "mobile-apps": "Mobile Apps",
  "web-apps": "Web Apps",
  utilities: "Utilities",
};

/**
 * Normalised project model used throughout the UI.
 * Generated at build-time and enriched client-side.
 */
export interface Project {
  /** GitHub repo numeric ID. */
  id: number;
  /** Repository name (e.g. "crypto-tracker-dashboard"). */
  name: string;
  /** Curated display name (title-cased version of name by default). */
  displayName: string;
  /** GitHub description (empty string when null). */
  description: string;
  /** https://github.com/BOSSincrypto/{name} */
  htmlUrl: string;
  /** Live demo URL or null. */
  homepage: string | null;

  /** Primary language detected by GitHub. */
  language: string | null;
  /** All detected languages (at minimum the primary). */
  languages: string[];
  /** GitHub topics tags. */
  topics: string[];
  /** Auto-classified category. */
  category: ProjectCategory;
  /** SPDX license ID (e.g. "MIT") or null. */
  license: string | null;
  /** Whether the repo is a fork. */
  isFork: boolean;

  /** Star count (live-enhanced at runtime). */
  stars: number;
  /** Fork count. */
  forks: number;

  /** ISO date the repo was created. */
  createdAt: string;
  /** ISO date of last update (live-enhanced at runtime). */
  updatedAt: string;
  /** ISO date of last push. */
  pushedAt: string;

  /** Curated "featured" flag (false by default). */
  featured: boolean;
  /** Curated one-liner for card display (defaults to description). */
  summary: string;
}

/**
 * Subset of the GitHub REST API repository response.
 * Only fields consumed by the application are listed.
 */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  license: { key: string; name: string; spdx_id: string } | null;
  default_branch: string;
}

/** Sort options exposed to the UI. */
export type SortOption = "stars" | "updated" | "name";

/** Active filter state used by useProjects / filter utilities. */
export interface FilterState {
  search: string;
  categories: Set<ProjectCategory>;
  languages: Set<string>;
  includeForks: boolean;
  sortBy: SortOption;
}

/**
 * User-configurable visual/audio effect settings.
 *
 * Persisted to localStorage via `useLocalStorage`. `reducedMotion` is NOT
 * included here because it is an OS/browser preference detected via the
 * `prefers-reduced-motion` media query (see `useReducedMotion`), not a
 * user-facing toggle.
 */
export interface SettingsState {
  /** CRT scanline overlay on/off. */
  scanlines: boolean;
  /** Matrix rain background on/off. */
  matrixRain: boolean;
  /** Starfield + grid futuristic background on/off. */
  starfield: boolean;
  /** Sound effects on/off. */
  sound: boolean;
}

/** Default settings: scanlines on, starfield on, matrix rain and sound off. */
export const DEFAULT_SETTINGS: SettingsState = {
  scanlines: true,
  matrixRain: false,
  starfield: true,
  sound: false,
};
