import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGitHubData } from "./useGitHubData";
import {
  CATEGORY_ORDER,
  type Project,
  type ProjectCategory,
  type SortOption,
} from "../types";
import {
  filterAndSort,
  getUniqueLanguages,
} from "../utils/filters";

/**
 * A category group: the category key plus the projects classified under it.
 */
export interface CategoryGroup {
  category: ProjectCategory;
  projects: Project[];
}

export interface UseProjectsResult {
  /** All merged projects (static + live enhancement). */
  projects: Project[];
  /** True while the initial live-data fetch is in-flight. */
  loading: boolean;
  /** Non-null when the live fetch failed and the static fallback is in use. */
  error: string | null;
  /** Where the data came from: "cache" | "api" | "fallback" | "static". */
  source: "cache" | "api" | "fallback" | "static";
  /** Total number of projects (unfiltered). */
  totalCount: number;
  /** Projects grouped by category, in CATEGORY_ORDER priority (unfiltered). */
  groups: CategoryGroup[];

  // ── Filter / Sort / Search state ──────────────────────────────

  /** Current search query (debounced). */
  search: string;
  /** Update the search query. */
  setSearch: (query: string) => void;
  /** Debounced search query (used for actual filtering). */
  debouncedSearch: string;

  /** Active category filter (null = show all). */
  activeCategory: ProjectCategory | null;
  /** Set the active category filter. */
  setActiveCategory: (category: ProjectCategory | null) => void;

  /** Active language filter (null = show all). */
  activeLanguage: string | null;
  /** Set the active language filter. */
  setActiveLanguage: (language: string | null) => void;

  /** Whether to include forked projects. */
  includeForks: boolean;
  /** Toggle fork inclusion. */
  setIncludeForks: (include: boolean) => void;

  /** Current sort option. */
  sortBy: SortOption;
  /** Set the sort option. */
  setSortBy: (option: SortOption) => void;

  /** Reset all filters to defaults. */
  clearFilters: () => void;

  // ── Derived data ──────────────────────────────────────────

  /** Filtered + sorted projects (applies all active filters + sort). */
  filteredProjects: Project[];
  /** Filtered projects grouped by category. */
  filteredGroups: CategoryGroup[];
  /** Number of projects after filtering (before sorting). */
  filteredCount: number;

  /** All unique primary languages from the full project set. */
  allLanguages: string[];

  /** Default filter values. */
  defaultFilters: {
    search: string;
    activeCategory: null;
    activeLanguage: null;
    includeForks: boolean;
    sortBy: SortOption;
  };
}

/** Default search debounce delay in milliseconds. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * useProjects — project data access hook for the UI.
 *
 * Wraps {@link useGitHubData} and extends it with search, filter, sort, and
 * derived grouped views.  This is the single integration point between the
 * data layer and the presentation layer.
 *
 * - Filter state lives in the hook (not in context) so each consumer can
 *   have its own filter scope.
 * - Search is debounced by `SEARCH_DEBOUNCE_MS` (~300ms) to avoid
 *   re-filtering on every keystroke.
 * - All filters are combined with AND logic; sort is applied last.
 * - Grouping follows `CATEGORY_ORDER` so sections always render in the
 *   curated priority order.  Empty categories are omitted.
 */
export function useProjects(): UseProjectsResult {
  const { projects, loading, error, source } = useGitHubData();

  // ── Filter / Sort / Search state ──────────────────────────

  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [includeForks, setIncludeForks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("stars");

  // Debounce search input.  Uses a simple timeout approach — when `search`
  // changes, schedule an update to `debouncedSearch` after the delay.
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback((query: string) => {
    setSearchRaw(query);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // Cleanup the timer on unmount.
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const clearFilters = useCallback(() => {
    setSearchRaw("");
    setDebouncedSearch("");
    setActiveCategory(null);
    setActiveLanguage(null);
    setIncludeForks(false);
    setSortBy("stars");
  }, []);

  // ── Derived data ──────────────────────────────────────────

  // Unfiltered groups.
  const groups = useMemo<CategoryGroup[]>(() => {
    const byCategory = new Map<ProjectCategory, Project[]>();
    for (const project of projects) {
      let bucket = byCategory.get(project.category);
      if (!bucket) {
        bucket = [];
        byCategory.set(project.category, bucket);
      }
      bucket.push(project);
    }

    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      projects: byCategory.get(category)!,
    }));
  }, [projects]);

  // All unique languages from the full dataset.
  const allLanguages = useMemo(() => getUniqueLanguages(projects), [projects]);

  // Filtered + sorted projects.
  const filteredProjects = useMemo(() => {
    const categories = activeCategory ? new Set([activeCategory]) : undefined;
    const languages = activeLanguage ? new Set([activeLanguage]) : undefined;

    return filterAndSort(projects, {
      search: debouncedSearch,
      categories: categories as Set<string> | undefined,
      languages: languages as Set<string> | undefined,
      includeForks,
      sortBy,
    });
  }, [projects, debouncedSearch, activeCategory, activeLanguage, includeForks, sortBy]);

  const filteredCount = filteredProjects.length;

  // Filtered groups.
  const filteredGroups = useMemo<CategoryGroup[]>(() => {
    const byCategory = new Map<ProjectCategory, Project[]>();
    for (const project of filteredProjects) {
      let bucket = byCategory.get(project.category);
      if (!bucket) {
        bucket = [];
        byCategory.set(project.category, bucket);
      }
      bucket.push(project);
    }

    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      projects: byCategory.get(category)!,
    }));
  }, [filteredProjects]);

  return {
    projects,
    loading,
    error,
    source,
    totalCount: projects.length,
    groups,

    // Filter/sort/search state
    search,
    setSearch,
    debouncedSearch,
    activeCategory,
    setActiveCategory,
    activeLanguage,
    setActiveLanguage,
    includeForks,
    setIncludeForks,
    sortBy,
    setSortBy,
    clearFilters,

    // Derived
    filteredProjects,
    filteredGroups,
    filteredCount,
    allLanguages,

    defaultFilters: {
      search: "",
      activeCategory: null,
      activeLanguage: null,
      includeForks: false,
      sortBy: "stars" as SortOption,
    },
  };
}
