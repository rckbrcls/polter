# Polter Desktop

`@polterware/desktop` is the active Electron desktop app for Polter. It owns the desktop shell, main process, preload bridge, React renderer, feature UI, design contract, tests, and Electron packaging configuration.

The current renderer is UI-only and mock-first. It uses a local mock workbench adapter so the product interface can be developed without starting real processes, calling real IPC handlers, installing MCP, executing scripts, or applying infrastructure.

## Responsibility

This package is responsible for:

- Electron app bootstrap.
- Main window and Commander overlay window.
- Electron security settings.
- Typed preload bridge exposed as `window.polter`.
- IPC channel catalog usage.
- React renderer composition.
- Feature-based renderer UI.
- Local mock workbench state.
- shadcn/ui-based primitives and desktop styling.
- Design contract enforcement through `DESIGN.md`.
- Electron Vite build configuration.
- Electron Builder packaging configuration.

Shared command, process, pipeline, config, declarative, MCP, and workspace logic belongs in `@polterware/core`.

## Main Files And Folders

```text
apps/desktop/
├── DESIGN.md                    # Visual source of truth
├── components.json              # shadcn/ui configuration
├── electron-builder.yml         # Unsigned package targets
├── electron.vite.config.ts      # Main/preload/renderer build config
├── index.html                   # Renderer HTML and CSP
├── resources/                   # App icons
├── src/
│   ├── main/                    # Electron main process
│   ├── preload/                 # contextBridge preload API
│   ├── shared/                  # IPC channel constants
│   └── renderer/                # React app, features, styles, UI
└── package.json
```

Important renderer feature folders:

- `features/workbench` owns current UI-only state and mock adapter.
- `features/shell` owns the desktop shell.
- `features/commander` owns Commander dialog and overlay behavior.
- `features/navigation` owns navigation catalogs.
- `features/processes`, `features/pipelines`, `features/scripts`, `features/commands`, and `features/system` own their respective views.

## Technology Stack

- Electron.
- electron-vite.
- Electron Builder.
- React 19.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui with `radix-luma` style.
- lucide-react.
- cmdk.
- motion.
- sonner.
- Orama.
- dnd-kit.
- Vitest, jsdom, and Testing Library React.

## Scripts

Package scripts:

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Starts `electron-vite dev`. |
| `pnpm build` | Builds main, preload, and renderer output. |
| `pnpm preview` | Runs `electron-vite preview`. |
| `pnpm dist` | Builds and packages with Electron Builder. |
| `pnpm dist:mac` | Builds the macOS target. |
| `pnpm dist:win` | Builds the Windows target. |
| `pnpm dist:linux` | Builds the Linux target. |
| `pnpm dist:all` | Builds macOS, Windows, and Linux targets. |
| `pnpm design:lint` | Runs `design.md lint DESIGN.md`. |
| `pnpm deps:electron` | Prints the Electron dependency version. |
| `pnpm typecheck` | Runs `tsc --noEmit`. |
| `pnpm test` | Runs `vitest run`. |

Agent sessions in this repository must not run dev, build, preview, or dist commands.

## How It Fits Into The Workspace

`apps/desktop` consumes `@polterware/core` through a workspace dependency:

```json
"@polterware/core": "workspace:*"
```

Electron Vite bundles the shared core into the main output by excluding `@polterware/core` from dependency externalization. This keeps packaged Electron output from trying to load TypeScript source files at runtime.

## Current Runtime Shape

Current UI flow:

```text
React feature view
  -> useWorkbench()
    -> createMockWorkbenchAdapter()
      -> mock commands, repositories, pipelines, processes, scripts, config, MCP, and declarative state
```

Existing real contract shape:

```text
React renderer
  -> window.polter
    -> preload bridge
      -> IPC channel
        -> main-process handler
          -> @polterware/core desktop service
```

The contract exists, but most main handlers are deliberately disconnected in UI-only mode.

## Tests

Tests cover:

- Main-process IPC handler registration.
- Global Commander shortcut registration.
- Preload bridge channel routing.
- Renderer root surface selection.
- Navigation catalogs.
- Mock workbench adapter behavior.
- Workbench bootstrap without a live bridge.
- Script, pipeline, process, and Commander search behavior.

Run package tests:

```bash
pnpm test
```

## Packaging

Electron Builder config:

```text
apps/desktop/electron-builder.yml
```

Configured outputs:

- macOS `dmg`
- Windows `nsis` for `x64`
- Linux `AppImage`

Signing, notarization, publishing, and auto-update are not configured in this package.

## Important Notes

- Follow `DESIGN.md` for all UI changes.
- Keep UI strings concise and in English.
- Do not expose raw Electron or Node APIs to renderer code.
- Keep `App.tsx` as a composition root.
- Keep feature logic inside feature folders.
- Do not wire real execution into the renderer until UI-only mode is explicitly changed.
