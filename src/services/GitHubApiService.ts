import type { GitHubRepo, Project } from "../types";
import staticRepos from "../data/repos.json";

/**
 * Client-side GitHub API service.
 *
 * Responsibilities:
 * 1. Fetch live repo data from the GitHub REST API.
 * 2. Cache responses in localStorage with a 30-minute TTL.
 * 3. Gracefully fall back to static repos.json on rate-limit / network error.
 *
 * The service NEVER throws — callers always receive a `GitHubRepo[]`.
 */

const GITHUB_API_URL =
  "https://api.github.com/users/BOSSincrypto/repos?per_page=100&sort=updated";

const CACHE_KEY = "bossincrypto:github-repos";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: GitHubRepo[];
  timestamp: number;
}

/**
 * Map a normalised Project (from repos.json) back into the GitHubRepo shape
 * so that the merge logic in the hook can treat fallback data uniformly.
 */
function projectToRepo(project: Project): GitHubRepo {
  return {
    id: project.id,
    name: project.name,
    full_name: `BOSSincrypto/${project.name}`,
    html_url: project.htmlUrl,
    description: project.description || null,
    fork: project.isFork,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    pushed_at: project.pushedAt,
    homepage: project.homepage,
    stargazers_count: project.stars,
    watchers_count: project.stars,
    forks_count: project.forks,
    language: project.language,
    topics: project.topics,
    license: project.license
      ? { key: project.license.toLowerCase(), name: project.license, spdx_id: project.license }
      : null,
    default_branch: "main",
  };
}

export class GitHubApiService {
  private readonly apiUrl: string;
  private readonly cacheKey: string;
  private readonly cacheTtlMs: number;
  private readonly fallbackData: GitHubRepo[];

  constructor(options?: {
    apiUrl?: string;
    cacheKey?: string;
    cacheTtlMs?: number;
    fallbackData?: GitHubRepo[];
  }) {
    this.apiUrl = options?.apiUrl ?? GITHUB_API_URL;
    this.cacheKey = options?.cacheKey ?? CACHE_KEY;
    this.cacheTtlMs = options?.cacheTtlMs ?? CACHE_TTL_MS;
    this.fallbackData =
      options?.fallbackData ??
      (staticRepos as Project[]).map(projectToRepo);
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Fetch repos, preferring cache → live API → static fallback.
   * Returns a `source` field so callers know where the data came from.
   */
  async fetchRepos(): Promise<{ repos: GitHubRepo[]; source: DataSource }> {
    const cached = this.readCache();
    if (cached) {
      return { repos: cached, source: "cache" };
    }

    try {
      const repos = await this.fetchFromApi();
      this.writeCache(repos);
      return { repos, source: "api" };
    } catch {
      return { repos: this.fallbackData, source: "fallback" };
    }
  }

  /** Remove the cached entry (useful for testing / manual refresh). */
  clearCache(): void {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch {
      /* localStorage may be unavailable — ignore */
    }
  }

  // ── Cache helpers ─────────────────────────────────────────

  /** Return cached repos if the entry exists and is within TTL, else null. */
  readCache(): GitHubRepo[] | null {
    try {
      const raw = localStorage.getItem(this.cacheKey);
      if (!raw) return null;

      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.timestamp > this.cacheTtlMs) {
        return null; // expired
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  /** Persist repos to localStorage with the current timestamp. */
  writeCache(repos: GitHubRepo[]): void {
    const entry: CacheEntry = { data: repos, timestamp: Date.now() };
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(entry));
    } catch {
      /* Quota exceeded or unavailable — non-fatal */
    }
  }

  // ── API call ──────────────────────────────────────────────

  /** Fetch repos from the GitHub API. Throws on non-OK / network error. */
  private async fetchFromApi(): Promise<GitHubRepo[]> {
    const response = await fetch(this.apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as GitHubRepo[];
  }
}

/** Where the returned data originated. */
export type DataSource = "cache" | "api" | "fallback";
