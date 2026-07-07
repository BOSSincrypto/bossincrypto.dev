import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GitHubApiService } from "./GitHubApiService";
import type { GitHubRepo } from "../types";

// ── Helpers ────────────────────────────────────────────────

const CACHE_KEY = "bossincrypto:github-repos";

function mockRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 1,
    name: "test-repo",
    full_name: "BOSSincrypto/test-repo",
    html_url: "https://github.com/BOSSincrypto/test-repo",
    description: "Test description",
    fork: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-01-01T00:00:00Z",
    homepage: null,
    stargazers_count: 5,
    watchers_count: 5,
    forks_count: 1,
    language: "TypeScript",
    topics: ["react"],
    license: { key: "mit", name: "MIT License", spdx_id: "MIT" },
    default_branch: "main",
    ...overrides,
  };
}

function createMockResponse(
  ok: boolean,
  status: number,
  body: unknown,
): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
    headers: new Headers(),
  } as Response;
}

// ── Tests ──────────────────────────────────────────────────

describe("GitHubApiService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Cache hit ─────────────────────────────────────────

  describe("cache hit (within TTL)", () => {
    it("returns cached data without making an API call", async () => {
      const cachedRepos = [mockRepo({ name: "cached-repo", stargazers_count: 99 })];
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: cachedRepos, timestamp: Date.now() }),
      );

      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const service = new GitHubApiService({ fallbackData: [] });
      const { repos, source } = await service.fetchRepos();

      expect(source).toBe("cache");
      expect(repos).toEqual(cachedRepos);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns cached data when just under TTL boundary", async () => {
      const cachedRepos = [mockRepo()];
      // 29 minutes ago — just within 30 min TTL
      const timestamp = Date.now() - 29 * 60 * 1000;
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: cachedRepos, timestamp }),
      );

      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const service = new GitHubApiService({ fallbackData: [] });
      const { source } = await service.fetchRepos();

      expect(source).toBe("cache");
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── Cache miss ────────────────────────────────────────

  describe("cache miss (fresh fetch)", () => {
    it("fetches from API and caches the result", async () => {
      const freshRepos = [mockRepo({ name: "fresh-repo", stargazers_count: 10 })];
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(createMockResponse(true, 200, freshRepos));

      const service = new GitHubApiService({ fallbackData: [] });
      const { repos, source } = await service.fetchRepos();

      expect(source).toBe("api");
      expect(repos).toEqual(freshRepos);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Verify it was cached
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)!);
      expect(cached.data).toEqual(freshRepos);
      expect(cached.timestamp).toBeCloseTo(Date.now(), -2);
    });

    it("fetches from API on cache miss (no cache entry)", async () => {
      const freshRepos = [mockRepo()];
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        createMockResponse(true, 200, freshRepos),
      );

      const service = new GitHubApiService({ fallbackData: [] });
      const { source } = await service.fetchRepos();

      expect(source).toBe("api");
    });
  });

  // ── Cache expiry ──────────────────────────────────────

  describe("cache expiry (TTL exceeded)", () => {
    it("fetches fresh data when cache is expired", async () => {
      const staleRepos = [mockRepo({ name: "stale-repo", stargazers_count: 1 })];
      // 31 minutes ago — past 30 min TTL
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: staleRepos,
          timestamp: Date.now() - 31 * 60 * 1000,
        }),
      );

      const freshRepos = [mockRepo({ name: "fresh-repo", stargazers_count: 99 })];
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(createMockResponse(true, 200, freshRepos));

      const service = new GitHubApiService({ fallbackData: [] });
      const { repos, source } = await service.fetchRepos();

      expect(source).toBe("api");
      expect(repos).toEqual(freshRepos);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Cache should now contain fresh data
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)!);
      expect(cached.data).toEqual(freshRepos);
    });
  });

  // ── Fallback on error ─────────────────────────────────

  describe("fallback on API failure", () => {
    it("falls back to static data on 403 rate-limit error", async () => {
      const fallback = [mockRepo({ name: "fallback-repo" })];
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        createMockResponse(false, 403, { message: "rate limit exceeded" }),
      );

      const service = new GitHubApiService({ fallbackData: fallback });
      const { repos, source } = await service.fetchRepos();

      expect(source).toBe("fallback");
      expect(repos).toEqual(fallback);
    });

    it("falls back to static data on network error (fetch rejection)", async () => {
      const fallback = [mockRepo({ name: "fallback-repo" })];
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new Error("network error"),
      );

      const service = new GitHubApiService({ fallbackData: fallback });
      const { repos, source } = await service.fetchRepos();

      expect(source).toBe("fallback");
      expect(repos).toEqual(fallback);
    });

    it("falls back on 500 server error", async () => {
      const fallback = [mockRepo({ name: "fallback-repo" })];
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        createMockResponse(false, 500, { message: "server error" }),
      );

      const service = new GitHubApiService({ fallbackData: fallback });
      const { source } = await service.fetchRepos();

      expect(source).toBe("fallback");
    });

    it("does not cache on failure", async () => {
      const fallback = [mockRepo({ name: "fallback-repo" })];
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));

      const service = new GitHubApiService({ fallbackData: fallback });
      await service.fetchRepos();

      expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    });

    it("never throws — always returns repos", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("total failure"));

      const service = new GitHubApiService({ fallbackData: [] });

      await expect(service.fetchRepos()).resolves.toBeDefined();
    });
  });

  // ── Cache management ──────────────────────────────────

  describe("cache management", () => {
    it("clearCache removes the cache entry", () => {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: [mockRepo()], timestamp: Date.now() }),
      );

      const service = new GitHubApiService({ fallbackData: [] });
      service.clearCache();

      expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    });

    it("readCache returns null when no cache exists", () => {
      const service = new GitHubApiService({ fallbackData: [] });
      expect(service.readCache()).toBeNull();
    });

    it("readCache returns null for corrupted cache data", () => {
      localStorage.setItem(CACHE_KEY, "not-valid-json{");

      const service = new GitHubApiService({ fallbackData: [] });
      expect(service.readCache()).toBeNull();
    });

    it("writeCache stores data with timestamp", () => {
      const service = new GitHubApiService({ fallbackData: [] });
      const repos = [mockRepo({ name: "test" })];

      service.writeCache(repos);

      const cached = JSON.parse(localStorage.getItem(CACHE_KEY)!);
      expect(cached.data).toEqual(repos);
      expect(typeof cached.timestamp).toBe("number");
    });
  });

  // ── Custom TTL ────────────────────────────────────────

  describe("custom TTL", () => {
    it("respects a custom shorter TTL", async () => {
      const cachedRepos = [mockRepo()];
      // 5 minutes ago — within default 30 min but past custom 1 min
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: cachedRepos,
          timestamp: Date.now() - 5 * 60 * 1000,
        }),
      );

      const freshRepos = [mockRepo({ name: "fresh" })];
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        createMockResponse(true, 200, freshRepos),
      );

      const service = new GitHubApiService({
        cacheTtlMs: 60 * 1000, // 1 minute
        fallbackData: [],
      });
      const { source } = await service.fetchRepos();

      expect(source).toBe("api"); // expired because TTL is 1 min
    });
  });

  // ── Custom cache key ──────────────────────────────────

  describe("custom cache key", () => {
    it("uses a custom cache key for storage", async () => {
      const customKey = "custom:cache:key";
      const cachedRepos = [mockRepo()];
      localStorage.setItem(
        customKey,
        JSON.stringify({ data: cachedRepos, timestamp: Date.now() }),
      );

      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const service = new GitHubApiService({
        cacheKey: customKey,
        fallbackData: [],
      });
      const { source } = await service.fetchRepos();

      expect(source).toBe("cache");
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
