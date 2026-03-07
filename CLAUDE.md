# Polter

Multi-tool CLI orchestrator for Supabase, GitHub CLI, Vercel, Git, and package managers. Built as a React+Ink TUI with an MCP server and declarative infrastructure layer.

## Commands

```bash
npm run dev          # Watch mode (tsup)
npm run build        # Production build (tsup, outputs to dist/)
npm run lint         # Type-check only (tsc --noEmit)
npm run test         # Run all tests (vitest run)
npm run test:watch   # Watch mode tests
npx vitest run src/lib/runner.test.ts  # Run a single test file
```

## Architecture

### Entry Points

- `src/index.tsx` — CLI entry (`polter` binary). Parses CLI args and dispatches to TUI, pipeline runner, declarative plan/apply, or status commands.
- `src/api.ts` — Public API. Re-exports all modules for programmatic use.
- `src/mcp.ts` — MCP server entry (`polter-mcp` binary). Exposes tools, resources, and prompts via `@modelcontextprotocol/sdk`.

### Layers

- **TUI** (`src/app.tsx`, `src/appPanel.tsx`) — Two layout modes: classic (single-column) and panel (sidebar + content). Both use React+Ink with screen-based navigation. Screens live in `src/screens/`, reusable components in `src/components/`, hooks in `src/hooks/`.
- **Command Registry** (`src/data/`) — `CommandDef` entries organized by tool (`src/data/commands/{supabase,gh,vercel,git,pkg}.ts`). Features group commands for the TUI. Flags and suggested args are colocated.
- **Execution** (`src/lib/runner.ts`) — `runCommand` (async, captures output) and `runInteractiveCommand` (sync, inherits stdio). `src/lib/toolResolver.ts` resolves tool binaries (local node_modules/.bin or PATH).
- **Pipelines** (`src/pipeline/`) — Multi-step command sequences. `engine.ts` executes steps sequentially with progress callbacks. `storage.ts` persists pipelines to project or global config.
- **Declarative** (`src/declarative/`) — `polter.yaml` schema in `schema.ts`. `parser.ts` reads YAML, `planner.ts` diffs desired vs current state, `applier.ts` executes plan actions. `status.ts` reads current project state.
- **Config** (`src/config/`) — Project config (`polter.config.json`) and global settings via `conf` package.
- **Apps** (`src/apps/`) — Internal ops tooling (release workflows, bootstrap paths).
- **Package Manager** (`src/lib/pkgManager.ts`) — Auto-detects npm/pnpm/yarn/bun from lockfiles and translates commands between managers.

### Key Types (`src/data/types.ts`)

- `CommandDef` — Tool ID, base args, label, hints, suggested args
- `Pipeline` / `PipelineStep` — Named multi-step sequences
- `ProjectConfig` — Per-project tool settings and pipelines
- `Screen` — Union of all TUI screen names
- `CliToolId` — `"supabase" | "gh" | "vercel" | "git" | "pkg"`

## Testing

- Framework: **Vitest** with `vitest run` (no watch by default)
- Test files live alongside source: `foo.ts` -> `foo.test.ts`
- Pure unit tests — no component/render tests. Test logic models, parsers, and utilities.
- Use `describe`/`it`/`expect` from vitest. Temp dirs with cleanup in `afterEach` for filesystem tests.
- No mocking framework — tests use real filesystem ops on temp dirs.

## Style

- TypeScript strict mode, ESM-only (`"type": "module"`)
- Imports use `.js` extensions (NodeNext resolution)
- React JSX for TUI components (Ink 6 / React 19)
- No classes — functions and plain objects throughout
- `picocolors` for terminal colors outside React components
