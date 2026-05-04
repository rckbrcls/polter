# @polterware/core

`@polterware/core` is the shared non-visual TypeScript package for Polter. It centralizes command metadata, tool resolution, command execution helpers, process management, pipelines, config storage, declarative planning, MCP setup, skill setup, IPC helpers, and desktop service adapters.

The package is consumed by the active Electron app in `apps/desktop` and is designed to stay independent from renderer UI code.

## Responsibility

This package owns:

- Command catalogs for Supabase, GitHub CLI, Vercel CLI, Git, and package managers.
- Command feature grouping, flags, suggested args, and pins.
- Package-manager detection and command translation.
- CLI tool resolution.
- Command execution through `execa`.
- Background process tracking and stdout/stderr ring buffers.
- Local JSON-RPC process IPC server/client helpers.
- Pipeline execution and project/global pipeline storage.
- Project config at `.polter/config.json`.
- Global local config through `conf`.
- Declarative `polter.yaml` parsing, planning, status, and apply helpers.
- MCP installer and removal helpers for Claude settings.
- Skill setup helpers.
- Desktop service functions intended for Electron main-process handlers.

It should not own renderer UI components, visual state, or Electron window behavior.

## Package Exports

Defined in `package.json`:

```json
{
  ".": "./src/index.ts",
  "./catalog": "./src/catalog.ts",
  "./desktop": "./src/desktop/service.ts"
}
```

Usage:

```ts
import { allCommands, runCommand } from "@polterware/core";
import { getDesktopWorkspaceSnapshot } from "@polterware/core/desktop";
```

## Main Files And Folders

```text
packages/core/
├── src/
│   ├── catalog.ts              # Catalog-only export entry
│   ├── index.ts                # Main public export entry
│   ├── config/                 # Project and global config
│   ├── core/                   # Core execution/result/error/context helpers
│   ├── data/                   # Command definitions, flags, features, schemas, pins
│   ├── declarative/            # polter.yaml parser, planner, applier, status
│   ├── desktop/                # Desktop-facing service adapter
│   ├── lib/                    # Runner, process manager, IPC, MCP, tool helpers
│   └── pipeline/               # Pipeline engine, events, storage
├── package.json
└── tsconfig.json
```

## Technology Stack

- TypeScript.
- Vitest.
- Zod.
- execa.
- conf.
- eventemitter3.
- p-limit.
- p-retry.
- which.
- semver.
- signal-exit.
- Model Context Protocol SDK.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm build` | Runs `tsc -p tsconfig.json`. |
| `pnpm typecheck` | Runs `tsc --noEmit`. |
| `pnpm test` | Runs `vitest run`. |

Agent sessions in this repository must not run build commands.

## Command Catalog

Command definitions live under:

```text
packages/core/src/data/commands/
```

Supported tool IDs are:

- `supabase`
- `gh`
- `vercel`
- `git`
- `pkg`

The package exports helpers such as `allCommands`, `getCommandById`, `getCommandsByTool`, `getCommandValue`, `features`, flags, suggested args, and pin helpers.

## Execution And Processes

Command execution helpers live in:

```text
packages/core/src/lib/runner.ts
```

Process tracking lives in:

```text
packages/core/src/lib/processManager.ts
```

The process manager:

- Uses `execa`.
- Tracks processes in memory.
- Captures stdout and stderr into ring buffers.
- Emits process events.
- Can stop process groups with `SIGTERM` and then `SIGKILL`.

This is not durable storage.

## Config And Persistence

Project config:

```text
.polter/config.json
```

Global config:

```text
conf projectName: polter
```

Main global keys:

- `globalPipelinesV1`
- `desktopRepositoriesV1`

See [../../docs/database.md](../../docs/database.md) for the storage map.

## Declarative Planning

Declarative files are named:

```text
polter.yaml
```

Core helpers can parse desired state, compute a plan, inspect current CLI status, and apply actions through external CLIs. The active Electron renderer currently mocks these flows and does not apply real infrastructure.

## MCP And Skills

MCP helpers live in:

```text
packages/core/src/lib/mcpInstaller.ts
```

They can register or remove a `polter` MCP server entry through Claude CLI or manual settings file edits. The expected binary path is:

```text
~/.polter/bin/polter-mcp
```

Skill helpers live in:

```text
packages/core/src/lib/skillSetup.ts
```

## Tests

Tests cover:

- Package-manager detection and translation.
- Command metadata and suggested args.
- Runner behavior.
- Process manager behavior.
- Local IPC protocol/server/client behavior.
- Config storage.
- YAML writer.
- Error suggestions and error modeling.
- Pins.

Run tests:

```bash
pnpm test
```

## Important Notes

- Keep core UI-free.
- Validate external inputs at boundaries.
- Do not store secrets in project config.
- Do not treat `conf` as a durable database.
- Export only APIs intended for desktop or future surfaces.
