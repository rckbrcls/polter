# Deployment And Packaging

## Overview

Polter currently has Electron desktop packaging configuration. It does not have production deployment infrastructure, signing, notarization, auto-update, publishing, or rollback configured in the active workspace.

## Available Environments

Identified environments:

- Local development through `electron-vite dev`.
- Local Electron build output through `electron-vite build`.
- Local unsigned package artifacts through Electron Builder.

No staging, production, cloud, self-hosted relay, or hosted web deployment environment was identified.

## Build Process

Root build command:

```bash
pnpm build
```

The desktop package build command:

```bash
electron-vite build
```

Output paths configured in `apps/desktop/electron.vite.config.ts`:

- `apps/desktop/out/main`
- `apps/desktop/out/preload`
- `apps/desktop/out/renderer`

Packaged app entrypoints:

- Main: `apps/desktop/out/main/index.js`
- Preload: `apps/desktop/out/preload/index.cjs`
- Renderer HTML: `apps/desktop/out/renderer/index.html`

## Packaging Process

Root package scripts:

```bash
pnpm dist
pnpm dist:mac
pnpm dist:win
pnpm dist:linux
pnpm dist:all
```

Desktop package scripts run `pnpm build` before Electron Builder.

Electron Builder config lives in:

```text
apps/desktop/electron-builder.yml
```

Configured targets:

| Platform | Target | Notes |
| --- | --- | --- |
| macOS | `dmg` | `identity: null`, so signing is disabled. |
| Windows | `nsis`, `x64` | One-click disabled; install directory can be changed. |
| Linux | `AppImage` | Category is `Development`. |

Artifacts are configured to write under:

```text
apps/desktop/release/${version}
```

## Production Environment Variables

No required production environment variables were identified in the active codebase.

Development/local variables are documented in [Setup](setup.md).

## External Services

No required production external services were identified.

Optional CLIs exist as command targets in core:

- Supabase CLI.
- GitHub CLI.
- Vercel CLI.

The active Electron renderer does not call them in UI-only mode.

## CI/CD Workflow

The repository contains:

```text
.github/workflows/release.yml
```

This workflow appears stale for the current workspace because it:

- Sets up Bun.
- Runs `bun install --frozen-lockfile`.
- Compiles root-level `src/index.tsx` and `src/mcp.ts`.
- Publishes `polter` and `polter-mcp` binaries.

Those root-level source files do not exist in the active monorepo layout. Treat this workflow as legacy until it is removed or rewritten for the current Electron workspace.

## Pre-Deployment Checklist

Before distributing Polter publicly:

- Confirm the release workflow matches the current monorepo.
- Run type-checks and tests.
- Run `design:lint` for desktop UI changes.
- Build Electron output.
- Package target platforms.
- Decide signing identity and notarization for macOS.
- Decide Windows signing strategy.
- Decide Linux artifact and distribution channel.
- Define update and rollback policy.
- Confirm license coverage for the root workspace.
- Confirm no secrets are bundled into artifacts.

## Rollback Process

No rollback process was identified in the current codebase.

For now, rollback would be manual and artifact-based. A production release process should define how users downgrade or recover from a bad package.
