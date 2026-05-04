# Product And Project Overview

## Product Goal

Polter is a desktop-first command workbench for developers who need a structured surface for project commands, pipelines, processes, tool status, MCP setup, scripts, and local workspace automation.

The long-term product direction is a secure machine control plane for humans and AI agents. The current implementation is not there yet: the active Electron renderer is UI-only and mock-first, while the reusable non-visual logic lives in `packages/core`.

## Target Users And Use Cases

Primary users:

- Developers who work across multiple local projects and package managers.
- Developers who use Supabase CLI, GitHub CLI, Vercel CLI, Git, and package-manager scripts.
- Builders who want to compose reusable workflows instead of repeating ad hoc shell commands.
- Future AI-agent workflows that need controlled command, process, log, MCP, and approval surfaces.

Current use cases represented in code:

- Browse command categories and command metadata.
- Preview command forms, flags, suggested args, pins, and command output in a mock UI.
- Compose and run mock pipelines in the renderer.
- Stage scripts into the Processes view.
- View mock process state and mock logs.
- Inspect and edit mock project config JSON.
- Preview declarative infrastructure plan/apply flows in mock mode.
- Inspect MCP registration state and skill setup in mock mode.
- Store local repository appearance preferences in renderer `localStorage`.

## Main Modules

### Desktop App

`apps/desktop` is the active app. It contains:

- Electron main process under `src/main`.
- Preload bridge under `src/preload`.
- Shared IPC channel definitions under `src/shared`.
- React renderer under `src/renderer`.
- Feature modules under `src/renderer/features`.
- UI primitives under `src/renderer/components/ui`.
- Visual contract in `DESIGN.md`.
- Electron Vite config and Electron Builder config.

### Core Package

`packages/core` contains shared non-visual logic:

- Command catalog and command feature grouping.
- CLI tool resolution.
- Command execution helpers.
- Package manager detection and command translation.
- Process manager and local JSON-RPC IPC helpers.
- Pipeline engine and pipeline storage.
- Project config and global config storage.
- Declarative `polter.yaml` parser, planner, status, and applier.
- MCP installer and skill setup helpers.
- Desktop service adapter exports.

### Legacy TUI

`legacy/tui` contains the archived Ink/Bun CLI/TUI implementation. It remains useful as a historical reference for command taxonomy and older flows, but it is not the active product surface.

## Main User Flow

The current UI-only flow is:

1. Open the Electron desktop app.
2. Select a repository from the project sidebar or use the mock current workspace.
3. Navigate with workflow icons or Commander.
4. Inspect commands, scripts, pipelines, processes, tool status, MCP, skills, settings, or project config.
5. Trigger mock actions that update UI state without running external commands.

Future product docs use this intended operational flow:

```text
Machine -> Command -> Stage -> Approval -> Execution -> Logs -> Audit
```

That full chain is product direction, not fully implemented runtime behavior.

## What The Project Does

- Provides an Electron desktop shell and Commander overlay.
- Defines a typed preload bridge and explicit IPC channel catalog.
- Keeps the renderer modularized by feature.
- Provides a mock workbench adapter for safe UI iteration.
- Centralizes command, process, pipeline, config, declarative, MCP, and desktop service helpers in `@polterware/core`.
- Supports project config files at `.polter/config.json`.
- Supports global local config through `conf`.
- Supports Electron packaging configuration for unsigned desktop artifacts.

## What The Project Does Not Do

- It does not expose an HTTP API.
- It does not run a backend web server.
- It does not use a database, ORM, schema migrations, or seeds.
- It does not provide production deployment infrastructure.
- It does not configure signing, notarization, auto-update, release channels, or rollback.
- The active renderer does not call real backend IPC handlers, start real processes, execute scripts, apply infrastructure, or install MCP.
- It does not provide an active CLI package in the current workspace. The CLI/TUI code in `legacy/tui` is archived.

## Important Decisions

- `apps/desktop` is the live product surface.
- `packages/core` is the non-visual logic boundary.
- `legacy/tui` is archived transition code.
- Renderer features should live under `apps/desktop/src/renderer/features/<feature>`.
- `App.tsx` should remain a composition root.
- Public IPC channels belong in `apps/desktop/src/shared/ipc.ts`.
- The renderer should consume `window.polter` when real bridge integration returns, but the current phase stays mock/local.
- The design source of truth is `apps/desktop/DESIGN.md`.
- Electron renderer HTML disables browser translation with `lang="en"`, `translate="no"`, and `meta name="google" content="notranslate"`.
