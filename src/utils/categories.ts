import type { GitHubRepo, ProjectCategory } from "../types";

/**
 * Category classification heuristic.
 *
 * Projects are auto-classified based on topics (primary signal), repo name,
 * and description.  Categories are evaluated in the priority order defined by
 * the architecture; the first match wins.
 *
 * @see architecture.md "Category Classification Rules"
 */

interface ClassificationInput {
  topics: string[];
  name: string;
  description: string | null;
  language: string | null;
}

/**
 * Keyword sets per category (checked against topic word-parts and name tokens).
 * Languages that trigger a category by primary language are listed separately.
 */
const CATEGORY_RULES: {
  category: ProjectCategory;
  keywords: string[];
  languages?: string[];
}[] = [
  {
    category: "crypto-web3",
    keywords: [
      "crypto",
      "bitcoin",
      "ethereum",
      "blockchain",
      "solidity",
      "web3",
      "defi",
      "wallet",
    ],
  },
  {
    category: "ai-ml",
    keywords: [
      "ai",
      "ml",
      "openai",
      "llm",
      "gpt",
      "gemini",
      "claude",
      "openrouter",
    ],
  },
  {
    category: "developer-tools",
    keywords: [
      "developer",
      "cli",
      "sdk",
      "api",
      "tools",
      "editor",
      "markdown",
      "converter",
    ],
  },
  {
    category: "telegram-bots",
    keywords: ["telegram", "bot"],
  },
  {
    category: "mobile-apps",
    keywords: ["android", "ios", "mobile", "pwa"],
    languages: ["Kotlin", "Swift"],
  },
  {
    category: "web-apps",
    keywords: ["react", "github-pages"],
    languages: ["TypeScript", "JavaScript", "HTML"],
  },
];

/**
 * Split a hyphenated/underscored token into lowercased word-parts.
 * "crypto-tracker-dashboard" → ["crypto", "tracker", "dashboard"]
 */
function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[-_]+/);
}

/**
 * Return true when any token list contains a keyword as an exact word-part.
 */
function tokensMatchKeyword(tokens: string[], keyword: string): boolean {
  return tokens.includes(keyword);
}

/**
 * Check whether the given input matches a keyword set.
 *
 * 1. Topics — split into word-parts and checked for exact keyword matches.
 * 2. Name   — split into word-parts (same approach as topics).
 * 3. Description — split into words and checked for exact keyword matches.
 */
function matchesCategory(
  keywords: string[],
  input: ClassificationInput,
): boolean {
  const topicTokens = input.topics.flatMap(tokenize);
  const nameTokens = tokenize(input.name);
  const descTokens = input.description
    ? input.description.toLowerCase().split(/[^a-z0-9]+/i)
    : [];

  return keywords.some(
    (kw) =>
      tokensMatchKeyword(topicTokens, kw) ||
      tokensMatchKeyword(nameTokens, kw) ||
      tokensMatchKeyword(descTokens, kw),
  );
}

/**
 * Auto-classify a project into one of seven categories.
 *
 * Each category's rule set is evaluated in priority order; the first match
 * wins.  If no rule matches, the project falls back to `"utilities"`.
 */
export function classifyCategory(input: ClassificationInput): ProjectCategory;

/** Overload accepting a raw GitHub API repo object. */
export function classifyCategory(repo: GitHubRepo): ProjectCategory;

export function classifyCategory(
  source: ClassificationInput | GitHubRepo,
): ProjectCategory {
  const input: ClassificationInput =
    "topics" in source && "stargazers_count" in source
      ? {
          topics: source.topics ?? [],
          name: source.name,
          description: source.description,
          language: source.language,
        }
      : (source as ClassificationInput);

  for (const rule of CATEGORY_RULES) {
    const keywordMatch = matchesCategory(rule.keywords, input);
    const languageMatch =
      rule.languages && input.language
        ? rule.languages.includes(input.language)
        : false;

    if (keywordMatch || languageMatch) {
      return rule.category;
    }
  }

  return "utilities";
}

/**
 * Group projects by category, preserving CATEGORY_ORDER for the key order.
 * Returns an array of { category, label, projects } entries.
 */
export function groupByCategory<T extends { category: ProjectCategory }>(
  projects: T[],
): { category: ProjectCategory; projects: T[] }[] {
  const groups = new Map<ProjectCategory, T[]>();

  for (const project of projects) {
    const list = groups.get(project.category) ?? [];
    list.push(project);
    groups.set(project.category, list);
  }

  // Return in a stable order following CATEGORY_ORDER; only categories that
  // have at least one project are included.
  return (
    (
      [
        "crypto-web3",
        "ai-ml",
        "developer-tools",
        "telegram-bots",
        "mobile-apps",
        "web-apps",
        "utilities",
      ] as ProjectCategory[]
    )
      .filter((cat) => groups.has(cat))
      .map((category) => ({ category, projects: groups.get(category)! }))
  );
}
