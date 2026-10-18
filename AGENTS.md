## Architecture & System Boundaries (CRITICAL)

- **Frontend-Only Repository:** This repository contains ONLY the **Next.js** frontend for a blog platform.
- **External Backend (FastAPI):** The backend is built with **FastAPI** and lives in a completely separate repository.
- **Strict Rule:** We CANNOT modify backend endpoints, database schemas, or FastAPI logic from here. Treat the FastAPI backend as an immutable external contract. All bug fixes, data transformations, caching, state management, and architectural optimizations MUST happen strictly within this Next.js codebase (Client/Server Components, Route Handlers, Server Actions, or API client adapters).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues and specs live as local markdown files in `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical roles mapped 1:1 (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.
