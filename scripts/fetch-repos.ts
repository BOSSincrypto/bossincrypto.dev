/**
 * Build-time data fetcher.
 *
 * Fetches all public repos for BOSSincrypto from the GitHub REST API,
 * classifies each into a category, normalises to the Project interface,
 * and writes the result to `src/data/repos.json`.
 *
 * Run via:  pnpm run data:refresh
 *
 * No authentication required (public repos, 60 req/hour unauthenticated).
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyCategory } from "../src/utils/categories.ts";
import type { GitHubRepo, Project, ProjectCategory } from "../src/types/index.ts";

// ── Config ─────────────────────────────────────────────────

const GITHUB_USER = "BOSSincrypto";
const API_URL = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_OUTPUT_PATH = resolve(__dirname, "..", "src", "data", "repos.json");
const PUBLIC_OUTPUT_PATH = resolve(__dirname, "..", "public", "repos.json");

// ── Helpers ────────────────────────────────────────────────

/**
 * Convert a kebab-case repo name to a human-readable display name.
 * "crypto-tracker-dashboard" → "Crypto Tracker Dashboard"
 */
function toDisplayName(name: string): string {
  return name
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Normalise a raw GitHub repo into the Project model. */
function normaliseRepo(repo: GitHubRepo): Project {
  const category: ProjectCategory = classifyCategory({
    topics: repo.topics ?? [],
    name: repo.name,
    description: repo.description,
    language: repo.language,
  });

  const language = repo.language ?? null;

  return {
    id: repo.id,
    name: repo.name,
    displayName: toDisplayName(repo.name),
    description: repo.description ?? "",
    htmlUrl: repo.html_url,
    homepage: repo.homepage || null,
    language,
    languages: language ? [language] : [],
    topics: repo.topics ?? [],
    category,
    license: repo.license?.spdx_id ?? null,
    isFork: repo.fork,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    featured: false,
    summary: repo.description ?? "",
  };
}

// ── Main ───────────────────────────────────────────────────

async function fetchRepos(): Promise<GitHubRepo[]> {
  const response = await fetch(API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "bossincrypto.dev-data-fetcher",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API returned ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as GitHubRepo[];
}

async function main(): Promise<void> {
  console.log(`[data:refresh] Fetching repos from ${API_URL} …`);

  const repos = await fetchRepos();
  console.log(`[data:refresh] Received ${repos.length} repos.`);

  const projects = repos
    .map(normaliseRepo)
    .sort((a, b) => b.stars - a.stars || b.updatedAt.localeCompare(a.updatedAt));

  const json = JSON.stringify(projects, null, 2) + "\n";

  // Write to src/data/ for bundling (imported by services/hooks at build time).
  mkdirSync(dirname(SRC_OUTPUT_PATH), { recursive: true });
  writeFileSync(SRC_OUTPUT_PATH, json, "utf-8");

  // Also write to public/ so the JSON is HTTP-fetchable at /repos.json
  // (serves as a static fallback URL for VAL-DATA-001).
  mkdirSync(dirname(PUBLIC_OUTPUT_PATH), { recursive: true });
  writeFileSync(PUBLIC_OUTPUT_PATH, json, "utf-8");

  console.log(`[data:refresh] Wrote ${projects.length} projects to:`);
  console.log(`  ${SRC_OUTPUT_PATH}`);
  console.log(`  ${PUBLIC_OUTPUT_PATH}`);

  // Print category distribution for quick verification.
  const distribution: Record<string, number> = {};
  for (const p of projects) {
    distribution[p.category] = (distribution[p.category] ?? 0) + 1;
  }
  console.log("[data:refresh] Category distribution:");
  for (const [cat, count] of Object.entries(distribution)) {
    console.log(`  ${cat}: ${count}`);
  }
}

main().catch((err: unknown) => {
  console.error("[data:refresh] FATAL:", err);
  process.exit(1);
});
