# Polter Product Architecture Direction

This document records the product architecture direction for Polter. It is not a statement that all described capabilities are implemented today.

Current implementation snapshot:

- The active app is the Electron desktop package in `apps/desktop`.
- Shared non-visual logic lives in `packages/core`.
- The renderer is currently UI-only and mock-first.
- Real command execution, process management, pipelines, declarative apply, MCP setup, and desktop services exist in core helpers, but the active renderer does not call real runtime handlers.
- Remote machines, gateway, relay, cloud, approvals, audit history, and durable machine registry are product direction, not implemented runtime systems in this checkout.

## Product Mission

Polter should become a secure command workbench and machine control plane for humans and AI agents.

Short form:

```text
Polter turns terminal operations into contextual, reviewable, and auditable workflows.
```

The product should not be only a prettier terminal and should not become the agent brain. It should sit between humans, agents, commands, processes, logs, policies, and machines.

## Current Product Surface

The implemented product surface is:

```text
Electron Desktop
  -> React renderer
  -> UI-only mock workbench adapter
  -> desktop views for processes, pipelines, scripts, commands, config, MCP, skills, and settings
```

The implemented shared service surface is:

```text
@polterware/core
  -> command catalog
  -> command runner helpers
  -> process manager
  -> pipeline engine
  -> project/global config
  -> declarative plan/apply helpers
  -> MCP installer helpers
  -> desktop service adapter
```

## Long-Term Product Model

The intended operational chain is:

```text
Machine -> Command -> Stage -> Approval -> Execution -> Logs -> Audit
```

This chain is the main design handle for future work. It should guide interface, CLI, MCP, storage, gateway, and security decisions.

## Core Concepts

### Machine

Future concept. A machine is an operable environment such as a local Mac, Windows PC, VPS, EC2 instance, staging server, or future managed runner.

Expected future properties:

- Stable identity.
- Display name.
- OS and architecture.
- Hostname.
- Connection status.
- Workspaces.
- Command registry.
- Process list.
- Logs.
- Pipelines.
- Policies.
- Audit trail.

Current implementation note: the current renderer is project/workspace-oriented and mock-first. No durable machine registry exists.

### Command

Implemented partially through the core command catalog.

Current sources:

- Supabase CLI commands.
- GitHub CLI commands.
- Vercel CLI commands.
- Git commands.
- Package-manager commands.

Future command model should include:

- Source.
- Title.
- Command line.
- Description.
- Aliases.
- Tags.
- Platforms.
- Risk classification.
- cwd policy.
- Last seen and last used metadata.
- Ranking.

Current implementation note: the current `CommandDef` includes id, tool, base args, label, hint, suggested args, editor target, interactivity, and basic execution metadata such as read-only/destructive flags.

### Stage

Future product step. Staging means preparing a command before execution so the user can inspect context, arguments, cwd, risk, and approval requirements.

Current implementation note: the renderer has staging-like mock interactions, especially from Scripts into Processes, but no real approval-backed staging system exists.

### Approval

Future product step. Approval should separate proposing an action from executing it.

Future approval record should include:

- Machine.
- Workspace.
- Command line.
- Source.
- Risk level.
- Requester.
- Timestamp.
- Expected effect.
- Network or privilege requirements.

Current implementation note: no approval model or durable approval storage exists.

### Execution

Implemented in core helpers, not wired into the active renderer.

Current execution helpers:

- `runCommand`
- `runCommandWithRetry`
- `runInteractiveCommand`
- `runSupabaseCommand`
- `startProcess`
- `stopProcess`
- `executePipeline`
- `applyActions`

Current implementation note: these helpers can execute commands when called from real runtime paths. The active renderer avoids calling them directly.

### Logs

Implemented partially through process output buffers.

Current behavior:

- `processManager` captures stdout and stderr in ring buffers.
- Default buffer capacity is 1000 lines per stream.
- Logs are in memory and are not durable.

Future behavior should add durable logs, structured events, redaction, filtering, and audit linkage.

### Audit

Future concept. No durable audit history exists in the current codebase.

Future audit should record:

- Actor.
- Requester.
- Approver.
- Machine.
- cwd.
- Command.
- Risk.
- Result.
- Important logs.
- Timestamp.

## Desktop Direction

The Electron desktop app should remain the human cockpit:

- Dense workflow navigation.
- Project or future machine context.
- Commander for search and actions.
- Process and log surfaces.
- Pipeline composition.
- Config and tool status.
- MCP and skill visibility.
- Approval inbox when real approvals exist.

The desktop should follow `apps/desktop/DESIGN.md`: operational, compact, serious, and keyboard-friendly.

## CLI Direction

No active CLI package exists in the current workspace. The old CLI/TUI under `legacy/tui` is archived.

Future CLI responsibilities:

- Headless setup.
- Machine bootstrap.
- Scriptable command execution.
- Process and log inspection.
- MCP registration.
- Pipeline operation.
- JSON output for automation.

Potential future shape:

```bash
polter machine list
polter machine add prod --ssh ubuntu@host
polter run prod -- git status
polter logs prod --service api
polter mcp install
```

These commands are product direction, not current active CLI behavior.

## MCP Direction

Current code contains MCP installation helpers and an archived legacy MCP server. The active Electron renderer mocks MCP status and setup.

Future MCP should expose structured tools instead of unrestricted shell access:

- `list_machines`
- `get_machine_status`
- `search_commands`
- `stage_command`
- `request_approval`
- `run_approved_command`
- `list_processes`
- `read_process_logs`
- `run_pipeline`

Agents should interact through Polter policy and approval boundaries, not directly through arbitrary remote shell access.

## Gateway, Relay, And Node Direction

These are future concepts, not implemented services in this checkout.

Suggested future roles:

- **Polter Node:** lightweight service on a machine that discovers commands, supervises processes, streams logs, and enforces local policy.
- **Polter Gateway:** routing and session layer that connects clients, agents, and nodes.
- **Polter Relay:** hosted or self-hosted transport so machines can connect outbound without exposing public command APIs.

Preferred future network shape:

```text
Remote machine -> outbound connection -> Relay
Desktop/agent   -> authenticated request -> Relay -> Remote machine
```

No gateway, relay, cloud, or node package exists in the current workspace.

## Storage Direction

Current storage is config/file/memory based:

- `.polter/config.json`
- `conf`
- renderer `localStorage`
- in-memory process buffers

Future durable storage may be needed for:

- Command registry.
- Machine registry.
- Audit history.
- Approval history.
- Process history.
- Usage ranking.

SQLite plus a typed schema layer is a candidate direction, but no database is currently installed or configured.

## Security Direction

Security is central to the product.

Current safeguards:

- Electron context isolation.
- Renderer sandboxing.
- Node integration disabled.
- Explicit preload bridge.
- UI-only renderer behavior.
- CSP in `apps/desktop/index.html`.

Future safeguards needed before real remote or agent operation:

- Actor identity.
- Machine identity.
- Tool permissions.
- Approval policy.
- Secret redaction.
- Durable audit records.
- Restricted shell-like tools.
- Deny-by-default destructive operations.

## What Not To Build First

Avoid building these too early:

- Unrestricted remote shell access.
- Full cloud runner hosting before local control-plane value is proven.
- A new TUI as the primary interface.
- Vector search before command registry basics are durable.
- Public remote MCP endpoints without a control plane.
- Durable audit claims without durable storage.

## Suggested Implementation Phases

### Phase 1: Keep Desktop UI Honest

- Preserve UI-only/mock-first renderer until runtime integration is approved.
- Keep routes useful and clearly mocked.
- Keep docs accurate about current limitations.

### Phase 2: Wire Narrow Real Runtime Paths

- Choose one safe runtime path.
- Add explicit IPC handlers.
- Route through `packages/core`.
- Add tests around the bridge and handler.
- Keep dangerous operations blocked or approval-gated.

### Phase 3: Add Durable Local State

- Decide storage technology.
- Model command history, processes, and audit data.
- Add migrations if a database is introduced.

### Phase 4: Add Agent And Approval Boundaries

- Define MCP tools.
- Add permissions.
- Add approval inbox.
- Add audit records.

### Phase 5: Add Remote Machine Infrastructure

- Define node/gateway/relay packages.
- Add machine identity.
- Add secure transport.
- Add remote process/log streaming.

Each phase should update `README.md`, `docs/architecture.md`, `docs/api.md`, `docs/database.md`, `docs/security.md`, and `docs/deployment.md` when the code changes.
