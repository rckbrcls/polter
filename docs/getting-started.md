# Getting Started

The setup guide has moved to [setup.md](setup.md).

Use this file as a short entry point for the most common local workflow.

## Install Dependencies

```bash
pnpm install
```

## Start The Desktop App

```bash
pnpm dev
```

This runs the Electron desktop app through Turborepo and `electron-vite`.

## Run Checks

```bash
pnpm typecheck
pnpm test
pnpm design:lint
```

## Notes

- The active app is `apps/desktop`.
- Shared non-visual logic is in `packages/core`.
- The renderer is currently UI-only and mock-first.
- Agent sessions in this repository must not run dev, build, preview, or dist commands.
