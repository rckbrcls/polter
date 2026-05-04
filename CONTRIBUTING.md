# Contributing To Polter

Thanks for contributing to Polter. This repository is currently a desktop-first Electron workspace with shared TypeScript core services.

## Before You Start

Read:

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/development.md](docs/development.md)
- [apps/desktop/DESIGN.md](apps/desktop/DESIGN.md) for Electron UI work
- [AGENTS.md](AGENTS.md) for repository-specific agent rules

## Development Setup

Install dependencies from the repository root:

```bash
pnpm install
```

The active workspace packages are:

- `apps/desktop`
- `packages/core`

## Local Commands

Common checks:

```bash
pnpm typecheck
pnpm test
pnpm design:lint
```

Local desktop startup:

```bash
pnpm dev
```

Packaging commands:

```bash
pnpm dist
pnpm dist:mac
pnpm dist:win
pnpm dist:linux
pnpm dist:all
```

Agent sessions in this repository must not run dev, build, preview, or dist commands. Humans can run them locally when needed.

## Quality Standards

- Keep source code, comments, UI strings, documentation, examples, and commit messages in English.
- Keep Electron renderer UI modularized by feature under `apps/desktop/src/renderer/features/<feature>`.
- Keep `apps/desktop/src/renderer/App.tsx` as a composition root.
- Keep reusable non-visual logic in `packages/core`.
- Keep public IPC channels explicit in `apps/desktop/src/shared/ipc.ts`.
- Keep renderer access to Electron and Node APIs behind the preload bridge.
- Keep the current renderer phase UI-only/mock-first unless runtime integration is explicitly approved.
- Update docs when behavior, architecture, setup, scripts, or storage changes.

## UI Contribution Rules

For Electron UI work:

- Follow `apps/desktop/DESIGN.md`.
- Use semantic CSS variables and documented radius utilities.
- Prefer dense, operational workbench surfaces.
- Use Sonner for routine feedback.
- Avoid marketing sections, decorative dashboards, glassmorphism as page layout, neon, gradient orbs, oversized cards, and nested cards.
- Do not reintroduce focus rings on renderer form controls.

## Adding Or Changing Runtime Contracts

When adding a real bridge/IPC behavior:

1. Update `apps/desktop/src/shared/ipc.ts`.
2. Update `apps/desktop/src/preload/bridge.ts`.
3. Add or update main-process handlers in `apps/desktop/src/main/ipc.ts`.
4. Route shared non-visual behavior through `packages/core`.
5. Add focused tests.
6. Update [docs/api.md](docs/api.md) and [docs/architecture.md](docs/architecture.md).

## Pull Request Checklist

Before opening a pull request:

- Describe the change and why it is needed.
- State whether it touches `apps/desktop`, `packages/core`, or docs.
- Run relevant checks locally when allowed.
- Include screenshots for meaningful UI changes when practical.
- Update documentation for any public workflow, architecture, setup, command, storage, or security change.
- Call out any commands you could not run.

## Commit Conventions

No strict project-specific commit convention was identified in the current codebase.

Recommended format:

```text
type: short English summary
```

Examples:

```text
docs: document current desktop architecture
fix: keep commander shortcut registration stable
test: cover mock workbench process logs
```

Keep commits focused and avoid mixing unrelated Electron, core, documentation, and cleanup changes.
