import type { Project, SortOption } from "../types";
import type { CategoryGroup } from "../hooks/useProjects";

/**
 * Filter, search, and sort utilities for the project collection.
 *
 * All functions are pure (no side-effects) which makes them trivial to test
 * and compose.
 */

/**
 * Case-insensitive search across name, description, and topics.
 * Returns true when the query matches any field.
 */
export function matchesSearch(project: Project, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (project.name.toLowerCase().includes(q)) return true;
  if (project.displayName.toLowerCase().includes(q)) return true;
  if (project.description.toLowerCase().includes(q)) return true;
  if (project.topics.some((t) => t.toLowerCase().includes(q))) return true;

  return false;
}

/**
 * Apply search + category / language / fork filters to a project list.
 * Returns a new array (does not mutate the input).
 */
export function filterProjects(
  projects: Project[],
  options: {
    search?: string;
    categories?: Set<string>;
    languages?: Set<string>;
    includeForks?: boolean;
  },
): Project[] {
  const { search = "", categories, languages, includeForks = false } = options;

  return projects.filter((project) => {
    // Fork filter — exclude forks unless explicitly included.
    if (project.isFork && !includeForks) return false;

    // Category filter — if any categories are selected, project must match one.
    if (categories && categories.size > 0 && !categories.has(project.category))
      return false;

    // Language filter — if any languages are selected, project must match one.
    if (
      languages &&
      languages.size > 0 &&
      (!project.language || !languages.has(project.language))
    )
      return false;

    // Search filter.
    if (!matchesSearch(project, search)) return false;

    return true;
  });
}

/**
 * Sort projects by the chosen option.
 * - stars:   descending (most stars first)
 * - updated: descending (most recently updated first)
 * - name:    ascending (A-Z, case-insensitive)
 */
export function sortProjects(projects: Project[], sortBy: SortOption): Project[] {
  const copy = [...projects];

  switch (sortBy) {
    case "stars":
      return copy.sort((a, b) => b.stars - a.stars);

    case "updated":
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    case "name":
      return copy.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
        }),
      );

    default:
      return copy;
  }
}

/**
 * Convenience: apply filter then sort in one call.
 */
export function filterAndSort(
  projects: Project[],
  options: {
    search?: string;
    categories?: Set<string>;
    languages?: Set<string>;
    includeForks?: boolean;
    sortBy: SortOption;
  },
): Project[] {
  return sortProjects(filterProjects(projects, options), options.sortBy);
}

/**
 * Extract the unique set of primary languages from a project list,
 * sorted alphabetically.
 */
export function getUniqueLanguages(projects: Project[]): string[] {
  const languages = new Set<string>();
  for (const project of projects) {
    if (project.language) languages.add(project.language);
  }
  return [...languages].sort((a, b) => a.localeCompare(b));
}

/**
 * Count projects per category, returning entries in category-priority order.
 */
export function getCategoryCounts(
  projects: Project[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const project of projects) {
    counts[project.category] = (counts[project.category] ?? 0) + 1;
  }
  return counts;
}

/**
 * Sort category groups by the active sort criterion, ranking sections
 * (not just cards within them).
 *
 * - stars:   descending by total stars in the section
 * - updated: descending by most recent updatedAt in the section
 * - name:    ascending alphabetically by category label
 */
export function sortCategoryGroups(
  groups: CategoryGroup[],
  sortBy: SortOption,
): CategoryGroup[] {
  const copy = [...groups];

  switch (sortBy) {
    case "stars":
      return copy.sort((a, b) => {
        const aTotal = a.projects.reduce((sum, p) => sum + p.stars, 0);
        const bTotal = b.projects.reduce((sum, p) => sum + p.stars, 0);
        return bTotal - aTotal;
      });

    case "updated":
      return copy.sort((a, b) => {
        const aMax = Math.max(
          ...a.projects.map((p) => new Date(p.updatedAt).getTime()),
        );
        const bMax = Math.max(
          ...b.projects.map((p) => new Date(p.updatedAt).getTime()),
        );
        return bMax - aMax;
      });

    case "name":
      return copy.sort((a, b) =>
        a.category.localeCompare(b.category, undefined, {
          sensitivity: "base",
        }),
      );

    default:
      return copy;
  }
}
