import type { GitHubRepo, Project } from "../types";

/**
 * Merge live GitHub API data with static project data.
 *
 * Strategy (per architecture.md):
 * - **Static JSON** is the source of truth for curated fields
 *   (description, category, displayName, topics, license, …).
 * - **Live data** overrides dynamic fields: `stars` and `updatedAt`.
 *
 * Projects that exist in static but not in live data are returned unchanged.
 * Live repos with no matching static entry are ignored (they are new repos
 * not yet captured in the build-time snapshot).
 */
export function mergeProjects(
  staticProjects: Project[],
  liveRepos: GitHubRepo[],
): Project[] {
  const liveByName = new Map(liveRepos.map((r) => [r.name, r]));

  return staticProjects.map((project) => {
    const live = liveByName.get(project.name);
    if (!live) return project;

    return {
      ...project,
      stars: live.stargazers_count,
      forks: live.forks_count,
      updatedAt: live.updated_at,
      pushedAt: live.pushed_at,
    };
  });
}
