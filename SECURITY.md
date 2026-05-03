# Security Policy

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Report vulnerabilities privately to:

- Email: TODO

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

## Security Considerations

Polter is a desktop-first control surface for developer commands, processes, pipelines, MCP setup, workspace automation, and local machine operations.

Review these areas carefully:

- Local command execution and process management boundaries.
- User approval before destructive or privileged operations.
- Environment variable exposure in command runners.
- MCP/tool configuration and workspace trust.
- Logs that may contain command output, paths, or secrets.
- Electron renderer/main-process separation.
- Legacy TUI code under `legacy/tui`, which is archived and should not drive new security assumptions.

## Secrets

Never commit real secrets. Use `.env.example` for local diagnostics and keep runtime secrets out of logs.
