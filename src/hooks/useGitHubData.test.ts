import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGitHubData } from "./useGitHubData";
import type { GitHubRepo } from "../types";

// ── Helpers ────────────────────────────────────────────────

function mockRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 1,
    name: "test-repo",
    full_name: "BOSSincrypto/test-repo",
    html_url: "https://github.com/BOSSincrypto/test-repo",
    description: "Test",
    fork: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-07-07T00:00:00Z",
    pushed_at: "2026-01-01T00:00:00Z",
    homepage: null,
    stargazers_count: 42,
    watchers_count: 42,
    forks_count: 1,
    language: "TypeScript",
    topics: [],
    license: null,
    default_branch: "main",
    ...overrides,
  };
}

function createMockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 403,
    json: async () => body,
  } as Response;
}

// ── Tests ──────────────────────────────────────────────────

describe("useGitHubData", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initially returns static projects with loading=true", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useGitHubData());

    // Initial synchronous state: static data is immediately available
    expect(result.current.projects.length).toBeGreaterThan(0);
    expect(result.current.loading).toBe(true);
    expect(result.current.source).toBe("static");

    // Let the async fetch settle to avoid act() warnings
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("loads live data and merges stars", async () => {
    const liveRepos = [
      mockRepo({ name: "crypto-tracker-dashboard", stargazers_count: 999 }),
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse(liveRepos),
    );

    const { result } = renderHook(() => useGitHubData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("api");

    // The live star count should have been merged into the static project
    const project = result.current.projects.find(
      (p) => p.name === "crypto-tracker-dashboard",
    );
    expect(project?.stars).toBe(999);
  });

  it("falls back to static data on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useGitHubData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("fallback");
    expect(result.current.projects.length).toBeGreaterThan(0);
    expect(result.current.error).not.toBeNull();
  });

  it("uses cached data without API call when within TTL", async () => {
    // Pre-populate cache with valid data
    const cachedRepos = [
      mockRepo({ name: "crypto-tracker-dashboard", stargazers_count: 777 }),
    ];
    localStorage.setItem(
      "bossincrypto:github-repos",
      JSON.stringify({ data: cachedRepos, timestamp: Date.now() }),
    );

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useGitHubData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("cache");
    expect(fetchSpy).not.toHaveBeenCalled();

    // Merged star count from cache
    const project = result.current.projects.find(
      (p) => p.name === "crypto-tracker-dashboard",
    );
    expect(project?.stars).toBe(777);
  });

  it("returns all 23 static projects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useGitHubData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(23);
  });

  it("preserves static descriptions after merge", async () => {
    const liveRepos = [
      mockRepo({
        name: "crypto-tracker-dashboard",
        description: "LIVE OVERWRITE",
      }),
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse(liveRepos),
    );

    const { result } = renderHook(() => useGitHubData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const project = result.current.projects.find(
      (p) => p.name === "crypto-tracker-dashboard",
    );
    // Static description must NOT be overridden by live data
    expect(project?.description).not.toBe("LIVE OVERWRITE");
    expect(project?.description).toContain("crypto");
  });
});
