# Polter Workspace

Polter is now a pnpm + Turborepo workspace focused on the Electron desktop app and the shared TypeScript core.

## Active Layout

- `apps/desktop` is the Electron desktop product.
- `packages/core` owns shared non-visual services for commands, pipelines, process management, config, MCP, skills, and workspace state.
- `legacy/tui` is archived transition code. It is intentionally outside the active workspace and should not drive new product or architecture decisions.

No new CLI package exists yet. If a CLI returns later, it should be designed as a new surface instead of reviving the old TUI.

## Package Manager

Use pnpm from the repository root:

```bash
pnpm install
```

The workspace is declared in `pnpm-workspace.yaml`, and task orchestration is declared in `turbo.json`.

## Desktop Commands

Run the app from the desktop package when you are working directly on the product:

```bash
cd apps/desktop
pnpm dev
```

The root scripts are Turborepo wrappers for convenience:

- `pnpm dev` runs the desktop app through Turbo.
- `pnpm typecheck` type-checks active workspace packages.
- `pnpm test` runs active workspace tests.
- `pnpm design:lint` validates the desktop design contract.
- `pnpm dist`, `pnpm dist:mac`, `pnpm dist:win`, `pnpm dist:linux`, and `pnpm dist:all` package the desktop app.

Agent work in this repository must not run dev, build, preview, or dist commands. If runtime verification is needed, document the command for Erick to run.

## Desktop App

`apps/desktop` uses:

- `electron.vite.config.ts` for the Electron Vite pipeline.
- `electron-builder.yml` for unsigned packaging.
- `DESIGN.md` as the visual source of truth.
- `out/` for Electron Vite output.
- `release/<version>/` for packaged artifacts.

The packaged app entry is `apps/desktop/out/main/index.js`, the preload is `apps/desktop/out/preload/index.js`, and the renderer HTML is `apps/desktop/out/renderer/index.html`.

The renderer consumes the typed preload bridge exposed as `window.polter`. Public IPC channels stay explicit in `apps/desktop/src/shared/ipc.ts`.

## Core

`@polterware/core` is the TypeScript backend layer for the desktop app. It remains isolated so process orchestration can later move to Rust or a dedicated service without forcing a renderer rewrite.

Current core responsibilities include command metadata, package-manager translation, process management, pipeline storage/execution, declarative config, MCP setup, skill setup, and desktop service adapters.

## Electron Baseline

Polter Desktop targets the newest supported stable Electron line rather than a Node-style LTS label. The current desktop package is backed by `electron-vite` for main/preload/renderer output and `electron-builder` for unsigned local packaging.

The main process keeps secure Electron defaults explicit: context isolation enabled, Node integration disabled in the renderer, sandboxing enabled, web security enabled, default permission denial, constrained navigation, and a restrictive renderer CSP.

This repository does not configure signing, notarization, publishing, or auto-update in the current phase.
