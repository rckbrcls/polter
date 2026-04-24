# Polter Agent Instructions

## Communication

- Always answer Erick in Portuguese.
- Keep source code, code comments, commit messages, documentation meant for the app, and application UI strings in English unless Erick explicitly asks for another language.
- When editing user-facing copy in the Electron app, use concise English product language.

## Command Restrictions

- Never run build or run commands in this repository. This includes `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm dist`, and target-specific dist commands.
- Static inspection, dependency installation, lockfile updates, searches, and tests are allowed when they do not start the app or build production artifacts.
- If a requested verification would require a build or run command, document the command for Erick instead of executing it.

## Architecture

- `apps/desktop` is the live desktop app. Do not revive or extend the old SwiftUI desktop implementation.
- `packages/core` owns shared non-visual logic for commands, pipelines, process management, config, MCP, skills, and workspace services.
- `legacy/tui` is archived transition code and is not part of the active workspace.
- The Electron renderer should consume the typed preload bridge exposed as `window.polter`; do not expose raw Electron or Node APIs to renderer code.
- Keep public IPC channels explicit in `apps/desktop/src/shared/ipc.ts` and route implementation through main-process handlers.

## Renderer Feature Architecture

- New Electron renderer UI MUST be modularized by feature under `apps/desktop/src/renderer/features/<feature>/`.
- `apps/desktop/src/renderer/App.tsx` MUST stay a composition root only: initialize top-level hooks, render the shell, and route views.
- Screen logic, local components, and feature-specific hooks MUST live in the owning feature folder, not in `App.tsx`.
- Cross-feature renderer sharing MUST go through `features/shared` or `components/ui`; do not create ad hoc imports between unrelated feature folders.
- `window.polter` calls SHOULD be centralized in feature hooks or service modules, such as `features/workbench`, instead of being scattered through view components.
- New navigation catalogs MUST live in `features/navigation` and be exported through the root compatibility module only when older imports still need it.

## Electron Workflow

- The official desktop workflow is `electron-vite` for main, preload, and renderer builds, with `electron-builder` for unsigned packaging.
- The live build config is `apps/desktop/electron.vite.config.ts`.
- The packaged app entry is `apps/desktop/out/main/index.js`, the packaged preload is `apps/desktop/out/preload/index.js`, and the packaged renderer HTML is `apps/desktop/out/renderer/index.html`.
- Preserve `resolve.preserveSymlinks: false` in Electron Vite config unless the package manager strategy changes.
- The active package manager is `pnpm`, with workspace orchestration through Turborepo.

## UI And Design

- `apps/desktop/DESIGN.md` is the visual source of truth for the Electron app.
- New or changed Electron UI MUST read and follow `apps/desktop/DESIGN.md` before implementation.
- Theme, radius, typography, or token changes MUST update both the implementation and `apps/desktop/DESIGN.md` in the same change.
- Component code MUST use semantic CSS variables and Tailwind theme radius utilities from the active design system instead of hardcoded colors or numeric arbitrary radii.
- Build a serious desktop command workbench: dense, scannable, keyboard-friendly, and operational.
- Avoid marketing heroes, generic SaaS landing sections, glassmorphism, neon glow, gradient orbs, oversized cards, and decorative placeholder dashboards.
- Prefer durable app surfaces: sidebars, tables, inspectors, command palettes, logs, forms, status strips, and split panes.
- Use `shadcn/ui` primitives only when they serve the desktop workflow; do not let default component styling override the product direction in `DESIGN.md`.

## Dependency Policy

- Keep Electron on a currently supported stable major line. Electron does not use Node-style LTS; prefer the newest stable supported major unless a compatibility reason is documented.
- Keep modern tooling aligned around pnpm workspaces, Turborepo, React, TypeScript, Vite, `electron-vite`, and `electron-builder`.
- Add libraries only when they provide concrete leverage for desktop development, state management, async data, logging, or design-system enforcement.
