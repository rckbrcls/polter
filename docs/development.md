# Development Workflow

## Project Organization

Polter is organized as a small monorepo:

```text
apps/desktop/      # Active Electron desktop app
packages/core/     # Shared non-visual TypeScript services
docs/              # Project documentation
```

The root package owns workspace orchestration through Turborepo. Package-specific behavior lives in each package manifest.

## Code Conventions

General conventions visible in the codebase:

- TypeScript-first.
- ESM modules.
- Strict TypeScript settings.
- React JSX in the renderer.
- `.js` import specifiers where NodeNext package code requires them.
- Feature-local renderer code under `apps/desktop/src/renderer/features/<feature>`.
- Shared renderer primitives under `apps/desktop/src/renderer/components/ui`.
- Shared renderer utilities under `apps/desktop/src/renderer/features/shared` or `apps/desktop/src/renderer/lib`.
- Non-visual reusable behavior in `packages/core`.
- Zod validation at external or user-controlled boundaries.
- English source code, comments, UI strings, docs, examples, and generated artifacts.

## Desktop Renderer Guidelines

The renderer must follow `apps/desktop/DESIGN.md`.

Important rules from the current project:

- Keep the app dense, operational, and desktop-oriented.
- Avoid marketing pages, decorative dashboards, gradient orbs, neon, and generic SaaS styling.
- Use semantic theme tokens and documented radius utilities.
- Keep `App.tsx` as a composition root.
- Put feature logic under `features/<feature>`.
- Use Sonner for routine success/error feedback.
- Do not reintroduce focus rings on renderer form controls.
- Keep the current phase UI-only/mock-first until runtime integration is explicitly approved.

## Creating New Renderer Features

1. Create a folder under `apps/desktop/src/renderer/features/<feature>`.
2. Put feature views, feature-local components, and feature hooks in that folder.
3. Add shared feature primitives only to `features/shared` when multiple features need them.
4. Add navigation entries in `apps/desktop/src/renderer/features/navigation/navigation.ts`.
5. Compose the feature in `apps/desktop/src/renderer/App.tsx` without moving business logic into `App.tsx`.
6. Add focused tests beside the feature where behavior is meaningful.

## Adding Bridge Or IPC Functionality

When the project leaves UI-only mode for a specific feature:

1. Add or update channel names in `apps/desktop/src/shared/ipc.ts`.
2. Add typed bridge methods in `apps/desktop/src/preload/bridge.ts`.
3. Add main-process handlers in `apps/desktop/src/main/ipc.ts`.
4. Route reusable non-visual behavior through `packages/core`, usually `packages/core/src/desktop/service.ts`.
5. Keep Electron and Node APIs out of renderer components.
6. Add tests for bridge routing and handler behavior.

## Adding Core Services

Add reusable non-visual logic to `packages/core`.

Common locations:

- `src/data/commands` for command definitions.
- `src/lib` for reusable process, CLI, filesystem, editor, IPC, tool, and package helpers.
- `src/pipeline` for pipeline behavior.
- `src/config` for project/global config behavior.
- `src/declarative` for `polter.yaml` behavior.
- `src/desktop/service.ts` for desktop-facing adapters.

Export public package APIs from `packages/core/src/index.ts` only when they are intended to be used outside the package.

## Scripts And Checks

Root scripts:

```bash
pnpm typecheck
pnpm test
pnpm design:lint
pnpm deps:electron
```

Package scripts:

```bash
cd apps/desktop
pnpm typecheck
pnpm test
pnpm design:lint

cd packages/core
pnpm typecheck
pnpm test
```

Build and run scripts exist, but agent sessions in this repository must not execute them.

## Debugging

Current debugging entry points:

- Electron main bootstrap: `apps/desktop/src/main/index.ts`.
- Window loading/security: `apps/desktop/src/main/window.ts`.
- IPC handler registration: `apps/desktop/src/main/ipc.ts`.
- Preload bridge routing: `apps/desktop/src/preload/bridge.ts`.
- Renderer surface selection: `apps/desktop/src/renderer/root.tsx`.
- Renderer state owner: `apps/desktop/src/renderer/features/workbench/use-workbench.ts`.
- Mock data and simulated operations: `apps/desktop/src/renderer/features/workbench/mock-workbench-adapter.ts`.
- Core process execution: `packages/core/src/lib/runner.ts`.
- Core process registry: `packages/core/src/lib/processManager.ts`.
- Declarative plan/apply: `packages/core/src/declarative`.

## Branch, Commit, And Pull Request Workflow

No project-specific branch naming, commit convention, or PR template was identified in the current codebase.

Recommended default:

- Use small feature branches.
- Keep commits focused.
- Write commit messages in English.
- Include tests or static checks relevant to the change.
- Explain whether a change affects active Electron code, shared core logic, or docs.

## Project-Specific Best Practices

- Do not describe UI-only mock behavior as real execution.
- Do not scatter `window.polter` calls through view components when real bridge usage returns; centralize them in feature hooks or services.
- Keep public IPC channels explicit.
- Keep docs synchronized with architecture changes.
- Mark stale automation clearly instead of assuming it is production-ready.
