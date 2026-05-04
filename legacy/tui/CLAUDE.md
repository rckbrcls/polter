# Polter Legacy TUI Notes

This file documents the archived terminal implementation under `legacy/tui`. The active product is the Electron desktop app in `apps/desktop`; do not use this legacy package as the default architecture for new work.

## Commands

```bash
bun run dev          # Watch mode through tsup
bun run build        # Production build through tsup, output to dist/
bun run lint         # Type-check only with tsc --noEmit
bun run test         # Run all tests with vitest run
bun run test:watch   # Watch mode tests
bun vitest run src/lib/runner.test.ts  # Run one test file
```

## Architecture

### Entry Points

- `src/index.tsx` is the legacy CLI entry for the `polter` binary. It parses CLI args and dispatches to the TUI, pipeline runner, declarative plan/apply, or status commands.
- `src/api.ts` is the legacy public API barrel.
- `src/mcp.ts` is the legacy MCP server entry for the `polter-mcp` binary.

### Layers

- TUI: `src/app.tsx` and `src/appPanel.tsx` implement classic and panel layouts with React and Ink.
- Screens: `src/screens/` contains screen-level flows.
- Components: `src/components/` contains reusable Ink components.
- Hooks: `src/hooks/` contains terminal UI behavior.
- Command registry: `src/data/` groups command definitions by tool.
- Execution: `src/lib/runner.ts` and `src/lib/toolResolver.ts`.
- Pipelines: `src/pipeline/`.
- Declarative: `src/declarative/`.
- Config: `src/config/`.
- Package manager helpers: `src/lib/pkgManager.ts`.

### Key Types

- `CommandDef` describes a legacy command entry.
- `Pipeline` and `PipelineStep` describe named multi-step sequences.
- `ProjectConfig` describes per-project tool settings and pipelines.
- `Screen` is the union of legacy TUI screen names.
- `CliToolId` is `"supabase" | "gh" | "vercel" | "git" | "pkg"`.

## Testing

- Framework: Vitest.
- Tests live beside source files.
- Tests focus on logic models, parsers, utilities, command metadata, process helpers, and IPC helpers.
- Filesystem tests should use temporary directories and cleanup.

## Style

- TypeScript strict mode.
- ESM modules.
- React JSX for Ink components.
- `.js` import specifiers for NodeNext-compatible package code.
- Prefer functions and plain objects.
- Use `picocolors` for terminal output outside React components.

## Code Quality Patterns

### Caching

Caches that depend on `cwd`, project, environment, or user context should use composite keys. Do not key contextual caches by ID alone.

### Error Handling

- MCP handlers that call async functions should catch errors and return structured error responses instead of letting exceptions crash the server.
- Fire-and-forget promises should use `void fn()` to signal intentional async work.
- External process spawning should handle missing commands such as `ENOENT`.

### Validation At Boundaries

- Validate external input before passing it downstream.
- Validate parsed YAML and JSON before casting.
- Prefer Zod or explicit assertions at IPC, MCP, parser, and CLI boundaries.
- Internal module calls can rely on TypeScript types.

### Cross-Platform Behavior

- Clipboard, browser opening, process, path, and OS interactions should support macOS, Windows, and Linux where applicable.
- Use `process.platform` with a fallback path.
- Wrap platform-specific tools in error handling.
