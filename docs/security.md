# Security Notes

## Overview

Polter is security-sensitive because its core domain is command execution, process management, MCP setup, project configuration, and future machine operations. The current active renderer is UI-only/mock-first, which reduces runtime risk during UI development, but the repository already contains helpers capable of running commands and managing processes in `packages/core`.

## Authentication

No application authentication system was identified in the active codebase.

Related integrations:

- `packages/core/src/lib/mcpInstaller.ts` can register a Polter MCP server command in Claude settings.
- `packages/core/src/declarative/status.ts` can inspect GitHub CLI authentication status through `gh auth status`.

These are tool integrations, not Polter user authentication.

## Authorization And Permission Model

No Polter-specific authorization or permission model is implemented.

Current boundaries:

- The active renderer uses mock data and does not run real commands.
- The Electron renderer is sandboxed and context-isolated.
- Renderer code should not access raw Node or Electron APIs.
- Public IPC channels are explicit.

Future real command execution, remote machines, agents, approvals, and audit history need a dedicated permission model before production use.

## Electron Security

Important protections in `apps/desktop/src/main/window.ts`:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- Preload-only bridge exposure.
- Permission requests are denied by default.
- New windows are denied; allowed external `http` and `https` URLs open through `shell.openExternal`.
- Navigation is constrained to the expected renderer URL or packaged renderer file.

The renderer HTML in `apps/desktop/index.html` defines a Content Security Policy:

```text
default-src 'self';
base-uri 'self';
object-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*;
```

The HTML also disables browser translation to prevent browser translation tools from mutating the DOM.

## Command Execution Risks

Core helpers can run shell commands:

- `packages/core/src/lib/runner.ts`
- `packages/core/src/lib/processManager.ts`
- `packages/core/src/declarative/applier.ts`
- `packages/core/src/desktop/service.ts`

Risks:

- Shell command injection if untrusted args are concatenated incorrectly.
- Secrets leaking into stdout/stderr logs.
- Destructive commands being triggered without approval.
- Long-running or detached processes surviving longer than expected.
- External CLIs using the user's local credentials.

Current renderer mitigation:

- The active renderer uses a mock adapter and does not run real external commands.

Future runtime integration should add:

- Approval flows for destructive or privileged commands.
- Structured command models instead of arbitrary shell strings wherever possible.
- Secret redaction for logs and errors.
- Actor, machine, cwd, command, timestamp, and approval audit records.

## Secret Management

No production secret management system was identified.

Current guidance:

- Do not commit real secrets.
- Do not store secrets in `.polter/config.json`.
- Do not store secrets in renderer `localStorage`.
- Treat command stdout/stderr as potentially sensitive.
- Be careful with `ProjectConfig.env`; it is plain JSON, not encrypted storage.

## Input Validation

Existing validation:

- Zod schemas validate pipelines, desktop repository entries, JSON-RPC process params, and declarative YAML shapes.
- Config readers handle parse failures by returning empty or undefined data.

Validation should continue at external boundaries:

- IPC payloads.
- JSON-RPC params.
- Config file parsing.
- MCP tool inputs.
- Any future remote machine or approval API.

## Abuse Prevention

No abuse-prevention layer is implemented.

Future remote or agent-accessible features should consider:

- Rate limits.
- Workspace trust.
- Machine trust and identity.
- Command allowlists.
- Deny-by-default destructive operations.
- Human approval inbox.
- Audit logs.

## Sensitive Data Handling

Sensitive surfaces:

- Environment variables.
- CLI auth state.
- Command output.
- Project paths.
- MCP settings files.
- `.polter/config.json`.
- Future process logs and audit history.

Current implementation does not provide automatic redaction for all of these surfaces.

## Known Risks

- Root `.github/workflows/release.yml` appears stale and should not be trusted for current production releases.
- No root security contact is identified.
- No root license coverage is identified.
- No signing/notarization process is identified.
- No permissions model exists for future real command execution.
- Current process management is local and in memory.
- Declarative apply helpers can execute external CLI commands when called from real core paths.

## Future Recommendations

- Define command risk levels and approval requirements before wiring real renderer execution.
- Add structured audit records before remote or agent-triggered execution.
- Add secret redaction for command output and logs.
- Add MCP tool input schemas and permission scopes.
- Add signing and release integrity checks before public desktop distribution.
- Replace or remove stale CI release automation.
