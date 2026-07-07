import { describe, it, expect } from "vitest";
import { mergeProjects } from "./merge";
import type { GitHubRepo, Project } from "../types";

// ── Fixtures ───────────────────────────────────────────────

function makeProject(overrides: Partial<Project> & { name: string }): Project {
  return {
    id: 1,
    displayName: "Test Project",
    description: "Static description",
    htmlUrl: "https://github.com/BOSSincrypto/test",
    homepage: null,
    language: "TypeScript",
    languages: ["TypeScript"],
    topics: ["react"],
    category: "web-apps",
    license: "MIT",
    isFork: false,
    stars: 10,
    forks: 2,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    pushedAt: "2026-01-01T00:00:00Z",
    featured: false,
    summary: "Static description",
    ...overrides,
  };
}

function makeRepo(overrides: Partial<GitHubRepo> & { name: string }): GitHubRepo {
  return {
    id: 1,
    full_name: `BOSSincrypto/${overrides.name}`,
    html_url: `https://github.com/BOSSincrypto/${overrides.name}`,
    description: null,
    fork: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    pushed_at: "2026-01-01T00:00:00Z",
    homepage: null,
    stargazers_count: 0,
    watchers_count: 0,
    forks_count: 0,
    language: null,
    topics: [],
    license: null,
    default_branch: "main",
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────

describe("mergeProjects", () => {
  it("overrides stars from live data", () => {
    const staticProjects = [makeProject({ name: "my-repo", stars: 10 })];
    const liveRepos = [
      makeRepo({ name: "my-repo", stargazers_count: 42 }),
    ];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].stars).toBe(42);
  });

  it("overrides updatedAt from live data", () => {
    const staticProjects = [
      makeProject({ name: "my-repo", updatedAt: "2026-01-01T00:00:00Z" }),
    ];
    const liveRepos = [
      makeRepo({ name: "my-repo", updated_at: "2026-07-07T12:00:00Z" }),
    ];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].updatedAt).toBe("2026-07-07T12:00:00Z");
  });

  it("overrides forks from live data", () => {
    const staticProjects = [makeProject({ name: "my-repo", forks: 2 })];
    const liveRepos = [makeRepo({ name: "my-repo", forks_count: 5 })];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].forks).toBe(5);
  });

  it("preserves static description (not overridden by live)", () => {
    const staticProjects = [
      makeProject({ name: "my-repo", description: "Curated description" }),
    ];
    const liveRepos = [
      makeRepo({ name: "my-repo", description: "Live description" }),
    ];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].description).toBe("Curated description");
  });

  it("preserves static category (not overridden by live)", () => {
    const staticProjects = [
      makeProject({ name: "my-repo", category: "crypto-web3" }),
    ];
    const liveRepos = [makeRepo({ name: "my-repo" })];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].category).toBe("crypto-web3");
  });

  it("preserves static displayName (not overridden by live)", () => {
    const staticProjects = [
      makeProject({ name: "my-repo", displayName: "My Cool Repo" }),
    ];
    const liveRepos = [makeRepo({ name: "my-repo" })];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].displayName).toBe("My Cool Repo");
  });

  it("preserves static topics (not overridden by live)", () => {
    const staticProjects = [
      makeProject({ name: "my-repo", topics: ["crypto", "defi"] }),
    ];
    const liveRepos = [makeRepo({ name: "my-repo", topics: ["other"] })];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].topics).toEqual(["crypto", "defi"]);
  });

  it("returns static project unchanged when no live match exists", () => {
    const staticProjects = [
      makeProject({ name: "static-only", stars: 15 }),
    ];
    const liveRepos = [makeRepo({ name: "different-repo" })];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result[0].stars).toBe(15);
    expect(result[0].name).toBe("static-only");
  });

  it("ignores live repos with no matching static entry", () => {
    const staticProjects = [makeProject({ name: "repo-a" })];
    const liveRepos = [
      makeRepo({ name: "repo-a" }),
      makeRepo({ name: "repo-b" }),
      makeRepo({ name: "repo-c" }),
    ];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("repo-a");
  });

  it("handles multiple projects with partial live matches", () => {
    const staticProjects = [
      makeProject({ id: 1, name: "repo-a", stars: 1 }),
      makeProject({ id: 2, name: "repo-b", stars: 2 }),
      makeProject({ id: 3, name: "repo-c", stars: 3 }),
    ];
    const liveRepos = [
      makeRepo({ name: "repo-a", stargazers_count: 100 }),
      // repo-b not in live data
      makeRepo({ name: "repo-c", stargazers_count: 300 }),
    ];

    const result = mergeProjects(staticProjects, liveRepos);

    expect(result.map((p) => p.stars)).toEqual([100, 2, 300]);
  });

  it("handles empty live repos array", () => {
    const staticProjects = [
      makeProject({ name: "repo-a", stars: 5 }),
      makeProject({ name: "repo-b", stars: 10 }),
    ];

    const result = mergeProjects(staticProjects, []);

    expect(result).toHaveLength(2);
    expect(result[0].stars).toBe(5);
    expect(result[1].stars).toBe(10);
  });

  it("handles empty static projects array", () => {
    const result = mergeProjects([], [
      makeRepo({ name: "repo-a", stargazers_count: 5 }),
    ]);

    expect(result).toEqual([]);
  });

  it("does not mutate the input static projects", () => {
    const staticProjects = [makeProject({ name: "my-repo", stars: 10 })];
    const liveRepos = [
      makeRepo({ name: "my-repo", stargazers_count: 42 }),
    ];

    mergeProjects(staticProjects, liveRepos);

    expect(staticProjects[0].stars).toBe(10); // unchanged
  });
});
