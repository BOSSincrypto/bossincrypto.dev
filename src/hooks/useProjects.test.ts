import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
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

/** Build a multi-category repo list for section ordering tests. */
function multiCategoryRepos(): GitHubRepo[] {
  return [
    mockRepo({
      id: 1,
      name: "crypto-proj",
      stargazers_count: 10,
      updated_at: "2026-01-01T00:00:00Z",
    }),
    mockRepo({
      id: 2,
      name: "ai-proj",
      stargazers_count: 80,
      updated_at: "2026-06-01T00:00:00Z",
    }),
    mockRepo({
      id: 3,
      name: "tool-proj",
      stargazers_count: 30,
      updated_at: "2026-03-01T00:00:00Z",
    }),
    mockRepo({
      id: 4,
      name: "mobile-proj",
      stargazers_count: 5,
      updated_at: "2026-02-01T00:00:00Z",
    }),
    mockRepo({
      id: 5,
      name: "web-proj",
      stargazers_count: 45,
      updated_at: "2026-05-01T00:00:00Z",
    }),
  ];
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

  it("settles to loading=false with static projects from repos.json", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects.length).toBeGreaterThan(0);
    expect(result.current.totalCount).toBe(result.current.projects.length);
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

  // ── Filter / Sort / Search state ──────────────────────────

  it("exposes default filter state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.search).toBe("");
    expect(result.current.debouncedSearch).toBe("");
    expect(result.current.activeCategory).toBeNull();
    expect(result.current.activeLanguage).toBeNull();
    expect(result.current.includeForks).toBe(false);
    expect(result.current.sortBy).toBe("stars");
  });

  it("filtering by category narrows filteredProjects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalCount = result.current.totalCount;

    act(() => {
      result.current.setActiveCategory("crypto-web3");
    });

    // There should be at least one crypto-web3 project, fewer than total
    expect(result.current.filteredProjects.length).toBeGreaterThan(0);
    expect(result.current.filteredProjects.length).toBeLessThan(originalCount);
    expect(result.current.filteredCount).toBe(result.current.filteredProjects.length);

    // All filtered projects should have the matching category
    for (const project of result.current.filteredProjects) {
      expect(project.category).toBe("crypto-web3");
    }
  });

  it("filtering by language narrows filteredProjects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const originalCount = result.current.totalCount;

    act(() => {
      result.current.setActiveLanguage("TypeScript");
    });

    expect(result.current.filteredProjects.length).toBeGreaterThan(0);
    expect(result.current.filteredProjects.length).toBeLessThan(originalCount);

    for (const project of result.current.filteredProjects) {
      expect(project.language).toBe("TypeScript");
    }
  });

  it("including forks changes the count", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const withoutForks = result.current.filteredProjects.length;

    act(() => {
      result.current.setIncludeForks(true);
    });

    const withForks = result.current.filteredProjects.length;

    // There should be at least as many, and likely more projects when forks are included
    expect(withForks).toBeGreaterThanOrEqual(withoutForks);
  });

  it("sorting by name changes order to alphabetical", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSortBy("name");
    });

    expect(result.current.sortBy).toBe("name");

    const names = result.current.filteredProjects.map((p) =>
      p.displayName.toLowerCase(),
    );
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("sorting by stars returns descending order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSortBy("stars");
    });

    const stars = result.current.filteredProjects.map((p) => p.stars);
    for (let i = 1; i < stars.length; i++) {
      expect(stars[i]).toBeLessThanOrEqual(stars[i - 1]);
    }
  });

  it("clearFilters resets all filters to defaults", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change some filters
    act(() => {
      result.current.setSearch("test query");
      result.current.setActiveCategory("crypto-web3");
      result.current.setActiveLanguage("TypeScript");
      result.current.setIncludeForks(true);
      result.current.setSortBy("name");
    });

    // Clear them
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.search).toBe("");
    expect(result.current.debouncedSearch).toBe("");
    expect(result.current.activeCategory).toBeNull();
    expect(result.current.activeLanguage).toBeNull();
    expect(result.current.includeForks).toBe(false);
    expect(result.current.sortBy).toBe("stars");
    // Forkless count should match the count before any filters were set
    expect(result.current.filteredProjects.length).toBeLessThan(result.current.totalCount);
  });

  it("exposes allLanguages from the full dataset", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allLanguages.length).toBeGreaterThan(0);
    // Should include common languages found in the data
    expect(result.current.allLanguages).toContain("TypeScript");
  });

  it("exposes filteredGroups matching filteredProjects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setActiveCategory("crypto-web3");
    });

    // Every project in filteredGroups should be in filteredProjects
    const allFiltered = new Set(result.current.filteredProjects.map((p) => p.id));
    let groupedCount = 0;
    for (const group of result.current.filteredGroups) {
      for (const project of group.projects) {
        expect(allFiltered.has(project.id)).toBe(true);
        groupedCount++;
      }
    }
    expect(groupedCount).toBe(result.current.filteredProjects.length);
  });

  // ── Section ordering (sort ranks category sections) ──────

  it("filteredGroups sections ordered by total stars when sortBy=stars", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse(multiCategoryRepos()),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Default sort is "stars"
    const categories = result.current.filteredGroups.map((g) => g.category);
    const totalStars = result.current.filteredGroups.map(
      (g) => g.projects.reduce((s, p) => s + p.stars, 0),
    );

    // Verify descending order
    for (let i = 1; i < totalStars.length; i++) {
      expect(totalStars[i]).toBeLessThanOrEqual(totalStars[i - 1]);
    }
    // groups (unfiltered) stay in CATEGORY_ORDER
    const groupCats = result.current.groups.map((g) => g.category);
    expect(groupCats).not.toEqual(categories);
  });

  it("filteredGroups sections re-order when switching to sortBy=updated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse(multiCategoryRepos()),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const defaultCats = result.current.filteredGroups.map((g) => g.category);

    act(() => {
      result.current.setSortBy("updated");
    });

    const updatedCats = result.current.filteredGroups.map((g) => g.category);

    // Categories with recent updates should appear earlier than those with older ones
    const maxDates = result.current.filteredGroups.map((g) =>
      Math.max(...g.projects.map((p) => new Date(p.updatedAt).getTime())),
    );
    for (let i = 1; i < maxDates.length; i++) {
      expect(maxDates[i]).toBeLessThanOrEqual(maxDates[i - 1]);
    }
    // Order should differ from the default stars ordering
    expect(updatedCats).not.toEqual(defaultCats);
  });

  it("filteredGroups sections re-order alphabetically when sortBy=name", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse(multiCategoryRepos()),
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSortBy("name");
    });

    const categories = result.current.filteredGroups.map((g) => g.category);
    expect(categories).toEqual([...categories].sort());
  });
});

// ── Search debounce tests (use fake timers) ────────────────────

describe("useProjects search debounce", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces search: filteredProjects only updates after debounce delay", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    // Set a search query
    act(() => {
      result.current.setSearch("alpha");
    });

    // Immediately, search is set but debouncedSearch is still empty
    expect(result.current.search).toBe("alpha");
    expect(result.current.debouncedSearch).toBe("");

    // After 200ms (less than debounce), still not updated
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedSearch).toBe("");

    // After full debounce delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedSearch).toBe("alpha");
  });

  it("multiple rapid keystrokes only fire one debounced update", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    // Rapid keystrokes
    act(() => {
      result.current.setSearch("a");
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      result.current.setSearch("al");
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      result.current.setSearch("alp");
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      result.current.setSearch("alph");
    });

    expect(result.current.debouncedSearch).toBe("");

    // After full debounce from last keystroke
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedSearch).toBe("alph");
  });

  it("clearing search during debounce prevents stale update", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createMockResponse([mockRepo()]),
    );

    const { result } = renderHook(() => useProjects());

    act(() => {
      result.current.setSearch("hello");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Clear before debounce fires
    act(() => {
      result.current.setSearch("");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedSearch).toBe("");
  });
});
