import { useEffect, useRef, useState } from "react";
import type { Project } from "../types";
import staticRepos from "../data/repos.json";
import { GitHubApiService } from "../services/GitHubApiService";
import { mergeProjects } from "../utils/merge";

export interface UseGitHubDataResult {
  /** Merged projects (static + live enhancement). */
  projects: Project[];
  /** True while the initial live-data fetch is in-flight. */
  loading: boolean;
  /** Non-null when the live fetch failed and static fallback is in use. */
  error: string | null;
  /** Where the data came from: "cache" | "api" | "fallback". */
  source: "cache" | "api" | "fallback" | "static";
}

/**
 * Fetch and merge GitHub repo data.
 *
 * 1. Immediately serves the static `repos.json` snapshot.
 * 2. Concurrently requests live data via `GitHubApiService`.
 * 3. On success, merges live stars/updatedAt into the static projects.
 * 4. On failure, silently keeps the static data (no error UI).
 *
 * The effect runs once on mount.  A ref guard prevents state updates after
 * unmount.
 */
export function useGitHubData(): UseGitHubDataResult {
  const [projects, setProjects] = useState<Project[]>(
    staticRepos as Project[],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] =
    useState<UseGitHubDataResult["source"]>("static");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const service = new GitHubApiService();

    service
      .fetchRepos()
      .then(({ repos, source: src }) => {
        if (!mountedRef.current) return;

        const merged = mergeProjects(staticRepos as Project[], repos);
        setProjects(merged);
        setSource(src);
        setLoading(false);

        if (src === "fallback") {
          setError("Live data unavailable — showing static snapshot.");
        }
      })
      .catch(() => {
        // Should never happen — service catches internally — but guard anyway.
        if (!mountedRef.current) return;
        setError("Unexpected error fetching live data.");
        setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { projects, loading, error, source };
}
