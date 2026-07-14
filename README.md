# BOSSincrypto.dev — Project Hub

Hacker-terminal portfolio showcasing all [BOSSincrypto](https://github.com/BOSSincrypto) GitHub projects with live API data and a retro CRT aesthetic.

**Built with:** ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer) ![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm)

---

## Quick Start

```bash
git clone https://github.com/BOSSincrypto/bossincrypto.dev.git
cd bossincrypto.dev
pnpm install
pnpm dev
```

Open [http://localhost:3100](http://localhost:3100) in your browser.

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Typecheck and build for production |
| `pnpm test` | Run the Vitest test suite |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm data:refresh` | Fetch fresh repo data from the GitHub API |

## Project Structure

```
.
├── .github/workflows/    # CI/CD pipelines (deploy, data refresh)
├── public/               # Static assets (favicon, OG image, etc.)
├── scripts/              # Utility scripts (fetch-repos, OG image generator)
├── src/
│   ├── components/       # React components (boot sequence, project grid, modals, effects)
│   ├── data/             # Cached GitHub repo data (JSON)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client, data fetching logic
│   ├── styles/           # Tailwind theme and global styles
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper utilities
│   ├── App.tsx           # Root application component
│   └── main.tsx          # Application entry point
├── index.html            # HTML shell with SEO meta tags
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Features

- **Boot sequence** — Animated terminal startup mimicking a system boot before the main UI appears
- **Terminal aesthetic** — Green-on-black CRT look with a monospace font (JetBrains Mono) throughout
- **Project grid** — Live display of all 25 public GitHub repos with stars, language, and description
- **Search, filter & sort** — Find projects by name, description, or language; sort by name, stars, or date
- **Detail modal** — Click any project card for full description, stats, topics, and a direct link to the repo
- **Visual effects** — CRT scanlines, matrix rain background, glitch animations, and smooth Framer Motion transitions
- **Mobile responsive** — Fully adaptive layout for phones, tablets, and desktops
- **SEO** — Open Graph, Twitter Cards, JSON-LD structured data, and canonical URL meta tags

## Deployment

Deployed to **GitHub Pages** via GitHub Actions on every push to `master`. The workflow typechecks, builds the Vite output to `dist/`, and deploys using the official `actions/deploy-pages` action.

A **custom domain** is configured so the site is served at **[bossincrypto.dev](https://bossincrypto.dev)**.

### DNS Setup

Four A-records point to GitHub Pages' IP addresses:

| Type | Host | Value |
|------|------|-------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

The GitHub Pages settings must use **"GitHub Actions"** as the deployment source (not "Deploy from a branch").

A scheduled GitHub Action keeps the project data fresh by periodically re-fetching from the GitHub API.

## Links

- **bossincrypto.com** — [https://bossincrypto.com](https://bossincrypto.com)
- **bossincrypto.dev** — [https://bossincrypto.dev](https://bossincrypto.dev)
- **GitHub Org** — [github.com/BOSSincrypto](https://github.com/BOSSincrypto)
- **Repo** — [github.com/BOSSincrypto/bossincrypto.dev](https://github.com/BOSSincrypto/bossincrypto.dev)

## Verification

All checks pass as of 2026-07-14:

| Check | Result |
|-------|--------|
| Tests (`pnpm test`) | 380 tests, 23 files — all passing |
| TypeScript (`pnpm typecheck`) | No errors |
| Build (`pnpm build`) | 326 ms; main bundle 16.3 kB gzipped + vendor 100.2 kB gzipped (under 200 kB combined) |
| Dev server (`pnpm dev` → `:3100`) | Returns 200 with HTML containing site title |
| Data refresh (`pnpm data:refresh`) | Fetches 25 repos from GitHub API, writes `repos.json` |
