# Polter Documentation

This documentation describes the current Polter monorepo as it exists in this checkout. It separates implemented behavior from product direction and marks unclear areas honestly.

## Core Docs

- [Overview](overview.md) - Product goal, users, modules, flows, boundaries, and current status.
- [Architecture](architecture.md) - Electron, renderer, core package, IPC, storage, and internal dependencies.
- [Setup](setup.md) - Prerequisites, dependency installation, environment variables, and local startup commands.
- [Development](development.md) - Project organization, conventions, feature workflow, checks, and quality rules.
- [API And Contracts](api.md) - Internal bridge, IPC, JSON-RPC process API, and core exports. There is no HTTP API.
- [Storage And Persistence](database.md) - Config files, global `conf` storage, localStorage, in-memory buffers, and absence of a database.
- [Deployment](deployment.md) - Electron packaging, outputs, missing production release pieces, and stale CI notes.
- [Security](security.md) - Electron boundaries, command execution risks, secrets, MCP setup, and known gaps.
- [Troubleshooting](troubleshooting.md) - Common setup, renderer, IPC, test, packaging, and stale workflow issues.
- [Contributing](../CONTRIBUTING.md) - Contribution workflow and quality expectations.

## Product Direction Docs

- [Product Architecture](polter-product-architecture.md) - Product mission and future machine-control-plane direction.
- [Interface UX](polter-interface-ux.md) - Desktop, CLI, MCP, approvals, risks, and interaction model direction.
- [Library Candidates](polter-library-candidates.md) - Installed dependencies, future candidates, and dependency boundaries.

## Active Code Areas

- `apps/desktop/` is the active Electron desktop product surface.
- `packages/core/` owns shared non-visual command, pipeline, process, config, MCP, IPC, and desktop service logic.
- `legacy/tui/` is archived transition code and should not drive new product decisions.

## Documentation Principles

- Document current code before roadmap ideas.
- Keep future direction clearly labeled as future direction.
- Keep app copy, examples, comments, section titles, and generated documentation in English.
- Do not describe a database, HTTP API, deployment platform, signing process, or production release channel unless it exists in the current codebase.
