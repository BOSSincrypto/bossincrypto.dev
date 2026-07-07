import { describe, it, expect } from "vitest";
import {
  classifyCategory,
  groupByCategory,
} from "./categories";
import type { GitHubRepo } from "../types";

// ── Helpers ────────────────────────────────────────────────

function makeRepo(
  overrides: Partial<GitHubRepo> & { name: string },
): GitHubRepo {
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

// ── Classification by topics ───────────────────────────────

describe("classifyCategory — topic-based", () => {
  it("classifies crypto repos via crypto topic keywords", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "crypto-tracker-dashboard",
          topics: ["bitcoin", "crypto", "cryptocurrency", "blockchain"],
        }),
      ),
    ).toBe("crypto-web3");

    expect(
      classifyCategory(
        makeRepo({
          name: "wallet-project",
          topics: ["ethereum", "defi", "wallet"],
        }),
      ),
    ).toBe("crypto-web3");
  });

  it("classifies AI/ML repos via AI topic keywords", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "news-minimalist",
          topics: ["ai-news", "openrouter", "artificial-intelligence"],
        }),
      ),
    ).toBe("ai-ml");

    expect(
      classifyCategory(
        makeRepo({
          name: "my-llm-tool",
          topics: ["llm", "gemini", "claude"],
        }),
      ),
    ).toBe("ai-ml");
  });

  it("classifies developer-tools repos via tool keywords", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "markitdown-app",
          topics: ["markdown-converter", "file-converter", "document-converter"],
        }),
      ),
    ).toBe("developer-tools");

    expect(
      classifyCategory(
        makeRepo({
          name: "my-editor",
          topics: ["editor", "cli", "sdk"],
        }),
      ),
    ).toBe("developer-tools");
  });

  it("classifies telegram-bots via telegram topic keyword", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "analytics-for-telegram-bot",
          topics: ["telegram", "telegram-bot", "python"],
        }),
      ),
    ).toBe("telegram-bots");
  });

  it("classifies mobile-apps via mobile topic keywords", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "my-android-app",
          topics: ["android", "mobile"],
        }),
      ),
    ).toBe("mobile-apps");

    expect(
      classifyCategory(
        makeRepo({
          name: "my-pwa",
          topics: ["pwa", "service-worker"],
        }),
      ),
    ).toBe("mobile-apps");
  });

  it("classifies web-apps via web topic keywords", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "my-react-app",
          topics: ["react", "github-pages"],
          language: "TypeScript",
        }),
      ),
    ).toBe("web-apps");
  });
});

// ── Classification by language ─────────────────────────────

describe("classifyCategory — language-based", () => {
  it("classifies Kotlin repos as mobile-apps", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "some-app", language: "Kotlin", topics: [] }),
      ),
    ).toBe("mobile-apps");
  });

  it("classifies Swift repos as mobile-apps", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "some-app", language: "Swift", topics: [] }),
      ),
    ).toBe("mobile-apps");
  });

  it("classifies TypeScript repos as web-apps (fallback via language)", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "generic-tool", language: "TypeScript", topics: [] }),
      ),
    ).toBe("web-apps");
  });

  it("classifies HTML repos as web-apps", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "about-me", language: "HTML", topics: [] }),
      ),
    ).toBe("web-apps");
  });
});

// ── Classification by name ─────────────────────────────────

describe("classifyCategory — name-based", () => {
  it("classifies repos with 'crypto' in name when no topics", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "crypto-summary-bot", topics: [], description: null }),
      ),
    ).toBe("crypto-web3");
  });

  it("classifies repos with 'bot' in name as telegram-bots when no higher match", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "rea-schedule-bot", topics: [], description: null }),
      ),
    ).toBe("telegram-bots");
  });

  it("crypto keyword in name takes priority over bot keyword", () => {
    // crypto-summary-bot → crypto-web3 (not telegram-bots) because crypto has higher priority
    expect(
      classifyCategory(
        makeRepo({ name: "crypto-summary-bot-v2", topics: [], description: null }),
      ),
    ).toBe("crypto-web3");
  });
});

// ── Priority ordering ──────────────────────────────────────

describe("classifyCategory — priority", () => {
  it("crypto-web3 has higher priority than ai-ml", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "defi-ai-bot",
          topics: ["bitcoin", "ai", "llm"],
        }),
      ),
    ).toBe("crypto-web3");
  });

  it("ai-ml has higher priority than telegram-bots", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "news-objectivity-bot",
          topics: ["ai", "telegram-bot", "gemini"],
        }),
      ),
    ).toBe("ai-ml");
  });
});

// ── Edge cases ─────────────────────────────────────────────

describe("classifyCategory — edge cases", () => {
  it("falls back to utilities when nothing matches", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "russian-humanizer", topics: [], description: null }),
      ),
    ).toBe("utilities");
  });

  it("falls back to utilities for empty repos", () => {
    expect(
      classifyCategory(
        makeRepo({ name: "5ber-esim-manager", topics: [], description: null }),
      ),
    ).toBe("utilities");
  });

  it("handles null topics array gracefully", () => {
    const repo = makeRepo({ name: "test-repo" });
    repo.topics = undefined as unknown as string[];
    expect(() => classifyCategory(repo)).not.toThrow();
  });

  it("does NOT classify 'cryptography' topic as crypto-web3 (word-part match)", () => {
    // "cryptography" as a single word-part does not equal "crypto"
    expect(
      classifyCategory(
        makeRepo({
          name: "password-generator",
          topics: ["cryptography", "security", "privacy"],
          language: "TypeScript",
        }),
      ),
    ).toBe("web-apps"); // classified by language TypeScript
  });

  it("handles null description", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "crypto-project",
          topics: ["bitcoin"],
          description: null,
        }),
      ),
    ).toBe("crypto-web3");
  });

  it("handles empty string description", () => {
    expect(
      classifyCategory(
        makeRepo({
          name: "crypto-project",
          topics: ["bitcoin"],
          description: "",
        }),
      ),
    ).toBe("crypto-web3");
  });
});

// ── Real repo classification (smoke tests) ─────────────────

describe("classifyCategory — real repos", () => {
  // Each entry mirrors the real GitHub API data (topics, language, name)
  // so the classification heuristic works with the same signals as production.
  const realRepos: Array<{
    name: string;
    topics: string[];
    language: string | null;
    description: string | null;
    expected: string;
  }> = [
    {
      name: "crypto-tracker-dashboard",
      topics: ["bitcoin", "crypto", "cryptocurrency", "blockchain"],
      language: "TypeScript",
      description: "Crypto portfolio dashboard",
      expected: "crypto-web3",
    },
    {
      name: "currency-desk",
      topics: ["bitcoin", "crypto", "ethereum", "solana"],
      language: "TypeScript",
      description: "Currency converter with crypto support",
      expected: "crypto-web3",
    },
    {
      name: "aml-chainalysis",
      topics: ["bitcoin", "blockchain", "crypto", "ethereum"],
      language: "TypeScript",
      description: "Crypto sanctions checker",
      expected: "crypto-web3",
    },
    {
      name: "crypto-summary-bot",
      topics: [],
      language: "Python",
      description: null,
      expected: "crypto-web3",
    },
    {
      name: "crypto-summary-bot-v2",
      topics: [],
      language: "Python",
      description: null,
      expected: "crypto-web3",
    },
    {
      name: "news-minimalist",
      topics: ["ai-news", "openrouter", "artificial-intelligence"],
      language: "TypeScript",
      description: "AI-powered news aggregator",
      expected: "ai-ml",
    },
    {
      name: "best-ai-plan",
      topics: ["ai", "chatgpt", "claude", "gemini", "llm"],
      language: "TypeScript",
      description: "AI subscription value index",
      expected: "ai-ml",
    },
    {
      name: "inkdown",
      topics: ["ai", "ai-tools", "llm", "markdown-editor"],
      language: "TypeScript",
      description: "WYSIWYG markdown editor",
      expected: "ai-ml",
    },
    {
      name: "news-objectivity-bot",
      topics: ["ai", "gemini", "openrouter", "telegram-bot"],
      language: "Python",
      description: "Telegram bot for news objectivity analysis using AI",
      expected: "ai-ml",
    },
    {
      name: "markitdown-app",
      topics: ["markdown-converter", "file-converter", "document-converter"],
      language: "Python",
      description: "Desktop GUI for markitdown",
      expected: "developer-tools",
    },
    {
      name: "family-tree-local-editor",
      topics: ["tree-editor", "genealogy-tools"],
      language: "JavaScript",
      description: "Offline family tree editor",
      expected: "developer-tools",
    },
    {
      name: "analytics-for-telegram-bot",
      topics: ["telegram", "telegram-bot", "analytics"],
      language: "Python",
      description: "Analytics for Telegram bots",
      expected: "telegram-bots",
    },
    {
      name: "amvera-monitoring-module",
      topics: ["telegram-bot", "monitoring", "fastapi"],
      language: "Python",
      description: "Container monitoring with Telegram alerts",
      expected: "telegram-bots",
    },
    {
      name: "rea-schedule-bot",
      topics: [],
      language: "Python",
      description: null,
      expected: "telegram-bots",
    },
    {
      name: "mini-time-widget",
      topics: ["android", "android-app", "kotlin"],
      language: "Kotlin",
      description: "Minimalist Android widget",
      expected: "mobile-apps",
    },
    {
      name: "5ber-esim-manager",
      topics: [],
      language: "Kotlin",
      description: null,
      expected: "mobile-apps",
    },
    {
      name: "typing-trainer",
      topics: ["mobile-web", "pwa", "offline-first"],
      language: "JavaScript",
      description: "Mobile-first PWA typing trainer",
      expected: "mobile-apps",
    },
    {
      name: "password-generator",
      topics: ["react", "github-pages", "typescript", "security"],
      language: "TypeScript",
      description: "Password generator",
      expected: "web-apps",
    },
    {
      name: "dont-sleep-app",
      topics: ["productivity", "crossplatform"],
      language: "TypeScript",
      description: "Keep your device awake",
      expected: "web-apps",
    },
    {
      name: "about-me",
      topics: [],
      language: "HTML",
      description: null,
      expected: "web-apps",
    },
    {
      name: "russian-humanizer",
      topics: [],
      language: null,
      description: null,
      expected: "utilities",
    },
    {
      name: "BOSSincrypto",
      topics: [],
      language: null,
      description: "About me",
      expected: "utilities",
    },
    {
      name: "base-agentic-ecosystem",
      topics: [],
      language: null,
      description: null,
      expected: "utilities",
    },
  ];

  for (const repo of realRepos) {
    it(`classifies ${repo.name} as ${repo.expected}`, () => {
      const result = classifyCategory({
        name: repo.name,
        topics: repo.topics,
        description: repo.description,
        language: repo.language,
      });
      expect(result).toBe(repo.expected);
    });
  }
});

// ── groupByCategory ────────────────────────────────────────

describe("groupByCategory", () => {
  it("groups projects by category", () => {
    const projects = [
      { category: "crypto-web3" as const, name: "a" },
      { category: "crypto-web3" as const, name: "b" },
      { category: "ai-ml" as const, name: "c" },
      { category: "utilities" as const, name: "d" },
    ];

    const groups = groupByCategory(projects);
    expect(groups).toHaveLength(3);
    expect(groups[0].category).toBe("crypto-web3");
    expect(groups[0].projects).toHaveLength(2);
    expect(groups[1].category).toBe("ai-ml");
    expect(groups[2].category).toBe("utilities");
  });

  it("returns groups in category priority order", () => {
    const projects = [
      { category: "utilities" as const, name: "u" },
      { category: "web-apps" as const, name: "w" },
      { category: "crypto-web3" as const, name: "c" },
    ];

    const groups = groupByCategory(projects);
    expect(groups.map((g) => g.category)).toEqual([
      "crypto-web3",
      "web-apps",
      "utilities",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(groupByCategory([])).toEqual([]);
  });

  it("skips categories with no projects", () => {
    const projects = [{ category: "ai-ml" as const, name: "a" }];
    const groups = groupByCategory(projects);
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe("ai-ml");
  });
});
