# Polter Desktop

> **Status:** To be confirmed
> Electron desktop app snapshot for the `polter-rckbrcls` checkout.

## Summary

- Electron desktop app package for the Polter workspace in this checkout.
- Solves the UI surface for command workflows, navigation, preferences, local state, IPC boundaries, and packaged desktop distribution.
- Main stack: Electron, electron-vite, React 19, TypeScript, Vite, Vitest, Tailwind CSS, Radix/Base UI-style components, and `@polterware/core`.
- Current status: to be confirmed because this is a separate `polter-rckbrcls` checkout.
- Technical value: keeps main/preload/renderer boundaries explicit while consuming shared orchestration logic from `packages/core`.

Desktop UI package for Polter. It combines an Electron main process, a preload bridge, and a React renderer that consumes `@polterware/core` for shared non-visual behavior.

## Features

- Electron main, preload, and renderer entrypoints.
- Typed IPC channel definitions in `src/shared/ipc.ts`.
- React 19 renderer with shell navigation, local UI state, and tests.
- Global shortcut and IPC tests.
- Desktop packaging configuration through Electron Builder.
- Design contract linting through `DESIGN.md`.

## Tech Stack

- Electron
- electron-vite
- React 19
- TypeScript
- Vite
- Vitest
- Tailwind CSS
- Radix/Base UI/shadcn-style components
- `@polterware/core`

## Getting Started

Install dependencies from the workspace root with pnpm. The package scripts are declared in `package.json`; agent sessions in this repository should document runtime commands instead of executing dev, build, preview, or dist commands.

## Usage

Primary package scripts:

- `pnpm dev` starts Electron Vite.
- `pnpm build` builds main, preload, and renderer output.
- `pnpm preview` previews the Electron Vite output.
- `pnpm dist*` variants package unsigned desktop builds.
- `pnpm design:lint` validates the desktop design contract.
- `pnpm typecheck` and `pnpm test` run static and test checks.

## Project Structure

```text
apps/desktop/
├── electron.vite.config.ts
├── electron-builder.yml
├── DESIGN.md
├── src/
│   ├── main/
│   ├── preload/
│   ├── renderer/
│   └── shared/
└── package.json
```

## Architecture

The main process owns window creation, global shortcuts, and Electron-level behavior. The preload layer exposes a constrained bridge to the renderer. The renderer stays UI-focused and imports shared domain behavior from `@polterware/core` instead of embedding process orchestration directly in React components.

## Technical Highlights

- Renderer-facing IPC channels are explicit in `src/shared/ipc.ts`.
- Tests cover root rendering, navigation, preload bridge behavior, IPC, and global shortcuts.
- Packaging is configured locally, but signing, notarization, publishing, and auto-update are not documented as active in this package.
