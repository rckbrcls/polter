# Setup Guide

## Prerequisites

Required:

- Node.js compatible with the workspace dependencies.
- pnpm. The root manifest declares `pnpm@10.33.0`.
- Git.

Optional, depending on the workflows you want to inspect or run through core helpers:

- Supabase CLI.
- GitHub CLI (`gh`).
- Vercel CLI.
- npm, yarn, or bun when testing package-manager detection beyond pnpm.

## Dependency Installation

From the repository root:

```bash
pnpm install
```

This installs dependencies for:

- `apps/desktop`
- `packages/core`

The workspace is declared in `pnpm-workspace.yaml`.

## Environment Variables

Start from `.env.example` if you need local overrides:

```bash
cp .env.example .env
```

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `ELECTRON_RENDERER_URL` | No | `apps/desktop/src/main/window.ts` | Renderer URL used by Electron while a Vite renderer server is active. |
| `POLTER_LOG_FORMAT` | No | `packages/core/src/core/config.ts` | Core diagnostic log format. |
| `POLTER_LOG_LEVEL` | No | `packages/core/src/core/config.ts` | Core diagnostic log level. |
| `POLTER_DEBUG` | No | `packages/core/src/core/config.ts` | Enables debug mode when set to `1` or `true`. |
| `EDITOR` | No | `packages/core/src/lib/editor.ts` | Fallback editor command for edit flows. |
| `VISUAL` | No | `packages/core/src/lib/editor.ts` | Preferred visual editor command. |

No database URL, API token, cloud credential, or production secret is required by the active workspace.

## Database Setup

No database setup is required. The current project does not use a database server, ORM, migrations, or seed files.

Local persistence is file/config based:

- `.polter/config.json` for project-level Polter config.
- `conf` package storage for global local data such as global pipelines and desktop repositories.
- Renderer `localStorage` for project appearance preferences.

See [Storage And Persistence](database.md).

## External Service Setup

No external service is required to install the workspace.

Optional CLIs can be installed separately if you want `packages/core` helpers to detect or invoke them:

- Supabase CLI for Supabase command catalog entries.
- GitHub CLI for repository and auth status helpers.
- Vercel CLI for Vercel status and env/domain command catalog entries.

The active Electron renderer does not call those real services in UI-only mode.

## Running Locally

From the repository root:

```bash
pnpm dev
```

This runs:

```bash
turbo run dev --filter=@polterware/desktop
```

The desktop package `dev` script runs:

```bash
electron-vite dev
```

Agent sessions for this repository must not run `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm dist`, or target-specific distribution commands.

## Checks

Run type-checking:

```bash
pnpm typecheck
```

Run tests:

```bash
pnpm test
```

Run the desktop design contract check:

```bash
pnpm design:lint
```

Inspect the Electron dependency version:

```bash
pnpm deps:electron
```

## Common Setup Problems

### pnpm is missing or using the wrong version

The root package declares `pnpm@10.33.0`. Use the same package manager family for this workspace because scripts and lockfile are pnpm-based.

### Electron renderer does not load

Check `ELECTRON_RENDERER_URL` only when running a development renderer server. In packaged output, Electron loads `out/renderer/index.html`.

### CLI status looks incomplete

Supabase, GitHub CLI, and Vercel CLI are optional external tools. Missing CLIs affect tool status and command resolution helpers, but they are not required for the UI-only renderer.

### Build or distribution commands are blocked in agent sessions

This is intentional for repository work performed by agents. Humans can run documented commands locally when needed.
