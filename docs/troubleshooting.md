# Troubleshooting

## Dependency Installation Issues

### `pnpm` is not found

Install pnpm and use the workspace package manager declared by the root package:

```bash
pnpm install
```

### Workspace packages do not resolve

Check:

- `pnpm-workspace.yaml` includes `apps/*` and `packages/*`.
- `@polterware/core` is linked as `workspace:*` from `apps/desktop/package.json`.
- Dependencies were installed from the repository root.

## Renderer Issues

### The desktop renderer does not load in development

Check:

- `ELECTRON_RENDERER_URL` points to the active renderer development URL only when a renderer dev server is running.
- In packaged mode, Electron should load `out/renderer/index.html`.
- `apps/desktop/index.html` still contains the root element: `<div id="root"></div>`.

### The UI shows mock data

This is expected. The active renderer uses:

```text
apps/desktop/src/renderer/features/workbench/mock-workbench-adapter.ts
```

Mock actions are designed not to execute external commands.

### A bridge call says UI-only mode is not connected

Most main-process IPC handlers are intentionally disconnected in:

```text
apps/desktop/src/main/ipc.ts
```

The public bridge shape exists, but real runtime wiring is not active for most domains.

## Command And Process Issues

### Process logs are missing after restart

The process manager stores process state and ring-buffer output in memory. It does not persist logs to disk or a database.

### A process cannot be removed

`removeProcess` refuses to remove running processes. Stop the process first, then remove it.

### A CLI command cannot be resolved

Check whether the relevant CLI is installed:

- `supabase`
- `gh`
- `vercel`
- `git`
- package manager command detected from lockfiles

The active renderer does not depend on these CLIs, but core helpers do when real command paths are used.

## Config Issues

### `.polter/config.json` is ignored

Project config resolution starts from the nearest package root. Confirm that the selected cwd is inside a package or workspace root that can be detected.

### Global pipelines or repositories look wrong

Global data is stored through the `conf` package using project name `polter`. Tests use isolated temp config under `polter-test`.

### Project appearance does not follow the repository

Repository appearance is stored in renderer `localStorage` under:

```text
polter.repositoryAppearance.v1
```

It is local UI preference data, not repository metadata.

## Test Issues

### Renderer component tests fail because DOM APIs are missing

Renderer tests rely on Vitest plus jsdom. Check `apps/desktop/vitest.config.ts` and package test dependencies.

### Main-process tests fail around Electron objects

Main-process tests use focused mocks for IPC and shortcut registration. Inspect:

- `apps/desktop/src/main/ipc.test.ts`
- `apps/desktop/src/main/global-shortcuts.test.ts`

## Build And Packaging Issues

### Packaged app entry is missing

Expected output paths after a desktop build:

- `apps/desktop/out/main/index.js`
- `apps/desktop/out/preload/index.cjs`
- `apps/desktop/out/renderer/index.html`

### macOS package is unsigned

`apps/desktop/electron-builder.yml` sets:

```yaml
mac:
  identity: null
```

Signing and notarization were not identified in the current codebase.

### GitHub release workflow fails

The current `.github/workflows/release.yml` appears stale. It references root-level Bun source files that do not exist in the active workspace:

- `src/index.tsx`
- `src/mcp.ts`

Rewrite or remove the workflow before relying on it.

## Environment Issues

### `POLTER_DEBUG` does not behave as expected

Core config treats debug as enabled when `POLTER_DEBUG` is `1` or `true`.

### Editor flows open the wrong editor

`VISUAL` takes precedence over `EDITOR`. If neither is set, core editor helpers use their fallback behavior.

## When To Inspect Specific Files

- Desktop bootstrap: `apps/desktop/src/main/index.ts`
- Window loading and security: `apps/desktop/src/main/window.ts`
- IPC channels: `apps/desktop/src/shared/ipc.ts`
- Preload bridge: `apps/desktop/src/preload/bridge.ts`
- Renderer shell: `apps/desktop/src/renderer/features/shell/desktop-shell.tsx`
- Workbench state: `apps/desktop/src/renderer/features/workbench/use-workbench.ts`
- Mock adapter: `apps/desktop/src/renderer/features/workbench/mock-workbench-adapter.ts`
- Core process manager: `packages/core/src/lib/processManager.ts`
- Core config: `packages/core/src/config`
- Declarative planning: `packages/core/src/declarative`
