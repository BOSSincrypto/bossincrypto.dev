import { describe, it, expect } from "vitest";
import {
  matchesSearch,
  filterProjects,
  sortProjects,
  filterAndSort,
  getUniqueLanguages,
  getCategoryCounts,
  sortCategoryGroups,
} from "./filters";
import type { Project, ProjectCategory, SortOption } from "../types";
import type { CategoryGroup } from "../hooks/useProjects";

// ── Test fixtures ──────────────────────────────────────────

function makeProject(overrides: Partial<Project> & { name: string }): Project {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    displayName: overrides.name.replace(/-/g, " "),
    description: "A test project",
    htmlUrl: `https://github.com/BOSSincrypto/${overrides.name}`,
    homepage: null,
    language: "TypeScript",
    languages: ["TypeScript"],
    topics: [],
    category: "web-apps",
    license: "MIT",
    isFork: false,
    stars: 0,
    forks: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z",
    featured: false,
    summary: "A test project",
    ...overrides,
  };
}

const fixtures: Project[] = [
  makeProject({
    name: "alpha",
    displayName: "Alpha",
    description: "Crypto trading bot",
    topics: ["crypto", "bot"],
    category: "crypto-web3",
    language: "TypeScript",
    stars: 50,
    isFork: false,
    updatedAt: "2026-06-01T00:00:00Z",
  }),
  makeProject({
    name: "beta",
    displayName: "Beta",
    description: "AI-powered assistant",
    topics: ["ai", "ml"],
    category: "ai-ml",
    language: "Python",
    stars: 100,
    isFork: false,
    updatedAt: "2026-07-01T00:00:00Z",
  }),
  makeProject({
    name: "gamma",
    displayName: "Gamma",
    description: "Simple calculator utility",
    topics: ["tools"],
    category: "utilities",
    language: "JavaScript",
    stars: 5,
    isFork: true,
    updatedAt: "2026-05-01T00:00:00Z",
  }),
  makeProject({
    name: "delta",
    displayName: "Delta",
    description: "Kotlin Android app",
    topics: ["android"],
    category: "mobile-apps",
    language: "Kotlin",
    stars: 25,
    isFork: false,
    updatedAt: "2026-04-01T00:00:00Z",
  }),
];

// ── matchesSearch ──────────────────────────────────────────

describe("matchesSearch", () => {
  it("returns true for empty query", () => {
    expect(matchesSearch(fixtures[0], "")).toBe(true);
    expect(matchesSearch(fixtures[0], "   ")).toBe(true);
  });

  it("matches by name (case-insensitive)", () => {
    expect(matchesSearch(fixtures[0], "alpha")).toBe(true);
    expect(matchesSearch(fixtures[0], "ALPHA")).toBe(true);
    expect(matchesSearch(fixtures[0], "Alp")).toBe(true);
  });

  it("matches by displayName", () => {
    expect(matchesSearch(fixtures[0], "Alpha")).toBe(true);
  });

  it("matches by description", () => {
    expect(matchesSearch(fixtures[0], "crypto trading")).toBe(true);
    expect(matchesSearch(fixtures[1], "AI-powered")).toBe(true);
  });

  it("matches by topic", () => {
    expect(matchesSearch(fixtures[0], "crypto")).toBe(true);
    expect(matchesSearch(fixtures[1], "ml")).toBe(true);
  });

  it("returns false for non-matching query", () => {
    expect(matchesSearch(fixtures[0], "xyz123")).toBe(false);
  });
});

// ── filterProjects ─────────────────────────────────────────

describe("filterProjects", () => {
  it("returns all non-fork projects by default", () => {
    const result = filterProjects(fixtures, {});
    expect(result).toHaveLength(3); // gamma is a fork, excluded
    expect(result.find((p) => p.name === "gamma")).toBeUndefined();
  });

  it("includes forks when includeForks is true", () => {
    const result = filterProjects(fixtures, { includeForks: true });
    expect(result).toHaveLength(4);
    expect(result.find((p) => p.name === "gamma")).toBeDefined();
  });

  it("filters by category", () => {
    const categories = new Set(["crypto-web3"]);
    const result = filterProjects(fixtures, { categories });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha");
  });

  it("filters by multiple categories", () => {
    const categories = new Set(["crypto-web3", "ai-ml"]);
    const result = filterProjects(fixtures, { categories, includeForks: true });
    expect(result).toHaveLength(2);
  });

  it("filters by language", () => {
    const languages = new Set(["TypeScript"]);
    const result = filterProjects(fixtures, { languages });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha");
  });

  it("filters by search query", () => {
    const result = filterProjects(fixtures, { search: "AI" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("beta");
  });

  it("combines all filters (intersection)", () => {
    const result = filterProjects(fixtures, {
      search: "trading",
      categories: new Set(["crypto-web3"]),
      languages: new Set(["TypeScript"]),
      includeForks: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha");
  });

  it("returns empty when no project matches", () => {
    const result = filterProjects(fixtures, { search: "nonexistent" });
    expect(result).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const original = [...fixtures];
    filterProjects(fixtures, { search: "alpha" });
    expect(fixtures).toEqual(original);
  });
});

// ── sortProjects ───────────────────────────────────────────

describe("sortProjects", () => {
  it("sorts by stars descending", () => {
    const result = sortProjects(fixtures, "stars" as SortOption);
    expect(result.map((p) => p.stars)).toEqual([100, 50, 25, 5]);
  });

  it("sorts by updated date descending", () => {
    const result = sortProjects(fixtures, "updated" as SortOption);
    expect(result.map((p) => p.name)).toEqual([
      "beta",
      "alpha",
      "gamma",
      "delta",
    ]);
  });

  it("sorts by name ascending (case-insensitive)", () => {
    const result = sortProjects(fixtures, "name" as SortOption);
    expect(result.map((p) => p.displayName)).toEqual([
      "Alpha",
      "Beta",
      "Delta",
      "Gamma",
    ]);
  });

  it("does not mutate the input array", () => {
    const originalOrder = fixtures.map((p) => p.name);
    sortProjects(fixtures, "stars");
    expect(fixtures.map((p) => p.name)).toEqual(originalOrder);
  });

  it("handles empty array", () => {
    expect(sortProjects([], "stars")).toEqual([]);
  });
});

// ── filterAndSort ──────────────────────────────────────────

describe("filterAndSort", () => {
  it("applies filter then sort", () => {
    const result = filterAndSort(fixtures, {
      includeForks: true,
      sortBy: "stars",
    });
    expect(result.map((p) => p.stars)).toEqual([100, 50, 25, 5]);
  });

  it("applies search + sort", () => {
    const result = filterAndSort(fixtures, {
      search: "a",
      sortBy: "name",
    });
    // Matches alpha, beta, delta, gamma (all have "a" in description or name)
    // gamma is fork, excluded by default
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── getUniqueLanguages ─────────────────────────────────────

describe("getUniqueLanguages", () => {
  it("extracts unique languages sorted alphabetically", () => {
    const result = getUniqueLanguages(fixtures);
    expect(result).toEqual(["JavaScript", "Kotlin", "Python", "TypeScript"]);
  });

  it("excludes null languages", () => {
    const projects = [
      makeProject({ name: "a", language: null }),
      makeProject({ name: "b", language: "TypeScript" }),
    ];
    expect(getUniqueLanguages(projects)).toEqual(["TypeScript"]);
  });

  it("returns empty for all-null languages", () => {
    const projects = [makeProject({ name: "a", language: null })];
    expect(getUniqueLanguages(projects)).toEqual([]);
  });
});

// ── getCategoryCounts ──────────────────────────────────────

describe("getCategoryCounts", () => {
  it("counts projects per category", () => {
    const result = getCategoryCounts(fixtures);
    expect(result).toEqual({
      "crypto-web3": 1,
      "ai-ml": 1,
      utilities: 1,
      "mobile-apps": 1,
    });
  });

  it("returns empty object for empty input", () => {
    expect(getCategoryCounts([])).toEqual({});
  });
});

// ── sortCategoryGroups ─────────────────────────────────────

/** Build a CategoryGroup from a list of projects sharing the same category. */
function makeGroup(
  projects: Project[],
): CategoryGroup {
  return {
    category: projects[0]?.category ?? "utilities",
    projects,
  };
}

describe("sortCategoryGroups", () => {
  const groupA = makeGroup([fixtures[0]]); // crypto-web3, 50 stars, updated 2026-06-01
  const groupB = makeGroup([fixtures[1]]); // ai-ml, 100 stars, updated 2026-07-01
  const groupC = makeGroup([fixtures[2]]); // utilities, 5 stars, updated 2026-05-01
  const groupD = makeGroup([fixtures[3]]); // mobile-apps, 25 stars, updated 2026-04-01

  // Two-project group to test aggregate sorting
  const multiGroup = makeGroup([
    makeProject({
      name: "epsilon",
      category: "web-apps" as ProjectCategory,
      stars: 30,
      updatedAt: "2026-03-01T00:00:00Z",
    }),
    makeProject({
      name: "zeta",
      category: "web-apps" as ProjectCategory,
      stars: 40,
      updatedAt: "2026-08-01T00:00:00Z",
    }),
  ]);

  it("sorts sections by total stars descending", () => {
    const groups = [groupC, groupA, groupB, groupD];
    const result = sortCategoryGroups(groups, "stars");
    expect(result.map((g) => g.category)).toEqual([
      "ai-ml",       // 100
      "crypto-web3", // 50
      "mobile-apps", // 25
      "utilities",   // 5
    ]);
  });

  it("sorts sections by most recent updatedAt descending", () => {
    const groups = [groupD, groupC, groupA, groupB];
    const result = sortCategoryGroups(groups, "updated");
    expect(result.map((g) => g.category)).toEqual([
      "ai-ml",       // 2026-07-01
      "crypto-web3", // 2026-06-01
      "utilities",   // 2026-05-01
      "mobile-apps", // 2026-04-01
    ]);
  });

  it("sorts sections by category key ascending", () => {
    const groups = [groupB, groupA, groupD, groupC];
    const result = sortCategoryGroups(groups, "name");
    expect(result.map((g) => g.category)).toEqual([
      "ai-ml",
      "crypto-web3",
      "mobile-apps",
      "utilities",
    ]);
  });

  it("uses the most recent date in multi-project sections", () => {
    // multiGroup has two projects: epsilon (2026-03-01), zeta (2026-08-01)
    // Group A is 2026-06-01 → multiGroup (2026-08-01) should come first
    const groups = [groupA, multiGroup];
    const result = sortCategoryGroups(groups, "updated");
    expect(result[0].category).toBe("web-apps"); // multiGroup first
  });

  it("sums stars across all projects in a section", () => {
    // multiGroup has 30 + 40 = 70 stars; groupA has 50 → multiGroup first
    const groups = [groupA, multiGroup];
    const result = sortCategoryGroups(groups, "stars");
    expect(result[0].category).toBe("web-apps"); // 70 > 50
  });

  it("returns empty array unchanged", () => {
    expect(sortCategoryGroups([], "stars")).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    const result = sortCategoryGroups([groupA], "stars");
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("crypto-web3");
  });

  it("does not mutate the input array", () => {
    const groups = [groupC, groupA, groupB];
    const originalOrder = [...groups];
    sortCategoryGroups(groups, "stars");
    expect(groups.map((g) => g.category)).toEqual(originalOrder.map((g) => g.category));
  });
});
