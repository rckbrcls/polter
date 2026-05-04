# Polter Interface UX

This document describes the intended interface direction for Polter across Desktop, CLI, and MCP. It is product direction, not a statement that every capability is currently implemented.

The current Electron renderer is UI-only and mock-first. The long-term UX model is:

```text
Machine -> Command -> Stage -> Approval -> Execution -> Logs -> Audit
```

Polter should be an operational interface for humans and agents. It should not become a generic dashboard, a marketing surface, or an unrestricted shell wrapper.

## UX Mission

Polter should turn real commands and processes into understandable, reviewable, and safe operations.

The user should always be able to answer:

- Where will this action happen?
- What will be executed?
- Who requested it?
- What is the risk?
- What approval is required?
- What happened after execution?

Guiding product sentence:

> Polter is a machine-first command workbench for safe human and agent operations.

## Mental Model

Polter is machine-first.

The user should start from an operable machine or workspace context, not from an abstract tool list. In future versions, examples might include:

- `This Mac`
- `Windows PC`
- `prod-api`
- `staging-worker`
- `customer-demo`

Switching machine context should change:

- Commands.
- Workspaces.
- Processes.
- Logs.
- Pipelines.
- History.
- Policies.
- Approvals.
- Agent access.

The current desktop UI has project/workspace-oriented mock surfaces. Future machine support should preserve the same operational clarity.

## Shared Product Language

Desktop, CLI, and MCP should use the same concepts.

Primary vocabulary:

| Term | Meaning |
| --- | --- |
| `Machine` | An operable environment. |
| `Command` | A discovered, curated, or user-authored operation. |
| `Stage` | Preparation before execution. |
| `Approval` | Explicit human or policy decision. |
| `Execution` | A command or pipeline run. |
| `Process` | A long-running or monitorable execution. |
| `Log` | Raw output and structured events. |
| `Audit` | Record of who requested, approved, and executed. |
| `Agent` | MCP consumer with controlled permissions. |

Secondary vocabulary:

| Term | UX placement |
| --- | --- |
| `Node` | Diagnostics and setup details. |
| `Gateway` | Advanced routing/configuration. |
| `Relay` | Advanced transport/cloud configuration. |

Primary navigation should favor user-facing concepts such as Machines, Commands, Processes, Logs, Pipelines, Approvals, Agents, History, and Settings. `Node`, `Gateway`, and `Relay` should not be the first words in the default experience.

## Desktop UX

The desktop app is the human cockpit. It should be visual, inspectable, dense, keyboard-friendly, and approval-oriented.

It must follow `apps/desktop/DESIGN.md`:

- Serious command workbench.
- Dense rows and compact surfaces.
- Tables, split panes, logs, forms, status strips, command palettes, and inspectors.
- Minimal decorative chrome.
- No marketing heroes or generic SaaS dashboard styling.

### Shell Shape

Ideal long-term shell:

```text
Sidebar
  Projects / Machines
  Workspaces
  Primary views

Header
  Active context
  Commander
  Status and approvals

Main area
  Active workflow view

Inspector
  Selected item details
  Risk
  Approval
  Logs
  Actions
```

The active context should always be visible enough for safe operation:

```text
Machine: prod-api
Workspace: /srv/api
Connection: Online
Agent access: Limited
Pending approvals: 2
```

### Navigation

Ideal future views:

- `Machines`
- `Commands`
- `Processes`
- `Logs`
- `Pipelines`
- `Approvals`
- `Agents`
- `History`
- `Settings`

Current implemented/mock desktop surfaces are:

- `Processes`
- `Pipelines`
- `Scripts`
- `Infrastructure`
- `Project Config`
- command feature views
- `Tool Status`
- `MCP`
- `Skill Setup`
- `Settings`

Do not remove routes only because their runtime is mock. During UI-only work, routes should stay useful as product surfaces unless intentionally reset.

## Core Views

### Machines

Future purpose: manage and switch operable environments.

Each machine should show:

- Name.
- Type, such as local, Windows, VPS, or future managed runner.
- OS and architecture.
- Connection status.
- Last heartbeat.
- Workspaces.
- Active processes.
- Pending approvals.
- Allowed agents.

Primary action:

- `Open machine`

Secondary actions:

- `Add machine`
- `Connect via SSH`
- `Copy bootstrap command`
- `View diagnostics`
- `Remove machine`

### Commands

Purpose: find operations available in the active context.

Commands should be structured objects, not only raw shell strings.

Useful row shape:

```text
Public IP
curl ifconfig.me
Recipe / Network / This Mac
Risk: Network
```

Sources:

- `System`
- `Package Manager`
- `Workspace Script`
- `Recipe`
- `Pipeline`
- `History`

Filters:

- Source.
- Risk.
- Workspace.
- Recently used.
- Pinned.
- Agent-safe.
- Requires approval.

Primary action:

- `Stage`

Nothing risky should run directly from a list without clear staging or approval.

### Command Detail

Command detail should answer:

- What does this command do?
- What exact command line will run?
- Which machine and cwd will be used?
- What is the source?
- What is the risk?
- Does it use network?
- Can it destroy data?
- Which args are missing?
- Which approvals are required?

Suggested layout:

```text
Command header
  title, source, risk, machine

Invocation
  command preview
  editable args
  cwd selector

Policy
  safety classification
  approval requirement

Recent results
  last runs
  last exit codes
```

### Stage Surface

Staging is a product step, not a generic confirmation dialog.

It should show:

- Machine.
- Workspace.
- Command.
- Requester.
- Risk.
- Required approval.
- Expected output.

Example:

```text
Machine: prod-api
Workspace: /srv/api
Command: systemctl restart api
Requester: Codex
Risk: Privileged
Approval: Required
```

Actions:

- `Approve and run`
- `Edit command`
- `Deny`
- `Save as recipe`
- `Copy command`

### Processes

Purpose: monitor running and recently completed operations.

Process rows should show:

- Process id.
- Command.
- Machine or workspace.
- cwd.
- Status.
- PID when real runtime is active.
- Uptime.
- Last output.
- Exit code.
- Requester.

Statuses:

- `Running`
- `Exited`
- `Failed`
- `Stopping`
- `Needs attention`

Process detail should include:

- Command invocation.
- stdout/stderr tabs.
- Structured events.
- Timeline.
- Stop/remove actions.
- Save output.
- Create recipe or pipeline from command.

### Logs

Purpose: operational reading, not generic analytics.

Logs should be:

- Monospace.
- Filterable.
- Copy-friendly.
- Stable in height.
- Grouped by machine, process, service, or workspace.
- Able to become structured events later.

Useful filters:

- Machine.
- Workspace.
- Process.
- Stream.
- Severity.
- Time range.
- Error pattern.

Polter should highlight common errors without hiding raw output:

- Port already in use.
- Command not found.
- Permission denied.
- Auth failed.
- Missing environment variable.
- Migration failed.
- Connection refused.

### Pipelines

Purpose: turn repeated command sequences into reusable workflows.

Pipeline steps should define:

- Command source.
- cwd.
- args.
- flags.
- approval rule.
- continue-on-error rule.
- output/log behavior.

For an early real runtime, prefer single-machine pipelines. Multi-machine pipelines add complexity around permissions, rollback, and logs.

### Approvals

Purpose: inbox for human decisions.

Approval rows should show:

```text
Codex wants to run
systemctl restart api
prod-api / /srv/api / Privileged
```

Fields:

- Requester.
- Agent or user.
- Machine.
- Workspace.
- Command.
- Risk.
- Reason.
- Created at.
- Timeout.
- Status.

Statuses:

- `Pending`
- `Approved`
- `Denied`
- `Expired`
- `Executed`
- `Failed`

Toasts can notify. The approval inbox should remain the source of truth.

### Agents

Purpose: show who can request actions.

Agent rows should show:

- Agent name.
- Client type, such as Codex, Claude Code, OpenClaw, or custom MCP.
- Connection status.
- Allowed machines.
- Allowed tools.
- Approval policy.
- Last requests.

Agent tools should be human-readable:

- `List machines`
- `Search commands`
- `Read logs`
- `Stage command`
- `Run approved command`
- `Run pipeline`

Avoid presenting unrestricted `run_shell` as a default tool.

### History

Purpose: operational memory.

History should answer:

- What was requested?
- Who requested it?
- Where did it run?
- Who approved it?
- What executed?
- What was the result?
- Which logs matter?
- Did it become a recipe or pipeline?

History event types:

- Command run.
- Pipeline run.
- Approval decision.
- Agent request.
- Machine connection event.
- Policy change.

### Settings

Settings should be grouped by:

- Account.
- Machines.
- Relay or cloud.
- MCP.
- Policies.
- Storage.
- Diagnostics.
- Appearance.

Technical `Node`, `Gateway`, and `Relay` details belong in settings or machine diagnostics.

## Commander UX

Commander is the desktop action/search center.

It should respond to intent, not just exact text.

Example queries:

```text
public ip
logs api
restart service
add machine
show windows processes
approve pending command
```

Results should show:

- Type.
- Title.
- Command or action.
- Context.
- Source.
- Risk.

Example:

```text
[Recipe] Public IP        curl ifconfig.me        This Mac / Network
[Process] api-server      Running                 prod-api / 2h uptime
[Command] ping            System                  Windows PC / Read-only
[Approval] Restart API    Pending                 prod-api / Privileged
```

Commander should support:

- List plane.
- Command detail plane.
- Approval plane.
- Machine quick actions.
- Process/log jump.

Do not turn Commander into a giant form. Long editing flows should open a dedicated view, modal, sheet, or inspector.

## CLI UX Direction

The future CLI should be explicit, predictable, and scriptable.

Principles:

- Remote commands should declare their target machine.
- Dangerous actions should not depend on invisible state.
- stdout should be useful for humans.
- `--json` should exist for automation.
- Errors should suggest a next step.
- Setup commands should explain what they install or start.

Potential command groups:

```bash
polter machine ...
polter command ...
polter run ...
polter process ...
polter logs ...
polter pipeline ...
polter approval ...
polter mcp ...
polter node ...
```

No active CLI package exists in the current workspace.

## MCP UX Direction

MCP is the agent interface. Agents should receive structured tools, not unrestricted shell access.

Good future tools:

```text
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

```text
run_shell(command: string)
```

If a shell-like tool exists, it should be restricted, audited, and disabled by default for sensitive machines.

## Risk Taxonomy

Use a small taxonomy:

- `Read-only`
- `Normal`
- `Network`
- `Destructive`
- `Privileged`

Risk should appear near actions:

- Command rows.
- Stage surfaces.
- Approvals.
- History.
- Agent tools.

## Empty States And Errors

Empty states should be short and operational.

Good examples:

- `No processes yet`
- `Start a script or stage a command.`
- `No pipelines saved`
- `Create a pipeline from repeated commands.`

Errors should include context and next step.

Example:

```text
Command failed
Machine: prod-api
Command: pnpm build
Exit code: 1
Next: Open logs
```

Raw logs should remain accessible.

## Desktop, CLI, And MCP Relationship

The three surfaces should complement each other:

- Desktop: inspection, approval, dense workbench, logs, and human decisions.
- CLI: setup, headless automation, servers, and scripts.
- MCP: structured agent access under Polter policy.

Shared principles:

- Show target context near every action.
- Keep dangerous operations explicit.
- Prefer staging before execution.
- Keep logs and audit attached to results.
- Avoid hidden state for production-like actions.

## Do Not Build

Avoid:

- Generic card-heavy dashboards.
- Marketing hero sections inside the app.
- Unrestricted agent shell by default.
- Hidden production target state.
- Destructive actions without context and approval.
- Treating `Node`, `Gateway`, or `Relay` as primary user navigation.
