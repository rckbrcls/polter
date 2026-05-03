# Polter Workspace

> **Status:** To be confirmed
> This checkout appears to mirror the desktop-first Polter workspace, but its canonical remote/status should be verified before release.

Polter is a pnpm + Turborepo workspace focused on the Electron desktop app and the shared TypeScript core.

## Summary

- Polter is a desktop-first control surface for developer commands, pipelines, processes, MCP setup, and workspace automation.
- The active product in this checkout is an Electron app in `apps/desktop`, backed by shared non-visual TypeScript services in `packages/core`.
- The old Ink TUI remains in `legacy/tui` only as archived transition code; it should not drive new product direction.
- Main stack: pnpm, Turborepo, Electron, electron-vite, React, TypeScript, Vitest, and Electron Builder.
- Current status: to be confirmed against the `polter-rckbrcls` remote before treating this checkout as canonical.

## Overview

Polter is being rebuilt as a desktop-first developer control plane. The live workspace centers on an Electron renderer, explicit preload bridge, and shared TypeScript core package. Runtime execution, process orchestration, MCP setup, skills, and desktop service adapters belong outside the renderer so the UI can stay product-focused and the core can evolve independently.

## Motivation

- Make Polter a desktop-first control surface for developer commands, pipelines, processes, MCP setup, and workspace automation.
- Keep renderer UX separate from shared non-visual orchestration logic.
- Preserve the old TUI only as archived transition code while the Electron app becomes the active product surface.
- Keep the core portable enough to support future CLI, service, or Rust-backed execution paths.

## Features

- Electron desktop product in `apps/desktop`.
- Shared non-visual command, pipeline, process, config, MCP, skill, and workspace services in `packages/core`.
- Archived Ink/Bun TUI in `legacy/tui` for transition reference only.
- Root Turborepo scripts for type-checking, tests, design linting, and packaging tasks.
- Typed preload bridge exposed as `window.polter` instead of direct renderer access to Node APIs.

## Tech Stack

- pnpm workspace
- Turborepo
- Electron
- electron-vite
- Electron Builder
- React
- TypeScript
- Vitest

## Getting Started

### Requirements

- pnpm
- Node.js compatible with the Electron workspace dependencies

### Installation

```bash
pnpm install
```

The workspace is declared in `pnpm-workspace.yaml`, and task orchestration is declared in `turbo.json`.

### Running Locally

Run the app from the desktop package when you are working directly on the product:

```bash
cd apps/desktop
pnpm dev
```

Agent work in this repository must not run dev, build, preview, or dist commands. If runtime verification is needed, document the command for Erick to run.

### Running Tests

Root scripts are Turborepo wrappers:

- `pnpm typecheck` type-checks active workspace packages.
- `pnpm test` runs active workspace tests.
- `pnpm design:lint` validates the desktop design contract.

## Usage

Desktop workflow commands are documented for local use:

- `pnpm dev` runs the desktop app through Turbo.
- `pnpm typecheck` type-checks active workspace packages.
- `pnpm test` runs active workspace tests.
- `pnpm design:lint` validates the desktop design contract.
- `pnpm dist`, `pnpm dist:mac`, `pnpm dist:win`, `pnpm dist:linux`, and `pnpm dist:all` package the desktop app.

No new CLI package exists yet. If a CLI returns later, it should be designed as a new surface instead of reviving the old TUI.

## Project Structure

```text
polter-rckbrcls/
├── apps/desktop/      # Electron desktop product
├── packages/core/     # Shared non-visual orchestration services
├── legacy/tui/        # Archived Ink/Bun TUI
├── pnpm-workspace.yaml
└── turbo.json
```

`apps/desktop` uses `electron.vite.config.ts` for the Electron Vite pipeline, `electron-builder.yml` for unsigned packaging, `DESIGN.md` as the visual source of truth, `out/` for Electron Vite output, and `release/<version>/` for packaged artifacts.

## Architecture

### Main Components

- `apps/desktop`: Electron main, preload, and renderer surfaces.
- `packages/core`: shared non-visual services for commands, pipelines, process management, config, MCP, skills, and workspace state.
- `legacy/tui`: archived Ink/Bun implementation retained only for transition reference.

### Data Flow

The renderer talks to the desktop shell through explicit preload APIs. The desktop app can delegate shared command, pipeline, process, config, MCP, and skill behavior to `@polterware/core` instead of placing orchestration logic inside UI components.

### Key Design Choices

- The packaged app entry is `apps/desktop/out/main/index.js`, the preload is `apps/desktop/out/preload/index.js`, and the renderer HTML is `apps/desktop/out/renderer/index.html`.
- The renderer consumes the typed preload bridge exposed as `window.polter`.
- Public IPC channels stay explicit in `apps/desktop/src/shared/ipc.ts`.
- `@polterware/core` stays isolated so process orchestration can later move to Rust or a dedicated service without forcing a renderer rewrite.
- The main process keeps secure Electron defaults explicit: context isolation enabled, Node integration disabled in the renderer, sandboxing enabled, web security enabled, default permission denial, constrained navigation, and a restrictive renderer CSP.

## Technical Highlights

- Separates renderer UX from non-visual orchestration services.
- Keeps archived TUI behavior available as domain reference without making it the active architecture.
- Uses electron-vite and Electron Builder for local desktop output.
- Documents agent restrictions beside the commands that humans may run locally.

## Current Status

This checkout looks aligned with the desktop-first Polter workspace, but its canonical status should be confirmed against the remote/repo owner before publication. The old TUI is archived, and desktop package output is unsigned/local by default.

## Known Limitations

- Signing, notarization, publishing, and auto-update are not configured in the current phase.
- Runtime commands are documented but not executed by agents in this environment.
- There is no new active CLI package yet.
