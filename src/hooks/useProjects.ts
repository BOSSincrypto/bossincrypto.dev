import { useMemo } from "react";
import { useGitHubData } from "./useGitHubData";
import {
  CATEGORY_ORDER,
  type Project,
  type ProjectCategory,
} from "../types";

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
  /** Total number of projects. */
  totalCount: number;
  /** Projects grouped by category, in CATEGORY_ORDER priority. */
  groups: CategoryGroup[];
}

/**
 * useProjects — project data access hook for the UI.
 *
 * Wraps {@link useGitHubData} and derives a category-grouped view used by the
 * `ProjectGrid`. This is the single integration point between the data layer
 * and the presentation layer; the search/filter/sort feature extends this hook
 * with filter state.
 *
 * Grouping follows `CATEGORY_ORDER` so sections always render in the curated
 * priority order regardless of how the underlying data is ordered, and empty
 * categories are omitted.
 */
export function useProjects(): UseProjectsResult {
  const { projects, loading, error, source } = useGitHubData();

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

    // Emit in CATEGORY_ORDER priority; skip categories with no projects.
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      projects: byCategory.get(category)!,
    }));
  }, [projects]);

  return {
    projects,
    loading,
    error,
    source,
    totalCount: projects.length,
    groups,
  };
}
