# Security Policy

## Reporting A Vulnerability

Please do not open public issues for security vulnerabilities.

Security contact: not identified in the current codebase.

Until a private reporting channel is added, coordinate disclosure privately with the repository owner.

## Supported Versions

| Version | Supported |
| --- | --- |
| `main` | Yes |

## Security Considerations

Polter is a desktop-first control surface for developer commands, processes, pipelines, MCP setup, workspace automation, and local machine operations. The current Electron renderer is UI-only/mock-first, but `packages/core` already contains helpers that can run commands and manage local processes when called from real runtime paths.

Review these areas carefully:

- Local command execution and process management boundaries.
- Human approval before destructive or privileged operations.
- Environment variable exposure in command runners.
- MCP/tool configuration and workspace trust.
- Logs that may contain command output, paths, or secrets.
- Electron renderer/main-process separation.
- Explicit preload bridge boundaries.
- Legacy TUI code under `legacy/tui`, which is archived and should not drive new security assumptions.

## Secrets

Never commit real secrets.

Do not store secrets in:

- `.polter/config.json`
- renderer `localStorage`
- command logs
- checked-in docs or screenshots

Use `.env.example` for non-secret local diagnostics and document any future required secret through an example name only.

## Current Gaps

- No root security contact is configured.
- No production signing or notarization process is configured.
- No Polter-specific authentication or authorization model exists.
- No durable audit log exists.
- No full secret redaction system was identified.

See [docs/security.md](docs/security.md) for the detailed security notes.
