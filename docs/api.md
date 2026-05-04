# API And Internal Contracts

## API Overview

Polter does not expose an HTTP API in the current active workspace. There are no Next.js API routes, Express/Fastify/Hono routes, server actions, REST controllers, or GraphQL endpoints.

The project does define several internal contracts:

- Electron renderer bridge exposed as `window.polter`.
- IPC channel names in `apps/desktop/src/shared/ipc.ts`.
- Core package exports from `@polterware/core`.
- Local JSON-RPC process IPC helpers in `packages/core/src/lib/ipcServer.ts` and `packages/core/src/lib/ipcClient.ts`.
- MCP installation helpers for registering a local `polter-mcp` binary with Claude settings.

The active renderer currently uses a mock adapter and does not call real bridge methods for runtime operations.

## Electron Bridge: `window.polter`

Defined in:

- `apps/desktop/src/preload/index.ts`
- `apps/desktop/src/preload/bridge.ts`
- `apps/desktop/src/renderer/global.d.ts`

Domains exposed by `PolterBridge`:

| Domain | Methods |
| --- | --- |
| `app` | `getInfo` |
| `commands` | `listFeatures`, `listAll`, `getForm`, `getPins`, `toggleCommandPin`, `toggleRunPin`, `run` |
| `repositories` | `list`, `add`, `remove`, `pickDirectory` |
| `pipelines` | `list`, `save`, `remove`, `run` |
| `processes` | `list`, `start`, `stop`, `logs`, `remove` |
| `status` | `getTools` |
| `config` | `read`, `write` |
| `declarative` | `status`, `plan`, `apply` |
| `workspace` | `snapshot`, `runScript` |
| `mcp` | `status`, `install`, `remove` |
| `skills` | `preview`, `setup` |
| `commander` | `hideOverlay`, `showMainWindow`, `onFocusSearch` |

Example bridge call shape:

```ts
const info = await window.polter.app.getInfo();
const pins = await window.polter.commands.getPins();
const logs = await window.polter.processes.logs("process-id", 200);
```

Current limitation: `apps/desktop/src/main/ipc.ts` registers these channels but most handlers throw a UI-only mode error. Only Commander window controls are wired to real main-process behavior.

## IPC Channels

Channel names are defined in `apps/desktop/src/shared/ipc.ts`.

The channel tree mirrors the bridge domains:

- `app:get-info`
- `commands:*`
- `repositories:*`
- `pipelines:*`
- `processes:*`
- `status:tools`
- `config:*`
- `declarative:*`
- `workspace:*`
- `mcp:*`
- `skills:*`
- `commander:*`

IPC event names:

- `commander:focus-search`

The shared channel file is the source of truth. New bridge methods should add channels there before adding preload or main-process wiring.

## Core Package Exports

The `@polterware/core` package exports:

- Main entry: `@polterware/core`
- Catalog entry: `@polterware/core/catalog`
- Desktop service entry: `@polterware/core/desktop`

Important exported groups from `packages/core/src/index.ts`:

- Command discovery: `allCommands`, `getCommandById`, `getCommandsByTool`, `features`, flags, suggested args, pins.
- Execution: `runCommand`, `runCommandWithRetry`, `runInteractiveCommand`, `resolveSupabaseCommand`, `runSupabaseCommand`.
- Package manager helpers: `detectPkgManager`, `translateCommand`, `resolvePkgArgs`.
- Filesystem and workspace helpers: wrapped filesystem functions, package root lookup, child repository discovery, script reading, editor helpers.
- Process manager and IPC: `startProcess`, `stopProcess`, `listProcesses`, `getProcessOutput`, `createIpcServer`, `createIpcClient`, JSON-RPC serializers.
- Pipelines: `executePipeline`, pipeline storage, pipeline events.
- Config: project and global pipeline/config helpers.
- Declarative: `parsePolterYaml`, `planChanges`, `applyActions`, `getCurrentStatus`.
- MCP and skills: MCP install/remove/status helpers and skill setup helpers.
- Desktop services: `getDesktopAppInfo`, command, repository, pipeline, workspace, tool status, declarative, MCP, skill, and process helpers.

Example:

```ts
import {
  allCommands,
  detectPkgManager,
  getDesktopWorkspaceSnapshot,
  runCommand,
} from "@polterware/core";
```

## Local JSON-RPC Process IPC

Defined in:

- `packages/core/src/lib/ipcServer.ts`
- `packages/core/src/lib/ipcClient.ts`
- `packages/core/src/lib/ipcProtocol.ts`
- `packages/core/src/lib/processManager.ts`

Transport:

- Unix-style socket path derived from the nearest package root: `.polter/polter.sock`.
- JSON-RPC 2.0 messages serialized with newline delimiters.

Available methods:

| Method | Parameters | Result |
| --- | --- | --- |
| `ps.list` | none | List tracked processes. |
| `ps.start` | `command`, optional `args`, optional `cwd`, optional `id` | Start and track a process. |
| `ps.stop` | `id` | Stop a tracked process. |
| `ps.logs` | `id`, optional `tail`, optional `stream` | Return stdout/stderr buffers. |
| `ps.remove` | `id` | Remove a stopped process from the registry. |
| `ps.find_by_cwd` | `cwd`, optional `filter` | Find processes by working directory. |
| `ps.find_running` | `cwd`, `command`, `args` | Find a running process by command. |
| `ps.generate_id` | `command`, `args` | Generate a process id. |
| `status` | none | Return service name and PID. |

Example request:

```json
{"jsonrpc":"2.0","id":1,"method":"ps.logs","params":{"id":"dev-server","tail":200,"stream":"both"}}
```

Example response:

```json
{"jsonrpc":"2.0","id":1,"result":{"stdout":["ready"],"stderr":[],"stdoutLineCount":1,"stderrLineCount":0}}
```

## Authentication And Authorization

No authentication or authorization layer was identified for the internal Electron bridge or local process JSON-RPC helpers.

Security currently depends on:

- Electron context isolation.
- Renderer sandboxing.
- No raw Node/Electron APIs in the renderer.
- Explicit IPC channel definitions.
- UI-only renderer behavior for active desktop views.
- Local process boundaries.

Future remote, multi-user, or AI-agent execution flows need explicit identity, permissions, approvals, and audit modeling.

## Error Model

Electron bridge:

- UI-only IPC handlers throw errors with the message `Polter Desktop is running in UI-only mode. <channel> is not connected.`

JSON-RPC process IPC:

- Unknown methods return code `-32601`.
- Handler failures return code `-32000` with the thrown message.
- Client calls time out after the default timeout in `ipcClient.ts`.

Core command execution:

- `RunResult` includes `exitCode`, `signal`, `stdout`, `stderr`, and optional `spawnError`.

## Important Notes

- Do not document `window.polter` methods as active runtime behavior until main handlers are wired.
- Do not expose raw shell execution to renderer components.
- Keep channel names stable and explicit.
- Add validation at boundaries before passing payloads to core helpers.
