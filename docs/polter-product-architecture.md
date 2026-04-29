# Polter Product Mission And Architecture

This document is intentionally exploratory. It captures the current product thesis, the architecture direction, the role of local and remote machines, how agents should interact with Polter, and what to study before implementation starts.

## Product Mission

Polter should not be only a prettier terminal and should not become another AI agent.

The stronger mission is:

> Polter is the secure control plane that lets humans and AI agents operate commands, processes, logs, and workflows across any machine.

Shorter version:

> Polter turns the terminal into safe, contextual infrastructure for humans and agents.

The core product idea is not "run shell commands remotely". The product is the layer that gives terminal operations context, memory, policy, approval, auditability, and composition.

## Product Positioning

Polter sits between:

- humans who need to operate local and remote machines,
- AI agents that need controlled access to real environments,
- machines that can execute commands and expose logs,
- workflows that should become reusable pipelines instead of ad hoc terminal history.

Polter should be inspired by the Supabase pattern, but not by copying Supabase's exact business.

Supabase wraps complex infrastructure primitives into an opinionated developer experience. Polter can do the same for:

- commands,
- processes,
- logs,
- machine access,
- MCP tools,
- remote execution,
- approvals,
- audit trails,
- agent-safe operations.

The first paid product should probably not be "we rent EC2 machines". That creates hosting cost, abuse risk, security liability, and infrastructure support too early.

The better early paid product is:

- secure relay,
- machine registry,
- team permissions,
- audit history,
- approval flows,
- agent access control,
- remote machine operation without exposing public ports.

Managed runners or managed EC2-like machines can come later if the control plane proves valuable.

## Core Concepts

### Machine

A machine is any execution environment Polter can operate.

Examples:

- This Mac,
- Windows PC,
- EC2 instance,
- VPS,
- staging server,
- customer demo box,
- managed runner in the future.

Every machine should have:

- stable identity,
- display name,
- OS and architecture,
- hostname,
- connection status,
- workspaces,
- command registry,
- process list,
- logs,
- pipelines,
- policies,
- audit trail.

The UI should make the current machine context obvious. Switching machine context should change commands, processes, logs, pipelines, and history.

### Polter Node

Polter Node is the lightweight service installed on a machine that Polter can operate.

The node is the representative of Polter on that machine. It should:

- discover commands available on the machine,
- index workspaces and scripts,
- run approved commands,
- supervise processes,
- capture stdout and stderr,
- expose logs,
- execute pipelines,
- maintain local state,
- enforce local policy,
- send heartbeat/status,
- stream events to a gateway or relay.

The user should not need to think much about "the node". Product language should focus on "add machine", "connect machine", and "open machine". The node is the operational detail that makes a machine controllable.

### Polter Gateway

Polter Gateway is the routing layer.

It should not execute commands itself. It should:

- authenticate nodes and clients,
- register connected machines,
- route requests to the correct machine,
- route streams back to clients,
- enforce session-level permissions,
- support local, self-hosted, and cloud deployment modes.

In a local prototype, the gateway can run on the Mac. The Windows node can connect outbound to it.

### Polter Relay

Polter Relay is the hosted or self-hosted network service that allows machines to connect without opening public inbound ports.

The safer network shape is:

```txt
Remote machine -> outbound connection -> Relay
Client/agent    -> authenticated request -> Relay -> Remote machine
```

The remote machine should not expose an unauthenticated MCP or command API directly to the internet.

### Polter Desktop

Polter Desktop is the human cockpit.

It should provide:

- machine switcher,
- command search,
- command staging,
- process board,
- logs,
- pipelines,
- approvals,
- history,
- settings,
- MCP/agent access visibility.

The desktop app is the best place for human approval and inspection.

### Polter CLI

The CLI should be headless and operational. It should not revive the old TUI as the main product surface.

Useful commands:

```bash
polter login
polter machine list
polter machine add prod --ssh ubuntu@host
polter machine status prod
polter node start
polter node status
polter run prod -- git status
polter logs prod --service api
polter mcp install
```

The CLI is mandatory for servers and automation. A TUI can return later only if it has a clear job: operating Polter over SSH when the desktop is unavailable.

### Polter MCP

Polter MCP should be the tool bridge for AI agents.

The preferred model is:

```txt
Codex/OpenClaw/local agent
  -> local Polter MCP server
     -> Polter Core/Gateway
        -> local or remote Polter Node
```

The agent should not connect directly to every remote machine by default. A local Polter MCP server keeps configuration, permissions, and approvals centralized.

## Reference Architecture

```txt
Human
  -> Polter Desktop
     -> Polter Core
        -> Polter Gateway
           -> Polter Node on This Mac
           -> Polter Node on Windows
           -> Polter Node on EC2

AI Agent
  -> Polter MCP
     -> Polter Core
        -> Polter Gateway
           -> selected machine

Polter Cloud
  -> identity
  -> relay
  -> machine registry
  -> team permissions
  -> audit history
  -> billing
```

The same model should support three deployment modes:

- local only,
- self-hosted relay,
- Polter Cloud relay.

## Local Mac And Windows Prototype

The Mac and Windows setup is a good first test because it validates real cross-machine behavior without building cloud infrastructure first.

Recommended prototype:

```txt
Mac
  Polter Desktop
  Polter Gateway local
  Polter MCP local

Windows
  Polter Node
```

Connection shape:

```txt
Windows Node -> Mac Gateway
Mac Desktop  -> Mac Gateway -> Windows Node
Codex local  -> Polter MCP local -> Mac Gateway -> Windows Node
```

This validates:

- machine registration,
- remote command search,
- remote process listing,
- stdout/stderr streaming,
- command staging,
- approval,
- OS differences,
- MCP routing to a selected machine.

Safe Windows commands for early tests:

```powershell
hostname
whoami
git --version
node --version
Get-Process
Get-ChildItem
```

Safe macOS commands for early tests:

```bash
hostname
whoami
git --version
node --version
ps aux
ls
```

## SSH Bootstrap

SSH should be setup and fallback, not the whole product.

Good UX:

```bash
polter machine add prod-api --ssh ubuntu@ec2-host
```

That command should:

- connect via SSH,
- detect OS and architecture,
- check whether Polter Node is installed,
- install or update the node if needed,
- create `~/.polter`,
- generate or load machine identity,
- start the node,
- register the machine,
- test the connection,
- show the machine in Desktop/CLI.

After bootstrap, the node should maintain its own connection to the gateway/relay when possible.

The user thinks "add machine". Polter handles "install node".

## Command Registry

Polter should not treat "all commands on the computer" as a blind disk scan.

Commands should come from trusted sources:

- executables in `PATH`,
- common system paths,
- Homebrew bins,
- npm/pnpm/yarn/bun global bins,
- Cargo bins,
- pipx bins,
- workspace package scripts,
- Polter pipelines,
- curated recipes,
- Polter usage history later, preferably opt-in.

Shell history should not be indexed by default because it can contain secrets.

Each command entry should include:

```ts
{
  id: string;
  source: "system" | "package-manager" | "workspace-script" | "recipe" | "pipeline" | "history";
  title: string;
  commandLine: string;
  executablePath?: string;
  description?: string;
  aliases: string[];
  tags: string[];
  platforms: string[];
  safety: "read-only" | "normal" | "network" | "destructive" | "privileged";
  requiresNetwork: boolean;
  isDestructive: boolean;
  cwdPolicy: "any" | "workspace" | "machine-root";
  lastSeenAt: string;
  lastUsedAt?: string;
  rank: number;
}
```

The value is not listing thousands of binaries. The value is helping the user find the right operation by intent and execute it safely.

Examples:

- "public ip" -> `curl ifconfig.me`,
- "port 3000" -> `lsof -i :3000`,
- "dns lookup" -> `dig example.com`,
- "git status" -> `git status`,
- "dev server" -> workspace script,
- "restart service" -> approved remote recipe.

## Storage Direction

SQLite should be the durable local store.

Recommended split:

- SQLite for durable data,
- SQLite FTS for command search,
- in-memory index for hot UI search if needed,
- `conf` only for small preferences/settings,
- localStorage only for renderer-only appearance preferences.

Data categories:

- reconstructable: discovered PATH commands, global bins, workspace scripts, built-in recipes,
- durable user data: favorites, aliases, notes, approvals, history, usage ranking, pipelines.

The index can be rebuilt. User decisions should not be lost.

## Agent Tool Surface

Agents should receive structured tools, not a free shell.

Good tools:

```txt
list_machines
get_machine_status
search_commands
stage_command
request_approval
run_approved_command
list_processes
read_process_logs
read_recent_errors
run_pipeline
explain_command
```

Risky tool:

```txt
run_shell(command: string)
```

If a shell-like tool exists at all, it should be heavily restricted, audited, and probably disabled by default for remote production machines.

## Approval Model

Polter should separate propose, approve, and execute.

Flow:

```txt
Agent/user searches command
  -> command is staged
  -> Polter classifies risk
  -> human approves or denies
  -> node executes
  -> result is captured
  -> audit event is stored
```

Approval should include:

- machine,
- working directory,
- command line,
- source,
- risk level,
- requester,
- timestamp,
- expected effect,
- whether it needs network or elevated privileges.

## Logs And Error Intelligence

Regex is useful, but it should not be the full model.

Logs should become structured events:

- process id,
- command,
- cwd,
- machine,
- stream,
- timestamp,
- exit code,
- stderr tail,
- matched pattern,
- severity,
- suggested next action,
- linked pipeline step.

Error detection can start with rules:

- port already in use,
- command not found,
- missing env var,
- permission denied,
- auth failed,
- migration failed,
- dependency install failed,
- DNS failure,
- connection refused.

Later, an agent can receive a compact context packet rather than raw infinite logs.

## OpenClaw Integration

OpenClaw should be treated as an agent/gateway that can consume MCP tools, not as something Polter must deeply embed.

Best integration:

```txt
OpenClaw
  -> MCP
     -> Polter MCP
        -> Polter Gateway
           -> selected machine
```

Polter should expose a standard MCP tool surface. OpenClaw, Codex, Claude Code, or another MCP client can use the same surface.

OpenClaw also has its own gateway concept and MCP bridge. That suggests future integration points:

- Polter as an MCP server used by OpenClaw,
- Polter as an MCP server definition in OpenClaw config,
- OpenClaw conversations triggering Polter approval requests,
- Polter machines exposed as controlled operational tools.

Polter should avoid becoming the agent brain. The cleaner division:

- OpenClaw/Codex/Claude Code: reasoning and conversation,
- Polter: controlled machine operation,
- Polter Node: execution surface,
- Polter Gateway/Relay: routing and trust boundary.

## Security Principles

Security is central, not a later feature.

Principles:

- no raw Node/Electron APIs in the renderer,
- no unauthenticated remote command API,
- no direct public MCP on production machines by default,
- nodes should prefer outbound connections,
- all commands should be auditable,
- destructive commands need approval,
- shell history should not be indexed by default,
- secrets should be redacted in logs,
- tokens should be stored safely,
- every request should have an actor,
- every execution should have a machine and cwd,
- policies should be machine-specific and workspace-specific.

## TypeScript Versus Rust

TypeScript should remain the first backend/runtime choice for now.

Reasons:

- the project is already Electron, React, and TypeScript,
- `packages/core` already owns non-visual logic,
- IPC contracts and UI types are easier to share,
- product iteration matters more than low-level performance right now,
- command orchestration, indexing metadata, SQLite, MCP, and process supervision can all start in TypeScript.

Rust can be added later for real hotspots:

- advanced PTY handling,
- long-lived process supervision,
- high-volume file watching,
- heavy indexing,
- sandboxing helpers,
- cross-platform native service behavior.

The right boundary is:

```txt
TypeScript product core first
  -> Rust sidecar later only where it earns its place
```

## TUI, CLI, Desktop

The old TUI should not drive the new architecture.

Recommended priority:

- Desktop for the human cockpit,
- CLI for servers, bootstrap, automation, and headless operation,
- MCP for agents,
- TUI only later if SSH-native operation needs a richer terminal UI.

The TUI is optional. The CLI and node are not.

## Product Use Cases

### Local Developer

- search commands by intent,
- run workspace scripts,
- see local processes,
- understand command errors,
- create reusable pipelines,
- stage commands before running them.

### Remote Machine Operator

- add EC2/VPS via SSH bootstrap,
- see remote commands and processes,
- run safe diagnostics,
- stream logs,
- restart approved services,
- run deploy pipelines.

### AI Agent With Guardrails

- list machines,
- inspect logs,
- search commands,
- propose fixes,
- request approval,
- execute approved actions,
- report results with audit trail.

### Small Team

- share machines,
- share recipes,
- define safe commands,
- audit operations,
- onboard new developers through executable workflows,
- control who can run diagnostics, deploys, or destructive actions.

## What Not To Build First

Avoid these early traps:

- replacing the entire terminal,
- giving agents unrestricted shell access,
- hosting EC2 as the first product,
- building a full TUI before a headless node/CLI,
- making logs a generic dashboard,
- exposing remote MCP directly from machines without a control plane,
- indexing shell history by default,
- using vector search before lexical/ranked search is solid.

## Suggested Implementation Phases

### Phase 1: Product Shape

- define `Machine`,
- define local machine context,
- define command registry model,
- define staged command flow,
- define approval model,
- define audit event model.

### Phase 2: Local Runtime

- local Polter Node behavior inside `packages/core`,
- command registry from `PATH` and workspace scripts,
- process manager integration,
- SQLite storage,
- Desktop machine switcher with `This Mac`.

### Phase 3: Mac To Windows Prototype

- local gateway on Mac,
- Windows node connects outbound to Mac,
- Desktop shows Windows as remote machine,
- commands/processes/logs routed by machine,
- staged execution only.

### Phase 4: MCP Local Proxy

- local Polter MCP server,
- agent tools route to selected machines,
- approval requests surface in Desktop/CLI,
- no free shell by default.

### Phase 5: Self-host Relay

- standalone gateway/relay,
- token-based machine registration,
- outbound node connections,
- stream routing,
- audit persistence.

### Phase 6: Polter Cloud

- hosted relay,
- identity,
- teams,
- machine registry,
- permissions,
- audit history,
- billing.

### Phase 7: Managed Runners

- optional hosted execution environments,
- only after the relay/control plane is valuable.

## Research Topics

Study these before implementing:

### Networking And Remote Access

- SSH bootstrap and SSH tunnels,
- WebSocket connection lifecycle,
- reverse tunnels,
- NAT traversal basics,
- outbound-only agent architecture,
- heartbeat/reconnect protocols,
- backpressure in streaming logs.

### MCP And Agent Tooling

- MCP stdio transport,
- MCP HTTP/SSE or Streamable HTTP transport,
- MCP authorization,
- tool schemas and structured outputs,
- approval flows in agent tools,
- local MCP proxy design,
- OpenClaw MCP server/client registry behavior.

### Desktop And Local Runtime

- Electron main/preload/renderer security,
- context isolation,
- typed IPC,
- Node child processes,
- PTY behavior,
- process groups and signal handling,
- Windows PowerShell versus cmd versus Unix shells.

### Command Discovery

- how `PATH` resolution works,
- executable permissions on Unix,
- `.cmd` and `.ps1` behavior on Windows,
- shell builtins versus binaries,
- aliases and shell functions,
- npm/pnpm/yarn/bun global bin discovery,
- Homebrew/Cargo/pipx bin layouts.

### Storage And Search

- SQLite schema design,
- SQLite FTS5,
- migrations,
- append-only audit logs,
- local-first data sync,
- ranking algorithms for command search,
- redaction of secrets in logs and command history.

### Security

- capability-based permissions,
- least privilege,
- command allowlists and denylists,
- secret redaction,
- token storage,
- TLS,
- OAuth/device auth flow,
- signed node binaries,
- supply-chain security,
- audit logs and tamper evidence.

### Product Architecture

- control plane versus data plane,
- relay architecture,
- local-first apps,
- self-hosted versus hosted product boundaries,
- SaaS pricing for control planes,
- developer onboarding UX,
- human-in-the-loop approval UX.

## Useful References

- MCP transports: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
- MCP authorization: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
- MCP remote servers registry: https://modelcontextprotocol.io/registry/remote-servers
- OpenClaw overview: https://docs.opencomputer.dev/agents/cores/openclaw
- OpenClaw MCP CLI: https://docs.openclaw.ai/cli/mcp

## Final Product Sentence

Polter is a secure machine control plane for humans and AI agents, turning local and remote terminals into contextual, auditable, approval-driven workflows.
