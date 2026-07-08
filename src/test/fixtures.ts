import type { Project, ProjectCategory } from "../types";

/**
 * Build a fully-populated `Project` for tests, overriding only the fields
 * each test cares about. Keeps fixture noise out of individual test files.
 */
export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: "crypto-tracker-dashboard",
    displayName: "Crypto Tracker Dashboard",
    description: "Real-time crypto portfolio tracker with live prices.",
    htmlUrl: "https://github.com/BOSSincrypto/crypto-tracker-dashboard",
    homepage: "https://crypto.bossincrypto.dev",
    language: "TypeScript",
    languages: ["TypeScript"],
    topics: ["crypto", "web3", "dashboard", "react", "bitcoin"],
    category: "crypto-web3" as ProjectCategory,
    license: "MIT",
    isFork: false,
    stars: 42,
    forks: 3,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    pushedAt: "2026-06-30T00:00:00Z",
    featured: false,
    summary: "Real-time crypto portfolio tracker with live prices.",
    ...overrides,
  };
}
