# Documentation

Welcome to the documentation for Polter.

## Guides

- [Product Architecture](polter-product-architecture.md)
- [Interface UX](polter-interface-ux.md)
- [Library Candidates](polter-library-candidates.md)
- [Architecture](architecture.md)
- [Getting Started](getting-started.md)
- [Deployment](deployment.md)
- [Troubleshooting](troubleshooting.md)

## Current Architecture

- `apps/desktop/` is the active Electron desktop product surface.
- `packages/core/` owns shared non-visual command, pipeline, process, config, and workspace logic.
- `legacy/tui/` is archived transition code and should not drive new product decisions.

## Notes

- Keep renderer UI local/mock-only until the project direction explicitly changes.
- Treat command execution, process control, MCP setup, and logs as security-sensitive surfaces.
- Update this index when new planning or implementation docs are added.
