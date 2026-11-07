# CLAUDE.md — rocky-web

## Project

R.O.C.K.Y. (Regular Online Content Kernel Yarn) is a TikTok-style social media platform built as a technical assessment.
This repository is the frontend: a Next.js web app. The backend (rocky-api, NestJS) is a separate repository and is already complete.

Always follow these documents. If a task conflicts with them, stop and ask:

- docs/requirements.md — requirements with IDs (FR-_, NFR-_)
- docs/design.md — architecture, auth flow, API contract, frontend design (Section 7), ADRs
- docs/openapi.json — the exact API contract exported from rocky-api; the source of truth for request and response shapes

## The developer

The developer is new to React and Next.js and has a Java / Spring Boot background. They have built the backend in NestJS.

- Explain new React and Next.js concepts briefly where they first appear (components, hooks, server vs client components, etc.).
- Present a plan before non-trivial work and wait for approval.
- Work in the steps requested. Stop after each step and summarise what changed and why.
- Suggest a Conventional Commit message after each step.

## Tech stack

- Next.js (App Router), TypeScript strict mode, React
- Tailwind CSS and shadcn/ui; lucide-react icons
- TanStack Query for all server data
- next-themes for Light / Dark / System
- react-hook-form with zod for forms
- sonner for toasts
- Check the current official documentation for Next.js and each library before using an API; recent versions changed some conventions. Do not rely on older patterns from memory.
- This Next.js version has breaking changes; APIs, conventions and file structure may differ from older releases. Before using any Next.js API, read the relevant guide in the bundled docs at `node_modules/next/dist/docs/` and follow its deprecation notices.

## Architecture rules

- The browser only talks to the API at the same-origin path /api/v1 (ADR-004). Never call Firebase or the database from the frontend.
- In development, Next.js rewrites /api/_ to http://127.0.0.1:4000/api/_. In production, Nginx routes /api to the API.
- Authentication uses httpOnly cookies set by the API (ADR-003). The frontend never reads, stores or handles tokens.
- All API calls go through one typed API client. Response types come from docs/openapi.json; never hand-write duplicate types.
- Server data lives in TanStack Query. Do not copy server data into local state.
- Prefer server components; use client components only where interactivity, hooks or browser APIs are needed.
- Reusable UI lives in src/components/ui (shadcn) and src/components (shared). Feature code lives with its route or in src/features/<feature>.
- Add shadcn components with `npm run ui:add -- <component...>`; never run `npx shadcn add` directly. The shadcn registry ships components that import `cn` from the young `cn` package and installs it as a dependency. This project uses clsx + tailwind-merge via `@/lib/utils` instead, and the wrapper (scripts/shadcn-add.mjs) rewrites those imports and uninstalls `cn`. ESLint rejects any import from `cn` as a safeguard.

## Design

- Colours, typography and layout follow design.md Section 7. Purple is primary (actions, active nav, focus rings); orange is the accent (likes, badges, highlights).
- Every interactive element has hover, active, focus-visible and disabled states.
- Loading: skeletons for content, spinners for actions. Every list has a meaningful empty state. Actions give toast feedback.
- Responsive for small laptops (~1024px), standard desktops and widescreens (2560px+); no horizontal page scrolling.
- Accessible: keyboard navigation, visible focus, labels on icon-only buttons, alt text, WCAG AA contrast in both themes.
- Languages: English (en) and Sinhala (si). All user-facing text comes from translation dictionaries. Sinhala uses Noto Sans Sinhala; layouts must allow longer text.

## Code standards

- No `any`. Precise types; `unknown` plus narrowing where needed.
- No `console.log` in committed code.
- Small, single-purpose components and functions with descriptive names.
- Files: kebab-case. Components: PascalCase. Variables and functions: camelCase.
- Do not add a dependency without explaining why and asking first.

## Comments

- Every exported component, hook and function has a short TSDoc comment explaining its purpose.
- Inline comments explain WHY, not WHAT. Reference requirement IDs or ADRs where relevant.
- No commented-out code. No TODO without an issue number, e.g. `// TODO(#12): ...`.

## Quality checks

Before declaring a step complete, run: npm run lint, npm run typecheck, npm run build. Describe what to verify manually in the browser.

## Security

- Never read, print or modify .env files.
- Never use dangerouslySetInnerHTML.
- No secrets in NEXT*PUBLIC* variables.

## Git

- Read-only git commands are allowed: `git status`, `git diff`, `git log`, `git show`.
- Never run git commands that change the working tree, the index or history (e.g. add, commit, restore, checkout, reset, stash, rebase, merge, push). The developer handles all commits.
- Commit messages follow Conventional Commits: type(scope): description.
