import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProjects } from "./useProjects";
import type { GitHubRepo } from "../types";

function mockRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 1,
    name: "crypto-tracker-dashboard",
    full_name: "BOSSincrypto/crypto-tracker-dashboard",
    html_url: "https://github.com/BOSSincrypto/crypto-tracker-dashboard",
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

function createMockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("useProjects", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes loading=true initially and projects from static data", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());
    expect(result.current.loading).toBe(true);
    expect(result.current.projects.length).toBeGreaterThan(0);
  });

  it("settles to loading=false with all 23 static projects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(23);
    expect(result.current.totalCount).toBe(23);
  });

  it("groups projects by category in CATEGORY_ORDER priority", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const categories = result.current.groups.map((g) => g.category);
    // Must be a strictly increasing subsequence of CATEGORY_ORDER
    const order = [
      "crypto-web3",
      "ai-ml",
      "developer-tools",
      "telegram-bots",
      "mobile-apps",
      "web-apps",
      "utilities",
    ];
    const indices = categories.map((c) => order.indexOf(c));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));

    // Every project appears in exactly one group
    const grouped = result.current.groups.reduce(
      (n, g) => n + g.projects.length,
      0,
    );
    expect(grouped).toBe(result.current.totalCount);
  });

  it("each project belongs to exactly one group", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const seen = new Set<number>();
    for (const group of result.current.groups) {
      for (const project of group.projects) {
        expect(seen.has(project.id)).toBe(false);
        seen.add(project.id);
      }
    }
    expect(seen.size).toBe(result.current.totalCount);
  });

  it("group category matches the projects inside it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    for (const group of result.current.groups) {
      for (const project of group.projects) {
        expect(project.category).toBe(group.category);
      }
    }
  });

  it("exposes error and source from the data layer", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.source).toBe("fallback");
    expect(result.current.error).not.toBeNull();
  });
});
