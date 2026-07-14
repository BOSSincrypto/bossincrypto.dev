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

Open [http://localhost:5173](http://localhost:5173) in your browser.

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
- **Project grid** — Live display of all 24 public GitHub repos with stars, language, and description
- **Search, filter & sort** — Find projects by name, description, or language; sort by name, stars, or date
- **Detail modal** — Click any project card for full description, stats, topics, and a direct link to the repo
- **Visual effects** — CRT scanlines, matrix rain background, glitch animations, and smooth Framer Motion transitions
- **Mobile responsive** — Fully adaptive layout for phones, tablets, and desktops
- **SEO** — Open Graph, Twitter Cards, JSON-LD structured data, and canonical URL meta tags

## Deployment

Deployed to **GitHub Pages** via GitHub Actions on every push to `master`. The workflow typechecks, builds the Vite output to `dist/`, and deploys using the official `actions/deploy-pages` action.

A **custom domain** is configured so the site is served at **[bossincrypto.dev](https://bossincrypto.dev)**.

A scheduled GitHub Action keeps the project data fresh by periodically re-fetching from the GitHub API.

## Links

- **bossincrypto.com** — [https://bossincrypto.com](https://bossincrypto.com)
- **bossincrypto.dev** — [https://bossincrypto.dev](https://bossincrypto.dev)
- **GitHub** — [github.com/BOSSincrypto](https://github.com/BOSSincrypto)
